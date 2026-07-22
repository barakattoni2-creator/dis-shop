import AdminLayout from "@/features/admin/AdminLayout";
import AssistantPlaceholder from "@/features/admin/ai/AssistantPlaceholder";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_AI);
  if (guard.redirect) return guard;
  return { props: { email: guard.session.email, role: guard.session.role } };
}

export default function SalesAssistantPage({ email, role }) {
  return (
    <AdminLayout title="Sales Assistant" email={email} role={role}>
      <div className="shadcn-root">
        <AssistantPlaceholder
          icon="💹"
          title="Sales Assistant"
          bullets={[
            "Daily sales report drafts",
            "Weekly sales report drafts",
            "Reports are generated from real order data only — never estimated",
          ]}
        />
      </div>
    </AdminLayout>
  );
}
