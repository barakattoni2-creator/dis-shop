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

export default function InventoryAssistantPage({ email, role }) {
  return (
    <AdminLayout title="Inventory Assistant" email={email} role={role}>
      <div className={styles.main}>
        <AssistantPlaceholder
          icon="📋"
          title="Inventory Assistant"
          bullets={[
            "Low-stock warnings",
            "Reorder suggestions",
            "Stock changes always require approval before being applied",
          ]}
        />
      </div>
    </AdminLayout>
  );
}
