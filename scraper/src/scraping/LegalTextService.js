export class LegalTextService {
  async extract(page) {
    return this.normalize(await page.evaluate(() => document.body?.innerText || ''));
  }

  normalize(text) {
    return text.trim().replace(/\s+/g, ' ');
  }
}
