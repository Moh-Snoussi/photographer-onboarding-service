export class LlmAdapter {
  async completeJson(_systemMessage) {
    throw new Error('LLM adapter must implement completeJson().');
  }
}
