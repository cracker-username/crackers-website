import { z } from "zod";

export const SettingsSchemaMap = {
  businessName: z.string().default("[BRAND_NAME]"),
  logo: z.string().default(""),
  favicon: z.string().default(""),
  phone: z.string().default("+91 98765 43210"),
  whatsappNumber: z.string().default("919876543210"),
  email: z.string().email().default("contact@crackers.local"),
  address: z.string().default("Sivakasi, Tamil Nadu 626123, India"),
  hours: z.string().default("Mon - Sat: 9:00 AM - 9:00 PM IST"),
  licenseNumber: z.string().default(""), // Empty hides badge
  enforceMinOrder: z.boolean().default(true),
  shippingWording: z.string().default(
    "Transport charges confirmed via WhatsApp/Call or payable at destination delivery hub"
  ),
  priceAndGstNote: z.string().default(
    "Prices inclusive of all applicable taxes. Authentic Sivakasi estimates."
  ),
  enquiryPrefix: z.string().min(1).max(5).default("CE"),
  showMrpAndDiscount: z.boolean().default(true),
  countdownEnabled: z.boolean().default(true),
  countdownTarget: z.string().default("2026-11-08T00:00:00+05:30"),
  countdownTitle: z.string().default("Diwali 2026 Booking Season Closes In:"),
  maintenanceMode: z.boolean().default(false),
  enquiriesOpen: z.boolean().default(true),
  notificationEmail: z.string().email().default("owner@crackers.local"),
  socialLinks: z
    .object({
      facebook: z.string().optional().default(""),
      instagram: z.string().optional().default(""),
      youtube: z.string().optional().default(""),
    })
    .default({}),
  defaultSeoTitle: z
    .string()
    .default("Sivakasi Crackers Price List & Bulk Enquiry 2026"),
  defaultSeoDesc: z
    .string()
    .default(
      "Direct Sivakasi fireworks price list and festival enquiry platform. Browse premium sparklers, flower pots, rockets and combos."
    ),
  analyticsScript: z.string().default(""),
  defaultTheme: z.enum(["dark", "light"]).default("dark"),
  homepageSectionsOrder: z
    .array(
      z.object({
        id: z.string(),
        enabled: z.boolean(),
      })
    )
    .default([
      { id: "hero", enabled: true },
      { id: "trustStrip", enabled: true },
      { id: "locationNotice", enabled: true },
      { id: "featuredCategories", enabled: true },
      { id: "combos", enabled: true },
      { id: "bestSellers", enabled: true },
      { id: "newArrivals", enabled: true },
      { id: "howItWorks", enabled: true },
      { id: "whyChooseUs", enabled: true },
      { id: "testimonials", enabled: true },
      { id: "faq", enabled: true },
      { id: "complianceNotice", enabled: true },
    ]),
};

export type SettingKey = keyof typeof SettingsSchemaMap;
export type SettingsValues = {
  [K in SettingKey]: z.infer<(typeof SettingsSchemaMap)[K]>;
};

export function getDefaultSetting<K extends SettingKey>(
  key: K
): SettingsValues[K] {
  const schema = SettingsSchemaMap[key];
  return schema.parse(undefined) as SettingsValues[K];
}

export function parseSettingValue<K extends SettingKey>(
  key: K,
  storedValue: unknown
): SettingsValues[K] {
  const schema = SettingsSchemaMap[key];
  if (!schema) {
    throw new Error(`Unknown setting key: ${String(key)}`);
  }
  const result = schema.safeParse(storedValue);
  if (result.success) {
    return result.data as SettingsValues[K];
  }
  console.warn(
    `[SettingsRegistry] Failed to parse setting "${String(key)}". Falling back to default. Error:`,
    result.error.message
  );
  return schema.parse(undefined) as SettingsValues[K];
}
