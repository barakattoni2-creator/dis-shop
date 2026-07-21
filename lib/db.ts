import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

// Reuse a single PrismaClient across hot reloads in dev so we don't exhaust
// database connections; each serverless invocation in production gets its own.
const globalForPrisma = globalThis as unknown as { __disShopPrisma?: PrismaClient | null };

function createClient(): PrismaClient {
  const adapter = new PrismaPg(process.env.DATABASE_URL as string);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient | null =
  globalForPrisma.__disShopPrisma || (isDbConfigured() ? createClient() : null);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__disShopPrisma = prisma;
}
