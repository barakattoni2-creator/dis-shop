import type { NextApiRequest, NextApiResponse } from "next";
import {
  verifyAdminCredentials,
  createSessionCookie,
  isAdminAuthConfigured,
  getClientIp,
} from "@/lib/adminAuth";
import { logAdminActivity } from "@/services/db/adminActivity";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const result = await verifyAdminCredentials(email, password);

  if (!result.ok) {
    // isAdminAuthConfigured() only tells the customer whether the
    // break-glass env account exists — DB-backed accounts work whether or
    // not it's set, so a failed login is always "invalid credentials", not
    // "not configured", unless neither login path can possibly succeed.
    if (!isAdminAuthConfigured()) {
      const { isDbConfigured } = await import("@/lib/db");
      if (!isDbConfigured()) {
        return res.status(503).json({
          error:
            "Admin login isn't configured yet. Set ADMIN_EMAIL, ADMIN_PASSWORD_HASH and SESSION_SECRET in .env.local (see .env.example), or connect a database and add an admin user.",
        });
      }
    }
    await logAdminActivity(normalizedEmail, "login_failed", null, getClientIp(req));
    return res.status(401).json({ error: "Invalid email or password." });
  }

  res.setHeader("Set-Cookie", createSessionCookie(normalizedEmail, result.role!));
  await logAdminActivity(normalizedEmail, "login", `Signed in as ${result.role}.`, getClientIp(req));
  return res.status(200).json({ ok: true, role: result.role });
}
