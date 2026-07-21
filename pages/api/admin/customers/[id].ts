import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { updateCustomer, deleteCustomer } from "@/services/db/customers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_CUSTOMERS);
  if (!session) return;

  if (!isDbConfigured()) {
    return res.status(503).json({
      error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
    });
  }

  const id = req.query.id as string;

  if (req.method === "PUT") {
    try {
      const customer = await updateCustomer(id, req.body || {});
      return res.status(200).json({ customer });
    } catch (err) {
      if ((err as { code?: string }).code === "P2002") {
        return res.status(409).json({ error: "A customer with that email already exists." });
      }
      throw err;
    }
  }

  if (req.method === "DELETE") {
    await deleteCustomer(id);
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
