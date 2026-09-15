import express from 'express';
import { createLlmAdapter } from './llm/createLlmAdapter.js';
import { SmartCrawlError } from './llm/SmartCrawlError.js';
import { createApiTokenAuthenticator } from './security/createApiTokenAuthenticator.js';
import { EnvironmentService } from './services/EnvironmentService.js';
import { ScraperLogger } from './services/ScraperLogger.js';
import { ScrapingService } from './scraping/ScrapingService.js';

const app = express();
const logger = new ScraperLogger();
await new EnvironmentService().load();
const onboardingApiToken = requiredEnvironment('ONBOARDING_API_TOKEN');
const scrapingService = new ScrapingService({ logger, llmAdapter: createLlmAdapter() });
app.use(express.json({ limit: '64kb' }));
app.use(createApiTokenAuthenticator(onboardingApiToken));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/crawl', async (req, res) => {
  const { url } = req.body ?? {};

  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    logger.warn('Crawl request rejected.', { reason: 'invalid_url' });
    return res.status(422).json({ error: 'A valid http(s) URL is required.' });
  }

  // const urlHost = new URL(url).host;

  try {
    res.json(await scrapingService.crawl(url));
  } catch (error) {
    res.status(502).json({ error: 'Unable to crawl the requested URL.' });
  }
});

app.post('/smart-crawl', async (req, res) => {
  const {
    url,
    allow_text_scraping: allowTextScraping = false,
    allow_image_scraping: allowImageScraping = false,
  } = req.body ?? {};

  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    logger.warn('Smart crawl request rejected.', { reason: 'invalid_url' });
    return res.status(422).json({ success: false, error: 'A valid http(s) URL is required.' });
  }

  if (typeof allowTextScraping !== 'boolean' || typeof allowImageScraping !== 'boolean') {
    logger.warn('Smart crawl request rejected.', { reason: 'invalid_consent_flags' });
    return res.status(422).json({
      success: false,
      error: 'allow_text_scraping and allow_image_scraping must be booleans.',
    });
  }

  try {
    res.json({
      success: true,
      crawl: await scrapingService.smartCrawl(url, { allowTextScraping, allowImageScraping }),
    });
  } catch (error) {
    const statusCode = error instanceof SmartCrawlError ? 503 : 502;
    const message = error instanceof SmartCrawlError
      ? error.message
      : 'Unable to crawl the requested URL.';

    res.status(statusCode).json({
      success: false,
      error: message,
      ...(error instanceof SmartCrawlError && error.details ? { details: error.details } : {}),
    });
  }
});

app.listen(3001, '0.0.0.0', () => {
  logger.info('Playwright scraper listening.', { port: 3001 });
});

function requiredEnvironment(name) {
  if (!process.env[name]) {
    throw new Error(`${name} must be configured.`);
  }

  return process.env[name];
}
