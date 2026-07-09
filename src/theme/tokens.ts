/**
 * Regrade design tokens. This file is the ONLY place hex color literals
 * are allowed. Components must import from here (or reference the CSS
 * custom properties named in `cssVar`) instead of hardcoding values.
 */

export const palette = {
  navy: '#0A1F44',
  navyRaised: '#1B3464',
  navyDark: '#060F22',
  cyan: '#4FA8E0',
  cyanBright: '#7DD3FC',
  cream: '#F8F5EE',
  creamRaised: '#EFEAE0',
  border: '#E8E2D6',
  muted: '#6B7280',
  coral: '#E27D6B',
  green: '#4ADE80',
  gold: '#F59E0B',
} as const;

export type PaletteKey = keyof typeof palette;

export const fonts = {
  display: "'Playfair Display', Georgia, serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

export type FontKey = keyof typeof fonts;

/** Spacing scale in px. Index into this table; do not invent gaps. */
export const space = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96] as const;

export type SpaceStep = (typeof space)[number];

/** Corner radii in px. `pill` is the fully rounded control shape. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  card: 20,
  pill: 9999,
} as const;

export type RadiusKey = keyof typeof radius;

/**
 * CSS custom property names for each palette entry, so components can
 * write `var(--rg-navy)` and stay theme-switchable (light/dark) without
 * importing raw hex values.
 */
export const cssVar = {
  navy: '--rg-navy',
  navyRaised: '--rg-navy-raised',
  navyDark: '--rg-navy-dark',
  cyan: '--rg-cyan',
  cyanBright: '--rg-cyan-bright',
  cream: '--rg-cream',
  creamRaised: '--rg-cream-raised',
  border: '--rg-border',
  muted: '--rg-muted',
  coral: '--rg-coral',
  green: '--rg-green',
  gold: '--rg-gold',
} as const satisfies Record<PaletteKey, `--rg-${string}`>;

export type CssVarName = (typeof cssVar)[PaletteKey];

/** Convenience: `cssVarRef('navy')` returns "var(--rg-navy)". */
export function cssVarRef(key: PaletteKey): string {
  return `var(${cssVar[key]})`;
}
