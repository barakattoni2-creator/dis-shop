import { useState } from "react";
import NextImage from "next/image";
import { toast } from "sonner";
import { Copy, Trash2, Upload, Check, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getOptimizedUrl } from "@/lib/cloudinaryTransform";
import { formatBytes } from "@/features/admin/mediaFormat";
import type { PlainMediaAsset } from "@/types/domain";
import type { MediaFolder } from "@/data/mediaFolders";

interface MediaPreviewDialogProps {
  asset: PlainMediaAsset;
  folders: readonly MediaFolder[];
  onClose: () => void;
  onRename: (asset: PlainMediaAsset, filename: string) => Promise<PlainMediaAsset | null>;
  onMove: (asset: PlainMediaAsset, folder: string) => Promise<PlainMediaAsset | null>;
  onReplace: (asset: PlainMediaAsset, file: File) => Promise<PlainMediaAsset | null>;
  onDelete: (asset: PlainMediaAsset) => Promise<void> | void;
}

export default function MediaPreviewDialog({
  asset,
  folders,
  onClose,
  onRename,
  onMove,
  onReplace,
  onDelete,
}: MediaPreviewDialogProps) {
  const [current, setCurrent] = useState(asset);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(asset.filename);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveName = async () => {
    if (nameInput.trim() === current.filename) {
      setEditingName(false);
      return;
    }
    setBusy(true);
    const updated = await onRename(current, nameInput.trim());
    setBusy(false);
    if (updated) {
      setCurrent(updated);
      toast.success("Renamed.");
    }
    setEditingName(false);
  };

  const handleMoveFolder = async (folder: string) => {
    setBusy(true);
    const updated = await onMove(current, folder);
    setBusy(false);
    if (updated) {
      setCurrent(updated);
      toast.success(`Moved to ${folder}.`);
    }
  };

  const handleReplace = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const updated = await onReplace(current, file);
    setBusy(false);
    if (updated) {
      setCurrent(updated);
      toast.success("Image replaced — every place it's used now shows the new file.");
    }
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(current.url);
    toast.success("URL copied.");
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    await onDelete(current);
    onClose();
  };

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Media Details</DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <NextImage src={getOptimizedUrl(current.url)} alt={current.filename} fill sizes="400px" className="object-contain" />
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="media-filename">Filename</Label>
                {editingName ? (
                  <div className="flex gap-1.5">
                    <Input
                      id="media-filename"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && saveName()}
                    />
                    <Button size="icon" variant="outline" onClick={saveName} disabled={busy} aria-label="Save name">
                      <Check className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      setNameInput(current.filename);
                      setEditingName(true);
                    }}
                  >
                    <span className="truncate">{current.filename}</span>
                    <Pencil className="size-3.5 shrink-0 text-muted-foreground" />
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Folder</Label>
                <Select value={current.folder} onValueChange={handleMoveFolder} disabled={busy}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Dimensions</p>
                  <p>{current.width && current.height ? `${current.width}×${current.height}` : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Size</p>
                  <p>{formatBytes(current.bytes)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Format</p>
                  <p className="uppercase">{current.format || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Uploaded</p>
                  <p>{new Date(current.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={copyUrl}>
                  <Copy className="size-4" /> Copy URL
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild disabled={busy}>
                  <label className="cursor-pointer">
                    <Upload className="size-4" /> Replace Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={busy}
                      onChange={(e) => {
                        handleReplace(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" /> Delete
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this image?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &ldquo;{current.filename}&rdquo;? Anywhere this image is currently used (products,
              categories, brands, banners) will show a broken image afterward. This can&rsquo;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
