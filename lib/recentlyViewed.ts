import { readJSON, writeJSON } from "@/lib/storage";

const KEY = "dis-shop-recently-viewed";
const MAX_ITEMS = 8;

export function recordRecentlyViewed(id: string): void {
  if (typeof window === "undefined") return;
  const current = readJSON<string[]>(KEY, []);
  const next = [id, ...current.filter((existingId) => existingId !== id)].slice(
    0,
    MAX_ITEMS
  );
  writeJSON(KEY, next);
}

export function getRecentlyViewedIds(): string[] {
  return readJSON<string[]>(KEY, []);
}
