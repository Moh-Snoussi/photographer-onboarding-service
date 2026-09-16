export class LogoService {
  find(images) {
    const candidates = [
      (image) => image.isInHeader && image.hasLogoOrBrandMarker,
      (image) => image.hasLogoOrBrandMarker,
      (image) => /logo/i.test(`${image.alt || ''} ${image.src}`),
      (image) => image.isFavicon,
    ];

    return candidates.map((matches) => images.find(matches)?.src).find(Boolean) || null;
  }
}
