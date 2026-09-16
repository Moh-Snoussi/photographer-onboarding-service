import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { LoggerService } from '../src/services/LoggerService.js';

test('writes structured logs to the terminal and JSON-lines file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'scraper-logger-'));
  const terminalLogs = [];
  const logger = new LoggerService({
    logFile: join(directory, 'scraper.log'),
    consoleImpl: { info: (line) => terminalLogs.push(line), error() {} },
  });

  logger.info('Crawl completed.', { durationMs: 25, error: new Error('example') });

  const fileLines = (await readFile(join(directory, 'scraper.log'), 'utf8')).trim().split('\n');
  const entry = JSON.parse(fileLines[0]);
  assert.equal(terminalLogs.length, 1);
  assert.equal(entry.message, 'Crawl completed.');
  assert.equal(entry.durationMs, 25);
  assert.equal(entry.error.message, 'example');
  await rm(directory, { recursive: true });
});

test('keeps debug logs out of the terminal while preserving them in the log file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'scraper-logger-'));
  const terminalLogs = [];
  const logger = new LoggerService({
    logFile: join(directory, 'scraper.log'),
    consoleImpl: { debug: (line) => terminalLogs.push(line), error() {}, log() {} },
  });

  logger.debug('LLM request started.', { model: 'fixture' });
  assert.equal(terminalLogs.length, 0);
  assert.match(await readFile(join(directory, 'scraper.log'), 'utf8'), /LLM request started/);
  await rm(directory, { recursive: true });
});

test('logs LLM payloads only when explicitly enabled', () => {
  const terminalLogs = [];
  const logger = new LoggerService({
    logFile: null,
    consoleLevel: 'debug',
    consoleImpl: { debug: (line) => terminalLogs.push(line), error() {}, log() {} },
  });

  logger.debugLlmPayload('LLM request payload.', { systemMessage: 'sensitive text' });
  assert.equal(terminalLogs.length, 0);
});
