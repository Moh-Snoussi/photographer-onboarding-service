import test from 'node:test';
import assert from 'node:assert/strict';
import { ImageService } from '../src/scraping/ImageService.js';

test('extract includes image context and favicon metadata candidates', async () => {
  const result = await new ImageService().extract({
    async evaluate(extractor) {
      const originalDocument = global.document;
      const originalWindow = global.window;
      global.window = { innerHeight: 800 };
      global.document = {
        baseURI: 'https://photographer.example/',
        images: [{
          currentSrc: 'https://photographer.example/header-mark.svg',
          src: 'https://photographer.example/header-mark.svg',
          alt: 'Studio',
          naturalWidth: 150,
          naturalHeight: 100,
          id: '',
          className: '',
          parentElement: { id: 'brand', className: '', parentElement: null },
          closest: (selector) => selector === 'header' ? {} : null,
          getBoundingClientRect: () => ({ top: 0, bottom: 100, width: 150 }),
        }],
        querySelectorAll: (selector) => selector === 'link[rel]'
          ? [{ rel: 'apple-touch-icon', href: 'https://photographer.example/apple-touch-icon.png' }]
          : [],
        createElement: () => assert.fail('PNG transparency check must not run for SVG logos'),
      };

      try {
        return extractor();
      } finally {
        global.document = originalDocument;
        global.window = originalWindow;
      }
    },
  });

  assert.deepEqual(result, [
    {
      src: 'https://photographer.example/header-mark.svg',
      alt: 'Studio',
      isHero: false,
      isInHeader: true,
      hasLogoOrBrandMarker: true,
    },
    {
      src: 'https://photographer.example/apple-touch-icon.png',
      alt: '',
      isHero: false,
      isFavicon: true,
      isInHeader: false,
      hasLogoOrBrandMarker: false,
    },
  ]);
});

test('extract marks only valid above-the-fold or early-container images as heroes', async () => {
  const result = await new ImageService().extract({
    async evaluate(extractor) {
      const originalDocument = global.document;
      const originalWindow = global.window;
      const firstLargeContainer = { getBoundingClientRect: () => ({ width: 1200, height: 800 }) };
      const laterContainer = { getBoundingClientRect: () => ({ width: 1200, height: 800 }) };
      const image = ({ src, bounds, naturalWidth = 1600, naturalHeight = 900, container = null }) => ({
        currentSrc: src,
        src,
        alt: '',
        naturalWidth,
        naturalHeight,
        id: '',
        className: '',
        parentElement: null,
        closest: (selector) => selector === 'header' ? null : container,
        getBoundingClientRect: () => bounds,
      });
      global.window = { innerHeight: 800 };
      global.document = {
        baseURI: 'https://photographer.example/',
        images: [
          image({ src: 'https://photographer.example/above-fold.jpg', bounds: { top: 0, bottom: 700, width: 1200 } }),
          image({ src: 'https://photographer.example/early-container.jpg', bounds: { top: 1200, bottom: 1900, width: 1200 }, container: firstLargeContainer }),
          image({ src: 'https://photographer.example/icon.svg', bounds: { top: 0, bottom: 100, width: 100 } }),
          image({ src: 'https://photographer.example/small.jpg', bounds: { top: 0, bottom: 400, width: 700 }, naturalWidth: 799, naturalHeight: 600 }),
          image({ src: 'https://photographer.example/later.jpg', bounds: { top: 2000, bottom: 2700, width: 1200 }, container: laterContainer }),
        ],
        querySelectorAll: (selector) => selector === 'link[rel]' ? [] : [firstLargeContainer],
        createElement: () => assert.fail('PNG transparency check must not run for non-PNG images'),
      };

      try {
        return extractor();
      } finally {
        global.document = originalDocument;
        global.window = originalWindow;
      }
    },
  });

  assert.deepEqual(result.filter((image) => image.isHero).map((image) => image.src), [
    'https://photographer.example/above-fold.jpg',
    'https://photographer.example/early-container.jpg',
  ]);
});

test('extract excludes transparent PNG images from hero candidates', async () => {
  const result = await new ImageService().extract({
    async evaluate(extractor) {
      const originalDocument = global.document;
      const originalWindow = global.window;
      const image = (src, transparent) => ({
        currentSrc: src,
        src,
        alt: '',
        naturalWidth: 1600,
        naturalHeight: 900,
        transparent,
        id: '',
        className: '',
        parentElement: null,
        closest: () => null,
        getBoundingClientRect: () => ({ top: 0, bottom: 700, width: 1200 }),
      });
      global.window = { innerHeight: 800 };
      global.document = {
        baseURI: 'https://photographer.example/',
        images: [
          image('https://photographer.example/opaque.png', false),
          image('https://photographer.example/transparent.png', true),
        ],
        querySelectorAll: () => [],
        createElement: () => ({
          getContext: () => ({
            drawImage(canvasImage) { this.canvasImage = canvasImage; },
            getImageData() { return { data: [0, 0, 0, this.canvasImage.transparent ? 0 : 255] }; },
          }),
        }),
      };

      try {
        return extractor();
      } finally {
        global.document = originalDocument;
        global.window = originalWindow;
      }
    },
  });

  assert.deepEqual(result.filter((image) => image.isHero).map((image) => image.src), [
    'https://photographer.example/opaque.png',
  ]);
});
