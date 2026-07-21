import { useEffect, useState } from "react";
import AdminLayout from "@/features/admin/AdminLayout";
import CategoryTree from "@/features/admin/CategoryTree";
import CategoryForm from "@/features/admin/CategoryForm";
import ConfirmDialog from "@/features/admin/ConfirmDialog";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import styles from "@/styles/Admin.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_CATEGORIES);
  if (guard.redirect) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
}

export default function AdminCategoriesPage({ email, role, dbConfigured }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [error, setError] = useState("");
  // { type: "delete" | "toggle" | "move", node, extra }
  const [pendingAction, setPendingAction] = useState(null);

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

  const handleSubmit = async (data) => {
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
      setFormError(err.message);
    }
  };

  const runAction = async (action) => {
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
      setError(err.message);
      setPendingAction(null);
    }
  };

  const handleReorder = async (parentId, orderedIds) => {
    setError("");
    // Optimistic — update local order immediately so the row doesn't snap
    // back while the request is in flight.
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
      <div className={styles.main}>
        <div className={styles.headerRow}>
          <div />
          <button
            className={styles.addBtn}
            onClick={() => {
              setEditing(null);
              setFormError("");
              setShowForm(true);
            }}
            disabled={!dbConfigured}
          >
            + Add Category
          </button>
        </div>

        {!dbConfigured && (
          <p className={styles.note}>
            No database connected yet. Set <code>DATABASE_URL</code> to manage categories.
          </p>
        )}
        {error && <p className={styles.uploadError}>{error}</p>}

        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : (
          <CategoryTree
            categories={categories}
            onEdit={(node) => {
              setEditing(node);
              setFormError("");
              setShowForm(true);
            }}
            onRequestDelete={(node) => setPendingAction({ type: "delete", node })}
            onRequestToggleActive={(node) => setPendingAction({ type: "toggle", node })}
            onRequestMove={(draggedId, newParentId, newParentName) =>
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
        )}

        {showForm && (
          <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
              <h2 className={styles.modalHeading}>{editing ? "Edit Category" : "Add Category"}</h2>
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
            onConfirm={() => runAction(pendingAction)}
            onCancel={() => setPendingAction(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
