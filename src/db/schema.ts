import type { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_CATEGORIES, DEFAULT_OCCASIONS } from '@/types';

// Runs every time the app starts (via SQLiteProvider onInit).
// It is "self-healing": it creates any missing table or column, so the database can never
// end up half-updated (that's what caused "no such table: ai_usage"). Safe to run many times.
export async function migrate(db: SQLiteDatabase) {
  // Lists (occasions, weathers, item_ids) are stored as JSON text, e.g. '["casual","school"]'.
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_uri TEXT NOT NULL,
      category TEXT NOT NULL,
      occasions TEXT NOT NULL DEFAULT '[]',
      weathers TEXT NOT NULL DEFAULT '[]',
      color TEXT NOT NULL DEFAULT '#808080',
      favorite INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    -- kind: 'favorite' (hearted) or 'custom' (built with the + button)
    CREATE TABLE IF NOT EXISTS outfits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'favorite',
      item_ids TEXT NOT NULL,
      occasion TEXT,
      weather TEXT,
      created_at INTEGER NOT NULL
    );

    -- Only ever one row (id = 1).
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      height_cm INTEGER,
      skin_tone INTEGER NOT NULL DEFAULT 5
    );
    INSERT OR IGNORE INTO profile (id) VALUES (1);

    -- How many AI outfit requests were used each day, e.g. ('2026-11-09', 3).
    CREATE TABLE IF NOT EXISTS ai_usage (
      day TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0
    );

    -- Your categories and occasions (Settings lets you add more).
    CREATE TABLE IF NOT EXISTS categories (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      optional INTEGER NOT NULL DEFAULT 1,
      height INTEGER NOT NULL DEFAULT 90,
      built_in INTEGER NOT NULL DEFAULT 0,
      sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS occasions (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      built_in INTEGER NOT NULL DEFAULT 0,
      sort INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Columns added in later versions: add them to older databases that don't have them yet.
  await addColumnIfMissing(db, 'outfits', 'kind', "TEXT NOT NULL DEFAULT 'favorite'");
  await addColumnIfMissing(db, 'items', 'favorite', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'items', 'subtype', 'TEXT');
  await addColumnIfMissing(db, 'items', 'worn_at', 'INTEGER');

  // Built-in categories and occasions (INSERT OR IGNORE = only if not there yet).
  for (const [i, c] of DEFAULT_CATEGORIES.entries()) {
    await db.runAsync(
      'INSERT OR IGNORE INTO categories (key, label, optional, height, built_in, sort) VALUES (?, ?, ?, ?, 1, ?)',
      c.key,
      c.label,
      c.optional ? 1 : 0,
      c.height,
      i
    );
  }
  for (const [i, o] of DEFAULT_OCCASIONS.entries()) {
    await db.runAsync('INSERT OR IGNORE INTO occasions (key, label, built_in, sort) VALUES (?, ?, 1, ?)', o.key, o.label, i);
  }
}

// Adds a column only if the table doesn't already have it.
async function addColumnIfMissing(db: SQLiteDatabase, table: string, column: string, definition: string) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  }
}
