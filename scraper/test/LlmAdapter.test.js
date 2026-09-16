import test from 'node:test';
import assert from 'node:assert/strict';
import { FixtureAdapter } from '../src/llm/FixtureAdapter.js';
import { OpenAiCompatibleAdapter } from '../src/llm/HttpLlmAdapters.js';
import { createLlmAdapter } from '../src/llm/createLlmAdapter.js';

test('logs LLM lifecycle at debug level and payloads only through the payload logger', async () => {
  const entries = [];
  const logger = {
    info: (message, context) => entries.push({ level: 'info', message, context }),
    debug: (message, context) => entries.push({ level: 'debug', message, context }),
    debugLlmPayload: (message, context) => entries.push({ level: 'debug-payload', message, context }),
    warn: (message, context) => entries.push({ level: 'warn', message, context }),
  };
  const adapter = new FixtureAdapter({ logger });
  const prompt = 'Extract JSON.\n{"images":null,"ImpressumUrl":null}';

  const result = await adapter.completeJson(prompt);

  assert.deepEqual(result, { images: null, ImpressumUrl: null });
  assert.equal(entries[0].level, 'debug');
  assert.equal(entries[0].message, 'LLM request started.');
  assert.equal(entries[0].context.provider, 'fixture');
  assert.equal(entries[0].context.promptBytes, Buffer.byteLength(prompt, 'utf8'));
  assert.equal(entries[1].level, 'debug-payload');
  assert.equal(entries[1].message, 'LLM request payload.');
  assert.equal(entries[1].context.systemMessage, prompt);
  assert.equal(entries[2].level, 'debug');
  assert.equal(entries[2].message, 'LLM response received.');
  assert.equal(entries[3].level, 'debug-payload');
  assert.equal(entries[3].message, 'LLM response payload.');
  assert.deepEqual(entries[3].context.response, result);
});

test('creates an OpenAI-compatible adapter for the OpenAI provider', () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({}) });

  try {
    const adapter = createLlmAdapter({
      LLM_PROVIDER: 'openai',
      OPENAI_API_KEY: 'test-key',
      LLM_MODEL: 'gpt-5-mini',
    });

    assert.ok(adapter instanceof OpenAiCompatibleAdapter);
    assert.equal(adapter.baseUrl, 'https://api.openai.com/v1');
    assert.equal(adapter.apiKey, 'test-key');
    assert.equal(adapter.model, 'gpt-5-mini');
    assert.equal(adapter.providerName, 'OpenAI');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('logs the resolved OpenAI request URL when a request fails', async () => {
  const entries = [];
  const logger = {
    debug: () => {},
    warn: (message, context) => entries.push({ message, context }),
  };
  const adapter = new OpenAiCompatibleAdapter({
    baseUrl: 'https://api.openai.com/v1/',
    apiKey: 'test-key',
    model: 'gpt-4o-mini',
    providerName: 'OpenAI',
    logger,
    fetchImpl: async () => ({ ok: false, status: 404 }),
  });

  await assert.rejects(adapter.completeJson('Extract JSON.'), /status 404/);

  assert.equal(entries.length, 1);
  assert.equal(entries[0].message, 'LLM request failed.');
  assert.equal(entries[0].context.request.url, 'https://api.openai.com/v1/chat/completions');
});
