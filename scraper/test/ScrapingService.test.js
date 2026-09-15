import test from 'node:test';
import assert from 'node:assert/strict';
import { SmartCrawlError } from '../src/llm/SmartCrawlError.js';
import { ScrapingService } from '../src/scraping/ScrapingService.js';

const crawlResult = {
  Hero: 'https://photographer.example/hero.jpg',
  ImpressumUrl: 'https://photographer.example/impressum',
  Impressum: 'Studio Example GmbH',
};

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
    assert.deepEqual(options, { includeLegalText: false });
    return { ...crawlResult, Impressum: null };
  };
  service.crawlImpressum = async (url) => {
    assert.equal(url, crawlResult.ImpressumUrl);
    return crawlResult.Impressum;
  };

  const result = await service.smartCrawl('https://photographer.example');

  assert.equal(result.Impressum, 'Studio Example GmbH, Berlin');
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
      return { Hero: crawlResult.Hero, ImpressumUrl: null };
    },
  });
  service.crawl = async () => ({ Hero: crawlResult.Hero, ImpressumUrl: null, Impressum: null });
  service.crawlImpressum = async () => assert.fail('crawlImpressum must not be called without a URL');

  const result = await service.smartCrawl('https://photographer.example');

  assert.equal(result.Impressum, null);
  assert.equal(systemMessages.length, 1);
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
    service.smartCrawl('https://photographer.example'),
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
    service.smartCrawl('https://photographer.example'),
    SmartCrawlError,
  );
});

function createService(llmAdapter, logger = {}) {
  return new ScrapingService({
    logger: { warn() {}, crawlStarted() {}, crawlCompleted() {}, crawlFailed() {}, ...logger },
    llmAdapter,
  });
}
