import { useEffect, useState } from "react";
import type { PlainMediaAsset } from "@/types/domain";
import { MEDIA_FOLDERS } from "@/data/mediaFolders";

const PAGE_SIZE = 24;

// Shared fetch/upload/rename/replace/delete logic for both the standalone
// /admin/media page and the MediaPicker modal used from Product/Category/
// Brand/Banner forms — same debounced search + pagination convention as
// pages/admin/orders.js, so every surface stays in sync instead of
// drifting into separate implementations.
export function useMediaLibrary(dbConfigured: boolean, defaultFolder = "") {
  const [assets, setAssets] = useState<PlainMediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState(defaultFolder);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(dbConfigured);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const reload = () => {
    if (!dbConfigured) return;
    setLoading(true);
    const params = new URLSearchParams({ q, folder, page: String(page), pageSize: String(PAGE_SIZE) });
    fetch(`/api/admin/media?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setAssets(data.rows || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const reloadFolderCounts = () => {
    if (!dbConfigured) return;
    fetch("/api/admin/media/folders")
      .then((r) => r.json())
      .then((data) => setFolderCounts(data.counts || {}))
      .catch(() => {});
  };

  useEffect(() => {
    if (!dbConfigured) return;
    const t = setTimeout(reload, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbConfigured, q, folder, page]);

  useEffect(() => {
    reloadFolderCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbConfigured]);

  const readAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // XMLHttpRequest rather than fetch — fetch has no upload-progress event,
  // and these payloads (base64 data URLs) are large enough that a real
  // percentage is worth showing instead of just a spinner.
  const postWithProgress = (url: string, body: string): Promise<PlainMediaAsset> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        let data: { asset?: PlainMediaAsset; error?: string } = {};
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          // fall through to status-based error below
        }
        if (xhr.status >= 200 && xhr.status < 300 && data.asset) resolve(data.asset);
        else reject(new Error(data.error || "Upload failed."));
      };
      xhr.onerror = () => reject(new Error("Upload failed."));
      xhr.send(body);
    });

  const upload = async (file: File, uploadFolder?: string): Promise<PlainMediaAsset | null> => {
    setError("");
    setUploading(true);
    setUploadProgress(0);
    try {
      const dataUrl = await readAsDataUrl(file);
      const body = JSON.stringify({
        image: dataUrl,
        filename: file.name,
        folder: uploadFolder || folder || "General",
      });
      const asset = await postWithProgress("/api/admin/media", body);
      setPage(1);
      reload();
      reloadFolderCounts();
      return asset;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const rename = async (asset: PlainMediaAsset, filename: string): Promise<PlainMediaAsset | null> => {
    setError("");
    try {
      const res = await fetch(`/api/admin/media/${asset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rename failed.");
      reload();
      return data.asset as PlainMediaAsset;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  };

  const move = async (asset: PlainMediaAsset, newFolder: string): Promise<PlainMediaAsset | null> => {
    setError("");
    try {
      const res = await fetch(`/api/admin/media/${asset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: newFolder }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Move failed.");
      reload();
      reloadFolderCounts();
      return data.asset as PlainMediaAsset;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  };

  const replace = async (asset: PlainMediaAsset, file: File): Promise<PlainMediaAsset | null> => {
    setError("");
    setUploading(true);
    setUploadProgress(0);
    try {
      const dataUrl = await readAsDataUrl(file);
      const updated = await postWithProgress(
        `/api/admin/media/${asset.id}/replace`,
        JSON.stringify({ image: dataUrl })
      );
      reload();
      return updated;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const remove = async (asset: PlainMediaAsset) => {
    if (!window.confirm(`Delete "${asset.filename}"? This removes it everywhere it's used.`)) return;
    await fetch(`/api/admin/media/${asset.id}`, { method: "DELETE" });
    reload();
    reloadFolderCounts();
  };

  return {
    assets,
    total,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    q,
    setQ,
    folder,
    setFolder,
    folders: MEDIA_FOLDERS,
    folderCounts,
    loading,
    error,
    uploading,
    uploadProgress,
    upload,
    rename,
    move,
    replace,
    remove,
    reload,
  };
}
