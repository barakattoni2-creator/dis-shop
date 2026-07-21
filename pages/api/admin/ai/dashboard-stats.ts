import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { fetchSuggestionCounts } from "@/services/ai/suggestions";
import { fetchAiSettings } from "@/services/db/aiSettings";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_AI);
  if (!session) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const [counts, settings] = await Promise.all([fetchSuggestionCounts(), fetchAiSettings()]);
  return res.status(200).json({ counts, settings });
}
