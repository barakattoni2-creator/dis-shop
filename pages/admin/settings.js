import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/features/admin/AdminLayout";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { COMPANY_NAME, ADDRESS_LINES, EMAIL, PHONE_NUMBERS, WHATSAPP_NUMBER } from "@/data/contact";
import { SSP_PER_USD } from "@/data/currency";
import styles from "@/styles/Admin.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_SETTINGS);
  if (guard.redirect) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
}

const COMPANY_FIELDS = [
  { key: "companyName", label: "Company Name", default: COMPANY_NAME },
  {
    key: "address",
    label: "Address (one line per row)",
    default: ADDRESS_LINES.join("\n"),
    multiline: true,
  },
  { key: "email", label: "Email", default: EMAIL },
  { key: "phone1", label: "Phone 1", default: PHONE_NUMBERS[0]?.tel || "" },
  { key: "phone2", label: "Phone 2", default: PHONE_NUMBERS[1]?.tel || "" },
  { key: "whatsappNumber", label: "WhatsApp Number (digits only, no +)", default: WHATSAPP_NUMBER },
];

export default function AdminSettingsPage({ email, role, dbConfigured }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(
    Object.fromEntries(COMPANY_FIELDS.map((f) => [f.key, f.default]))
  );
  const [companySaving, setCompanySaving] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);
  const [exchangeRateInput, setExchangeRateInput] = useState(String(SSP_PER_USD));
  const [exchangeRateSaving, setExchangeRateSaving] = useState(false);
  const [exchangeRateError, setExchangeRateError] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = () => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        const rows = data.settings || {};
        setSettings(rows);
        setCompany((prev) => {
          const next = { ...prev };
          COMPANY_FIELDS.forEach((f) => {
            if (rows[f.key] !== undefined) next[f.key] = rows[f.key];
          });
          return next;
        });
        if (rows.exchangeRate !== undefined) setExchangeRateInput(rows.exchangeRate);
        setLoading(false);
      });
  };

  useEffect(() => {
    reload();
  }, []);

  const saveSetting = async (key, value) => {
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setCompanySaving(true);
    setCompanySaved(false);
    await Promise.all(COMPANY_FIELDS.map((f) => saveSetting(f.key, company[f.key])));
    setCompanySaving(false);
    setCompanySaved(true);
    reload();
  };

  const handleExchangeRateSubmit = async (e) => {
    e.preventDefault();
    setExchangeRateError("");
    setExchangeRateSaving(true);
    try {
      const res = await fetch("/api/admin/settings/exchange-rate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: exchangeRateInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save exchange rate.");
      reload();
    } catch (err) {
      setExchangeRateError(err.message);
    } finally {
      setExchangeRateSaving(false);
    }
  };

  const deleteSetting = async (key) => {
    if (!window.confirm(`Delete setting "${key}"?`)) return;
    await fetch(`/api/admin/settings/${encodeURIComponent(key)}`, { method: "DELETE" });
    reload();
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    setSaving(true);
    await saveSetting(newKey.trim(), newValue);
    setSaving(false);
    setNewKey("");
    setNewValue("");
    reload();
  };

  // Generic table only shows rows that aren't one of the dedicated fields above.
  const companyKeys = new Set(COMPANY_FIELDS.map((f) => f.key));
  const hiddenKeys = new Set([...companyKeys, "exchangeRate", "exchangeRateUpdatedAt"]);
  const otherSettings = Object.entries(settings).filter(([key]) => !hiddenKeys.has(key));

  const exchangeRateUpdatedAt = settings.exchangeRateUpdatedAt
    ? new Date(settings.exchangeRateUpdatedAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <AdminLayout title="Settings" email={email} role={role}>
      <div className={styles.main}>
        {!dbConfigured && (
          <p className={styles.note}>
            No database connected yet. Set <code>DATABASE_URL</code> in{" "}
            <code>.env.local</code> to store settings. The storefront uses the
            built-in defaults from the codebase until then.
          </p>
        )}

        <Link href="/admin/settings/search" className={styles.quickLink} style={{ marginBottom: "1.5rem" }}>
          🔎 Smart Search — synonyms, product keywords, popular searches, analytics & ranking →
        </Link>

        <h2 className={styles.modalHeading}>Company Information</h2>
        <p className={styles.note} style={{ marginBottom: "1rem" }}>
          Shown in the site footer, top bar, contact page and WhatsApp links.
          Changes here take effect without any code changes or redeploy.
        </p>
        <form className={styles.form} onSubmit={handleCompanySubmit}>
          {COMPANY_FIELDS.map((f) =>
            f.multiline ? (
              <label key={f.key} className={styles.label}>
                {f.label}
                <textarea
                  className={styles.textarea}
                  value={company[f.key]}
                  disabled={!dbConfigured}
                  onChange={(e) => setCompany((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              </label>
            ) : (
              <label key={f.key} className={styles.label}>
                {f.label}
                <input
                  className={styles.input}
                  value={company[f.key]}
                  disabled={!dbConfigured}
                  onChange={(e) => setCompany((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              </label>
            )
          )}
          <div className={styles.formActions}>
            <button type="submit" className={styles.saveBtn} disabled={!dbConfigured || companySaving}>
              {companySaving ? "Saving…" : "Save Company Information"}
            </button>
            {companySaved && <span className={styles.uploadStatus}>Saved.</span>}
          </div>
        </form>

        <h2 className={styles.modalHeading} style={{ marginTop: "2rem" }}>
          Currency Settings
        </h2>
        <p className={styles.note} style={{ marginBottom: "1rem" }}>
          Product prices are always stored and entered in USD — this rate only
          controls the SSP amount shown to shoppers who switch currency. Changing
          it updates every SSP price across the site immediately; it never
          rewrites the underlying USD prices.
        </p>
        <form className={styles.form} onSubmit={handleExchangeRateSubmit}>
          <label className={styles.label}>
            1 USD = ? SSP
            <input
              type="number"
              min="0"
              step="0.01"
              className={styles.input}
              value={exchangeRateInput}
              disabled={!dbConfigured}
              onChange={(e) => setExchangeRateInput(e.target.value)}
            />
          </label>
          {exchangeRateUpdatedAt && (
            <p className={styles.uploadStatus}>Last updated: {exchangeRateUpdatedAt}</p>
          )}
          {exchangeRateError && <p className={styles.uploadError}>{exchangeRateError}</p>}
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={!dbConfigured || exchangeRateSaving}
            >
              {exchangeRateSaving ? "Saving…" : "Save Exchange Rate"}
            </button>
          </div>
        </form>

        <h2 className={styles.modalHeading} style={{ marginTop: "2rem" }}>
          Other Settings
        </h2>

        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {otherSettings.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={styles.empty}>
                      No other settings yet.
                    </td>
                  </tr>
                ) : (
                  otherSettings.map(([key, value]) => (
                    <tr key={key}>
                      <td data-label="Key">{key}</td>
                      <td data-label="Value">
                        <input
                          className={styles.input}
                          defaultValue={value}
                          onBlur={(e) => {
                            if (e.target.value !== value) {
                              saveSetting(key, e.target.value).then(reload);
                            }
                          }}
                        />
                      </td>
                      <td className={styles.actionsCell}>
                        <button className={styles.deleteBtn} onClick={() => deleteSetting(key)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <h2 className={styles.modalHeading} style={{ marginTop: "1.5rem" }}>
          Add Setting
        </h2>
        <form className={styles.formRow} onSubmit={handleAdd}>
          <input
            className={styles.input}
            placeholder="Key (e.g. storeName)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            disabled={!dbConfigured}
          />
          <input
            className={styles.input}
            placeholder="Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            disabled={!dbConfigured}
          />
          <button
            type="submit"
            className={styles.saveBtn}
            disabled={!dbConfigured || saving}
          >
            Save
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
