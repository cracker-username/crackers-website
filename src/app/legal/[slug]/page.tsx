import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { DEFAULT_SITE_CONFIG } from "@/lib/settings/siteConfig";

interface LegalPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: LegalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) return { title: "Page Not Found" };

  return {
    title: `${page.title} — ${DEFAULT_SITE_CONFIG.name}`,
    description: `Official policy document: ${page.title}.`,
  };
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { slug } = await params;

  const page = await prisma.page.findUnique({
    where: { slug },
  });

  if (!page) {
    notFound();
  }

  return (
    <div className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-32">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span>Legal</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-semibold">{page.title}</span>
      </nav>

      <div className="p-8 sm:p-12 rounded-3xl bg-bg-1 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-2 text-xs text-accent-gold font-bold uppercase tracking-wider mb-3">
          <FileText className="w-4 h-4" />
          <span>STATUTORY POLICY DOCUMENT</span>
        </div>

        <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-foreground mb-4">
          {page.title}
        </h1>

        {/* Business-provided content label */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-text-muted mb-8 italic">
          ℹ️ Business-provided content, please review. All policies comply with applicable Indian explosives and commercial transport regulations.
        </div>

        {/* Render markdown / formatted content safely */}
        <div className="prose prose-invert max-w-none text-xs sm:text-sm text-text-muted leading-relaxed space-y-4">
          {page.contentMd.split("\n\n").map((block, idx) => {
            if (block.startsWith("# ")) {
              return null; // Skip main title as rendered in H1
            }
            if (block.startsWith("## ")) {
              return (
                <h2 key={idx} className="font-heading font-bold text-lg text-foreground mt-6 mb-2">
                  {block.replace("## ", "")}
                </h2>
              );
            }
            if (block.startsWith("### ")) {
              return (
                <h3 key={idx} className="font-heading font-bold text-base text-foreground mt-4 mb-2">
                  {block.replace("### ", "")}
                </h3>
              );
            }
            return (
              <p key={idx} className="leading-relaxed">
                {block}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
