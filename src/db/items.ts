import type { SQLiteDatabase } from 'expo-sqlite';
import type { Category, Item, Occasion, Weather } from '@/types';

// Shape of a row exactly as stored in SQLite.
type ItemRow = {
  id: number;
  image_uri: string;
  category: string;
  subtype: string | null;
  occasions: string;
  weathers: string;
  color: string;
  favorite: number;
  worn_at: number | null;
  created_at: number;
};

// Converts a DB row into the Item type the app uses.
export function rowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    imageUri: row.image_uri,
    category: row.category as Category,
    subtype: row.subtype ?? null,
    occasions: JSON.parse(row.occasions) as Occasion[],
    weathers: JSON.parse(row.weathers) as Weather[],
    color: row.color,
    favorite: row.favorite === 1,
    wornAt: row.worn_at ?? null,
    createdAt: row.created_at,
  };
}

export type NewItem = Omit<Item, 'id' | 'createdAt' | 'favorite' | 'wornAt'>;

export async function addItem(db: SQLiteDatabase, item: NewItem): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO items (image_uri, category, subtype, occasions, weathers, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    item.imageUri,
    item.category,
    item.subtype,
    JSON.stringify(item.occasions),
    JSON.stringify(item.weathers),
    item.color,
    Date.now()
  );
  return result.lastInsertRowId;
}

export async function getItems(db: SQLiteDatabase): Promise<Item[]> {
  const rows = await db.getAllAsync<ItemRow>('SELECT * FROM items ORDER BY created_at DESC');
  return rows.map(rowToItem);
}

export async function getItem(db: SQLiteDatabase, id: number): Promise<Item | null> {
  const row = await db.getFirstAsync<ItemRow>('SELECT * FROM items WHERE id = ?', id);
  return row ? rowToItem(row) : null;
}

export async function updateItem(db: SQLiteDatabase, id: number, item: NewItem) {
  await db.runAsync(
    'UPDATE items SET image_uri = ?, category = ?, subtype = ?, occasions = ?, weathers = ?, color = ? WHERE id = ?',
    item.imageUri,
    item.category,
    item.subtype,
    JSON.stringify(item.occasions),
    JSON.stringify(item.weathers),
    item.color,
    id
  );
}

export async function deleteItem(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM items WHERE id = ?', id);
}

// Heart / un-heart one piece of clothing.
export async function setItemFavorite(db: SQLiteDatabase, id: number, favorite: boolean) {
  await db.runAsync('UPDATE items SET favorite = ? WHERE id = ?', favorite ? 1 : 0, id);
}

// Styles you've already used for a category (so your own ones show up as choices next time).
export async function getUsedSubtypes(db: SQLiteDatabase, category: string): Promise<string[]> {
  const rows = await db.getAllAsync<{ subtype: string }>(
    'SELECT DISTINCT subtype FROM items WHERE category = ? AND subtype IS NOT NULL AND subtype <> ?',
    category,
    ''
  );
  return rows.map((r) => r.subtype);
}

// Mark clothes as worn (time = now) or washed again (time = null).
export async function setItemsWorn(db: SQLiteDatabase, ids: number[], time: number | null) {
  for (const id of ids) await db.runAsync('UPDATE items SET worn_at = ? WHERE id = ?', time, id);
}
