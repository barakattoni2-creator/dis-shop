import { useState } from "react";
import type { GetServerSideProps } from "next";
import { Search, UploadCloud, Loader2, LayoutGrid, List as ListIcon } from "lucide-react";
import AdminLayout from "@/features/admin/AdminLayout";
import MediaGrid from "@/features/admin/MediaGrid";
import MediaList from "@/features/admin/MediaList";
import MediaPreviewDialog from "@/features/admin/MediaPreviewDialog";
import { useMediaLibrary } from "@/features/admin/useMediaLibrary";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
    uploadProgress,
    upload,
    rename,
    move,
    replace,
    remove,
  } = useMediaLibrary(dbConfigured);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<PlainMediaAsset | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [uploadQueue, setUploadQueue] = useState<{ current: number; total: number; name: string } | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const totalAll = Object.values(folderCounts).reduce((a, b) => a + b, 0);

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    for (let i = 0; i < list.length; i++) {
      setUploadQueue({ current: i + 1, total: list.length, name: list[i].name });
      await upload(list[i]);
    }
    setUploadQueue(null);
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
          <aside className="lg:space-y-1">
            <p className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Folders
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setFolder("");
                }}
                className={`flex shrink-0 items-center justify-between gap-1.5 rounded-md px-2.5 py-1.5 text-left text-sm whitespace-nowrap lg:w-full lg:shrink lg:whitespace-normal ${
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
                  className={`flex shrink-0 items-center justify-between gap-1.5 rounded-md px-2.5 py-1.5 text-left text-sm whitespace-nowrap lg:w-full lg:shrink lg:whitespace-normal ${
                    folder === f ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  {f} <span className="text-xs opacity-70">{folderCounts[f] || 0}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[160px] max-w-xs flex-1">
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

              <div className="flex overflow-hidden rounded-md border">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                  className={`rounded-none ${view === "grid" ? "bg-accent" : ""}`}
                  onClick={() => setView("grid")}
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="List view"
                  aria-pressed={view === "list"}
                  className={`rounded-none border-l ${view === "list" ? "bg-accent" : ""}`}
                  onClick={() => setView("list")}
                >
                  <ListIcon className="size-4" />
                </Button>
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

            {uploadQueue && (
              <div className="mb-4 rounded-lg border bg-card p-3">
                <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">
                    Uploading {uploadQueue.name} ({uploadQueue.current} of {uploadQueue.total})
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

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
              ) : view === "grid" ? (
                <MediaGrid assets={assets} onPreview={setPreview} onDelete={remove} />
              ) : (
                <MediaList assets={assets} onPreview={setPreview} onDelete={remove} />
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
