import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import AdminLayout from "@/features/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import type { AdminRole } from "@/types/domain";

interface AdminAiActivityPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminAiActivityPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_AI);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

const STATUS_ICON: Record<string, string> = { success: "✅", failed: "❌", blocked: "⛔" };

interface ActivityRow {
  id: string;
  actorEmail: string;
  action: string;
  status: string;
  targetType?: string;
  details?: string;
  createdAt: string;
}

const PAGE_SIZE = 30;

export default function AiActivityPage({ email, role, dbConfigured }: AdminAiActivityPageProps) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(dbConfigured);

  useEffect(() => {
    if (!dbConfigured) return;
    fetch(`/api/admin/ai/activity?page=${page}&pageSize=${PAGE_SIZE}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows || []);
        setTotal(data.total || 0);
        setLoading(false);
      });
  }, [page, dbConfigured]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout title="AI Activity Log" email={email} role={role}>
      <div className="shadcn-root">
        {!dbConfigured && (
          <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            No database connected yet. Set <code>DATABASE_URL</code> to enable the AI system.
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Activity Log</CardTitle>
            <CardDescription>
              Every suggestion generated, approved, rejected, applied or blocked — most recent first.
              Every entry records who acted and when; nothing here contains API keys or secrets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No AI activity yet. Nothing has been suggested, approved or applied.
              </p>
            ) : (
              <ul className="divide-y">
                {rows.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {STATUS_ICON[r.status] || ""} {r.actorEmail}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {r.action}
                        {r.targetType ? ` · ${r.targetType}` : ""}
                        {r.details ? ` — ${r.details}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ← Prev
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
