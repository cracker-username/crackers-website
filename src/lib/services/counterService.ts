import { getIstCurrentYearShort } from "../utils/dates";

/**
 * Format counter integer into padded string e.g. 1 -> "000001"
 */
export function formatSequenceNumber(num: number, digits: number = 6): string {
  return String(num).padStart(digits, "0");
}

/**
 * Format full enquiry number: PREFIX-YY-XXXXXX
 * e.g. CE-26-000001
 */
export function buildEnquiryNumber(prefix: string, sequence: number, yearShort?: string): string {
  const cleanPrefix = (prefix || "CE").toUpperCase().trim();
  const year = yearShort || getIstCurrentYearShort();
  const seq = formatSequenceNumber(sequence);
  return `${cleanPrefix}-${year}-${seq}`;
}
