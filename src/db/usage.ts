import type { SQLiteDatabase } from 'expo-sqlite';
import { DAILY_AI_LIMIT } from '@/lib/gemini';

// Today's date in the phone's local time, e.g. "2026-11-09". A new day = a fresh count.
function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// How many AI outfit requests are left today.
export async function getAiRemaining(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT count FROM ai_usage WHERE day = ?', today());
  return Math.max(0, DAILY_AI_LIMIT - (row?.count ?? 0));
}

// Call after a successful AI request.
export async function recordAiRequest(db: SQLiteDatabase) {
  await db.runAsync(
    'INSERT INTO ai_usage (day, count) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET count = count + 1',
    today()
  );
}
