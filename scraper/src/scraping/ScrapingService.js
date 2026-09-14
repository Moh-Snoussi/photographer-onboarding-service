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
    llmSystemMessage = new LlmSystemMessage(),
  }) {
    this.logger = logger;
    this.browserService = browserService;
    this.legalPageService = legalPageService;
    this.legalTextService = legalTextService;
    this.imageService = imageService;
    this.heroImageService = heroImageService;
    this.llmAdapter = llmAdapter;
    this.llmSystemMessage = llmSystemMessage;
  }

  async crawl(url) {
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
      const legalText = await this.crawlLegalPages(browser, legalPageDetails.legalPages);
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
    const crawl = await this.crawl(url);

    if (!this.llmAdapter) {
      throw new SmartCrawlError('No LLM provider is configured for smart crawl.');
    }

    try {
      const systemMessage = await this.llmSystemMessage.read({ url, crawl });
      const result = await this.llmAdapter.completeJson(systemMessage);
      return this.normalizeSmartCrawlResult(result, crawl);
    } catch (error) {
      this.logger.warn('LLM enrichment failed.', {
        urlHost: new URL(url).host,
        error: error instanceof Error ? error.message : 'LLM enrichment failed',
      });
      throw new SmartCrawlError('LLM enrichment failed.', { cause: error });
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
