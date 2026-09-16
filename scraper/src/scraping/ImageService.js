export class ImageService {
  async extract(page) {
    const images = await page.evaluate(() => {
      const hasLogoOrBrandMarker = (element) => {
        for (let currentElement = element; currentElement; currentElement = currentElement.parentElement) {
          if (/logo|brand/i.test(`${currentElement.id} ${currentElement.className}`)) {
            return true;
          }
        }

        return false;
      };
      const isTransparentPng = (image, src) => {
        if (!new URL(src, document.baseURI).pathname.toLowerCase().endsWith('.png')) {
          return false;
        }

        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        try {
          const context = canvas.getContext('2d', { willReadFrequently: true });
          context.drawImage(image, 0, 0);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;

          for (let index = 3; index < pixels.length; index += 4) {
            if (pixels[index] < 255) {
              return true;
            }
          }

          return false;
        } catch {
          return true;
        }
      };
      const largeContainers = [...document.querySelectorAll('main > *, body > *')]
        .filter((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.width >= 800 && bounds.height >= 600;
        })
        .slice(0, 3);
      const imageCandidates = [...document.images].map((image) => {
        const bounds = image.getBoundingClientRect();
        const src = image.currentSrc || image.src;
        const isAboveTheFold = bounds.top < window.innerHeight && bounds.bottom > 0;
        const isInEarlyLargeContainer = largeContainers.includes(image.closest('main > *, body > *'));
        const isValidHeroImage = image.naturalWidth >= 800
          && image.naturalHeight >= 600
          && !new URL(src, document.baseURI).pathname.toLowerCase().endsWith('.svg')
          && !isTransparentPng(image, src);

        return {
          src,
          alt: image.alt,
          isHero: isValidHeroImage && (isAboveTheFold || isInEarlyLargeContainer),
          isInHeader: Boolean(image.closest('header')),
          hasLogoOrBrandMarker: hasLogoOrBrandMarker(image),
        };
      });
      const faviconCandidates = [...document.querySelectorAll('link[rel]')]
        .filter((link) => /(^|\s)(icon|shortcut icon|apple-touch-icon)(\s|$)/i.test(link.rel))
        .map((link) => ({
          src: link.href,
          alt: '',
          isHero: false,
          isFavicon: true,
          isInHeader: false,
          hasLogoOrBrandMarker: false,
        }));

      return [...imageCandidates, ...faviconCandidates];
    });

    return images.filter((image) => image.src);
  }
}
