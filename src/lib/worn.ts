import type { Item } from '@/types';

// Monday 00:00 of the current week (local time), in milliseconds.
export function startOfWeek(now = new Date()): number {
  const d = new Date(now);
  const daysSinceMonday = (d.getDay() + 6) % 7; // Sunday = 6, Monday = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysSinceMonday);
  return d.getTime();
}

// True if you wore it this week (so it's "in the laundry" until next Monday).
export const isWornThisWeek = (item: Item) => item.wornAt != null && item.wornAt >= startOfWeek();
