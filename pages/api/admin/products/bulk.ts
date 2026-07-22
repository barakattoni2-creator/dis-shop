import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { bulkUpdateProductStatus, bulkDeleteProducts } from "@/services/db/products";
import { logAdminActivity } from "@/services/db/adminActivity";

const ACTIONS = new Set(["publish", "draft", "archive", "delete"]);

// One endpoint for every bulk action in the Product Manager's list view —
// mirrors the { orderedIds } shape of the banner/category reorder
// endpoints, just with an `action` discriminant instead of always meaning
// "reorder".
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_PRODUCTS);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isDbConfigured()) {
    return res.status(503).json({ error: "No database connected." });
  }

  const { ids, action } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "ids must be a non-empty array." });
  }
  if (!ACTIONS.has(action)) {
    return res.status(400).json({ error: `action must be one of: ${[...ACTIONS].join(", ")}` });
  }

  try {
    if (action === "delete") {
      await bulkDeleteProducts(ids);
    } else {
      const status = action === "publish" ? "PUBLISHED" : action === "draft" ? "DRAFT" : "ARCHIVED";
      await bulkUpdateProductStatus(ids, status);
    }
    await logAdminActivity(
      session.email,
      "product_bulk_action",
      `${action} on ${ids.length} product${ids.length === 1 ? "" : "s"}`,
      getClientIp(req)
    );
    return res.status(200).json({ ok: true, count: ids.length });
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
}
