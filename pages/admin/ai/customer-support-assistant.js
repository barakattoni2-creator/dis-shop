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

export default function CustomerSupportAssistantPage({ email, role }) {
  return (
    <AdminLayout title="Customer Support Assistant" email={email} role={role}>
      <div className={styles.main}>
        <AssistantPlaceholder
          icon="💬"
          title="Customer Support Assistant"
          bullets={[
            "Draft replies to customer messages",
            "Nothing is sent to a customer without admin approval",
            "Requires Manage Customers to approve",
          ]}
        />
      </div>
    </AdminLayout>
  );
}
