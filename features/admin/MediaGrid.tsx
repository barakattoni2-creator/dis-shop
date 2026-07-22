import Image from "next/image";
import styles from "@/styles/MediaLibrary.module.css";
import adminStyles from "@/styles/Admin.module.css";
import type { PlainMediaAsset } from "@/types/domain";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface MediaGridProps {
  assets: PlainMediaAsset[];
  onSelect?: (asset: PlainMediaAsset) => void;
  onDelete?: (asset: PlainMediaAsset) => void;
  selectedId?: string | null;
}

export default function MediaGrid({ assets, onSelect, onDelete, selectedId }: MediaGridProps) {
  if (assets.length === 0) {
    return <p className={adminStyles.empty}>No images yet. Upload one to get started.</p>;
  }

  return (
    <div className={styles.grid}>
      {assets.map((asset) => {
        const tile = (
          <div className={styles.tileImageWrap}>
            <Image
              src={asset.url}
              alt={asset.filename}
              fill
              sizes="160px"
              className={styles.tileImage}
            />
          </div>
        );
        return (
          <div key={asset.id} className={`${styles.tile} ${selectedId === asset.id ? styles.tileSelected : ""}`}>
            {onDelete && (
              <div className={styles.tileActions}>
                <button
                  type="button"
                  className={styles.tileActionBtn}
                  title="Delete"
                  aria-label={`Delete ${asset.filename}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(asset);
                  }}
                >
                  ✕
                </button>
              </div>
            )}
            {onSelect ? (
              <button type="button" className={styles.tileButton} onClick={() => onSelect(asset)}>
                {tile}
              </button>
            ) : (
              tile
            )}
            <div className={styles.tileMeta}>
              <span className={styles.tileFilename} title={asset.filename}>
                {asset.filename}
              </span>
              {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ""}
              {formatBytes(asset.bytes)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
