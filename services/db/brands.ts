import { prisma, isDbConfigured } from "@/lib/db";
import { brands as staticBrands } from "@/data/products";
import type { Brand } from "@/lib/generated/prisma/client";
import type { PlainBrand } from "@/types/domain";

function toPlain(row: Brand): PlainBrand {
  return { id: row.id, name: row.name, logoUrl: row.logoUrl || null };
}

export async function fetchBrands(): Promise<PlainBrand[]> {
  if (!isDbConfigured()) return staticBrands.map((name) => ({ name, logoUrl: null }));
  const rows = await prisma!.brand.findMany({ orderBy: { name: "asc" } });
  const dbBrands = rows.map(toPlain);
  const dbNames = new Set(dbBrands.map((b) => b.name));
  const staticOnly = staticBrands
    .filter((name) => !dbNames.has(name))
    .map((name) => ({ name, logoUrl: null }));
  return [...staticOnly, ...dbBrands];
}

export async function createBrand({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string | null;
}): Promise<PlainBrand> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const row = await prisma!.brand.create({ data: { name, logoUrl } });
  return toPlain(row);
}

export async function updateBrand(id: string, patch: Partial<Pick<Brand, "name" | "logoUrl">>): Promise<PlainBrand> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const row = await prisma!.brand.update({ where: { id }, data: patch });
  return toPlain(row);
}

export async function deleteBrand(id: string): Promise<true> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  await prisma!.brand.delete({ where: { id } });
  return true;
}
