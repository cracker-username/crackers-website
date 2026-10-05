import { z } from "zod";
import { DEFAULT_SITE_CONFIG } from "./siteConfig";

export const SettingsSchemaMap = {
  businessName: z.string().default(DEFAULT_SITE_CONFIG.name),
  businessShortName: z.string().default(DEFAULT_SITE_CONFIG.shortName),
  logo: z.string().default(""),
  favicon: z.string().default(""),
  phone: z.string().default(DEFAULT_SITE_CONFIG.phone),
  whatsappNumber: z.string().default(DEFAULT_SITE_CONFIG.whatsappNumber),
  email: z.string().default(""),
  address: z.string().default(DEFAULT_SITE_CONFIG.address),
  city: z.string().default(DEFAULT_SITE_CONFIG.city),
  state: z.string().default(DEFAULT_SITE_CONFIG.state),
  pincode: z.string().default(DEFAULT_SITE_CONFIG.pincode),
  hours: z.string().default(DEFAULT_SITE_CONFIG.hours),
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
  notificationEmail: z.string().default(""),
  socialLinks: z
    .object({
      facebook: z.string().optional().default(""),
      instagram: z.string().optional().default(""),
      youtube: z.string().optional().default(""),
    })
    .default({}),
  defaultSeoTitle: z
    .string()
    .default("Festivo Fireworks | Sivakasi Crackers Price List & Bulk Enquiry 2026"),
  defaultSeoDesc: z
    .string()
    .default(
      "Direct Sivakasi fireworks price list and festival enquiry platform by Festivo Fireworks. Browse premium sparklers, flower pots, rockets and combos."
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
