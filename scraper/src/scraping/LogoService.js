export class LogoService {
  find(images) {
    return images.find((image) => /logo/i.test(`${image.alt || ''} ${image.src}`))?.src || null;
  }
}
