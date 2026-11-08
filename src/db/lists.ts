import type { SQLiteDatabase } from 'expo-sqlite';
import type { CategoryDef, OccasionDef } from '@/types';

type CategoryRow = { key: string; label: string; optional: number; height: number; built_in: number };
type OccasionRow = { key: string; label: string; built_in: number };

export async function getCategories(db: SQLiteDatabase): Promise<CategoryDef[]> {
  const rows = await db.getAllAsync<CategoryRow>('SELECT * FROM categories ORDER BY sort, rowid');
  return rows.map((r) => ({ key: r.key, label: r.label, optional: !!r.optional, height: r.height, builtIn: !!r.built_in }));
}

export async function getOccasions(db: SQLiteDatabase): Promise<OccasionDef[]> {
  const rows = await db.getAllAsync<OccasionRow>('SELECT * FROM occasions ORDER BY sort, rowid');
  return rows.map((r) => ({ key: r.key, label: r.label, builtIn: !!r.built_in }));
}

// Turns "Party Wear" into a key like "party wear" (what gets stored on items).
export const toKey = (label: string) => label.trim().toLowerCase();

// New categories are optional rows (they get a "None" choice) placed after the built-in ones.
export async function addCategory(db: SQLiteDatabase, label: string) {
  await db.runAsync(
    'INSERT INTO categories (key, label, optional, height, built_in, sort) VALUES (?, ?, 1, 90, 0, 100)',
    toKey(label),
    label.trim()
  );
}

export async function addOccasion(db: SQLiteDatabase, label: string) {
  await db.runAsync('INSERT INTO occasions (key, label, built_in, sort) VALUES (?, ?, 0, 100)', toKey(label), label.trim());
}

// How many items use this category (we don't delete a category that still has clothes).
export async function countItemsInCategory(db: SQLiteDatabase, key: string): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM items WHERE category = ?', key);
  return row?.n ?? 0;
}

export async function deleteCategory(db: SQLiteDatabase, key: string) {
  await db.runAsync('DELETE FROM categories WHERE key = ? AND built_in = 0', key);
}

export async function deleteOccasion(db: SQLiteDatabase, key: string) {
  await db.runAsync('DELETE FROM occasions WHERE key = ? AND built_in = 0', key);
}
