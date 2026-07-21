import { useState } from "react";
import AdminLayout from "@/features/admin/AdminLayout";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import SynonymsPanel from "@/features/admin/search/SynonymsPanel";
import KeywordsPanel from "@/features/admin/search/KeywordsPanel";
import PopularSearchesPanel from "@/features/admin/search/PopularSearchesPanel";
import NoResultSearchesPanel from "@/features/admin/search/NoResultSearchesPanel";
import AnalyticsPanel from "@/features/admin/search/AnalyticsPanel";
import PriorityPanel from "@/features/admin/search/PriorityPanel";
import ImportExportPanel from "@/features/admin/search/ImportExportPanel";
import styles from "@/styles/AdminSearch.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_SEARCH);
  if (guard.redirect) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
}

const TABS = [
  { key: "synonyms", label: "Search Synonyms" },
  { key: "keywords", label: "Product Keywords" },
  { key: "popular", label: "Popular Searches" },
  { key: "noResults", label: "No-Result Searches" },
  { key: "analytics", label: "Search Analytics" },
  { key: "priority", label: "Search Priority" },
  { key: "importExport", label: "Import / Export" },
];

export default function SmartSearchPage({ email, role, dbConfigured }) {
  const [tab, setTab] = useState("synonyms");
  const [synonymPrefill, setSynonymPrefill] = useState("");

  const handleAddSynonymFromTerm = (term) => {
    setSynonymPrefill(term);
    setTab("synonyms");
  };

  return (
    <AdminLayout title="Smart Search" email={email} role={role}>
      <div className={styles.main}>
        <p className={styles.intro}>
          Manage synonyms, product search keywords, popular searches, ranking priority and search
          analytics for the storefront. Changes here apply on the next storefront search — no
          redeploy or restart needed.
        </p>

        {!dbConfigured && (
          <p className={styles.note}>
            No database connected yet. Set <code>DATABASE_URL</code> in <code>.env.local</code> to
            manage Smart Search. The storefront search stays on its built-in behavior until then.
          </p>
        )}

        <div className={styles.tabBar}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${styles.tabBtn} ${tab === t.key ? styles.tabBtnActive : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.tabPanel}>
          {tab === "synonyms" && (
            <SynonymsPanel dbConfigured={dbConfigured} prefillTerm={synonymPrefill} />
          )}
          {tab === "keywords" && <KeywordsPanel dbConfigured={dbConfigured} />}
          {tab === "popular" && <PopularSearchesPanel dbConfigured={dbConfigured} />}
          {tab === "noResults" && (
            <NoResultSearchesPanel dbConfigured={dbConfigured} onAddSynonym={handleAddSynonymFromTerm} />
          )}
          {tab === "analytics" && <AnalyticsPanel dbConfigured={dbConfigured} />}
          {tab === "priority" && <PriorityPanel dbConfigured={dbConfigured} />}
          {tab === "importExport" && <ImportExportPanel dbConfigured={dbConfigured} />}
        </div>
      </div>
    </AdminLayout>
  );
}
