import { chromium } from 'playwright';

export class BrowserService {
  async launch() {
    return chromium.launch({ headless: true });
  }

  async createPage(browser) {
    return browser.newPage({ viewport: { width: 1440, height: 900 } });
  }

  async visit(page, url) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  }

  async closePage(page) {
    await page?.close();
  }

  async close(browser) {
    await browser?.close();
  }
}
