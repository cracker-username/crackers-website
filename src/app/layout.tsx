import type { Metadata } from "next";
import { Baloo_2, Poppins } from "next/font/google";
import "./globals.css";
import { ClientShell } from "@/components/public/ClientShell";
import { prisma } from "@/lib/db/prisma";
import { parseSettingValue } from "@/lib/settings/registry";

import { DEFAULT_SITE_CONFIG } from "@/lib/settings/siteConfig";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_CONFIG.siteUrl).replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `Sivakasi Crackers Price List & Bulk Enquiry 2026 | ${DEFAULT_SITE_CONFIG.name}`,
    template: `%s | ${DEFAULT_SITE_CONFIG.name}`,
  },
  description:
    "Direct Sivakasi fireworks price list and festival enquiry platform. Browse premium sparklers, flower pots, rockets, ground chakkars, and family combo boxes with genuine factory estimates.",
  keywords: [
    "Sivakasi crackers price list",
    "Diwali crackers enquiry",
    "Sivakasi fireworks wholesale",
    "Diwali fireworks 2026",
    "Sivakasi crackers factory direct",
    "green crackers Sivakasi",
  ],
  authors: [{ name: DEFAULT_SITE_CONFIG.name }],
  creator: DEFAULT_SITE_CONFIG.name,
  publisher: DEFAULT_SITE_CONFIG.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: DEFAULT_SITE_CONFIG.name,
    title: "Sivakasi Crackers Price List & Bulk Enquiry 2026",
    description:
      "Direct Sivakasi fireworks price list and festival enquiry platform. Browse genuine sparklers, flower pots, rockets, and festival combo boxes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sivakasi Crackers Price List & Bulk Enquiry 2026",
    description:
      "Direct Sivakasi fireworks price list and festival enquiry platform. Browse genuine sparklers, flower pots, rockets, and festival combo boxes.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Query settings safely from database for public shell
  let brandName = DEFAULT_SITE_CONFIG.name;
  let phone = DEFAULT_SITE_CONFIG.phone;
  let whatsappNumber = DEFAULT_SITE_CONFIG.whatsappNumber;
  let email = DEFAULT_SITE_CONFIG.email;
  let address = DEFAULT_SITE_CONFIG.address;
  let hours = DEFAULT_SITE_CONFIG.hours;
  let licenseNumber = DEFAULT_SITE_CONFIG.licenseNumber;

  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    if (settingsMap.has("businessName")) {
      const val = parseSettingValue("businessName", settingsMap.get("businessName"));
      if (val && val !== "[BRAND_NAME]") {
        brandName = val;
      }
    }
    if (settingsMap.has("phone")) {
      const val = parseSettingValue("phone", settingsMap.get("phone"));
      if (val && !val.includes("98765")) {
        phone = val;
      }
    }
    if (settingsMap.has("whatsappNumber")) {
      const val = parseSettingValue("whatsappNumber", settingsMap.get("whatsappNumber"));
      if (val && !val.includes("98765")) {
        whatsappNumber = val;
      }
    }
    if (settingsMap.has("email")) {
      const val = parseSettingValue("email", settingsMap.get("email"));
      if (val && !val.includes("crackers.local")) {
        email = val;
      }
    }
    if (settingsMap.has("address")) {
      address = parseSettingValue("address", settingsMap.get("address"));
    }
    if (settingsMap.has("hours")) {
      hours = parseSettingValue("hours", settingsMap.get("hours"));
    }
    if (settingsMap.has("licenseNumber")) {
      licenseNumber = parseSettingValue("licenseNumber", settingsMap.get("licenseNumber"));
    }
  } catch (err) {
    console.warn("Could not load settings from DB in RootLayout, using safe defaults:", err);
  }

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: brandName,
    description: "Direct Sivakasi fireworks catalogue and festival enquiry platform.",
    url: siteUrl,
    telephone: phone,
    email: email,
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressLocality: "Sivakasi",
      addressRegion: "Tamil Nadu",
      postalCode: "626123",
      addressCountry: "IN",
    },
    openingHours: hours,
    priceRange: "₹₹",
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </head>
      <body className={`${baloo.variable} ${poppins.variable} antialiased`}>
        <ClientShell
          brandName={brandName}
          phone={phone}
          whatsappNumber={whatsappNumber}
          email={email}
          address={address}
          hours={hours}
          licenseNumber={licenseNumber}
        >
          {children}
        </ClientShell>
      </body>
    </html>
  );
}
