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

export function validateCsvRows(rawRows: Record<string, unknown>[]): ParsedCsvResult {
  const validRows: Array<CsvProductRow & { mrpPaise: number; pricePaise: number }> = [];
  const errors: Array<{ rowNumber: number; sku?: string; message: string }> = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // header is row 1
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
