import type { NextApiRequest, NextApiResponse } from "next";
import { prisma, isDbConfigured } from "@/lib/db";

// TEMPORARY diagnostic route — runs real Prisma queries against whatever
// DATABASE_URL this deployment actually has, from inside the live runtime
// (not from an external machine), to settle exactly which queries succeed
// or fail and why. Remove once the underlying production DB connectivity
// issue is confirmed fixed.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const report: Record<string, unknown> = {
    dbConfigured: isDbConfigured(),
  };

  if (!prisma) {
    report.banner = { ok: false, reason: "prisma client is null (DATABASE_URL not set)" };
    report.brand = { ok: false, reason: "prisma client is null (DATABASE_URL not set)" };
    return res.status(200).json(report);
  }

  try {
    const banners = await prisma.banner.findMany();
    report.banner = { ok: true, count: banners.length, titles: banners.map((b) => b.title) };
  } catch (err) {
    report.banner = {
      ok: false,
      name: (err as Error)?.name,
      message: (err as Error)?.message,
    };
  }

  try {
    const brands = await prisma.brand.findMany();
    report.brand = { ok: true, count: brands.length, names: brands.map((b) => b.name) };
  } catch (err) {
    report.brand = {
      ok: false,
      name: (err as Error)?.name,
      message: (err as Error)?.message,
    };
  }

  return res.status(200).json(report);
}
