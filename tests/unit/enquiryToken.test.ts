import { describe, it, expect } from "vitest";
import { generateEnquiryToken, verifyEnquiryToken } from "@/lib/utils/token";
import { hashPayload } from "@/lib/services/enquiryService";
import { hashIp } from "@/lib/security/rateLimiter";

describe("Enquiry Security Token Tests", () => {
  it("generates a valid token and verifies it correctly", () => {
    const enquiryNumber = "CE-26-000042";
    const token = generateEnquiryToken(enquiryNumber);

    expect(token).toBeDefined();
    expect(token.includes(".")).toBe(true);

    const isValid = verifyEnquiryToken(enquiryNumber, token);
    expect(isValid).toBe(true);
  });

  it("fails verification if the token was tampered with", () => {
    const enquiryNumber = "CE-26-000042";
    const token = generateEnquiryToken(enquiryNumber);

    // Tamper with signature part
    const tampered = token.slice(0, -4) + "abcd";
    const isValid = verifyEnquiryToken(enquiryNumber, tampered);
    expect(isValid).toBe(false);
  });

  it("fails verification for a different enquiry number", () => {
    const enquiryNumber = "CE-26-000042";
    const token = generateEnquiryToken(enquiryNumber);

    const isValid = verifyEnquiryToken("CE-26-000099", token);
    expect(isValid).toBe(false);
  });

  it("fails verification for null or malformed tokens", () => {
    expect(verifyEnquiryToken("CE-26-000042", null)).toBe(false);
    expect(verifyEnquiryToken("CE-26-000042", "")).toBe(false);
    expect(verifyEnquiryToken("CE-26-000042", "invalid-token-without-dot")).toBe(false);
  });

  it("consistently computes SHA-256 payload hashes regardless of item order", () => {
    const payload1 = {
      fullName: "Ramesh Kumar",
      mobile: "9876543210",
      state: "Tamil Nadu",
      city: "Madurai",
      pincode: "625001",
      address: "123 Anna Nagar",
      preferredContact: "WHATSAPP" as const,
      consent18Plus: true,
      items: [
        { productId: "11111111-1111-1111-1111-111111111111", quantity: 2 },
        { productId: "22222222-2222-2222-2222-222222222222", quantity: 5 },
      ],
    };

    const payload2 = {
      ...payload1,
      items: [
        { productId: "22222222-2222-2222-2222-222222222222", quantity: 5 },
        { productId: "11111111-1111-1111-1111-111111111111", quantity: 2 },
      ],
    };

    const hash1 = hashPayload(payload1);
    const hash2 = hashPayload(payload2);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("hashes IP addresses safely without storing plain IPs", () => {
    const ip = "192.168.1.100";
    const hash = hashIp(ip);

    expect(hash).not.toContain(ip);
    expect(hash).toHaveLength(32);
    expect(hashIp(ip)).toBe(hash); // Deterministic
  });
});
