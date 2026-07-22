import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchMediaForAdmin, createMediaAsset } from "@/services/db/media";
import { uploadMediaAsset } from "@/lib/upload";
import { logAdminActivity } from "@/services/db/adminActivity";

export const config = {
  api: { bodyParser: { sizeLimit: "8mb" } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_MEDIA);
  if (!session) return;

  if (req.method === "GET") {
    const { q = "", folder = "", page = "1", pageSize = "24" } = req.query;
    const data = await fetchMediaForAdmin({
      q: String(q),
      folder: String(folder),
      page: Math.max(1, Number(page) || 1),
      pageSize: Math.min(100, Math.max(1, Number(pageSize) || 24)),
    });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    if (!isDbConfigured()) {
      return res.status(503).json({ error: "No database connected." });
    }
    const { image, filename, folder } = req.body || {};
    if (!image) return res.status(400).json({ error: "No image provided." });
    try {
      const uploaded = await uploadMediaAsset(image, folder);
      const asset = await createMediaAsset({
        url: uploaded.url,
        publicId: uploaded.publicId,
        filename: filename || uploaded.publicId.split("/").pop() || "untitled",
        folder,
        width: uploaded.width,
        height: uploaded.height,
        bytes: uploaded.bytes,
        format: uploaded.format,
      });
      await logAdminActivity(session.email, "media_uploaded", `Uploaded "${asset.filename}"`, getClientIp(req));
      return res.status(201).json({ asset });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
