import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchBrands, createBrand } from "@/services/db/brands";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_BRANDS);
  if (!session) return;

  if (req.method === "GET") {
    const brands = await fetchBrands();
    return res.status(200).json({ brands });
  }

  if (req.method === "POST") {
    if (!isDbConfigured()) {
      return res.status(503).json({
        error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
      });
    }
    const brand = await createBrand(req.body || {});
    return res.status(201).json({ brand });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
