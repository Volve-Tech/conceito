/**
 * MUI default breakpoints in px.
 * Use these in CSS `@media` queries — `rem` in media queries resolves against
 * the UA 16px root, not `html { font-size: 10px }`.
 */
export const breakpoints = {
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

/** Swiper pixel breakpoints from the Next services carousel. */
export const swiperBreakpoints = {
  peek: 0,
  two: 600,
  three: 960,
  wide: 1280,
} as const;
