import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://crackers.local").replace(/\/$/, "");

  // 1. Core static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/price-list`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/combos`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/safety`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/enquiry`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/track-enquiry`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  try {
    // 2. Dynamic Categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${siteUrl}/collections/${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // 3. Dynamic Products
    const products = await prisma.product.findMany({
      where: { isActive: true, isArchived: false },
      select: { slug: true, updatedAt: true },
    });

    const productEntries: MetadataRoute.Sitemap = products.map((prod) => ({
      url: `${siteUrl}/products/${prod.slug}`,
      lastModified: prod.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // 4. Dynamic Legal Pages
    const legalPages = await prisma.page.findMany({
      select: { slug: true, updatedAt: true },
    });

    const legalEntries: MetadataRoute.Sitemap = legalPages.map((pg) => ({
      url: `${siteUrl}/legal/${pg.slug}`,
      lastModified: pg.updatedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

    return [...staticPages, ...categoryEntries, ...productEntries, ...legalEntries];
  } catch (err) {
    console.error("[sitemap] Error loading dynamic routes from database:", err);
    return staticPages;
  }
}
