import crypto from "crypto";

const SECRET = process.env.ENQUIRY_TOKEN_SECRET || process.env.JWT_SECRET || "crackers-secret-enquiry-key-2026";

/**
 * Generate a cryptographically signed HMAC token for verifying viewing permissions
 * of an enquiry success/summary page without requiring user authentication.
 */
export function generateEnquiryToken(enquiryNumber: string, validHours = 168): string {
  const expiresAt = Math.floor(Date.now() / 1000) + validHours * 3600;
  const payload = `${enquiryNumber}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
  return `${expiresAt}.${signature}`;
}

/**
 * Verify an enquiry token for a given enquiryNumber.
 */
export function verifyEnquiryToken(enquiryNumber: string, token: string | null | undefined): boolean {
  if (!token || !enquiryNumber) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const expiresAtStr = parts[0];
  const providedSignature = parts[1];
  if (!expiresAtStr || !providedSignature) return false;

  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (now > expiresAt) return false; // Token expired

  const payload = `${enquiryNumber}:${expiresAt}`;
  const expectedSignature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");

  // Constant time buffer comparison
  const expectedBuf = Buffer.from(expectedSignature, "hex");
  const providedBuf = Buffer.from(providedSignature, "hex");

  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}
