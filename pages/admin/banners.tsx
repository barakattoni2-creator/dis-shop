import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import AdminLayout from "@/features/admin/AdminLayout";
import BannerTable from "@/features/admin/BannerTable";
import BannerForm, { type BannerFormValues } from "@/features/admin/BannerForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import type { AdminRole, PlainBanner } from "@/types/domain";

interface AdminBannersPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminBannersPageProps> = async ({ req, res }) => {
  // requireAdminPage's `res` param predates getServerSideProps usage and is
  // typed for the API-route response shape (status/json helpers) that a
  // plain SSR `res` doesn't have — it only ever calls res.setHeader here,
  // so the cast is safe.
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_BANNERS);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

export default function AdminBannersPage({ email, role, dbConfigured }: AdminBannersPageProps) {
  const [banners, setBanners] = useState<PlainBanner[]>([]);
  const [loading, setLoading] = useState(dbConfigured);
  const [editing, setEditing] = useState<PlainBanner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<PlainBanner | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = () => {
    fetch("/api/admin/banners")
      .then((r) => r.json())
      .then((data) => {
        setBanners(data.banners || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (dbConfigured) reload();
  }, [dbConfigured]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await fetch(`/api/admin/banners/${deleting.id}`, { method: "DELETE" });
      toast.success(`Deleted "${deleting.title}".`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleToggleActive = async (banner: PlainBanner) => {
    setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, active: !b.active } : b)));
    await fetch(`/api/admin/banners/${banner.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !banner.active }),
    });
    toast.success(banner.active ? "Banner disabled." : "Banner enabled.");
    reload();
  };

  const handleReorder = async (orderedIds: string[]) => {
    // Optimistic — apply the new order locally so rows don't snap back
    // while the request is in flight.
    setBanners((prev) => {
      const byId = new Map(prev.map((b) => [b.id, b]));
      return orderedIds.map((id, index) => ({ ...byId.get(id)!, order: index }));
    });
    const res = await fetch("/api/admin/banners/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Reorder failed.");
    }
    reload();
  };

  const handleSubmit = async (data: BannerFormValues) => {
    setSaving(true);
    try {
      const res = editing
        ? await fetch(`/api/admin/banners/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
        : await fetch("/api/admin/banners", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Save failed.");
      toast.success(editing ? "Banner updated." : "Banner added.");
      setShowForm(false);
      setEditing(null);
      reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Homepage Banners" email={email} role={role}>
      <div className="shadcn-root">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Banner Manager</h1>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            disabled={!dbConfigured}
          >
            <Plus className="size-4" /> Add Banner
          </Button>
        </div>

        {!dbConfigured && (
          <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            No database connected yet. Set <code>DATABASE_URL</code> in <code>.env.local</code> to manage
            homepage banners. The homepage will keep showing its default slides until then.
          </p>
        )}

        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <BannerTable
            banners={banners}
            onEdit={(b) => {
              setEditing(b);
              setShowForm(true);
            }}
            onDelete={setDeleting}
            onToggleActive={handleToggleActive}
            onReorder={handleReorder}
          />
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Banner" : "Add Banner"}</DialogTitle>
          </DialogHeader>
          <BannerForm
            initial={editing}
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &ldquo;{deleting?.title}&rdquo;? This can&rsquo;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
