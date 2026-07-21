import { useEffect, useState } from "react";
import AdminLayout from "@/features/admin/AdminLayout";
import SuggestionCard from "@/features/admin/ai/SuggestionCard";
import ConfirmDialog from "@/features/admin/ConfirmDialog";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import adminStyles from "@/styles/Admin.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_AI);
  if (guard.redirect) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
}

const STATUS_TABS = ["PENDING", "APPROVED", "APPLIED", "REJECTED", "EXPIRED"];

export default function AiApprovalsPage({ email, role, dbConfigured }) {
  const [status, setStatus] = useState("PENDING");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(dbConfigured);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState(null); // { type: "approve"|"reject", suggestion }

  const reload = () => {
    fetch(`/api/admin/ai/suggestions?status=${status}`)
      .then((r) => r.json())
      .then((data) => {
        setSuggestions(data.rows || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (dbConfigured) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, dbConfigured]);

  const runAction = async () => {
    setError("");
    const { type, suggestion } = pendingAction;
    try {
      const res = await fetch(`/api/admin/ai/suggestions/${suggestion.id}/${type}`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Action failed.");
      setPendingAction(null);
      reload();
    } catch (err) {
      setError(err.message);
      setPendingAction(null);
    }
  };

  return (
    <AdminLayout title="Pending Approvals" email={email} role={role}>
      <div className={adminStyles.main}>
        {!dbConfigured && (
          <p className={adminStyles.note}>
            No database connected yet. Set <code>DATABASE_URL</code> to enable the AI system.
          </p>
        )}
        {error && <p className={adminStyles.uploadError}>{error}</p>}

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.2rem", flexWrap: "wrap" }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={tab === status ? adminStyles.addBtn : adminStyles.cancelBtn}
              onClick={() => setStatus(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <p className={adminStyles.empty}>Loading…</p>
        ) : suggestions.length === 0 ? (
          <p className={adminStyles.empty}>
            No {status.toLowerCase()} suggestions yet. Suggestions appear here once an assistant
            generates them — nothing is ever applied without a click here.
          </p>
        ) : (
          suggestions.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onApprove={(suggestion) => setPendingAction({ type: "approve", suggestion })}
              onReject={(suggestion) => setPendingAction({ type: "reject", suggestion })}
            />
          ))
        )}

        {pendingAction && (
          <ConfirmDialog
            title={pendingAction.type === "approve" ? "Approve Suggestion" : "Reject Suggestion"}
            message={
              pendingAction.type === "approve"
                ? `Approve "${pendingAction.suggestion.title}"? This records your approval and, once this suggestion type's pipeline is wired up, applies the change.`
                : `Reject "${pendingAction.suggestion.title}"? This is final — the suggestion won't be applied.`
            }
            confirmLabel={pendingAction.type === "approve" ? "Approve" : "Reject"}
            danger={pendingAction.type === "reject"}
            onConfirm={runAction}
            onCancel={() => setPendingAction(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
