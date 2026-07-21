import { isOdooConfigured } from "./config";
import { executeKw } from "./client";
import { readJSON, writeJSON } from "@/lib/storage";
import { products as localProducts, type StaticProduct } from "@/data/products";

const OVERRIDES_KEY = "dis-shop-admin-products";

interface Overrides {
  added: StaticProduct[];
  edited: Record<string, Partial<StaticProduct>>;
  deleted: string[];
}

const EMPTY_OVERRIDES: Overrides = { added: [], edited: {}, deleted: [] };

function readOverrides(): Overrides {
  return readJSON(OVERRIDES_KEY, EMPTY_OVERRIDES);
}

function writeOverrides(overrides: Overrides): void {
  writeJSON(OVERRIDES_KEY, overrides);
}

// In mock mode (no Odoo configured), admin changes are layered on top of the
// static catalog via localStorage — functional for a single-browser demo, but
// not shared across devices. Once Odoo is configured, every call below goes
// straight to product.template instead.
export async function fetchProducts(): Promise<StaticProduct[]> {
  if (!isOdooConfigured()) {
    const overrides = readOverrides();
    const items = localProducts
      .filter((p) => !overrides.deleted.includes(p.id))
      .map((p) => (overrides.edited[p.id] ? { ...p, ...overrides.edited[p.id] } : p));
    return [...items, ...overrides.added];
  }
  return executeKw("product.template", "search_read", [[["sale_ok", "=", true]]], {
    fields: ["name", "list_price", "categ_id", "description_sale"],
  }) as unknown as Promise<StaticProduct[]>;
}

export async function fetchProductById(id: string): Promise<StaticProduct | null> {
  const items = await fetchProducts();
  return items.find((p) => p.id === id) ?? null;
}

export async function createProduct(product: Partial<StaticProduct> & { name: string; price: number }): Promise<StaticProduct> {
  if (!isOdooConfigured()) {
    const overrides = readOverrides();
    const newProduct = { id: `local-${Date.now()}`, ...product } as StaticProduct;
    overrides.added.push(newProduct);
    writeOverrides(overrides);
    return newProduct;
  }
  const id = await executeKw("product.template", "create", [
    [{ name: product.name, list_price: product.price }],
  ]);
  return { ...product, id: String(id) } as StaticProduct;
}

export async function updateProduct(id: string, patch: Partial<StaticProduct>): Promise<unknown> {
  if (!isOdooConfigured()) {
    const overrides = readOverrides();
    const addedIndex = overrides.added.findIndex((p) => p.id === id);
    if (addedIndex !== -1) {
      overrides.added[addedIndex] = { ...overrides.added[addedIndex], ...patch };
    } else {
      overrides.edited[id] = { ...(overrides.edited[id] || {}), ...patch };
    }
    writeOverrides(overrides);
    return true;
  }
  return executeKw("product.template", "write", [[id], patch]);
}

export async function deleteProduct(id: string): Promise<unknown> {
  if (!isOdooConfigured()) {
    const overrides = readOverrides();
    overrides.added = overrides.added.filter((p) => p.id !== id);
    delete overrides.edited[id];
    if (!overrides.deleted.includes(id)) overrides.deleted.push(id);
    writeOverrides(overrides);
    return true;
  }
  return executeKw("product.template", "unlink", [[id]]);
}
