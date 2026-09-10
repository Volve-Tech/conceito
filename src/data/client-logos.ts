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

/**
 * Client marks cropped from the CMS composite `logos1.png`, in visual order.
 */
export const clientLogos: ClientLogo[] = [
  { src: '/assets/brand/clients/simaq.png', alt: 'Simaq', width: 284, height: 98 },
  { src: '/assets/brand/clients/oboticario.png', alt: 'oBoticário', width: 274, height: 112 },
  { src: '/assets/brand/clients/c-nivel.png', alt: 'C-Nível Energias', width: 220, height: 82 },
  { src: '/assets/brand/clients/amb.png', alt: 'AMB', width: 232, height: 73 },
  { src: '/assets/brand/clients/bta.png', alt: 'BTA', width: 227, height: 96 },
  { src: '/assets/brand/clients/gsc.png', alt: 'GSC Soluções em Fibra de Vidro', width: 220, height: 122 },
  { src: '/assets/brand/clients/hidropav.png', alt: 'Hidropav Industrial', width: 297, height: 74 },
];

/**
 * True when this duplex should render the logo grid instead of a single image.
 */
export function isClientLogoDuplex(entry: { sys?: { id?: string } } | null | undefined, isOnlyImage: boolean): boolean {
  return Boolean(isOnlyImage && entry?.sys?.id === CLIENT_LOGO_DUPLEX_ID);
}
