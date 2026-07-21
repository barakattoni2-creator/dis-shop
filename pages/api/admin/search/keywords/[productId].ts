import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { upsertProductKeyword } from "@/services/db/search";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_SEARCH);
  if (!session) return;

  if (!isDbConfigured()) {
    return res.status(503).json({ error: "No database connected. Set DATABASE_URL in .env.local." });
  }

  const productId = req.query.productId as string;

  if (req.method === "PUT") {
    try {
      const keyword = await upsertProductKeyword(productId, req.body || {});
      return res.status(200).json({ keyword });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  res.setHeader("Allow", "PUT");
  return res.status(405).json({ error: "Method not allowed" });
}
