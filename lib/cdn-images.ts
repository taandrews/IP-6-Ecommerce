import { asset } from "@/lib/assets";

/**
 * Pictures and clips that used to ship inside the app build. They live in the
 * assets bucket like everything else; next/image needs each remote picture's
 * size up front, so it is recorded here beside the path.
 */
export interface CdnImage {
  src: string;
  width: number;
  height: number;
}

const img = (path: string, width: number, height: number): CdnImage => ({ src: asset(path), width, height });

export const HERO = {
  doctor: img("hero/doctor-cutout-v1.webp", 1254, 1254),
  yoga: img("hero/yoga-full-scene-desktop.webp", 1983, 793),
  yogaMobile: img("hero/yoga-full-scene-mobile.webp", 887, 1774),
  approvedSlide: img("hero/ip6-corrected-slide-desktop.webp", 1812, 868),
  approvedSlideMobile: img("hero/ip6-approved-slide-mobile.webp", 887, 1774),
  productScene: img("hero/ip6-products-mobile-cutout-v1.png", 1536, 1024),
  capsulesPowderScene: img("hero/ip6-capsules-powder-scene.webp", 1536, 1024),
} as const;

export const LIFESTYLE = {
  supplementMain: img("products/lifestyle/supplement-main.png", 1374, 1145),
  supplementDetail: img("products/lifestyle/supplement-detail.png", 1254, 1254),
  supplementUse: img("products/lifestyle/supplement-use.png", 1254, 1254),
  supplementRoutine: img("products/lifestyle/supplement-routine.png", 1774, 887),
  petMain: img("products/lifestyle/pet-main.png", 1374, 1145),
  petDetail: img("products/lifestyle/pet-detail.png", 1254, 1254),
  petUse: img("products/lifestyle/pet-use.png", 1254, 1254),
  petRoutine: img("products/lifestyle/pet-routine.png", 1774, 887),
  petFeeding: img("products/lifestyle/pet-feeding-v2.png", 1374, 1145),
} as const;

export const LABEL_240 = img("products/supplement-240-label.jpg", 1600, 622);

/** The shop page hero clips, with their first-frame posters. */
export const SHOP_VIDEO = {
  supplement: { video: asset("shop/video/supplement-field.mp4"), poster: asset("shop/video/supplement-field-poster.jpg"), width: 2048, height: 1080 },
  pets: { video: asset("shop/video/pets-golden.mp4"), poster: asset("shop/video/pets-golden-poster.jpg"), width: 1920, height: 1080 },
} as const;
