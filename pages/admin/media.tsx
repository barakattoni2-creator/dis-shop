import { useState } from "react";
import type { GetServerSideProps } from "next";
import { Search, UploadCloud, Loader2 } from "lucide-react";
import AdminLayout from "@/features/admin/AdminLayout";
import MediaGrid from "@/features/admin/MediaGrid";
import MediaPreviewDialog from "@/features/admin/MediaPreviewDialog";
import { useMediaLibrary } from "@/features/admin/useMediaLibrary";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import type { AdminRole, PlainMediaAsset } from "@/types/domain";

interface AdminMediaPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminMediaPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_MEDIA);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

export default function AdminMediaPage({ email, role, dbConfigured }: AdminMediaPageProps) {
  const {
    assets,
    total,
    page,
    setPage,
    pageSize,
    q,
    setQ,
    folder,
    setFolder,
    folders,
    folderCounts,
    loading,
    error,
    uploading,
    upload,
    rename,
    move,
    replace,
    remove,
  } = useMediaLibrary(dbConfigured);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<PlainMediaAsset | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const totalAll = Object.values(folderCounts).reduce((a, b) => a + b, 0);

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      await upload(file);
    }
  };

  return (
    <AdminLayout title="Media Library" email={email} role={role}>
      <div className="shadcn-root">
        {!dbConfigured && (
          <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            No database connected yet. Set <code>DATABASE_URL</code> in <code>.env.local</code> to use the
            media library.
          </p>
        )}
        {error && <p className="mb-4 text-sm font-medium text-destructive">{error}</p>}

        <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
          <aside className="space-y-1">
            <p className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Folders
            </p>
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setFolder("");
              }}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${
                folder === "" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              All Images <span className="text-xs opacity-70">{totalAll}</span>
            </button>
            {folders.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setPage(1);
                  setFolder(f);
                }}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${
                  folder === f ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                {f} <span className="text-xs opacity-70">{folderCounts[f] || 0}</span>
              </button>
            ))}
          </aside>

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => {
                    setPage(1);
                    setQ(e.target.value);
                  }}
                  placeholder="Search by filename…"
                  className="pl-8"
                  disabled={!dbConfigured}
                />
              </div>
              <Button variant="outline" size="sm" asChild disabled={!dbConfigured || uploading}>
                <label className="cursor-pointer">
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                  {uploading ? "Uploading…" : "Upload Images"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={!dbConfigured || uploading}
                    onChange={(e) => {
                      handleFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </Button>
            </div>

            <div
              className={`mb-4 rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground transition-colors ${
                dragOver ? "border-primary bg-primary/5 text-primary" : "border-input"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                if (dbConfigured) setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (dbConfigured) handleFiles(e.dataTransfer.files);
              }}
            >
              <UploadCloud className="mx-auto mb-1 size-6" />
              Drag & drop images here to upload{folder ? ` to ${folder}` : ""}
            </div>

            <div className="rounded-lg border bg-card p-3">
              {loading ? (
                <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
              ) : (
                <MediaGrid assets={assets} onPreview={setPreview} onDelete={remove} />
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  ← Prev
                </Button>
                <span>
                  Page {page} of {totalPages} ({total} images)
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next →
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {preview && (
        <MediaPreviewDialog
          asset={preview}
          folders={folders}
          onClose={() => setPreview(null)}
          onRename={rename}
          onMove={move}
          onReplace={replace}
          onDelete={remove}
        />
      )}
    </AdminLayout>
  );
}
