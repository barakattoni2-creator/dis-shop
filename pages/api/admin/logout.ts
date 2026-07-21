import type { NextApiRequest, NextApiResponse } from "next";
import { clearSessionCookie, getAdminSession, getClientIp } from "@/lib/adminAuth";
import { logAdminActivity } from "@/services/db/adminActivity";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const session = getAdminSession(req);
  res.setHeader("Set-Cookie", clearSessionCookie());
  if (session) {
    await logAdminActivity(session.email, "logout", null, getClientIp(req));
  }
  return res.status(200).json({ ok: true });
}
