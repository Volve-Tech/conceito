/**
 * Visual tokens ported from the Next.js MUI theme.
 * htmlFontSize is 10px, so 1rem = 10px. MUI spacing(n) = n * 5px = n * 0.5rem.
 */

export const CONTAINER_WIDTH = 1260;
export const CONTAINER_WIDTH_WIDE = 1262;
export const HEADER_HEIGHT = '9rem';
export const HEADER_HEIGHT_MD = '8rem';
export const SPACER_PX = 5;

export const DEFAULT_LOCALE = 'en-US';
export const LOCALES = ['en-US', 'de-DE'] as const;
export type Locale = (typeof LOCALES)[number];

export const SITE_NAME = 'Conceito Contabilidade';
export const SITE_TAGLINE =
  'Comprometimento. Eficiência. Performance. Isso é Conceito Contabilidade.';

export const GA_MEASUREMENT_ID = 'G-4V1J6BGDFL';

export interface ColorConfig {
  headlineColor: string;
  textColor: string;
  backgroundColor: string;
  buttonColor: 'primary' | 'secondary';
}

const colorConfigs: Record<string, ColorConfig> = {
  'palette-1. White (#FFFFFF)': {
    headlineColor: '#3A393E',
    textColor: '#414D63',
    backgroundColor: '#fff',
    buttonColor: 'primary',
  },
  'palette-7. Black (#000000)': {
    headlineColor: '#fff',
    textColor: '#bbb',
    backgroundColor: '#000',
    buttonColor: 'secondary',
  },
  'palette-2. White Smoke (#FCFCFC)': {
    headlineColor: '#1B273A',
    textColor: '#414D63',
    backgroundColor: '#fcfcfc',
    buttonColor: 'primary',
  },
  'palette-3. Light Gray (#F4F4F4)': {
    headlineColor: '#000',
    textColor: '#000',
    backgroundColor: '#f4f4f4',
    buttonColor: 'primary',
  },
  'palette-4. Gray (#EAEAEA)': {
    headlineColor: '#000',
    textColor: '#000',
    backgroundColor: '#eaeaea',
    buttonColor: 'primary',
  },
  'palette-5. Steel Gray (#BBBBBB)': {
    headlineColor: '#000',
    textColor: '#000',
    backgroundColor: '#bbbbbb',
    buttonColor: 'primary',
  },
  'palette-6. Dark Gray (#797979)': {
    headlineColor: '#fff',
    textColor: '#fff',
    backgroundColor: '#797979',
    buttonColor: 'secondary',
  },
};

/**
 * Resolve a Contentful palette string to theme colors.
 * Accepts both `1. White (#FFFFFF)` and `palette-1. White (#FFFFFF)`.
 */
export function getColorConfigFromPalette(palette?: string | null): ColorConfig {
  const fallback = colorConfigs['palette-1. White (#FFFFFF)'];
  if (!palette) return fallback;
  if (colorConfigs[palette]) return colorConfigs[palette];
  if (colorConfigs[`palette-${palette}`]) return colorConfigs[`palette-${palette}`];
  return fallback;
}

export interface LayoutContextValue {
  containerWidth: number;
  parent: string;
}

export const defaultLayout: LayoutContextValue = {
  containerWidth: 770,
  parent: '',
};

export const wideLayout: LayoutContextValue = {
  containerWidth: CONTAINER_WIDTH_WIDE,
  parent: '',
};
