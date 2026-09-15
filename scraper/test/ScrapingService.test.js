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
      return { ...crawlResult, Impressum: 'Studio Example GmbH, Berlin' };
    },
  });
  service.crawl = async () => crawlResult;

  const result = await service.smartCrawl('https://photographer.example');

  assert.equal(result.Impressum, 'Studio Example GmbH, Berlin');
  assert.equal(typeof result.llm_duration, 'number');
  assert.equal(Number.isFinite(result.llm_duration), true);
  assert.ok(result.llm_duration >= 0);
  assert.match(systemMessages[0], /normalize extracted photographer website crawl data/i);
  assert.match(systemMessages[0], /https:\/\/photographer\.example/);
  assert.match(systemMessages[0], /Studio Example GmbH/);
  assert.doesNotMatch(systemMessages[0], /{{url}}|{{crawl}}|<html/i);
});

test('smartCrawl fails when LLM output is invalid', async () => {
  const service = createService({
    async completeJson() {
      return [];
    },
  });
  service.crawl = async () => crawlResult;

  await assert.rejects(
    service.smartCrawl('https://photographer.example'),
    SmartCrawlError,
  );
});

test('smartCrawl fails when no LLM provider is configured', async () => {
  const service = createService(null);
  service.crawl = async () => crawlResult;

  await assert.rejects(
    service.smartCrawl('https://photographer.example'),
    SmartCrawlError,
  );
});

function createService(llmAdapter) {
  return new ScrapingService({
    logger: { warn() {}, crawlStarted() {}, crawlCompleted() {}, crawlFailed() {} },
    llmAdapter,
  });
}
