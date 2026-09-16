import test from 'node:test';
import assert from 'node:assert/strict';
import { FixtureAdapter } from '../src/llm/FixtureAdapter.js';

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