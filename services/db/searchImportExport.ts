import { prisma, isDbConfigured } from "@/lib/db";
import { parseCsv, toCsv, splitList, joinList } from "@/utils/csv";
import { synonymGroupExists } from "@/services/db/search";

const SYNONYM_COLUMNS = ["terms", "active"];
const KEYWORD_COLUMNS = [
  "sku",
  "productName",
  "arabicName",
  "englishName",
  "alternativeNames",
  "searchTags",
  "misspellings",
  "technicalKeywords",
];

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export async function exportSynonymsCsv(): Promise<string> {
  if (!isDbConfigured()) return toCsv([], SYNONYM_COLUMNS);
  const groups = await prisma!.searchSynonymGroup.findMany({ orderBy: { createdAt: "asc" } });
  return toCsv(
    groups.map((g) => ({ terms: joinList(g.terms), active: g.active ? "true" : "false" })),
    SYNONYM_COLUMNS
  );
}

// Validates every row before writing anything, skipping (not throwing on)
// malformed rows and exact duplicates — either an existing group or another
// row earlier in the same file — so one bad line never blocks the rest.
export async function importSynonymsCsv(text: string): Promise<ImportResult> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const rows = parseCsv(text);
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  if (rows.length === 0) {
    result.errors.push("No rows found. Expected a header row: terms,active");
    return result;
  }
  if (!("terms" in rows[0])) {
    result.errors.push('Missing required column "terms". Expected header: terms,active');
    return result;
  }

  const seenInFile: string[] = [];
  for (const [index, row] of rows.entries()) {
    const lineNo = index + 2; // header is line 1
    const terms = splitList(row.terms);
    if (terms.length < 2) {
      result.errors.push(`Line ${lineNo}: needs at least two terms separated by ";" — skipped.`);
      result.skipped++;
      continue;
    }
    const normalized = terms.map((t) => t.toLowerCase()).sort().join("|");
    if (seenInFile.includes(normalized)) {
      result.errors.push(`Line ${lineNo}: duplicate of another row in this file — skipped.`);
      result.skipped++;
      continue;
    }
    if (await synonymGroupExists(terms)) {
      result.errors.push(`Line ${lineNo}: a synonym group with these terms already exists — skipped.`);
      result.skipped++;
      continue;
    }
    seenInFile.push(normalized);
    const active = String(row.active ?? "true").trim().toLowerCase() !== "false";
    await prisma!.searchSynonymGroup.create({ data: { terms, active } });
    result.imported++;
  }
  return result;
}

export async function exportKeywordsCsv(): Promise<string> {
  if (!isDbConfigured()) return toCsv([], KEYWORD_COLUMNS);
  const rows = await prisma!.productSearchKeyword.findMany({ include: { product: true } });
  return toCsv(
    rows.map((r) => ({
      sku: r.product?.sku || "",
      productName: r.product?.name || "",
      arabicName: r.arabicName || "",
      englishName: r.englishName || "",
      alternativeNames: joinList(r.alternativeNames),
      searchTags: joinList(r.searchTags),
      misspellings: joinList(r.misspellings),
      technicalKeywords: joinList(r.technicalKeywords),
    })),
    KEYWORD_COLUMNS
  );
}

// Matches each row to a real product by SKU (preferred, unique) or exact
// product name, so a typo'd/unknown identifier is reported and skipped
// rather than silently creating orphan data.
export async function importKeywordsCsv(text: string): Promise<ImportResult> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const rows = parseCsv(text);
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  if (rows.length === 0) {
    result.errors.push("No rows found. Expected a header row starting with: sku,productName,...");
    return result;
  }
  if (!("sku" in rows[0]) && !("productName" in rows[0])) {
    result.errors.push('Missing required column "sku" or "productName" to identify each product.');
    return result;
  }

  for (const [index, row] of rows.entries()) {
    const lineNo = index + 2;
    const sku = row.sku?.trim();
    const productName = row.productName?.trim();
    if (!sku && !productName) {
      result.errors.push(`Line ${lineNo}: needs a "sku" or "productName" to match a product — skipped.`);
      result.skipped++;
      continue;
    }
    const product = sku
      ? await prisma!.product.findUnique({ where: { sku } })
      : await prisma!.product.findFirst({ where: { name: productName } });
    if (!product) {
      result.errors.push(`Line ${lineNo}: no product found for "${sku || productName}" — skipped.`);
      result.skipped++;
      continue;
    }
    const payload = {
      arabicName: row.arabicName?.trim() || null,
      englishName: row.englishName?.trim() || null,
      alternativeNames: splitList(row.alternativeNames),
      searchTags: splitList(row.searchTags),
      misspellings: splitList(row.misspellings),
      technicalKeywords: splitList(row.technicalKeywords),
    };
    await prisma!.productSearchKeyword.upsert({
      where: { productId: product.id },
      update: payload,
      create: { productId: product.id, ...payload },
    });
    result.imported++;
  }
  return result;
}
