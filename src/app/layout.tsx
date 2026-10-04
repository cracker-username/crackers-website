import type { Metadata } from "next";
import { Baloo_2, Poppins } from "next/font/google";
import "./globals.css";
import { ClientShell } from "@/components/public/ClientShell";
import { prisma } from "@/lib/db/prisma";
import { parseSettingValue } from "@/lib/settings/registry";

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

export const metadata: Metadata = {
  title: "Sivakasi Crackers Price List & Bulk Enquiry 2026",
  description:
    "Direct Sivakasi fireworks price list and festival enquiry platform. Browse premium sparklers, flower pots, rockets and combos.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Query settings safely from database for public shell
  let brandName = "Sivakasi Sparklers";
  let phone = "+91 98765 43210";
  let whatsappNumber = "919876543210";
  let email = "contact@crackers.local";
  let address = "Sivakasi, Tamil Nadu 626123, India";
  let hours = "Mon - Sat: 9:00 AM - 9:00 PM IST";
  let licenseNumber = "";

  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    if (settingsMap.has("businessName")) {
      brandName = parseSettingValue("businessName", settingsMap.get("businessName"));
    }
    if (settingsMap.has("phone")) {
      phone = parseSettingValue("phone", settingsMap.get("phone"));
    }
    if (settingsMap.has("whatsappNumber")) {
      whatsappNumber = parseSettingValue("whatsappNumber", settingsMap.get("whatsappNumber"));
    }
    if (settingsMap.has("email")) {
      email = parseSettingValue("email", settingsMap.get("email"));
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

  return (
    <html lang="en" className="dark">
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
