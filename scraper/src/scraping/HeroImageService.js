export class HeroImageService {
  find(images) {
    return images.find((image) => image.isHero)?.src || null;
  }
}
