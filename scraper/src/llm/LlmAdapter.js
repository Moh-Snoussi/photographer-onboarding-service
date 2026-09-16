export class LlmAdapter {
  constructor({ logger = null, providerName = 'unknown', model = null } = {}) {
    this.logger = logger;
    this.providerName = providerName;
    this.model = model;
  }

  async completeJson(_systemMessage) {
    throw new Error('LLM adapter must implement completeJson().');
  }

  async completeJsonWithLogging(systemMessage, request, complete) {
    const startedAt = performance.now();
    const context = {
      provider: this.providerName,
      ...(this.model ? { model: this.model } : {}),
      promptBytes: Buffer.byteLength(systemMessage, 'utf8'),
      request,
    };

    this.logger?.debug('LLM request started.', context);
    this.logger?.debugLlmPayload?.('LLM request payload.', { ...context, systemMessage });

    try {
      const result = await complete();
      const durationMs = Math.round(performance.now() - startedAt);
      this.logger?.debug('LLM response received.', {
        ...context,
        durationMs,
        responseKeys: result && typeof result === 'object' && !Array.isArray(result)
          ? Object.keys(result)
          : [],
      });
      this.logger?.debugLlmPayload?.('LLM response payload.', { ...context, durationMs, response: result });
      return result;
    } catch (error) {
      this.logger?.warn('LLM request failed.', {
        ...context,
        durationMs: Math.round(performance.now() - startedAt),
        error,
      });
      throw error;
    }
  }
}
