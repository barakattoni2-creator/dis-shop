import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/features/admin/AdminLayout";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import adminStyles from "@/styles/Admin.module.css";
import styles from "@/styles/AdminAi.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_AI);
  if (guard.redirect) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
}

const HUB_LINKS = [
  { href: "/admin/ai/product-assistant", icon: "📦", title: "Product Assistant", desc: "Names, descriptions, SEO, keywords, duplicates, missing fields" },
  { href: "/admin/ai/content-assistant", icon: "📝", title: "Content Assistant", desc: "Banner and page copy drafts" },
  { href: "/admin/ai/inventory-assistant", icon: "📋", title: "Inventory Assistant", desc: "Low-stock warnings, reorder suggestions" },
  { href: "/admin/ai/sales-assistant", icon: "💹", title: "Sales Assistant", desc: "Daily and weekly report drafts" },
  { href: "/admin/ai/quotation-assistant", icon: "🧾", title: "Quotation Assistant", desc: "Draft quotations for admin review" },
  { href: "/admin/ai/customer-support-assistant", icon: "💬", title: "Customer Support Assistant", desc: "Draft customer replies" },
  { href: "/admin/ai/marketing-assistant", icon: "📣", title: "Marketing Assistant", desc: "Campaign and promo copy drafts" },
  { href: "/admin/ai/approvals", icon: "✅", title: "Pending Approvals", desc: "Review and approve/reject all AI suggestions" },
  { href: "/admin/ai/activity", icon: "🕓", title: "AI Activity Log", desc: "Every suggestion, approval, rejection and apply event" },
  { href: "/admin/ai/settings", icon: "⚙️", title: "AI Settings", desc: "Mode, model, budget, customer assistant toggle" },
];

export default function AdminAiDashboard({ email, role, dbConfigured }) {
  const [data, setData] = useState(null);

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
      <div className={adminStyles.main}>
        {!dbConfigured && (
          <p className={adminStyles.note}>
            No database connected yet. Set <code>DATABASE_URL</code> to enable the AI system.
          </p>
        )}

        {settings && (
          <div className={settings.mode === "disabled" ? `${styles.modeBanner} ${styles.modeBannerDisabled}` : styles.modeBanner}>
            {settings.mode === "disabled"
              ? "⛔ AI system is disabled (AI_MODE=disabled)."
              : "🟢 AI_MODE = suggest_only — the AI can only propose changes. Nothing is written without your approval."}
            {!settings.openAiConfigured && " No OPENAI_API_KEY set yet — suggestion generation is inert until one is added."}
          </div>
        )}

        <div className={adminStyles.statGrid}>
          <div className={adminStyles.statCard}>
            <span className={adminStyles.statValue}>{counts?.PENDING ?? "—"}</span>
            <span className={adminStyles.statLabel}>Pending Approval</span>
          </div>
          <div className={adminStyles.statCard}>
            <span className={adminStyles.statValue}>{counts?.APPLIED ?? "—"}</span>
            <span className={adminStyles.statLabel}>Applied</span>
          </div>
          <div className={adminStyles.statCard}>
            <span className={adminStyles.statValue}>{counts?.REJECTED ?? "—"}</span>
            <span className={adminStyles.statLabel}>Rejected</span>
          </div>
          <div className={adminStyles.statCard}>
            <span className={adminStyles.statValue}>{counts?.APPROVED ?? "—"}</span>
            <span className={adminStyles.statLabel}>Approved, Awaiting Apply</span>
          </div>
        </div>

        <div className={styles.hubGrid}>
          {HUB_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={styles.hubCard}>
              <span className={styles.hubCardIcon}>{link.icon}</span>
              <span className={styles.hubCardTitle}>{link.title}</span>
              <span className={styles.hubCardDesc}>{link.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
