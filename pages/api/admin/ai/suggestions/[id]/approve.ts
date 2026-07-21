import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { approveSuggestion } from "@/services/ai/suggestions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_AI);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await approveSuggestion({
      id: req.query.id as string,
      approverEmail: session.email,
      approverRole: session.role,
      ip: getClientIp(req),
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
}
