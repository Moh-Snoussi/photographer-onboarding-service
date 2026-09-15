import { AlephAlphaAdapter, OllamaAdapter, OpenAiCompatibleAdapter } from './HttpLlmAdapters.js';

export function createLlmAdapter(environment = process.env) {
  const provider = environment.LLM_PROVIDER;

  if (!provider) {
    return null;
  }

  switch (provider.toLowerCase()) {
    case 'ollama':
      return new OllamaAdapter({
        baseUrl: environment.OLLAMA_BASE_URL || 'http://localhost:11434',
        apiKey: environment.OLLAMA_API_KEY,
        model: required(environment, 'LLM_MODEL'),
      });
    case 'xai':
    case 'grok':
      return new OpenAiCompatibleAdapter({
        baseUrl: environment.XAI_BASE_URL || 'https://api.x.ai/v1',
        apiKey: required(environment, 'XAI_API_KEY'),
        model: required(environment, 'LLM_MODEL'),
        providerName: 'xAI',
      });
    case 'aleph-alpha':
    case 'alephalpha':
      return new AlephAlphaAdapter({
        baseUrl: required(environment, 'ALEPH_ALPHA_BASE_URL'),
        apiKey: required(environment, 'ALEPH_ALPHA_API_KEY'),
        model: required(environment, 'LLM_MODEL'),
      });
    default:
      throw new Error(`Unsupported LLM_PROVIDER: ${provider}.`);
  }
}

function required(environment, name) {
  if (!environment[name]) {
    throw new Error(`${name} must be configured when LLM_PROVIDER is set.`);
  }

  return environment[name];
}
