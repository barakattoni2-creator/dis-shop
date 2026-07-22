import { useEffect, useState } from "react";
import NextImage from "next/image";
import type { GetServerSideProps } from "next";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import AdminLayout from "@/features/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import type { AdminRole, PlainBrand } from "@/types/domain";

interface AdminBrandsPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminBrandsPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_BRANDS);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

export default function AdminBrandsPage({ email, role, dbConfigured }: AdminBrandsPageProps) {
  const [brands, setBrands] = useState<PlainBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PlainBrand | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<PlainBrand | null>(null);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const reload = () => {
    fetch("/api/admin/brands")
      .then((r) => r.json())
      .then((data) => {
        setBrands(data.brands || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    reload();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setLogoUrl("");
    setShowForm(true);
  };

  const openEdit = (b: PlainBrand) => {
    setEditing(b);
    setName(b.name);
    setLogoUrl(b.logoUrl || "");
    setShowForm(true);
  };

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setLogoUrl(data.url);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = editing
        ? await fetch(`/api/admin/brands/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ logoUrl }),
          })
        : await fetch("/api/admin/brands", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, logoUrl }),
          });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Save failed.");
      toast.success(editing ? "Brand updated." : "Brand added.");
      setShowForm(false);
      reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await fetch(`/api/admin/brands/${deleting.id}`, { method: "DELETE" });
      toast.success(`Deleted "${deleting.name}".`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <AdminLayout title="Brands" email={email} role={role}>
      <div className="shadcn-root">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Brands</h1>
          <Button size="sm" onClick={openAdd} disabled={!dbConfigured}>
            <Plus className="size-4" /> Add Brand
          </Button>
        </div>

        {!dbConfigured && (
          <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            No database connected yet. Built-in brands are shown below, but adding new ones requires{" "}
            <code>DATABASE_URL</code>.
          </p>
        )}

        <div className="rounded-lg border bg-card">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : brands.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No brands yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((b) => (
                  <TableRow key={b.name}>
                    <TableCell>
                      <div className="relative size-9 overflow-hidden rounded-md border bg-muted">
                        {b.logoUrl && <NextImage src={b.logoUrl} alt="" fill sizes="36px" className="object-contain" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="text-muted-foreground">{b.productCount ?? "—"}</TableCell>
                    <TableCell>
                      {b.id ? (
                        <div className="flex gap-1.5">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(b)} aria-label={`Edit ${b.name}`}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleting(b)}
                            aria-label={`Delete ${b.name}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="outline">Built-in</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Brand" : "Add Brand"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand Name</Label>
              <Input id="brand-name" value={name} onChange={(e) => setName(e.target.value)} required disabled={Boolean(editing)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-logo">Logo</Label>
              <div className="flex items-center gap-3">
                {logoUrl && (
                  <div className="relative size-14 overflow-hidden rounded-md border bg-muted">
                    <NextImage src={logoUrl} alt="" fill sizes="56px" className="object-contain" />
                  </div>
                )}
                <Button type="button" variant="outline" size="sm" asChild>
                  <label className="cursor-pointer">
                    {uploading ? "Uploading…" : "Upload Logo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                    />
                  </label>
                </Button>
              </div>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="or paste a logo URL"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || uploading}>
                {editing ? "Save Changes" : "Add Brand"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this brand?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &ldquo;{deleting?.name}&rdquo;? This can&rsquo;t be undone.
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
    </AdminLayout>
  );
}
