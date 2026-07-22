import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductPreview from "@/features/admin/products/ProductPreview";
import { productToForm } from "@/features/admin/products/types";
import type { PlainProduct } from "@/types/domain";

interface ProductQuickPreviewProps {
  product: PlainProduct;
  onClose: () => void;
}

export default function ProductQuickPreview({ product, onClose }: ProductQuickPreviewProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        <ProductPreview form={productToForm(product)} productId={product.id} />
      </DialogContent>
    </Dialog>
  );
}
