// Shared types + tag lists used across the app.

// Weather is fixed. Categories and occasions can be extended in Settings (stored in the database).
export const WEATHERS = ['hot', 'rainy'] as const;
export type Weather = (typeof WEATHERS)[number];

export type Category = string; // e.g. "top", or your own like "hats"
export type Occasion = string; // e.g. "casual", or your own like "party"

// A category row on the Dressup screen.
export type CategoryDef = {
  key: string; // stored on items, e.g. "top"
  label: string; // shown on screen, e.g. "Tops"
  optional: boolean; // true = row has a "None" choice (jackets, accessories, your own)
  height: number; // image height on the Dressup screen
  builtIn: boolean; // built-in ones can't be deleted (the outfit rules rely on them)
};
export type OccasionDef = { key: string; label: string; builtIn: boolean };

// The starting lists, created in the database the first time the app runs.
export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { key: 'top', label: 'Tops', optional: false, height: 110, builtIn: true },
  { key: 'bottom', label: 'Bottoms', optional: false, height: 140, builtIn: true },
  { key: 'shoes', label: 'Shoes', optional: false, height: 80, builtIn: true },
  { key: 'jacket', label: 'Jackets', optional: true, height: 110, builtIn: true },
  { key: 'accessory', label: 'Accessories', optional: true, height: 70, builtIn: true },
];
export const DEFAULT_OCCASIONS: OccasionDef[] = [
  { key: 'casual', label: 'Casual', builtIn: true },
  { key: 'formal', label: 'Formal', builtIn: true },
  { key: 'school', label: 'School', builtIn: true },
];

// One clothing item. occasions/weathers are lists because one item can fit several.
export type Item = {
  id: number;
  imageUri: string; // local file path of the transparent PNG
  category: Category;
  subtype: string | null; // style within the category, e.g. "Shirt", "Jeans", "Sneakers"
  occasions: Occasion[];
  weathers: Weather[];
  color: string; // hex like "#1a2b3c"
  favorite: boolean; // hearted on the Dressup screen
  wornAt: number | null; // when you last wore it (ms). Worn this week = skipped by shuffle
  createdAt: number;
};

// A saved outfit = a list of item ids.
// "favorite" = a look you hearted, "custom" = a look you built yourself with the + button.
export type OutfitKind = 'favorite' | 'custom';

export type Outfit = {
  id: number;
  name: string;
  kind: OutfitKind;
  itemIds: number[];
  occasion: Occasion | null;
  weather: Weather | null;
  createdAt: number;
};

export type Profile = {
  heightCm: number | null;
  skinTone: number; // 1 (lightest) .. 10 (darkest)
};

// Ready-made styles for each built-in category (you can also type your own with "Other").
export const SUBTYPES: Record<string, string[]> = {
  top: ['T-shirt', 'Shirt', 'Polo', 'Blouse', 'Sweater', 'Hoodie', 'Tank top'],
  bottom: ['Jeans', 'Trousers', 'Shorts', 'Chinos', 'Joggers', 'Skirt'],
  shoes: ['Sneakers', 'Loafers', 'Boots', 'Sandals', 'Heels', 'Slides'],
  jacket: ['Denim jacket', 'Blazer', 'Bomber', 'Raincoat', 'Coat', 'Cardigan'],
  accessory: ['Cap', 'Hat', 'Watch', 'Bag', 'Belt', 'Glasses', 'Necklace'],
};
