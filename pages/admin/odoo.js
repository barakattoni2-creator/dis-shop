import { useEffect, useState } from "react";
import AdminLayout from "@/features/admin/AdminLayout";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import styles from "@/styles/AdminSearch.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_ODOO);
  if (guard.redirect) return guard;
  return { props: { email: guard.session.email, role: guard.session.role } };
}

function StatusRow({ label, value, ok }) {
  return (
    <div className={styles.financialRow}>
      <span className={styles.financialLabel}>{label}</span>
      <span className={ok ? styles.success : styles.cardSubtext}>{value}</span>
    </div>
  );
}

const STEP_LABELS = {
  config: "Configuration",
  version: "1. version() — /xmlrpc/2/common",
  authenticate: "2. authenticate() — /xmlrpc/2/common",
  search_count: "3. search_count(product.product) — /xmlrpc/2/object",
};

export default function AdminOdooPage({ email, role }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetch("/api/admin/odoo/status")
      .then((r) => r.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/admin/odoo/test", { method: "POST" });
    const data = await res.json();
    setTesting(false);
    setTestResult(data);
  };

  return (
    <AdminLayout title="Odoo Integration" email={email} role={role}>
      <div className={styles.main}>
        <p className={styles.intro}>
          Odoo credentials (URL, database, username, API key) are read from server
          environment variables only — they are never sent to the browser, and this page
          never displays the API key itself.
        </p>

        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : (
          status && (
            <div className={styles.card}>
              <h2 className={styles.cardHeading}>Connection Status</h2>
              <StatusRow label="Sync Enabled" value={status.syncEnabled ? "Yes" : "No"} ok={status.syncEnabled} />
              <StatusRow
                label="URL"
                value={status.hasUrl ? status.hostname : "Not set"}
                ok={status.hasUrl}
              />
              <StatusRow
                label="Database"
                value={status.hasDatabase ? status.database : "Not set"}
                ok={status.hasDatabase}
              />
              <StatusRow
                label="Username"
                value={status.hasUsername ? "Set" : "Not set"}
                ok={status.hasUsername}
              />
              <StatusRow
                label="API Key"
                value={status.hasApiKey ? "Set (hidden)" : "Not set"}
                ok={status.hasApiKey}
              />
              {status.version && <StatusRow label="Odoo Version" value={status.version} ok />}
              <p className={styles.cardSubtext} style={{ marginTop: "0.9rem" }}>
                {status.configured
                  ? "Odoo sync is active — product and order actions use Odoo instead of the local database."
                  : "Odoo is not active. The storefront and admin dashboard use the local database/catalog instead."}
              </p>
            </div>
          )
        )}

        <div className={styles.card}>
          <h2 className={styles.cardHeading}>Test Connection</h2>
          <p className={styles.cardSubtext}>
            Makes a real, read-only call to Odoo using the server-side credentials above —
            works even while sync is turned off, so you can verify credentials first.
          </p>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? "Testing…" : "Test Connection"}
          </button>
          {testResult && (
            <div style={{ marginTop: "0.8rem" }}>
              {testResult.ok ? (
                <>
                  <p className={styles.success}>Connected successfully.</p>
                  <StatusRow label="Odoo Version" value={testResult.version} ok />
                  <StatusRow label="Products Found" value={testResult.productCount} ok />
                </>
              ) : (
                <>
                  <p className={styles.error}>
                    Failed at {STEP_LABELS[testResult.step] || testResult.step}
                  </p>
                  <p className={styles.cardSubtext}>{testResult.error}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
