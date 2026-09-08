import express from 'express';
import { chromium } from 'playwright';

const app = express();
app.use(express.json({ limit: '64kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/crawl', async (req, res) => {
  const { url } = req.body ?? {};

  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return res.status(422).json({ error: 'A valid http(s) URL is required.' });
  }

  const browser = await chromium.launch({ headless: true });

  try {
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

    res.json(result);
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Crawl failed' });
  } finally {
    await browser.close();
  }
});

app.listen(3001, '0.0.0.0', () => {
  console.log('Playwright scraper listening on :3001');
});
