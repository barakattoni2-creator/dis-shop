// Shared with services/db/search.js (server) and PriorityPanel.js (client) —
// kept dependency-free so the client side never pulls in Prisma.
export const PRIORITY_FIELDS = [
  "sku",
  "name",
  "brand",
  "model",
  "category",
  "tags",
  "description",
  "specifications",
] as const;

export type PriorityField = (typeof PRIORITY_FIELDS)[number];
