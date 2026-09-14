export class ImageService {
  async extract(page) {
    const images = await page.evaluate(() => [...document.images].map((image) => {
      const bounds = image.getBoundingClientRect();

      return {
        src: image.currentSrc || image.src,
        alt: image.alt,
        isHero: bounds.top < window.innerHeight && bounds.bottom > 0 && bounds.width >= 300,
      };
    }));

    return images.filter((image) => image.src);
  }
}
