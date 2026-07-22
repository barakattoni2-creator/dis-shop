import AdminLayout from "@/features/admin/AdminLayout";
import AssistantPlaceholder from "@/features/admin/ai/AssistantPlaceholder";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_AI);
  if (guard.redirect) return guard;
  return { props: { email: guard.session.email, role: guard.session.role } };
}

export default function MarketingAssistantPage({ email, role }) {
  return (
    <AdminLayout title="Marketing Assistant" email={email} role={role}>
      <div className="shadcn-root">
        <AssistantPlaceholder
          icon="📣"
          title="Marketing Assistant"
          bullets={[
            "Promotional copy drafts",
            "Campaign ideas grounded in real catalog/stock data",
            "Publishing anything always requires admin approval",
          ]}
        />
      </div>
    </AdminLayout>
  );
}
