import AdminLayout from "@/features/admin/AdminLayout";
import AssistantPlaceholder from "@/features/admin/ai/AssistantPlaceholder";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_AI);
  if (guard.redirect) return guard;
  return { props: { email: guard.session.email, role: guard.session.role } };
}

export default function ContentAssistantPage({ email, role }) {
  return (
    <AdminLayout title="Content Assistant" email={email} role={role}>
      <div className="shadcn-root">
        <AssistantPlaceholder
          icon="📝"
          title="Content Assistant"
          bullets={[
            "Banner titles and subtitles",
            "Category descriptions",
            "SEO copy for storefront pages",
            "Draft content always requires approval before publishing",
          ]}
        />
      </div>
    </AdminLayout>
  );
}
