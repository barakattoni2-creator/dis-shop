import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { importKeywordsCsv } from "@/services/db/searchImportExport";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_SEARCH);
  if (!session) return;

  if (!isDbConfigured()) {
    return res.status(503).json({ error: "No database connected. Set DATABASE_URL in .env.local." });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { csv } = req.body || {};
  if (!csv || typeof csv !== "string") {
    return res.status(400).json({ error: "csv text is required." });
  }

  try {
    const result = await importKeywordsCsv(csv);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
}
