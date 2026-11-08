import type { SQLiteDatabase } from 'expo-sqlite';
import type { Profile } from '@/types';

// The profile table always has exactly one row (id = 1), created in schema.ts.
export async function getProfile(db: SQLiteDatabase): Promise<Profile> {
  const row = await db.getFirstAsync<{ height_cm: number | null; skin_tone: number }>(
    'SELECT height_cm, skin_tone FROM profile WHERE id = 1'
  );
  return { heightCm: row?.height_cm ?? null, skinTone: row?.skin_tone ?? 5 };
}

export async function saveProfile(db: SQLiteDatabase, profile: Profile) {
  await db.runAsync('UPDATE profile SET height_cm = ?, skin_tone = ? WHERE id = 1', profile.heightCm, profile.skinTone);
}
