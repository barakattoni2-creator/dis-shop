import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchMediaAssetById, replaceMediaAssetContent } from "@/services/db/media";
import { replaceMediaAsset } from "@/lib/upload";
import { logAdminActivity } from "@/services/db/adminActivity";

export const config = {
  api: { bodyParser: { sizeLimit: "8mb" } },
};

// Swaps the image content behind an existing MediaAsset without changing
// its url/publicId — every Product/Category/Brand/Banner already
// referencing that URL shows the new image automatically. See
// lib/upload.ts's replaceMediaAsset for how the Cloudinary side works.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_MEDIA);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isDbConfigured()) {
    return res.status(503).json({ error: "No database connected." });
  }

  const id = String(req.query.id);
  const existing = await fetchMediaAssetById(id);
  if (!existing) return res.status(404).json({ error: "Media asset not found." });

  const { image } = req.body || {};
  if (!image) return res.status(400).json({ error: "No replacement image provided." });

  try {
    const uploaded = await replaceMediaAsset(existing.publicId, image);
    const asset = await replaceMediaAssetContent(id, {
      width: uploaded.width,
      height: uploaded.height,
      bytes: uploaded.bytes,
      format: uploaded.format,
    });
    await logAdminActivity(session.email, "media_replaced", `Replaced content of "${existing.filename}"`, getClientIp(req));
    return res.status(200).json({ asset });
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
}
