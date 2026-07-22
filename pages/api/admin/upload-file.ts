import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { uploadProductFile } from "@/lib/upload";

// Separate from /api/admin/upload (images only, 8mb limit) — product
// videos and PDF catalogs need a different Cloudinary resource_type and a
// larger body limit, and gating this behind its own route keeps the much
// more widely used image path untouched.
export const config = {
  api: { bodyParser: { sizeLimit: "25mb" } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { file, type } = req.body || {};
  if (!file) return res.status(400).json({ error: "No file provided." });
  if (type !== "video" && type !== "raw") {
    return res.status(400).json({ error: 'type must be "video" or "raw".' });
  }

  try {
    const url = await uploadProductFile(file, type);
    return res.status(200).json({ url });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
