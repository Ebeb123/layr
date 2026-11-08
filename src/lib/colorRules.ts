import type { Item } from '@/types';

type Hsl = { h: number; s: number; l: number }; // h: 0-360, s and l: 0-1

// Converts "#rrggbb" to hue / saturation / lightness, which is easier to reason about.
export function hexToHsl(hex: string): Hsl {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h, s, l };
}

// Neutrals (black, white, grey, navy, beige) go with anything.
export function isNeutral(hex: string): boolean {
  const { h, s, l } = hexToHsl(hex);
  if (s < 0.2 || l < 0.18 || l > 0.92) return true; // greys, near-black, near-white
  if (h >= 200 && h <= 240 && l < 0.3) return true; // navy
  if (h >= 20 && h <= 50 && l > 0.55 && s < 0.5) return true; // beige / tan
  return false;
}

// Bright = strong, saturated color like red, lime, hot pink.
export function isBright(hex: string): boolean {
  const { s, l } = hexToHsl(hex);
  return s > 0.6 && l > 0.35 && l < 0.75;
}

// Distance between two hues on the color wheel (0-180).
const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

// Score for a pair of colors: positive = good together, negative = clash.
export function pairScore(a: string, b: string): number {
  if (isNeutral(a) || isNeutral(b)) return 1;
  const gap = hueGap(hexToHsl(a).h, hexToHsl(b).h);
  const bothBright = isBright(a) && isBright(b);
  if (gap < 30) return 2; // same color family
  if (gap > 150) return bothBright ? -2 : 2; // opposite colors: fine unless both loud
  return bothBright ? -5 : -1; // in-between hues tend to clash, worst when both bright
}

// Total score for a whole outfit. Higher is better.
export function outfitScore(items: Item[], skinTone: number): number {
  let score = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) score += pairScore(items[i].color, items[j].color);
  }
  const brights = items.filter((it) => isBright(it.color)).length;
  if (brights > 1) score -= 3 * (brights - 1); // one statement piece is enough

  // Small skin-tone hint for the top (closest to the face).
  const top = items.find((it) => it.category === 'top');
  if (top) {
    const { l } = hexToHsl(top.color);
    if (skinTone >= 7 && (l > 0.6 || isBright(top.color))) score += 1; // light/bright tops pop on deeper skin
    if (skinTone <= 3 && l < 0.45 && !isNeutral(top.color)) score += 1; // deeper colors contrast with light skin
  }
  return score;
}

// Simple color names, used as row titles on the Dressup screen.
const NAMED: [string, string][] = [
  ['Black', '#111111'], ['White', '#f5f5f5'], ['Grey', '#8c8c8c'], ['Navy', '#1f2a44'], ['Blue', '#2e6fd8'],
  ['Light blue', '#9cc3e6'], ['Red', '#c62828'], ['Maroon', '#7a2430'], ['Pink', '#e88aa8'], ['Orange', '#ef7d22'],
  ['Yellow', '#f2c94c'], ['Green', '#2e9d4f'], ['Olive', '#6b6b2a'], ['Brown', '#7a4b2a'], ['Beige', '#d8c3a0'],
  ['Purple', '#7b4bb7'],
];

// Returns the name of the closest color in the list above.
export function colorName(hex: string): string {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r, g, b] = rgb(hex);
  let best = NAMED[0][0];
  let bestDist = Infinity;
  for (const [name, value] of NAMED) {
    const [r2, g2, b2] = rgb(value);
    const dist = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (dist < bestDist) [best, bestDist] = [name, dist];
  }
  return best;
}
