import { useEffect, useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import {
  Package,
  FileText,
  ClipboardList,
  LineChart,
  Receipt,
  MessageCircle,
  Megaphone,
  CheckCircle2,
  History,
  Settings as SettingsIcon,
} from "lucide-react";
import AdminLayout from "@/features/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import type { AdminRole } from "@/types/domain";

interface AdminAiDashboardProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminAiDashboardProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_AI);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

const HUB_LINKS = [
  { href: "/admin/ai/product-assistant", icon: Package, title: "Product Assistant", desc: "Names, descriptions, SEO, keywords, duplicates, missing fields" },
  { href: "/admin/ai/content-assistant", icon: FileText, title: "Content Assistant", desc: "Banner and page copy drafts" },
  { href: "/admin/ai/inventory-assistant", icon: ClipboardList, title: "Inventory Assistant", desc: "Low-stock warnings, reorder suggestions" },
  { href: "/admin/ai/sales-assistant", icon: LineChart, title: "Sales Assistant", desc: "Daily and weekly report drafts" },
  { href: "/admin/ai/quotation-assistant", icon: Receipt, title: "Quotation Assistant", desc: "Draft quotations for admin review" },
  { href: "/admin/ai/customer-support-assistant", icon: MessageCircle, title: "Customer Support Assistant", desc: "Draft customer replies" },
  { href: "/admin/ai/marketing-assistant", icon: Megaphone, title: "Marketing Assistant", desc: "Campaign and promo copy drafts" },
  { href: "/admin/ai/approvals", icon: CheckCircle2, title: "Pending Approvals", desc: "Review and approve/reject all AI suggestions" },
  { href: "/admin/ai/activity", icon: History, title: "AI Activity Log", desc: "Every suggestion, approval, rejection and apply event" },
  { href: "/admin/ai/settings", icon: SettingsIcon, title: "AI Settings", desc: "Mode, model, budget, customer assistant toggle" },
];

interface DashboardStats {
  settings?: { mode: string; openAiConfigured: boolean };
  counts?: Record<string, number>;
}

export default function AdminAiDashboard({ email, role, dbConfigured }: AdminAiDashboardProps) {
  const [data, setData] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!dbConfigured) return;
    fetch("/api/admin/ai/dashboard-stats")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [dbConfigured]);

  const settings = data?.settings;
  const counts = data?.counts;

  return (
    <AdminLayout title="AI Dashboard" email={email} role={role}>
      <div className="shadcn-root">
        {!dbConfigured && (
          <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            No database connected yet. Set <code>DATABASE_URL</code> to enable the AI system.
          </p>
        )}

        {settings && (
          <div
            className={`mb-4 rounded-md border p-3 text-sm ${
              settings.mode === "disabled"
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-success/30 bg-success/10"
            }`}
          >
            {settings.mode === "disabled"
              ? "⛔ AI system is disabled (AI_MODE=disabled)."
              : "🟢 AI_MODE = suggest_only — the AI can only propose changes. Nothing is written without your approval."}
            {!settings.openAiConfigured && " No OPENAI_API_KEY set yet — suggestion generation is inert until one is added."}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard value={counts?.PENDING} label="Pending Approval" />
          <StatCard value={counts?.APPLIED} label="Applied" />
          <StatCard value={counts?.REJECTED} label="Rejected" />
          <StatCard value={counts?.APPROVED} label="Approved, Awaiting Apply" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HUB_LINKS.map(({ href, icon: Icon, title, desc }) => (
            <Link key={href} href={href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-2 pt-6">
                  <Icon className="size-6 text-primary" />
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ value, label }: { value: number | undefined; label: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-2xl font-bold">{value ?? "—"}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
