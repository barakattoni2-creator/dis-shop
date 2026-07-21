import { useEffect, useState } from "react";
import AdminLayout from "@/features/admin/AdminLayout";
import CustomerTable from "@/features/admin/CustomerTable";
import CustomerForm from "@/features/admin/CustomerForm";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import styles from "@/styles/Admin.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_CUSTOMERS);
  if (guard.redirect) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
}

export default function AdminCustomersPage({ email, role, dbConfigured }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(dbConfigured);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const reload = () => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((data) => {
        setCustomers(data.customers || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (dbConfigured) reload();
  }, [dbConfigured]);

  const handleDelete = async (customer) => {
    if (!window.confirm(`Delete customer "${customer.name}"?`)) return;
    await fetch(`/api/admin/customers/${customer.id}`, { method: "DELETE" });
    reload();
  };

  const handleSubmit = async (data) => {
    setError("");
    try {
      const res = editing
        ? await fetch(`/api/admin/customers/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
        : await fetch("/api/admin/customers", {
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
      setError(err.message);
    }
  };

  return (
    <AdminLayout title="Customers" email={email} role={role}>
      <div className={styles.main}>
        <div className={styles.headerRow}>
          <div />
          <button
            className={styles.addBtn}
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            disabled={!dbConfigured}
          >
            + Add Customer
          </button>
        </div>

        {!dbConfigured && (
          <p className={styles.note}>
            No database connected yet. Customer accounts appear here once{" "}
            <code>DATABASE_URL</code> is set and shoppers check out with an
            email address.
          </p>
        )}
        {error && <p className={styles.uploadError}>{error}</p>}

        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : (
          <CustomerTable
            customers={customers}
            onEdit={(c) => {
              setEditing(c);
              setShowForm(true);
            }}
            onDelete={handleDelete}
          />
        )}

        {showForm && (
          <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalHeading}>
                {editing ? "Edit Customer" : "Add Customer"}
              </h2>
              <CustomerForm
                initial={editing}
                onSubmit={handleSubmit}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
