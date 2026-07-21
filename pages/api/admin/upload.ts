import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { uploadProductImage } from "@/lib/upload";

export const config = {
  api: {
    bodyParser: { sizeLimit: "8mb" },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Shared infra used by product/banner/category forms alike — any
  // authenticated admin role may upload an image, gated only by session,
  // not a specific manage_* permission.
  const session = await requireAdminApi(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { image } = req.body || {};
  if (!image) {
    return res.status(400).json({ error: "No image provided." });
  }

  try {
    const url = await uploadProductImage(image);
    return res.status(200).json({ url });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
