import express from 'express';
import { createLlmAdapter } from './llm/createLlmAdapter.js';
import { SmartCrawlError } from './llm/SmartCrawlError.js';
import { createApiTokenAuthenticator } from './security/createApiTokenAuthenticator.js';
import { EnvironmentService } from './services/EnvironmentService.js';
import { LoggerService } from './services/LoggerService.js';
import { ScrapingService } from './scraping/ScrapingService.js';

/**
 * Entry file for the Playwright scraper server.
 * Sets up the Express.js server with health check and smart crawl endpoints.
 * Insures that all requests are authenticated using the API token.
 */
const app = express();
await new EnvironmentService().load();
const logger = new LoggerService();
const onboardingApiToken = requiredEnvironment('ONBOARDING_API_TOKEN');
const scrapingService = new ScrapingService({ logger, llmAdapter: createLlmAdapter(process.env, logger) });
app.use(express.json({ limit: '64kb' }));
app.use(createApiTokenAuthenticator(onboardingApiToken));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/smart-crawl', async (req, res) => {
  const {
    url,
    user,
    allow_text_scraping: allowTextScraping = false,
    allow_image_scraping: allowImageScraping = false,
  } = req.body ?? {};

  logger.debug('Received smart crawl request.', { url, allowTextScraping, allowImageScraping });

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
      ...(user !== undefined ? { user } : {}),
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
