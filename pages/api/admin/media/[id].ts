import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchMediaAssetById, deleteMediaAssetRow, updateMediaAsset } from "@/services/db/media";
import { deleteMediaAsset } from "@/lib/upload";
import { logAdminActivity } from "@/services/db/adminActivity";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_MEDIA);
  if (!session) return;

  if (!isDbConfigured()) {
    return res.status(503).json({ error: "No database connected." });
  }

  const id = String(req.query.id);

  if (req.method === "PUT") {
    const existing = await fetchMediaAssetById(id);
    if (!existing) return res.status(404).json({ error: "Media asset not found." });
    try {
      const { filename, folder } = req.body || {};
      const asset = await updateMediaAsset(id, { filename, folder });
      const changes = [
        filename && filename !== existing.filename ? `renamed to "${filename}"` : null,
        folder && folder !== existing.folder ? `moved to ${folder}` : null,
      ].filter(Boolean);
      if (changes.length) {
        await logAdminActivity(session.email, "media_updated", `"${existing.filename}" ${changes.join(", ")}`, getClientIp(req));
      }
      return res.status(200).json({ asset });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  if (req.method === "DELETE") {
    const asset = await fetchMediaAssetById(id);
    if (!asset) return res.status(404).json({ error: "Media asset not found." });

    try {
      await deleteMediaAsset(asset.publicId);
      await deleteMediaAssetRow(id);
      await logAdminActivity(session.email, "media_deleted", `Deleted "${asset.filename}"`, getClientIp(req));
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  res.setHeader("Allow", "PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
