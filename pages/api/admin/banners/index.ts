import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchAllBanners, createBanner } from "@/services/db/banners";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_BANNERS);
  if (!session) return;

  if (req.method === "GET") {
    const banners = await fetchAllBanners();
    return res.status(200).json({ banners });
  }

  if (req.method === "POST") {
    if (!isDbConfigured()) {
      return res.status(503).json({
        error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
      });
    }
    const banner = await createBanner(req.body || {});
    return res.status(201).json({ banner });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
