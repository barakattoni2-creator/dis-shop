import type { NextApiRequest, NextApiResponse } from "next";
import { fetchCategoryNavTree } from "@/services/db/categories";

// Public, read-only — powers the desktop mega menu and mobile accordion,
// fetched client-side from components/Header.js on every page.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  // TEMPORARY: surfaces the real Prisma/Postgres error message instead of a
  // bare 500, to settle a production-only "banners don't render" report
  // that couldn't be reproduced locally. Remove once the root cause behind
  // that failure is confirmed and fixed — this is a debugging aid, not a
  // permanent error-handling pattern for this route.
  try {
    const tree = await fetchCategoryNavTree();
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return res.status(200).json({ tree });
  } catch (err) {
    return res.status(500).json({
      error: "fetchCategoryNavTree failed",
      message: (err as Error)?.message || String(err),
      name: (err as Error)?.name,
    });
  }
}
