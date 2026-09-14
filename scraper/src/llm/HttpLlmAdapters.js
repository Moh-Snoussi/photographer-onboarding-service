import { LlmAdapter } from './LlmAdapter.js';

export class OllamaAdapter extends LlmAdapter {
  constructor({ baseUrl, model, fetchImpl = fetch }) {
    super();
    this.baseUrl = baseUrl;
    this.model = model;
    this.fetch = fetchImpl;
  }

  async completeJson(systemMessage) {
    const response = await this.fetch(`${this.baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'system', content: systemMessage }],
        format: 'json',
        stream: false,
      }),
    });
    const body = await readJson(response, 'Ollama');
    return parseCompletion(body.message?.content, 'Ollama');
  }
}

export class OpenAiCompatibleAdapter extends LlmAdapter {
  constructor({ baseUrl, apiKey, model, fetchImpl = fetch, providerName }) {
    super();
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.model = model;
    this.fetch = fetchImpl;
    this.providerName = providerName;
  }

  async completeJson(systemMessage) {
    const response = await this.fetch(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, {
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
  }
}

export class AlephAlphaAdapter extends LlmAdapter {
  constructor({ baseUrl, apiKey, model, fetchImpl = fetch }) {
    super();
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.model = model;
    this.fetch = fetchImpl;
  }

  async completeJson(systemMessage) {
    const response = await this.fetch(`${this.baseUrl.replace(/\/$/, '')}/complete/json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: this.model, prompt: systemMessage }),
    });
    const body = await readJson(response, 'Aleph Alpha');
    return typeof body === 'string' ? JSON.parse(body) : body;
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
