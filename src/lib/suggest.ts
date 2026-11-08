import { isNeutral, outfitScore } from '@/lib/colorRules';
import type { Category, Item, Occasion, Profile, Weather } from '@/types';

// Which item fills each slot of an outfit (item ids). Missing slot = nothing there.
export type Slots = Record<string, number | undefined>;
export type Suggestion = { slots: Slots; reason: string };

// Items with no occasion/weather tags are treated as "fits anything".
export function fits(item: Item, occasion: Occasion, weather: Weather | null): boolean {
  const okOccasion = item.occasions.length === 0 || item.occasions.includes(occasion);
  const okWeather = !weather || item.weathers.length === 0 || item.weathers.includes(weather);
  return okOccasion && okWeather;
}

// Items of one category that suit the occasion/weather. Falls back to all of that category.
export function candidates(items: Item[], category: Category, occasion: Occasion, weather: Weather | null): Item[] {
  const ofCategory = items.filter((it) => it.category === category);
  const fitting = ofCategory.filter((it) => fits(it, occasion, weather));
  return fitting.length > 0 ? fitting : ofCategory;
}

// Offline suggestions: try every top + bottom + shoes combo, score the colors, keep the best.
export function suggestLocal(
  items: Item[],
  occasion: Occasion,
  weather: Weather | null,
  profile: Profile,
  count = 5
): Suggestion[] {
  const pick = (c: Category, max: number) => candidates(items, c, occasion, weather).slice(0, max);
  const orNone = (list: Item[]) => (list.length > 0 ? list : [undefined]); // allow a missing category
  const tops = orNone(pick('top', 10));
  const bottoms = orNone(pick('bottom', 10));
  const shoes = orNone(pick('shoes', 6));
  const jackets = pick('jacket', 6);
  const accessories = pick('accessory', 6);

  // Build and score every combination.
  const combos: { parts: Item[]; score: number }[] = [];
  for (const t of tops) for (const b of bottoms) for (const s of shoes) {
    const parts = [t, b, s].filter((x): x is Item => !!x);
    if (parts.length === 0) continue;
    // Rainy -> add the jacket that matches best. Hot -> no jacket.
    if (weather === 'rainy' && jackets.length > 0) parts.push(bestAddition(parts, jackets, profile.skinTone));
    combos.push({ parts, score: outfitScore(parts, profile.skinTone) });
  }
  combos.sort((a, b) => b.score - a.score);

  // Keep variety: each top may appear at most twice.
  const results: Suggestion[] = [];
  const topUses = new Map<number, number>();
  for (const combo of combos) {
    if (results.length >= count) break;
    const top = combo.parts.find((p) => p.category === 'top');
    const used = top ? topUses.get(top.id) ?? 0 : 0;
    if (top && used >= 2) continue;
    if (top) topUses.set(top.id, used + 1);

    const parts = [...combo.parts];
    // Add an accessory only if it doesn't make the colors worse.
    if (accessories.length > 0) {
      const acc = bestAddition(parts, accessories, profile.skinTone);
      if (outfitScore([...parts, acc], profile.skinTone) >= combo.score) parts.push(acc);
    }
    results.push({ slots: toSlots(parts), reason: explain(parts) });
  }
  return results;
}

// The option that gives the highest outfit score when added.
function bestAddition(parts: Item[], options: Item[], skinTone: number): Item {
  return options.reduce((best, o) =>
    outfitScore([...parts, o], skinTone) > outfitScore([...parts, best], skinTone) ? o : best
  );
}

export function toSlots(parts: Item[]): Slots {
  const slots: Slots = {};
  for (const p of parts) slots[p.category] = p.id;
  return slots;
}

// Short human-readable reason for the suggestion.
export function explain(parts: Item[]): string {
  const neutrals = parts.filter((p) => isNeutral(p.color)).length;
  if (neutrals === parts.length) return 'All neutrals: safe and clean.';
  if (neutrals > 0) return 'Neutral base with a color accent.';
  return 'Colors from matching families.';
}
