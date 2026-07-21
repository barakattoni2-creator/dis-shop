import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchAdminUsers, createAdminUser } from "@/services/db/adminUsers";
import { logAdminActivity } from "@/services/db/adminActivity";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_USERS);
  if (!session) return;

  if (!isDbConfigured()) {
    return res.status(503).json({
      error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
    });
  }

  if (req.method === "GET") {
    const users = await fetchAdminUsers();
    return res.status(200).json({ users });
  }

  if (req.method === "POST") {
    try {
      const user = await createAdminUser(req.body || {});
      await logAdminActivity(
        session.email,
        "admin_user_created",
        `Created ${user.email} (${user.role}).`,
        getClientIp(req)
      );
      return res.status(201).json({ user });
    } catch (err) {
      if ((err as { code?: string }).code === "P2002") {
        return res.status(409).json({ error: "That email is already in use." });
      }
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
