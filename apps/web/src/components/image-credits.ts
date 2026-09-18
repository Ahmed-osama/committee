// Real photos sourced from Wikimedia Commons for GroundTruth's zero-photo states
// (simulated listings, category tiles, hero art) — every file here is CC0/CC-BY and
// stored locally under public/images/ (downloaded once, not hotlinked), resized to
// a mobile-reasonable max width. Attribution is legally required for the CC-BY ones
// and rendered via <ImageAttribution>, not just kept in this comment.
export type ImageCredit = {
  src: string;
  title: string;
  author: string;
  license: string;
  sourceUrl: string;
};

export const IMAGE_CREDITS = {
  apartment: {
    src: '/images/apartment.jpg',
    title: 'Modern apartment building with greenery',
    author: 'Gexoje24',
    license: 'CC0',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:Modern_apartment_building_with_greenery.jpg',
  },
  house: {
    src: '/images/house.jpg',
    title: 'Siwa Oasis, Village houses, Sahara Desert, Egypt',
    author: 'Vyacheslav Argenberg',
    license: 'CC BY 4.0',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:Siwa_Oasis,_Village_houses,_Sahara_Desert,_Egypt.jpg',
  },
  land: {
    src: '/images/land.jpg',
    title: 'Agriculture Along the Nile River',
    author: 'SentinelHub',
    license: 'CC BY 2.0',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:Agriculture_Along_the_Nile_River_(50304448147).png',
  },
  commercial: {
    src: '/images/commercial.jpg',
    title: 'Grocery shop in Giza, Egypt',
    author: 'Quintin Soloviev',
    license: 'CC BY 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Grocery_shop_in_Giza,_Egypt.jpg',
  },
  hero: {
    src: '/images/hero.jpg',
    title: 'Nile River Delta (MODIS 2020-06-19)',
    author: 'MODIS Land Rapid Response Team, NASA GSFC',
    license: 'Public domain',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Nile_River_Delta_(MODIS_2020-06-19).jpg',
  },
} as const satisfies Record<string, ImageCredit>;

export type PropertyTypeImageKey = 'apartment' | 'house' | 'land' | 'commercial';

export function creditForPropertyType(propertyType: PropertyTypeImageKey): ImageCredit {
  return IMAGE_CREDITS[propertyType];
}
