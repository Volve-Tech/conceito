/**
 * Snapshot id of the home “Quem confia em nós” duplex.
 * Image-only on en-US; leftover Coin copy on de-DE must keep the generic duplex.
 */
export const CLIENT_LOGO_DUPLEX_ID = '4nDmB3Gv4E7IlWt6jaIER9';

export interface ClientLogo {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/** Snapshot id of the AMB slide in “Ao lado da empresa em todos os momentos”. */
export const AMB_TESTIMONIAL_ID = '3BCxBDykQVR1y6xaHlWfVB';

/** In-repo AMB mark; survives a Contentful snapshot wipe of the CMS asterisk asset. */
export const AMB_BRAND_SRC = '/assets/brand/clients/amb.png';

/**
 * Client marks for “Quem confia em nós”, in visual order.
 * Brand PNGs live in `src/assets/brand/clients` and are copied to `public/assets/brand/clients`.
 */
export const clientLogos: ClientLogo[] = [
  { src: '/assets/brand/clients/oboticario.png', alt: 'oBoticário', width: 274, height: 112 },
  { src: '/assets/brand/clients/via-imagem.png', alt: 'Via Imagem', width: 1024, height: 425 },
  { src: '/assets/brand/clients/c-nivel.png', alt: 'C-Nível Energias', width: 1024, height: 341 },
  { src: '/assets/brand/clients/amb.png', alt: 'AMB Soluções Corporativas', width: 1024, height: 380 },
  { src: '/assets/brand/clients/bta.png', alt: 'BTA', width: 1024, height: 425 },
  { src: '/assets/brand/clients/gsc.png', alt: 'GSC Soluções em Fibra de Vidro', width: 1024, height: 425 },
  { src: '/assets/brand/clients/cot.png', alt: 'COT', width: 976, height: 323 },
];

/**
 * Resolve the brand image for a testimonial, overriding the CMS AMB asset.
 */
export function resolveTestimonialBrandUrl(entry: { sys?: { id?: string }; brand?: { url?: string } } | null | undefined): string | undefined {
  if (entry?.sys?.id === AMB_TESTIMONIAL_ID) {
    return AMB_BRAND_SRC;
  }
  return entry?.brand?.url;
}

/**
 * True when the testimonial brand is already a finished mark and must skip invert.
 */
export function isNeutralTestimonialBrand(entry: { sys?: { id?: string } } | null | undefined): boolean {
  return entry?.sys?.id === AMB_TESTIMONIAL_ID;
}

/**
 * True when this duplex should render the logo grid instead of a single image.
 */
export function isClientLogoDuplex(entry: { sys?: { id?: string } } | null | undefined, isOnlyImage: boolean): boolean {
  return Boolean(isOnlyImage && entry?.sys?.id === CLIENT_LOGO_DUPLEX_ID);
}
