import type { NextApiRequest, NextApiResponse } from "next";
import { fetchCategoryNavTree } from "@/services/db/categories";

// Public, read-only — powers the desktop mega menu and mobile accordion,
// fetched client-side from components/Header.js on every page.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const tree = await fetchCategoryNavTree();
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return res.status(200).json({ tree });
}
