export class ScraperLogger {
  info(message, context = {}) {
    this.write('info', message, context);
  }

  warn(message, context = {}) {
    this.write('warn', message, context);
  }

  error(message, context = {}) {
    this.write('error', message, context);
  }

  crawlStarted(urlHost) {
    this.info('Crawl started.', { urlHost });
  }

  crawlCompleted(urlHost, resolvedUrlHost, linkCount, durationMs) {
    this.info('Crawl completed.', {
      urlHost,
      resolvedUrlHost,
      linkCount,
      durationMs,
    });
  }

  crawlFailed(urlHost, error, durationMs) {
    this.error('Crawl failed.', {
      urlHost,
      error,
      durationMs,
    });
  }

  write(level, message, context) {
    console[level](JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: 'scraper',
      message,
      ...context,
    }));
  }
}