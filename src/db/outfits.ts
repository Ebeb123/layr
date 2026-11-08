import type { SQLiteDatabase } from 'expo-sqlite';
import type { Occasion, Outfit, OutfitKind, Weather } from '@/types';

type OutfitRow = {
  id: number;
  name: string;
  kind: string;
  item_ids: string;
  occasion: string | null;
  weather: string | null;
  created_at: number;
};

const rowToOutfit = (row: OutfitRow): Outfit => ({
  id: row.id,
  name: row.name,
  kind: row.kind as OutfitKind,
  itemIds: JSON.parse(row.item_ids) as number[],
  occasion: row.occasion as Occasion | null,
  weather: row.weather as Weather | null,
  createdAt: row.created_at,
});

export async function addOutfit(db: SQLiteDatabase, outfit: Omit<Outfit, 'id' | 'createdAt'>) {
  await db.runAsync(
    'INSERT INTO outfits (name, kind, item_ids, occasion, weather, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    outfit.name,
    outfit.kind,
    JSON.stringify(outfit.itemIds),
    outfit.occasion,
    outfit.weather,
    Date.now()
  );
}

export async function getOutfits(db: SQLiteDatabase): Promise<Outfit[]> {
  const rows = await db.getAllAsync<OutfitRow>('SELECT * FROM outfits ORDER BY created_at DESC');
  return rows.map(rowToOutfit);
}

export async function getOutfit(db: SQLiteDatabase, id: number): Promise<Outfit | null> {
  const row = await db.getFirstAsync<OutfitRow>('SELECT * FROM outfits WHERE id = ?', id);
  return row ? rowToOutfit(row) : null;
}

export async function deleteOutfit(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM outfits WHERE id = ?', id);
}

// Finds a saved outfit of this kind with exactly these items (any order), or null.
export function findSameOutfit(outfits: Outfit[], itemIds: number[], kind: OutfitKind): Outfit | null {
  const key = [...itemIds].sort((a, b) => a - b).join(',');
  return outfits.find((o) => o.kind === kind && [...o.itemIds].sort((a, b) => a - b).join(',') === key) ?? null;
}
