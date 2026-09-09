import express from 'express';
import { chromium } from 'playwright';
import { ScraperLogger } from './services/ScraperLogger.js';

const app = express();
const logger = new ScraperLogger();
app.use(express.json({ limit: '64kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/crawl', async (req, res) => {
  const { url } = req.body ?? {};

  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    logger.warn('Crawl request rejected.', { reason: 'invalid_url' });
    return res.status(422).json({ error: 'A valid http(s) URL is required.' });
  }

  const urlHost = new URL(url).host;
  const startedAt = performance.now();
  let browser;

  try {
    logger.crawlStarted(urlHost);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const result = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a[href]')]
        .map((a) => ({
          text: (a.textContent || '').trim().replace(/\s+/g, ' '),
          href: a.href,
        }))
        .filter((link) => link.href)
        .slice(0, 100);

      return {
        title: document.title,
        url: location.href,
        links,
      };
    });

    logger.crawlCompleted(
      urlHost,
      new URL(result.url).host,
      result.links.length,
      Math.round(performance.now() - startedAt),
    );
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Crawl failed';
    logger.crawlFailed(urlHost, message, Math.round(performance.now() - startedAt));
    res.status(502).json({ error: 'Unable to crawl the requested URL.' });
  } finally {
    await browser?.close();
  }
});

app.listen(3001, '0.0.0.0', () => {
  logger.info('Playwright scraper listening.', { port: 3001 });
});
