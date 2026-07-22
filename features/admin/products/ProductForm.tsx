import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Save, Rocket, Copy, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import GeneralSection from "@/features/admin/products/GeneralSection";
import MediaSection from "@/features/admin/products/MediaSection";
import PricingSection from "@/features/admin/products/PricingSection";
import InventorySection from "@/features/admin/products/InventorySection";
import OrganizationSection, { type CategoryOption } from "@/features/admin/products/OrganizationSection";
import StatusSection from "@/features/admin/products/StatusSection";
import SeoSection from "@/features/admin/products/SeoSection";
import RelationshipsSection from "@/features/admin/products/RelationshipsSection";
import ProductPreview from "@/features/admin/products/ProductPreview";
import { emptyProductForm, productToForm, formToPayload, type ProductFormValues } from "@/features/admin/products/types";
import type { PlainProduct, PlainBrand } from "@/types/domain";

interface ProductFormProps {
  initial?: PlainProduct | null;
  categories: CategoryOption[];
  brands: PlainBrand[];
  allProducts: PlainProduct[];
}

export default function ProductForm({ initial, categories, brands, allProducts }: ProductFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initial);
  const [form, setForm] = useState<ProductFormValues>(initial ? productToForm(initial) : emptyProductForm());
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async (status?: ProductFormValues["status"]) => {
    if (!form.name.trim()) {
      toast.error("Product name is required.");
      return;
    }
    if (!form.category) {
      toast.error("Choose a category.");
      return;
    }
    setSaving(true);
    try {
      const payload = formToPayload(status ? { ...form, status } : form);
      const res = await fetch(isEditing ? `/api/admin/products/${initial!.id}` : "/api/admin/products", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      toast.success(isEditing ? "Product updated." : "Product created.");
      router.push("/admin/products");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async () => {
    if (!initial) return;
    try {
      const res = await fetch(`/api/admin/products/${initial.id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Duplicate failed.");
      toast.success("Product duplicated as a draft.");
      router.push(`/admin/products/${data.product.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const remove = async () => {
    if (!initial) return;
    setConfirmDelete(false);
    try {
      const res = await fetch(`/api/admin/products/${initial.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed.");
      toast.success("Product deleted.");
      router.push("/admin/products");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="shadcn-root mx-auto max-w-7xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/products")}>
          <ArrowLeft className="size-4" /> Back to Products
        </Button>
        <div className="flex flex-wrap gap-2">
          {isEditing && (
            <Button variant="outline" size="sm" onClick={duplicate}>
              <Copy className="size-4" /> Duplicate
            </Button>
          )}
          {isEditing && (
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          )}
          <Button variant="secondary" size="sm" disabled={saving} onClick={() => save("DRAFT")}>
            <Save className="size-4" /> Save Draft
          </Button>
          <Button size="sm" disabled={saving} onClick={() => save("PUBLISHED")}>
            <Rocket className="size-4" /> Publish
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 rounded-xl border bg-card p-4 sm:p-6">
          <Tabs defaultValue="general">
            <TabsList className="mb-5 flex-wrap h-auto">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="organization">Organization</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <GeneralSection form={form} setForm={setForm} slugTouched={slugTouched} setSlugTouched={setSlugTouched} />
            </TabsContent>
            <TabsContent value="media">
              <MediaSection form={form} setForm={setForm} />
            </TabsContent>
            <TabsContent value="pricing">
              <PricingSection form={form} setForm={setForm} />
            </TabsContent>
            <TabsContent value="inventory">
              <InventorySection form={form} setForm={setForm} />
            </TabsContent>
            <TabsContent value="organization">
              <OrganizationSection form={form} setForm={setForm} categories={categories} brands={brands} />
            </TabsContent>
            <TabsContent value="status">
              <StatusSection form={form} setForm={setForm} />
            </TabsContent>
            <TabsContent value="seo">
              <SeoSection form={form} setForm={setForm} />
            </TabsContent>
            <TabsContent value="relationships">
              <RelationshipsSection form={form} setForm={setForm} allProducts={allProducts} excludeId={initial?.id} />
            </TabsContent>
          </Tabs>
        </div>

        <ProductPreview form={form} productId={initial?.id} />
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes &ldquo;{initial?.name}&rdquo;. This can&rsquo;t be undone — consider
              archiving instead if you might need it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
