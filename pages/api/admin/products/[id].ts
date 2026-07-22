import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { updateProduct, deleteProduct, fetchProductByIdForAdmin } from "@/services/db/products";
import { logAdminActivity } from "@/services/db/adminActivity";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_PRODUCTS);
  if (!session) return;

  if (!isDbConfigured()) {
    return res.status(503).json({
      error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
    });
  }

  const id = req.query.id as string;

  if (req.method === "GET") {
    const product = await fetchProductByIdForAdmin(id);
    if (!product) return res.status(404).json({ error: "Product not found." });
    return res.status(200).json({ product });
  }

  if (req.method === "PUT") {
    try {
      const product = await updateProduct(id, req.body || {});
      await logAdminActivity(session.email, "product_updated", `Updated "${product.name}"`, getClientIp(req));
      return res.status(200).json({ product });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002") {
        const target = (err as { meta?: { target?: string[] } }).meta?.target?.join(", ") || "field";
        return res.status(409).json({ error: `That ${target} is already in use by another product.` });
      }
      throw err;
    }
  }

  if (req.method === "DELETE") {
    const existing = await fetchProductByIdForAdmin(id);
    await deleteProduct(id);
    await logAdminActivity(
      session.email,
      "product_deleted",
      `Deleted "${existing?.name || id}"`,
      getClientIp(req)
    );
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
