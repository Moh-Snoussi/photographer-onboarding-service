import { BrowserService } from './BrowserService.js';
import { HeroImageService } from './HeroImageService.js';
import { ImageService } from './ImageService.js';
import { LegalPageService } from './LegalPageService.js';
import { LegalTextService } from './LegalTextService.js';
import { LlmSystemMessage } from '../llm/LlmSystemMessage.js';
import { SmartCrawlError } from '../llm/SmartCrawlError.js';

export class ScrapingService {
  constructor({
    logger,
    browserService = new BrowserService(),
    legalPageService = new LegalPageService(),
    legalTextService = new LegalTextService(),
    imageService = new ImageService(),
    heroImageService = new HeroImageService(),
    llmAdapter = null,
    homepageLlmSystemMessage = new LlmSystemMessage({
      filePath: new URL('../llm/homepage-system-message.md', import.meta.url),
    }),
    impressumLlmSystemMessage = new LlmSystemMessage({
      filePath: new URL('../llm/impressum-system-message.md', import.meta.url),
    }),
  }) {
    this.logger = logger;
    this.browserService = browserService;
    this.legalPageService = legalPageService;
    this.legalTextService = legalTextService;
    this.imageService = imageService;
    this.heroImageService = heroImageService;
    this.llmAdapter = llmAdapter;
    this.homepageLlmSystemMessage = homepageLlmSystemMessage;
    this.impressumLlmSystemMessage = impressumLlmSystemMessage;
  }

  async crawl(url, { includeLegalText = true } = {}) {
    const urlHost = new URL(url).host;
    const startedAt = performance.now();
    let browser;

    try {
      this.logger.crawlStarted(urlHost);
      browser = await this.browserService.launch();
      const page = await this.browserService.createPage(browser);
      await this.browserService.visit(page, url);

      const [resolvedUrl, images, legalPageDetails] = await Promise.all([
        page.evaluate(() => location.href),
        this.imageService.extract(page),
        this.legalPageService.discover(page),
      ]);
      const legalText = includeLegalText
        ? await this.crawlLegalPages(browser, legalPageDetails.legalPages)
        : { Impressum: null };
      const result = {
        Hero: this.heroImageService.find(images),
        ImpressumUrl: legalPageDetails.legalPages.Impressum || null,
        Impressum: legalText.Impressum,
      };

      this.logger.crawlCompleted(
        urlHost,
        new URL(resolvedUrl).host,
        legalPageDetails.links.length,
        Math.round(performance.now() - startedAt),
      );

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Crawl failed';
      this.logger.crawlFailed(urlHost, message, Math.round(performance.now() - startedAt));
      throw error;
    } finally {
      await this.browserService.close(browser);
    }
  }

  /**
   * Performs an AI calls and returns a Strucuted crawl result { success: boolean, data: Object<AsInSystemMessage> }
   *
   * @param {string} url - The URL to crawl.
   * @returns {Promise<Object>} - The enriched crawl result.
   * @throws {SmartCrawlError} - If the LLM enrichment fails or no LLM provider is configured.
   */
  async smartCrawl(url) {
    if (!this.llmAdapter) {
      throw new SmartCrawlError('No LLM provider is configured for smart crawl.');
    }

    let stage = 'homepage_crawl';
    let llmPromptBytes;

    try {
      const homepageCrawl = await this.crawl(url, { includeLegalText: false });
      const homepageSystemMessage = await this.homepageLlmSystemMessage.read({
        url,
        crawl: homepageCrawl,
      });
      let llmDuration = 0;
      stage = 'homepage_llm';
      llmPromptBytes = Buffer.byteLength(homepageSystemMessage, 'utf8');
      const homepageLlmStartedAt = performance.now();
      const homepageResult = this.normalizeSmartCrawlResult(
        await this.llmAdapter.completeJson(homepageSystemMessage),
        homepageCrawl,
      );
      llmDuration += performance.now() - homepageLlmStartedAt;
      let impressumResult = { Impressum: null };

      if (homepageResult.ImpressumUrl) {
        stage = 'impressum_crawl';
        llmPromptBytes = undefined;
        const impressumText = await this.crawlImpressum(homepageResult.ImpressumUrl);
        const impressumSystemMessage = await this.impressumLlmSystemMessage.read({
          url: homepageResult.ImpressumUrl,
          crawl: { Impressum: impressumText },
        });
        stage = 'impressum_llm';
        llmPromptBytes = Buffer.byteLength(impressumSystemMessage, 'utf8');
        const impressumLlmStartedAt = performance.now();
        impressumResult = this.normalizeSmartCrawlResult(
          await this.llmAdapter.completeJson(impressumSystemMessage),
          { Impressum: impressumText },
        );
        llmDuration += performance.now() - impressumLlmStartedAt;
      }

      return {
        ...homepageResult,
        ...impressumResult,
        llm_duration: llmDuration / 1000,
      };
    } catch (error) {
      this.logger.warn('LLM enrichment failed.', {
        urlHost: new URL(url).host,
        stage,
        ...(llmPromptBytes === undefined ? {} : { llmPromptBytes }),
        error: error instanceof Error ? error.message : 'LLM enrichment failed',
      });
      throw new SmartCrawlError('LLM enrichment failed.', {
        cause: error,
        details: {
          stage,
          ...(llmPromptBytes === undefined ? {} : { llmPromptBytes }),
        },
      });
    }
  }

  normalizeSmartCrawlResult(result, fallback) {
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      throw new Error('LLM result must be a JSON object.');
    }

    return Object.fromEntries(Object.keys(fallback).map((key) => [
      key,
      typeof result[key] === 'string' ? result[key].trim() || null : fallback[key],
    ]));
  }

  async crawlImpressum(url) {
    if (!url) {
      return null;
    }

    let browser;

    try {
      browser = await this.browserService.launch();
      return await this.crawlLegalPages(browser, { Impressum: url }).then(({ Impressum }) => Impressum);
    } finally {
      await this.browserService.close(browser);
    }
  }

  async crawlLegalPages(browser, legalPages) {
    const legalText = { Impressum: null };

    await Promise.all(Object.entries(legalPages).map(async ([pageType, url]) => {
      const page = await this.browserService.createPage(browser);

      try {
        await this.browserService.visit(page, url);
        legalText[pageType] = await this.legalTextService.extract(page);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Legal page crawl failed';
        this.logger.warn('Legal page crawl failed.', { pageType, url, error: message });
      } finally {
        await this.browserService.closePage(page);
      }
    }));

    return legalText;
  }
}
