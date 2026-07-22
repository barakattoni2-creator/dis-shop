import { useState } from "react";
import MediaGrid from "@/features/admin/MediaGrid";
import { useMediaLibrary } from "@/features/admin/useMediaLibrary";
import adminStyles from "@/styles/Admin.module.css";
import styles from "@/styles/MediaLibrary.module.css";
import type { PlainMediaAsset } from "@/types/domain";

interface MediaPickerProps {
  onChoose: (asset: PlainMediaAsset) => void;
  onClose: () => void;
}

// Modal used from BannerForm's image fields — lets an admin either reuse an
// existing Media Library image or upload a brand new one (which also lands
// in the library for future reuse), instead of every banner form re-running
// its own one-off upload flow.
export default function MediaPicker({ onChoose, onClose }: MediaPickerProps) {
  const { assets, total, page, setPage, pageSize, q, setQ, loading, error, uploading, upload } =
    useMediaLibrary(true);
  const [tab, setTab] = useState<"library" | "upload">("library");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const asset = await upload(file);
    if (asset) onChoose(asset);
  };

  return (
    <div className={styles.pickerOverlay} onClick={onClose}>
      <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.pickerHeader}>
          <h2 className={adminStyles.modalHeading}>Choose an Image</h2>
          <button type="button" className={adminStyles.cancelBtn} onClick={onClose}>
            Close
          </button>
        </div>

        <div className={styles.pickerTabs}>
          <button
            type="button"
            className={`${styles.pickerTab} ${tab === "library" ? styles.pickerTabActive : ""}`}
            onClick={() => setTab("library")}
          >
            Choose from Library
          </button>
          <button
            type="button"
            className={`${styles.pickerTab} ${tab === "upload" ? styles.pickerTabActive : ""}`}
            onClick={() => setTab("upload")}
          >
            Upload New
          </button>
        </div>

        {error && <p className={adminStyles.uploadError}>{error}</p>}

        {tab === "upload" ? (
          <label className={styles.dropZone} style={{ display: "block", cursor: "pointer" }}>
            {uploading ? "Uploading…" : "Click to choose a file to upload"}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              disabled={uploading}
              onChange={(e) => {
                handleUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        ) : (
          <>
            <div className={styles.toolbar}>
              <input
                className={styles.searchInput}
                placeholder="Search by filename…"
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
              />
            </div>
            {loading ? (
              <p className={adminStyles.empty}>Loading…</p>
            ) : (
              <MediaGrid assets={assets} onSelect={onChoose} />
            )}
            {totalPages > 1 && (
              <div className={styles.pagerRow}>
                <button className={styles.pagerBtn} disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  ← Prev
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  className={styles.pagerBtn}
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
