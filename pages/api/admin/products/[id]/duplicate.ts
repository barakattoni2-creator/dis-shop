import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { duplicateProduct } from "@/services/db/products";
import { logAdminActivity } from "@/services/db/adminActivity";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_PRODUCTS);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isDbConfigured()) {
    return res.status(503).json({ error: "No database connected." });
  }

  try {
    const product = await duplicateProduct(req.query.id as string);
    await logAdminActivity(session.email, "product_duplicated", `Duplicated as "${product.name}"`, getClientIp(req));
    return res.status(201).json({ product });
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
}
