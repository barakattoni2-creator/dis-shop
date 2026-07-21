import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { updateBrand, deleteBrand } from "@/services/db/brands";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_BRANDS);
  if (!session) return;

  if (!isDbConfigured()) {
    return res.status(503).json({
      error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
    });
  }

  const id = req.query.id as string;

  if (req.method === "PUT") {
    const brand = await updateBrand(id, req.body || {});
    return res.status(200).json({ brand });
  }

  if (req.method === "DELETE") {
    await deleteBrand(id);
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
