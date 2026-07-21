import { prisma, isDbConfigured } from "@/lib/db";

export async function fetchSettings(): Promise<Record<string, string>> {
  if (!isDbConfigured()) return {};
  const rows = await prisma!.setting.findMany();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function updateSetting(key: string, value: string): Promise<true> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  await prisma!.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return true;
}

export async function deleteSetting(key: string): Promise<true> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  await prisma!.setting.delete({ where: { key } });
  return true;
}
