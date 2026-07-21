import { useEffect, useState } from "react";
import AdminLayout from "@/features/admin/AdminLayout";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import adminStyles from "@/styles/Admin.module.css";
import styles from "@/styles/AdminAi.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_AI);
  if (guard.redirect) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
}

const MODEL_OPTIONS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"];

export default function AiSettingsPage({ email, role, dbConfigured }) {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reload = () => {
    fetch("/api/admin/ai/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings));
  };

  useEffect(() => {
    if (dbConfigured) reload();
  }, [dbConfigured]);

  const save = async (key, value) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Save failed.");
      setSettings(result.settings);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="AI Settings" email={email} role={role}>
      <div className={adminStyles.main}>
        {!dbConfigured && (
          <p className={adminStyles.note}>
            No database connected yet. Set <code>DATABASE_URL</code> to enable the AI system.
          </p>
        )}
        {error && <p className={adminStyles.uploadError}>{error}</p>}

        {settings && (
          <div className={adminStyles.form} style={{ maxWidth: 520 }}>
            <div>
              <label className={adminStyles.label}>
                AI Mode (deploy-time, set via AI_MODE in the server environment)
                <input className={adminStyles.input} value={settings.mode} disabled readOnly />
              </label>
              <p className={adminStyles.uploadStatus}>
                This is a safety ceiling, not a runtime toggle — changing it requires editing the
                server environment and redeploying, on purpose. Every apply route re-checks this
                value independently of anything below.
              </p>
            </div>

            <div>
              <label className={adminStyles.label}>
                OpenAI API Key
                <input
                  className={adminStyles.input}
                  value={settings.openAiConfigured ? "Set (hidden)" : "Not set"}
                  disabled
                  readOnly
                />
              </label>
              <p className={adminStyles.uploadStatus}>
                Set <code>OPENAI_API_KEY</code> in the server environment. Never displayed here.
              </p>
            </div>

            <label className={adminStyles.checkboxLabel}>
              <input
                type="checkbox"
                checked={settings.enabled}
                disabled={saving}
                onChange={(e) => save("enabled", e.target.checked)}
              />
              Customer Assistant Enabled (instant kill switch — no redeploy needed)
            </label>

            <label className={adminStyles.label}>
              Model
              <select
                className={adminStyles.input}
                value={settings.model}
                disabled={saving}
                onChange={(e) => save("model", e.target.value)}
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className={adminStyles.label}>
              Daily Budget (USD)
              <input
                type="number"
                min="0"
                step="0.5"
                className={adminStyles.input}
                value={settings.dailyBudgetUsd}
                disabled={saving}
                onChange={(e) => save("dailyBudgetUsd", Number(e.target.value) || 0)}
              />
            </label>
            <p className={adminStyles.uploadStatus}>
              Suggestion generation and the customer assistant stop for the rest of the day once
              this is reached.
            </p>
          </div>
        )}

        <div className={styles.modeBanner} style={{ marginTop: "1.5rem" }}>
          Never allowed, by design: raw terminal access, database resets, independent payment
          processing, writing to Odoo while sync is disabled, bypassing admin permissions, or
          inventing prices, stock, discounts, warranty or delivery dates.
        </div>
      </div>
    </AdminLayout>
  );
}
