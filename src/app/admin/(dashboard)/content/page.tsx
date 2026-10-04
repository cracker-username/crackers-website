import React from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { parseSettingValue } from "@/lib/settings/registry";
import { ContentManager } from "@/components/admin/ContentManager";

export const metadata: Metadata = {
  title: "Content & Brand CMS — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminContentPage() {
  const [banners, faqs, testimonials, pages, settingRows] = await Promise.all([
    prisma.banner.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.faq.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
    prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.page.findMany({ orderBy: { slug: "asc" } }),
    prisma.setting.findMany({
      where: {
        key: { in: ["countdownTitle", "countdownTarget", "countdownEnabled", "homepageSectionsOrder"] },
      },
    }),
  ]);

  const homeSections: Record<string, any> = {};
  settingRows.forEach((r) => {
    homeSections[r.key] = parseSettingValue(r.key as any, r.value);
  });

  ["countdownTitle", "countdownTarget", "countdownEnabled", "homepageSectionsOrder"].forEach((k) => {
    if (homeSections[k] === undefined) {
      homeSections[k] = parseSettingValue(k as any, undefined);
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ContentManager
        initialBanners={banners}
        initialFaqs={faqs}
        initialTestimonials={testimonials}
        initialPages={pages}
        initialHomeSections={homeSections}
      />
    </div>
  );
}
