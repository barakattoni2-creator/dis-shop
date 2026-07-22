import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import AdminLayout from "@/features/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import type { AdminRole } from "@/types/domain";

interface AdminAiApprovalsPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminAiApprovalsPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_AI);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

const STATUS_TABS = ["PENDING", "APPROVED", "APPLIED", "REJECTED", "EXPIRED"] as const;

interface Suggestion {
  id: string;
  title: string;
  type: string;
  status: string;
  targetType?: string;
  createdAt: string;
  reviewedBy?: string;
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "success" | "destructive" | "outline"> = {
  PENDING: "secondary",
  APPROVED: "default",
  APPLIED: "success",
  REJECTED: "destructive",
  EXPIRED: "outline",
};

export default function AiApprovalsPage({ email, role, dbConfigured }: AdminAiApprovalsPageProps) {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>("PENDING");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(dbConfigured);
  const [pendingAction, setPendingAction] = useState<{ type: "approve" | "reject"; suggestion: Suggestion } | null>(
    null
  );

  const reload = () => {
    fetch(`/api/admin/ai/suggestions?status=${status}`)
      .then((r) => r.json())
      .then((data) => {
        setSuggestions(data.rows || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (dbConfigured) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, dbConfigured]);

  const runAction = async () => {
    if (!pendingAction) return;
    const { type, suggestion } = pendingAction;
    try {
      const res = await fetch(`/api/admin/ai/suggestions/${suggestion.id}/${type}`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Action failed.");
      toast.success(type === "approve" ? "Suggestion approved." : "Suggestion rejected.");
      setPendingAction(null);
      reload();
    } catch (err) {
      toast.error((err as Error).message);
      setPendingAction(null);
    }
  };

  return (
    <AdminLayout title="Pending Approvals" email={email} role={role}>
      <div className="shadcn-root">
        {!dbConfigured && (
          <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            No database connected yet. Set <code>DATABASE_URL</code> to enable the AI system.
          </p>
        )}

        <div className="mb-5 flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <Button key={tab} size="sm" variant={tab === status ? "default" : "outline"} onClick={() => setStatus(tab)}>
              {tab}
            </Button>
          ))}
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : suggestions.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No {status.toLowerCase()} suggestions yet. Suggestions appear here once an assistant generates
            them — nothing is ever applied without a click here.
          </p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex flex-wrap items-start justify-between gap-3 pt-6">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{s.title}</p>
                      <Badge variant="outline">{s.type.replace(/_/g, " ")}</Badge>
                      <Badge variant={STATUS_BADGE[s.status] || "outline"}>{s.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.targetType && `${s.targetType} · `}
                      Created {new Date(s.createdAt).toLocaleString()}
                      {s.reviewedBy && ` · Reviewed by ${s.reviewedBy}`}
                    </p>
                  </div>
                  {s.status === "PENDING" && (
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" onClick={() => setPendingAction({ type: "approve", suggestion: s })}>
                        <Check className="size-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => setPendingAction({ type: "reject", suggestion: s })}
                      >
                        <X className="size-4" /> Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "approve" ? "Approve Suggestion" : "Reject Suggestion"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "approve"
                ? `Approve "${pendingAction.suggestion.title}"? This records your approval and, once this suggestion type's pipeline is wired up, applies the change.`
                : `Reject "${pendingAction?.suggestion.title}"? This is final — the suggestion won't be applied.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={runAction}
              className={
                pendingAction?.type === "reject" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""
              }
            >
              {pendingAction?.type === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
