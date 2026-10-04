import { z } from "zod";
import { rupeesToPaise } from "../utils/money";

export const CsvProductRowSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required").max(50),
  name: z.string().trim().min(2, "Product name is required").max(200),
  categoryName: z.string().trim().min(2, "Category name is required"),
  packSize: z.string().trim().min(1, "Pack size is required"),
  unit: z.string().trim().min(1, "Unit is required"),
  mrpRupees: z
    .coerce
    .number()
    .min(0, "MRP cannot be negative"),
  priceRupees: z
    .coerce
    .number()
    .min(0, "Enquiry price cannot be negative"),
  availability: z
    .enum(["IN_STOCK", "LIMITED", "OUT_OF_STOCK", "UNAVAILABLE"])
    .default("IN_STOCK"),
  isFeatured: z
    .string()
    .optional()
    .transform((val) => val?.toLowerCase() === "true" || val === "1"),
  isBestseller: z
    .string()
    .optional()
    .transform((val) => val?.toLowerCase() === "true" || val === "1"),
  shortDesc: z.string().optional().default(""),
}).refine((row) => row.priceRupees <= (row.mrpRupees > 0 ? row.mrpRupees : row.priceRupees), {
  message: "Enquiry price cannot exceed MRP",
  path: ["priceRupees"],
});

export type CsvProductRow = z.infer<typeof CsvProductRowSchema>;

export interface ParsedCsvResult {
  validRows: Array<CsvProductRow & { mrpPaise: number; pricePaise: number }>;
  errors: Array<{ rowNumber: number; sku?: string; message: string }>;
}

function normalizeRow(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(raw)) {
    const k = key.trim().toLowerCase().replace(/[\s_-]+/g, "");
    if (k === "sku") normalized.sku = val;
    else if (k === "name" || k === "productname") normalized.name = val;
    else if (k === "category" || k === "categoryname") normalized.categoryName = val;
    else if (k === "packsize") normalized.packSize = val;
    else if (k === "unit") normalized.unit = val;
    else if (k === "mrp" || k === "mrprupees") normalized.mrpRupees = val;
    else if (k === "price" || k === "pricerupees") normalized.priceRupees = val;
    else if (k === "availability") normalized.availability = val;
    else if (k === "featured" || k === "isfeatured") normalized.isFeatured = val;
    else if (k === "bestseller" || k === "isbestseller") normalized.isBestseller = val;
    else if (k === "shortdesc" || k === "shortdescription" || k === "description") normalized.shortDesc = val;
    else normalized[key] = val;
  }
  return normalized;
}

export function validateCsvRows(rawRows: Record<string, unknown>[]): ParsedCsvResult {
  const validRows: Array<CsvProductRow & { mrpPaise: number; pricePaise: number }> = [];
  const errors: Array<{ rowNumber: number; sku?: string; message: string }> = [];

  rawRows.forEach((rawRow, index) => {
    const rowNumber = index + 2; // header is row 1
    const row = normalizeRow(rawRow);
    const result = CsvProductRowSchema.safeParse(row);

    if (!result.success) {
      const errorMsg = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      errors.push({
        rowNumber,
        sku: typeof row["sku"] === "string" ? row["sku"] : undefined,
        message: errorMsg,
      });
    } else {
      validRows.push({
        ...result.data,
        mrpPaise: rupeesToPaise(result.data.mrpRupees),
        pricePaise: rupeesToPaise(result.data.priceRupees),
      });
    }
  });

  return { validRows, errors };
}
