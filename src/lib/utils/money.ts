/**
 * Money Utility Functions
 * All internal and database currency amounts are strictly stored in integer paise.
 * 1 INR = 100 paise.
 */

const inrDecimalFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrWholeFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format paise into formatted Indian Rupee string, e.g. 50000 -> "₹500", 125050 -> "₹1,250.50"
 */
export function formatPaise(paise: number, forceWhole: boolean = false): string {
  if (isNaN(paise) || !isFinite(paise)) return "₹0";
  const rupees = paise / 100;
  if (forceWhole || paise % 100 === 0) {
    return inrWholeFormatter.format(rupees);
  }
  return inrDecimalFormatter.format(rupees);
}

/**
 * Convert rupees (number or numeric string) into integer paise safely
 */
export function rupeesToPaise(rupees: number | string): number {
  const val = typeof rupees === "string" ? parseFloat(rupees.trim()) : rupees;
  if (isNaN(val) || !isFinite(val)) return 0;
  return Math.round(val * 100);
}

/**
 * Convert integer paise to decimal rupees
 */
export function paiseToRupees(paise: number): number {
  if (isNaN(paise) || !isFinite(paise)) return 0;
  return Math.round(paise) / 100;
}

/**
 * Compute discount percentage from MRP in paise and enquiry price in paise
 */
export function calculateDiscountPercent(mrpPaise: number, pricePaise: number): number {
  if (!mrpPaise || mrpPaise <= 0 || pricePaise >= mrpPaise) return 0;
  const discount = Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
  return Math.max(0, Math.min(99, discount));
}

/**
 * Calculate line item total in paise
 */
export function calculateLineTotalPaise(unitPricePaise: number, quantity: number): number {
  if (quantity <= 0) return 0;
  return Math.round(unitPricePaise * quantity);
}
