/**
 * Centralized Site Configuration & Business Identity
 * 
 * Default fallback brand is FESTIVO FIREWORKS.
 * All values can be overridden via Admin -> Settings -> Business Identity.
 * If an optional value (e.g. email, license) is empty, the UI should hide it rather than showing demo placeholders.
 */

export interface SiteConfig {
  name: string;
  shortName: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  hours: string;
  licenseNumber: string;
  whatsappDeepLink: string;
  telLink: string;
  siteUrl: string;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  name: "FESTIVO FIREWORKS",
  shortName: "Festivo",
  phone: "+91 91726 00587",
  whatsappNumber: "919172600587",
  email: "",
  address: "Sivakasi, Tamil Nadu 626123, India",
  city: "Sivakasi",
  state: "Tamil Nadu",
  pincode: "626123",
  hours: "Mon - Sat: 9:00 AM - 9:00 PM IST",
  licenseNumber: "",
  whatsappDeepLink: "https://wa.me/919172600587",
  telLink: "tel:+919172600587",
  siteUrl: (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://crackers-website-two.vercel.app").replace(/\/$/, ""),
};
