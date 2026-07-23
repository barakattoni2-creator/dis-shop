import { readJSON, writeJSON } from "@/lib/storage";

const KEY = "dis-shop-recent-searches";
const MAX_ITEMS = 6;

export function recordRecentSearch(term: string): void {
  if (typeof window === "undefined") return;
  const clean = term.trim();
  if (!clean) return;
  const current = readJSON<string[]>(KEY, []);
  const next = [
    clean,
    ...current.filter((existing) => existing.toLowerCase() !== clean.toLowerCase()),
  ].slice(0, MAX_ITEMS);
  writeJSON(KEY, next);
}

export function getRecentSearches(): string[] {
  return readJSON<string[]>(KEY, []);
}

export function clearRecentSearches(): void {
  writeJSON(KEY, []);
}

export function removeRecentSearch(term: string): void {
  const current = readJSON<string[]>(KEY, []);
  writeJSON(
    KEY,
    current.filter((existing) => existing !== term)
  );
}
