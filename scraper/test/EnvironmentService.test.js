import test from 'node:test';
import assert from 'node:assert/strict';
import { EnvironmentService } from '../src/services/EnvironmentService.js';

test('loads .env before .env.local while preserving explicit environment values', async () => {
  const environment = { LLM_PROVIDER: 'ollama' };
  const environmentService = new EnvironmentService({ environment });
  environmentService.readFile = async (filePath) => (
    filePath.pathname.endsWith('.env')
      ? { LLM_PROVIDER: 'xai', LLM_MODEL: 'shared-model' }
      : { LLM_MODEL: 'local-model', XAI_API_KEY: 'local-key' }
  );

  await environmentService.load();

  assert.deepEqual(environment, {
    LLM_PROVIDER: 'ollama',
    LLM_MODEL: 'local-model',
    XAI_API_KEY: 'local-key',
  });
});

test('parses comments, empty lines, and quoted values', () => {
  const environmentService = new EnvironmentService();

  assert.deepEqual(environmentService.parse('# Comment\nLLM_MODEL="my model"\n\nXAI_API_KEY=secret'), {
    LLM_MODEL: 'my model',
    XAI_API_KEY: 'secret',
  });
});
