import { useState } from "react";
import { Search, UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MediaGrid from "@/features/admin/MediaGrid";
import { useMediaLibrary } from "@/features/admin/useMediaLibrary";
import type { PlainMediaAsset } from "@/types/domain";

interface MediaPickerProps {
  onChoose: (asset: PlainMediaAsset) => void;
  onClose: () => void;
  /** Pre-selects this folder and is used as the target folder for "Upload New". */
  defaultFolder?: string;
}

// Modal used from Product/Category/Brand/Banner forms — lets an admin
// either reuse an existing Media Library image or upload a brand new one
// (which also lands in the library for future reuse), instead of every
// form re-running its own one-off upload flow.
export default function MediaPicker({ onChoose, onClose, defaultFolder = "" }: MediaPickerProps) {
  const { assets, total, page, setPage, pageSize, q, setQ, folder, setFolder, folders, loading, error, uploading, upload } =
    useMediaLibrary(true, defaultFolder);
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [dragOver, setDragOver] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleUpload = async (files: FileList | File[] | null) => {
    const file = files?.[0];
    if (!file) return;
    const asset = await upload(file, defaultFolder || folder || undefined);
    if (asset) onChoose(asset);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choose an Image</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "library" | "upload")}>
          <TabsList className="mb-3">
            <TabsTrigger value="library">Choose from Library</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          {error && <p className="mb-2 text-sm font-medium text-destructive">{error}</p>}

          <TabsContent value="upload">
            <label
              className={`flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center text-sm text-muted-foreground transition-colors ${
                dragOver ? "border-primary bg-primary/5 text-primary" : "border-input"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleUpload(e.dataTransfer.files);
              }}
            >
              <UploadCloud className="size-8" />
              {uploading ? "Uploading…" : "Drag & drop an image here, or click to browse"}
              {defaultFolder && <span className="text-xs">Will be saved to {defaultFolder}</span>}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  handleUpload(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </TabsContent>

          <TabsContent value="library">
            <div className="mb-3 flex flex-wrap items-center gap-2">
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
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button variant={folder === "" ? "default" : "outline"} size="sm" onClick={() => setFolder("")}>
                  All
                </Button>
                {folders.map((f) => (
                  <Button key={f} variant={folder === f ? "default" : "outline"} size="sm" onClick={() => setFolder(f)}>
                    {f}
                  </Button>
                ))}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
              ) : (
                <MediaGrid assets={assets} onSelect={onChoose} />
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-center gap-3 text-sm text-muted-foreground">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  ← Prev
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next →
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
