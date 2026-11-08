import { File, Paths } from 'expo-file-system';
import { candidates, suggestLocal, type Slots, type Suggestion } from '@/lib/suggest';
import type { Item, Occasion, Profile, Weather } from '@/types';

// Change the model here. See https://aistudio.google.com/docs/models
export const GEMINI_MODEL = 'gemini-3.5-flash-lite';

// How many AI outfit suggestions you allow yourself per day (saves your free quota).
export const DAILY_AI_LIMIT = 5;

// From .env -> EXPO_PUBLIC_GEMINI_API_KEY=... (restart with `npx expo start -c` after editing)
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const TIMEOUT_MS = 15000;

export type SuggestResult = {
  suggestions: Suggestion[];
  source: 'ai' | 'offline';
  error?: string; // why we fell back to offline rules
};

// Main entry: try Gemini first, use the local color rules if anything goes wrong.
export async function suggestOutfits(
  items: Item[],
  occasion: Occasion,
  weather: Weather | null,
  profile: Profile,
  allowAI = true, // false when today's AI limit is used up
  categoryKeys: string[] = ['top', 'bottom', 'shoes', 'jacket', 'accessory'] // your categories
): Promise<SuggestResult> {
  const local = () => suggestLocal(items, occasion, weather, profile);
  if (!allowAI) return { suggestions: local(), source: 'offline', error: 'daily AI limit reached' };
  if (!API_KEY) return { suggestions: local(), source: 'offline', error: 'No API key in .env' };
  try {
    const suggestions = await askGemini(items, occasion, weather, profile, categoryKeys);
    return { suggestions, source: 'ai' };
  } catch (e) {
    return { suggestions: local(), source: 'offline', error: e instanceof Error ? e.message : String(e) };
  }
}

async function askGemini(
  items: Item[],
  occasion: Occasion,
  weather: Weather | null,
  profile: Profile,
  categoryKeys: string[]
): Promise<Suggestion[]> {
  // Only send text metadata (no images) for items that suit this occasion/weather.
  const pool = categoryKeys.flatMap((c) => candidates(items, c, occasion, weather));
  // Example reply shape with one slot per category, e.g. {"top":1,"bottom":null,...}
  const shape = Object.fromEntries(categoryKeys.map((c) => [c, null]));
  const wardrobe = pool.map((it) => ({
    id: it.id,
    category: it.category,
    style: it.subtype,
    color: it.color,
    occasions: it.occasions,
    weathers: it.weathers,
  }));

  const prompt = `You are a fashion stylist. Suggest up to 5 different outfits for:
occasion: ${occasion}
weather: ${weather ?? 'normal'}
person: height ${profile.heightCm ?? 'unknown'} cm, skin tone ${profile.skinTone} on a 1 (lightest) to 10 (darkest) scale.

Use ONLY items from this wardrobe (colors are hex):
${JSON.stringify(wardrobe)}

Rules: each slot must hold the id of an item with that exact category, or null. Prefer a top, bottom and shoes.
Add a jacket if rainy, never if hot. Other categories are optional extras. Avoid clashing bright colors.
Reply with JSON only, in this shape (one key per category, plus "reason"):
{"outfits":[${JSON.stringify({ ...shape, reason: 'one short sentence' })}]}`;

  // Abort the request if it takes too long (e.g. bad connection).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY! },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
      signal: controller.signal,
    });
  } catch {
    throw new Error('No connection');
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw new Error(`Gemini error ${response.status}`);

  const data = await response.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty AI response');
  return validate(JSON.parse(text), items, categoryKeys);
}

// Never trust AI output blindly: keep only ids that exist and are in the right slot.
function validate(json: unknown, items: Item[], categoryKeys: string[]): Suggestion[] {
  const byId = new Map(items.map((it) => [it.id, it]));
  const outfits = (json as { outfits?: Record<string, unknown>[] })?.outfits;
  if (!Array.isArray(outfits)) throw new Error('Bad AI response');

  const results: Suggestion[] = [];
  for (const o of outfits) {
    const slots: Slots = {};
    for (const category of categoryKeys) {
      const item = byId.get(Number(o[category]));
      if (item && item.category === category) slots[category] = item.id;
    }
    if (Object.keys(slots).length > 0) {
      results.push({ slots, reason: typeof o.reason === 'string' ? o.reason : 'Suggested by AI' });
    }
  }
  if (results.length === 0) throw new Error('AI gave no usable outfits');
  return results;
}

// ---------------------------------------------------------------------------
// AI clean-up: redraws a messy clothing photo as a neat, front-facing product shot.
// Needs billing turned on for your Gemini key (image models have no free quota).
// ---------------------------------------------------------------------------

// Change the image model here.
export const GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image';
const IMAGE_TIMEOUT_MS = 60000;

const CLEANUP_PROMPT = `Recreate this clothing item as a clean e-commerce product photo.
Keep the exact same item: same colors, pattern, print, logos and material.
Show it straight-on from the front (shoes: side profile facing left), neatly laid out and wrinkle-free,
centered, filling most of the frame, on a plain pure white background, soft even lighting, no person, no hanger, no text.`;

// Returns a file uri of the cleaned image. Throws if the request fails (caller falls back to the original).
export async function cleanUpClothingImage(uri: string): Promise<string> {
  if (!API_KEY) throw new Error('No API key in .env');
  const base64 = await new File(uri).base64();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64 } }, { text: CLEANUP_PROMPT }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
      signal: controller.signal,
    });
  } catch {
    throw new Error('No connection');
  } finally {
    clearTimeout(timer);
  }
  if (response.status === 429) throw new Error('quota used up or billing not enabled');
  if (!response.ok) throw new Error(`Gemini error ${response.status}`);

  // Find the image part in the reply.
  const data = await response.json();
  const parts: { inlineData?: { data?: string } }[] = data?.candidates?.[0]?.content?.parts ?? [];
  const imageBase64 = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
  if (!imageBase64) throw new Error('AI returned no image');

  const out = new File(Paths.cache, `clean_${Date.now()}.png`);
  out.write(imageBase64, { encoding: 'base64' });
  return out.uri;
}
