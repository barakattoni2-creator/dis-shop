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

export default function ProductAssistantPage({ email, role }) {
  return (
    <AdminLayout title="Product Assistant" email={email} role={role}>
      <div className={styles.main}>
        <AssistantPlaceholder
          icon="📦"
          title="Product Assistant"
          bullets={[
            "Product names (English & Arabic)",
            "Product descriptions (English & Arabic)",
            "Category and brand suggestions",
            "SEO titles and descriptions",
            "Search keywords",
            "Related products",
            "Missing product fields",
            "Duplicate product flags",
          ]}
        />
      </div>
    </AdminLayout>
  );
}
