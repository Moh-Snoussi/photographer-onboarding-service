import test from 'node:test';
import assert from 'node:assert/strict';
import { SmartCrawlError } from '../src/llm/SmartCrawlError.js';
import { ScrapingService } from '../src/scraping/ScrapingService.js';

const crawlResult = {
  images: {
    logo: 'https://photographer.example/logo.svg',
    hero: [{ src: 'https://photographer.example/hero.jpg', alt: 'Studio portrait', isHero: true }],
  },
  ImpressumUrl: 'https://photographer.example/impressum',
  Impressum: 'Studio Example GmbH',
};

test('crawl skips image extraction and legal-link discovery when disabled', async () => {
  const page = { evaluate: async () => 'https://photographer.example/' };
  const service = new ScrapingService({
    logger: { info() {}, warn() {}, error() {}, debug() {} },
    browserService: {
      launch: async () => ({}),
      createPage: async () => page,
      visit: async () => {},
      close: async () => {},
    },
    imageService: { extract: async () => assert.fail('image extraction must not be called') },
    legalPageService: { discover: async () => assert.fail('legal-link discovery must not be called') },
  });

  const result = await service.crawl('https://photographer.example', {
    includeLegalText: false,
    includeImages: false,
    discoverLegalPages: false,
  });

  assert.deepEqual(result, { images: null, ImpressumUrl: null, Impressum: null });
});

test('smartCrawl enriches the deterministic crawl with an LLM adapter', async () => {
  const systemMessages = [];
  const service = createService({
    async completeJson(systemMessage) {
      systemMessages.push(systemMessage);
      return systemMessages.length === 1
        ? { ...crawlResult, Impressum: null }
        : { Impressum: 'Studio Example GmbH, Berlin' };
    },
  });
  service.crawl = async (url, options) => {
    assert.equal(url, 'https://photographer.example');
    assert.deepEqual(options, {
      includeLegalText: false,
      includeImages: true,
      discoverLegalPages: true,
    });
    return { ...crawlResult, Impressum: null };
  };
  service.crawlImpressum = async (url) => {
    assert.equal(url, crawlResult.ImpressumUrl);
    return crawlResult.Impressum;
  };

  const result = await service.smartCrawl('https://photographer.example', {
    allowTextScraping: true,
    allowImageScraping: true,
  });

  assert.equal(result.Impressum, 'Studio Example GmbH, Berlin');
  assert.deepEqual(result.images, crawlResult.images);
  assert.equal(typeof result.llm_duration, 'number');
  assert.equal(Number.isFinite(result.llm_duration), true);
  assert.ok(result.llm_duration >= 0);
  assert.equal(systemMessages.length, 2);
  assert.match(systemMessages[0], /normalize photographer website homepage crawl data/i);
  assert.match(systemMessages[0], /https:\/\/photographer\.example/);
  assert.doesNotMatch(systemMessages[0], /Studio Example GmbH/);
  assert.match(systemMessages[1], /normalize the supplied photographer website legal-notice text/i);
  assert.match(systemMessages[1], /Studio Example GmbH/);
  assert.doesNotMatch(systemMessages[0], /{{url}}|{{crawl}}|<html/i);
  assert.doesNotMatch(systemMessages[1], /{{url}}|{{crawl}}|<html/i);
});

test('smartCrawl skips legal-notice enrichment when no Impressum URL is found', async () => {
  const systemMessages = [];
  const service = createService({
    async completeJson(systemMessage) {
      systemMessages.push(systemMessage);
      return { images: crawlResult.images, ImpressumUrl: null };
    },
  });
  service.crawl = async () => ({ images: crawlResult.images, ImpressumUrl: null, Impressum: null });
  service.crawlImpressum = async () => assert.fail('crawlImpressum must not be called without a URL');

  const result = await service.smartCrawl('https://photographer.example', { allowTextScraping: true });

  assert.equal(result.Impressum, null);
  assert.equal(systemMessages.length, 1);
});

test('smartCrawl skips crawling and LLM enrichment without consent', async () => {
  const service = createService({
    async completeJson() { assert.fail('LLM enrichment must not be called without consent'); },
  });
  service.crawl = async () => assert.fail('crawl must not be called without consent');
  service.crawlImpressum = async () => assert.fail('crawlImpressum must not be called without text consent');

  const result = await service.smartCrawl('https://photographer.example');

  assert.deepEqual(result, {
    images: null,
    ImpressumUrl: null,
    Impressum: null,
    llm_duration: 0,
  });
});

test('smartCrawl fails when LLM output is invalid', async () => {
  const warnings = [];
  const service = createService({
    async completeJson() {
      return [];
    },
  }, { warn(message, context) { warnings.push({ message, context }); } });
  service.crawl = async () => crawlResult;

  await assert.rejects(
    service.smartCrawl('https://photographer.example', { allowImageScraping: true }),
    (error) => {
      assert.ok(error instanceof SmartCrawlError);
      assert.equal(error.details.stage, 'homepage_llm');
      assert.equal(Number.isInteger(error.details.llmPromptBytes), true);
      assert.ok(error.details.llmPromptBytes > 0);
      return true;
    },
  );
  assert.equal(warnings[0].message, 'LLM enrichment failed.');
  assert.equal(warnings[0].context.stage, 'homepage_llm');
  assert.equal(warnings[0].context.llmPromptBytes > 0, true);
});

test('smartCrawl fails when no LLM provider is configured', async () => {
  const service = createService(null);
  service.crawl = async () => crawlResult;

  await assert.rejects(
    service.smartCrawl('https://photographer.example', { allowImageScraping: true }),
    SmartCrawlError,
  );
});

function createService(llmAdapter, logger = {}) {
  return new ScrapingService({
    logger: { info() {}, warn() {}, error() {}, debug() {}, ...logger },
    llmAdapter,
  });
}
