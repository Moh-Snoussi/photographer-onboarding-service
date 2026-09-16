import test from 'node:test';
import assert from 'node:assert/strict';
import { LogoService } from '../src/scraping/LogoService.js';

test('find prioritizes an image marked as logo or brand in the header', () => {
  const logo = new LogoService().find([
    { src: 'https://photographer.example/logo-outside-header.svg', hasLogoOrBrandMarker: true },
    { src: 'https://photographer.example/header-brand.svg', isInHeader: true, hasLogoOrBrandMarker: true },
    { src: 'https://photographer.example/favicon.ico', isFavicon: true },
  ]);

  assert.equal(logo, 'https://photographer.example/header-brand.svg');
});

test('find falls back from logo URL matching to a favicon candidate', () => {
  const logo = new LogoService().find([
    { src: 'https://photographer.example/hero.jpg', alt: 'Portrait' },
    { src: 'https://photographer.example/favicon.ico', isFavicon: true },
  ]);

  assert.equal(logo, 'https://photographer.example/favicon.ico');
});
