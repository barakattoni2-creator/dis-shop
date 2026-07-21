import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchCustomers, createCustomer } from "@/services/db/customers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_CUSTOMERS);
  if (!session) return;

  if (req.method === "GET") {
    const customers = await fetchCustomers();
    return res.status(200).json({ customers });
  }

  if (req.method === "POST") {
    if (!isDbConfigured()) {
      return res.status(503).json({
        error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
      });
    }
    const { name, email } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ error: "name and email are required." });
    }
    try {
      const customer = await createCustomer(req.body);
      return res.status(201).json({ customer });
    } catch (err) {
      if ((err as { code?: string }).code === "P2002") {
        return res.status(409).json({ error: "A customer with that email already exists." });
      }
      throw err;
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
