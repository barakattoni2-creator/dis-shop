import { prisma, isDbConfigured } from "@/lib/db";
import type { AiActionLog } from "@/lib/generated/prisma/client";
import type { PaginatedResult } from "@/services/db/adminActivity";

export interface LogAiActivityInput {
  suggestionId?: string | null;
  action: string;
  actorEmail?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  status?: string;
  details?: string | null;
  ip?: string | null;
}

// Dedicated AI audit trail — every suggestion/approval/rejection/apply/block
// event, in addition to (not instead of) AdminActivityLog, which every
// applied suggestion also writes to for cross-cutting consistency with the
// rest of Admin. Never store secrets or raw model output containing them —
// `details` is a short human-readable summary, not a payload dump.
export async function logAiActivity({
  suggestionId = null,
  action,
  actorEmail,
  targetType = null,
  targetId = null,
  status = "success",
  details = null,
  ip = null,
}: LogAiActivityInput): Promise<AiActionLog | null> {
  if (!isDbConfigured()) return null;
  try {
    return await prisma!.aiActionLog.create({
      data: {
        suggestionId,
        action,
        actorEmail: actorEmail || "ai-system",
        targetType,
        targetId,
        status,
        details,
        ip,
      },
    });
  } catch {
    // Never let audit logging break the action it's logging.
    return null;
  }
}

export async function fetchAiActivity({
  page = 1,
  pageSize = 30,
}: { page?: number; pageSize?: number } = {}): Promise<PaginatedResult<AiActionLog>> {
  if (!isDbConfigured()) return { rows: [], total: 0, page, pageSize };
  const [rows, total] = await Promise.all([
    prisma!.aiActionLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma!.aiActionLog.count(),
  ]);
  return { rows, total, page, pageSize };
}
