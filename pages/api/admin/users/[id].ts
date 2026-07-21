import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { prisma } from "@/lib/db";
import { updateAdminUser, deleteAdminUser } from "@/services/db/adminUsers";
import { logAdminActivity } from "@/services/db/adminActivity";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_USERS);
  if (!session) return;

  if (!isDbConfigured()) {
    return res.status(503).json({
      error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
    });
  }

  const id = req.query.id as string;
  const target = await prisma!.adminUser.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: "User not found." });

  if (req.method === "PUT") {
    // A Super Admin can't demote/deactivate themself, and the last active
    // Super Admin can't be demoted/deactivated by anyone — both would risk
    // locking every account out of user management at once (the env-var
    // break-glass account is a fallback, not something to rely on daily).
    const losingSuperAdmin =
      target.role === "SUPER_ADMIN" &&
      ((("role" in (req.body || {})) && req.body.role !== "SUPER_ADMIN") ||
        (("active" in (req.body || {})) && !req.body.active));
    if (losingSuperAdmin) {
      if (target.email === session.email) {
        return res.status(400).json({ error: "You can't change your own Super Admin role or deactivate yourself." });
      }
      const activeSuperAdmins = await prisma!.adminUser.count({
        where: { role: "SUPER_ADMIN", active: true },
      });
      if (activeSuperAdmins <= 1) {
        return res.status(400).json({ error: "At least one active Super Admin must remain." });
      }
    }
    try {
      const user = await updateAdminUser(id, req.body || {});
      await logAdminActivity(
        session.email,
        "admin_user_updated",
        `Updated ${user.email}.`,
        getClientIp(req)
      );
      return res.status(200).json({ user });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  if (req.method === "DELETE") {
    if (target.email === session.email) {
      return res.status(400).json({ error: "You can't delete your own account." });
    }
    if (target.role === "SUPER_ADMIN") {
      const activeSuperAdmins = await prisma!.adminUser.count({
        where: { role: "SUPER_ADMIN", active: true },
      });
      if (activeSuperAdmins <= 1) {
        return res.status(400).json({ error: "At least one active Super Admin must remain." });
      }
    }
    await deleteAdminUser(id);
    await logAdminActivity(
      session.email,
      "admin_user_deleted",
      `Deleted ${target.email}.`,
      getClientIp(req)
    );
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
