import { LlmAdapter } from './LlmAdapter.js';

export class OllamaAdapter extends LlmAdapter {
  constructor({ baseUrl, apiKey, model, logger, fetchImpl = fetch }) {
    super({ logger, providerName: 'Ollama', model });
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.model = model;
    this.fetch = fetchImpl;
  }

  async completeJson(systemMessage, context = {}) {
    const requestUrl = `${this.baseUrl.replace(/\/$/, '')}/api/chat`;

    return this.completeJsonWithLogging(systemMessage, {
      ...context,
      endpoint: '/api/chat',
      url: requestUrl,
      responseFormat: 'json',
    }, async () => {
      const headers = { 'Content-Type': 'application/json' };
      if (this.apiKey) {
        headers.Authorization = `Bearer ${this.apiKey}`;
      }

      const response = await this.fetch(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'system', content: systemMessage }],
          format: 'json',
          stream: false,
          think: false,
        }),
      });
      const body = await readJson(response, 'Ollama');
      return parseCompletion(body.message?.content, 'Ollama');
    });
  }
}

export class OpenAiCompatibleAdapter extends LlmAdapter {
  constructor({ baseUrl, apiKey, model, logger, fetchImpl = fetch, providerName }) {
    super({ logger, providerName, model });
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.model = model;
    this.fetch = fetchImpl;
    this.providerName = providerName;
  }

  async completeJson(systemMessage, context = {}) {
    const requestUrl = `${this.baseUrl.replace(/\/$/, '')}/chat/completions`;

    return this.completeJsonWithLogging(systemMessage, {
      ...context,
      endpoint: '/chat/completions',
      url: requestUrl,
      responseFormat: 'json_object',
    }, async () => {
      const response = await this.fetch(requestUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'system', content: systemMessage }],
          response_format: { type: 'json_object' },
        }),
      });
      const body = await readJson(response, this.providerName);
      return parseCompletion(body.choices?.[0]?.message?.content, this.providerName);
    });
  }
}

export class AlephAlphaAdapter extends LlmAdapter {
  constructor({ baseUrl, apiKey, model, logger, fetchImpl = fetch }) {
    super({ logger, providerName: 'Aleph Alpha', model });
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.model = model;
    this.fetch = fetchImpl;
  }

  async completeJson(systemMessage, context = {}) {
    const requestUrl = `${this.baseUrl.replace(/\/$/, '')}/complete/json`;

    return this.completeJsonWithLogging(systemMessage, {
      ...context,
      endpoint: '/complete/json',
      url: requestUrl,
      responseFormat: 'json',
    }, async () => {
      const response = await this.fetch(requestUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: this.model, prompt: systemMessage }),
      });
      const body = await readJson(response, 'Aleph Alpha');
      return typeof body === 'string' ? JSON.parse(body) : body;
    });
  }
}

async function readJson(response, providerName) {
  if (!response.ok) {
    throw new Error(`${providerName} request failed with status ${response.status}.`);
  }

  return response.json();
}

function parseCompletion(content, providerName) {
  if (typeof content !== 'string') {
    throw new Error(`${providerName} returned no completion content.`);
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`${providerName} returned invalid JSON.`);
  }
}
