export class LegalPageService {
  async discover(page) {
    const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')]
      .map((anchor) => ({
        text: (anchor.textContent || '').trim().replace(/\s+/g, ' '),
        href: anchor.href,
      }))
      .filter((link) => link.href));

    return {
      links,
      legalPages: this.findPages(links),
    };
  }

  findLinks(links) {
    return links.filter(({ text, href }) => /impressum|legal notice/i.test(`${text} ${href}`));
  }

  findPages(links) {
    return this.findLinks(links).reduce((pages, link) => {
      const linkDescription = `${link.text} ${link.href}`;

      if (!pages.Impressum && /impressum|legal notice/i.test(linkDescription)) {
        pages.Impressum = link.href;
      }

      return pages;
    }, {});
  }
}
