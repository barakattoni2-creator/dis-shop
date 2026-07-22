import type { GetServerSideProps } from "next";
import AdminLayout from "@/features/admin/AdminLayout";
import ProductForm from "@/features/admin/products/ProductForm";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchProductByIdForAdmin, fetchProductsForAdmin } from "@/services/db/products";
import { fetchCategoriesFlat } from "@/services/db/categories";
import { fetchBrands } from "@/services/db/brands";
import type { CategoryOption } from "@/features/admin/products/OrganizationSection";
import type { AdminRole, PlainProduct, PlainBrand } from "@/types/domain";

interface AdminProductEditPageProps {
  email: string;
  role: AdminRole;
  product: PlainProduct | null;
  categories: CategoryOption[];
  brands: PlainBrand[];
  allProducts: PlainProduct[];
  notFound?: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminProductEditPageProps> = async ({ req, res, params }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_PRODUCTS);
  if ("redirect" in guard) return guard;

  const id = String(params?.id);
  const isNew = id === "new";

  if (!isDbConfigured()) {
    return {
      props: {
        email: guard.session.email,
        role: guard.session.role,
        product: null,
        categories: [],
        brands: [],
        allProducts: [],
      },
    };
  }

  const [product, categoriesRaw, brands, productsPage] = await Promise.all([
    isNew ? Promise.resolve(null) : fetchProductByIdForAdmin(id),
    fetchCategoriesFlat(),
    fetchBrands(),
    fetchProductsForAdmin({ page: 1, pageSize: 500 }),
  ]);
  // fetchCategoriesFlat can fall back to the static catalog shape (no id)
  // when the DB has no categories yet — filtered out here since the
  // Category/Subcategory picker needs a real category id to select.
  const categories: CategoryOption[] = categoriesRaw
    .filter((c) => "id" in c && Boolean(c.id))
    .map((c) => {
      const withId = c as typeof c & { id: string };
      return { id: withId.id, slug: withId.slug, name: withId.name, level: withId.level };
    });

  if (!isNew && !product) {
    return {
      props: {
        email: guard.session.email,
        role: guard.session.role,
        product: null,
        categories,
        brands,
        allProducts: productsPage.rows,
        notFound: true,
      },
    };
  }

  return {
    props: {
      email: guard.session.email,
      role: guard.session.role,
      product,
      categories,
      brands,
      allProducts: productsPage.rows,
    },
  };
};

export default function AdminProductEditPage({
  email,
  role,
  product,
  categories,
  brands,
  allProducts,
  notFound,
}: AdminProductEditPageProps) {
  return (
    <AdminLayout title={product ? `Edit — ${product.name}` : "New Product"} email={email} role={role}>
      {notFound ? (
        <p className="p-6 text-sm text-muted-foreground">Product not found.</p>
      ) : (
        <ProductForm initial={product} categories={categories} brands={brands} allProducts={allProducts} />
      )}
    </AdminLayout>
  );
}
