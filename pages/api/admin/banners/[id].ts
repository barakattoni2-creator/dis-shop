import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { updateBanner, deleteBanner } from "@/services/db/banners";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_BANNERS);
  if (!session) return;

  if (!isDbConfigured()) {
    return res.status(503).json({
      error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
    });
  }

  const id = req.query.id as string;

  if (req.method === "PUT") {
    const banner = await updateBanner(id, req.body || {});
    return res.status(200).json({ banner });
  }

  if (req.method === "DELETE") {
    await deleteBanner(id);
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
