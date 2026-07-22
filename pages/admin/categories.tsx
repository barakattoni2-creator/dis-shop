import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { Plus } from "lucide-react";
import AdminLayout from "@/features/admin/AdminLayout";
import CategoryTree from "@/features/admin/CategoryTree";
import CategoryForm from "@/features/admin/CategoryForm";
import ConfirmDialog from "@/features/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import type { AdminRole } from "@/types/domain";

interface AdminCategoriesPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminCategoriesPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_CATEGORIES);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

type CategoryNode = any;
type PendingAction = any;

export default function AdminCategoriesPage({ email, role, dbConfigured }: AdminCategoriesPageProps) {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CategoryNode | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const reload = () => {
    fetch("/api/admin/categories?format=flat")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    reload();
  }, []);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setFormError("");
    try {
      const res = editing
        ? await fetch(`/api/admin/categories/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
        : await fetch("/api/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Save failed.");
      setShowForm(false);
      setEditing(null);
      reload();
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  const runAction = async (action: PendingAction) => {
    setError("");
    try {
      if (action.type === "delete") {
        const res = await fetch(`/api/admin/categories/${action.node.id}`, { method: "DELETE" });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Delete failed.");
      } else if (action.type === "toggle") {
        const res = await fetch(`/api/admin/categories/${action.node.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !action.node.active }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Update failed.");
      } else if (action.type === "move") {
        const res = await fetch("/api/admin/categories/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: action.draggedId, newParentId: action.newParentId }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Move failed.");
      }
      setPendingAction(null);
      reload();
    } catch (err) {
      setError((err as Error).message);
      setPendingAction(null);
    }
  };

  const handleReorder = async (parentId: string | null, orderedIds: string[]) => {
    setError("");
    setCategories((prev) => {
      const next = [...prev];
      orderedIds.forEach((id, index) => {
        const row = next.find((c) => c.id === id);
        if (row) row.order = index;
      });
      return next;
    });
    const res = await fetch("/api/admin/categories/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId, orderedIds }),
    });
    if (!res.ok) {
      const result = await res.json();
      setError(result.error || "Reorder failed.");
      reload();
    }
  };

  return (
    <AdminLayout title="Categories" email={email} role={role}>
      <div className="shadcn-root">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Categories</h1>
          <Button
            size="sm"
            disabled={!dbConfigured}
            onClick={() => {
              setEditing(null);
              setFormError("");
              setShowForm(true);
            }}
          >
            <Plus className="size-4" /> Add Category
          </Button>
        </div>

        {!dbConfigured && (
          <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            No database connected yet. Set <code>DATABASE_URL</code> to manage categories.
          </p>
        )}
        {error && <p className="mb-4 text-sm font-medium text-destructive">{error}</p>}

        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="rounded-lg border bg-card p-2">
            <CategoryTree
              categories={categories}
              onEdit={(node: CategoryNode) => {
                setEditing(node);
                setFormError("");
                setShowForm(true);
              }}
              onRequestDelete={(node: CategoryNode) => setPendingAction({ type: "delete", node })}
              onRequestToggleActive={(node: CategoryNode) => setPendingAction({ type: "toggle", node })}
              onRequestMove={(draggedId: string, newParentId: string | null, newParentName: string) =>
                setPendingAction({
                  type: "move",
                  node: categories.find((c) => c.id === draggedId),
                  draggedId,
                  newParentId,
                  newParentName,
                })
              }
              onRequestReorder={handleReorder}
            />
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/40 p-8" onClick={() => setShowForm(false)}>
            <div
              className="w-full max-w-2xl rounded-lg border bg-card p-6 text-card-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-lg font-semibold">{editing ? "Edit Category" : "Add Category"}</h2>
              <CategoryForm
                initial={editing}
                categories={categories}
                onSubmit={handleSubmit}
                onCancel={() => setShowForm(false)}
                error={formError}
              />
            </div>
          </div>
        )}

        {pendingAction?.type === "delete" && (
          <ConfirmDialog
            title="Delete Category"
            message={`Delete "${pendingAction.node.name}"? This can't be undone. (Categories with products or subcategories can't be deleted.)`}
            confirmLabel="Delete"
            danger
            onConfirm={() => runAction(pendingAction)}
            onCancel={() => setPendingAction(null)}
          />
        )}
        {pendingAction?.type === "toggle" && (
          <ConfirmDialog
            title={pendingAction.node.active ? "Disable Category" : "Enable Category"}
            message={
              pendingAction.node.active
                ? `Disable "${pendingAction.node.name}"? It will disappear from the storefront navigation and category pages, but its products are kept.`
                : `Enable "${pendingAction.node.name}"? It will become visible on the storefront again.`
            }
            confirmLabel={pendingAction.node.active ? "Disable" : "Enable"}
            danger={pendingAction.node.active}
            onConfirm={() => runAction(pendingAction)}
            onCancel={() => setPendingAction(null)}
          />
        )}
        {pendingAction?.type === "move" && (
          <ConfirmDialog
            title="Move Category"
            message={`Move "${pendingAction.node?.name}" under "${pendingAction.newParentName || "Top Level"}"?`}
            confirmLabel="Move"
            danger={false}
            onConfirm={() => runAction(pendingAction)}
            onCancel={() => setPendingAction(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
