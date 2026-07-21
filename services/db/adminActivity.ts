import { prisma, isDbConfigured } from "@/lib/db";
import type { AdminActivityLog } from "@/lib/generated/prisma/client";

export interface PaginatedResult<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

export async function logAdminActivity(
  actorEmail: string | null | undefined,
  action: string,
  details: string | null = null,
  ip: string | null = null
): Promise<AdminActivityLog | null> {
  if (!isDbConfigured()) return null;
  try {
    return await prisma!.adminActivityLog.create({
      data: { actorEmail: actorEmail || "unknown", action, details, ip },
    });
  } catch {
    // Activity logging must never break the action it's logging — a write
    // failure here (e.g. a transient DB blip) is swallowed rather than
    // surfaced to the admin as a failed login/save.
    return null;
  }
}

export async function fetchAdminActivity({
  page = 1,
  pageSize = 30,
}: { page?: number; pageSize?: number } = {}): Promise<PaginatedResult<AdminActivityLog>> {
  if (!isDbConfigured()) return { rows: [], total: 0, page, pageSize };
  const [rows, total] = await Promise.all([
    prisma!.adminActivityLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma!.adminActivityLog.count(),
  ]);
  return { rows, total, page, pageSize };
}
