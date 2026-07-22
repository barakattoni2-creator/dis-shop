import { useEffect, useState } from "react";
import type { PlainMediaAsset } from "@/types/domain";

const PAGE_SIZE = 24;

// Shared fetch/upload/delete logic for both the standalone /admin/media
// page and the MediaPicker modal used from BannerForm — same debounced
// search + pagination convention as pages/admin/orders.js, so the two
// surfaces stay in sync instead of drifting into separate implementations.
export function useMediaLibrary(dbConfigured: boolean) {
  const [assets, setAssets] = useState<PlainMediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(dbConfigured);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const reload = () => {
    if (!dbConfigured) return;
    setLoading(true);
    const params = new URLSearchParams({ q, page: String(page), pageSize: String(PAGE_SIZE) });
    fetch(`/api/admin/media?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setAssets(data.rows || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!dbConfigured) return;
    const t = setTimeout(reload, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbConfigured, q, page]);

  const upload = async (file: File): Promise<PlainMediaAsset | null> => {
    setError("");
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, filename: file.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setPage(1);
      setQ("");
      reload();
      return data.asset as PlainMediaAsset;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const remove = async (asset: PlainMediaAsset) => {
    if (!window.confirm(`Delete "${asset.filename}"? This removes it everywhere it's used.`)) return;
    await fetch(`/api/admin/media/${asset.id}`, { method: "DELETE" });
    reload();
  };

  return {
    assets,
    total,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    q,
    setQ,
    loading,
    error,
    uploading,
    upload,
    remove,
    reload,
  };
}
