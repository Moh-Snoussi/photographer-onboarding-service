import { readFile } from 'node:fs/promises';

export class LlmSystemMessage {
  constructor({ filePath } = {}) {
    if (!filePath) {
      throw new Error('LLM system message file path is required.');
    }

    this.filePath = filePath;
  }

  async read({ url, crawl }) {
    const message = (await readFile(this.filePath, 'utf8')).trim();

    if (!message) {
      throw new Error('LLM system message file must not be empty.');
    }

    return message
      .replaceAll('{{url}}', url)
      .replaceAll('{{crawl}}', JSON.stringify(crawl));
  }
}
