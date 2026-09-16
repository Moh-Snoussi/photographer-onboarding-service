import { LlmAdapter } from './LlmAdapter.js';

export class FixtureAdapter extends LlmAdapter {
  constructor({ delayMs = 0, logger } = {}) {
    super({ logger, providerName: 'fixture', model: 'fixture' });
    this.delayMs = delayMs;
  }

  async completeJson(systemMessage, context = {}) {
    return this.completeJsonWithLogging(systemMessage, { ...context, fixtureDelayMs: this.delayMs }, async () => {
      if (this.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.delayMs));
      }

      const crawl = extractCrawlPayload(systemMessage);

      if (crawl && typeof crawl === 'object' && !Array.isArray(crawl)) {
        if ('images' in crawl || 'ImpressumUrl' in crawl) {
          return {
            images: crawl.images ?? null,
            ImpressumUrl: crawl.ImpressumUrl ?? null,
          };
        }

        if ('Impressum' in crawl) {
          const text = typeof crawl.Impressum === 'string' ? crawl.Impressum.trim() : null;
          return { Impressum: text || null };
        }
      }

      return crawl;
    });
  }
}

function extractCrawlPayload(systemMessage) {
  if (typeof systemMessage !== 'string' || !systemMessage.trim()) {
    throw new Error('FixtureAdapter requires a non-empty system message string.');
  }

  const lines = systemMessage.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const candidate = lines[i].trim();
    if (!candidate) {
      continue;
    }

    if (candidate.startsWith('{') || candidate.startsWith('[')) {
      try {
        return JSON.parse(candidate);
      } catch {
        break;
      }
    }

    break;
  }

  throw new Error('FixtureAdapter could not find crawl payload JSON at the end of the system message.');
}
