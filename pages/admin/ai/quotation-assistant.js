import AdminLayout from "@/features/admin/AdminLayout";
import AssistantPlaceholder from "@/features/admin/ai/AssistantPlaceholder";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import styles from "@/styles/Admin.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_AI);
  if (guard.redirect) return guard;
  return { props: { email: guard.session.email, role: guard.session.role } };
}

export default function QuotationAssistantPage({ email, role }) {
  return (
    <AdminLayout title="Quotation Assistant" email={email} role={role}>
      <div className={styles.main}>
        <AssistantPlaceholder
          icon="🧾"
          title="Quotation Assistant"
          bullets={[
            "Draft quotations from real product prices only — never invented figures",
            "Requires Manage Orders + View Financials to approve",
            "Creating the actual quotation always requires admin approval",
          ]}
        />
      </div>
    </AdminLayout>
  );
}
