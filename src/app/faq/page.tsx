import React from "react";
import { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { HelpCircle, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Sivakasi Sparklers",
  description:
    "Common questions about fireworks enquiry submission, minimum order values, surface cargo delivery, and safety compliance.",
};

export default async function FaqPage() {
  const faqs = await prisma.faq.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  // Group by category
  const categoriesMap = new Map<string, typeof faqs>();
  for (const faq of faqs) {
    const list = categoriesMap.get(faq.category) || [];
    list.push(faq);
    categoriesMap.set(faq.category, list);
  }

  return (
    <div className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-32">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-gold/15 border border-accent-gold/30 text-accent-gold text-xs font-bold uppercase tracking-wider mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>HELP & ORDERING GUIDANCE</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-foreground mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-sm md:text-base text-text-muted max-w-xl mx-auto leading-relaxed">
          Everything you need to know about our enquiry-first platform, minimum order progress, and dispatch logistics.
        </p>
      </div>

      <div className="space-y-10">
        {Array.from(categoriesMap.entries()).map(([catName, list]) => (
          <div key={catName}>
            <h2 className="font-heading font-bold text-lg text-accent-gold uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
              {catName}
            </h2>
            <div className="space-y-4">
              {list.map((faq) => (
                <details
                  key={faq.id}
                  className="group rounded-2xl bg-bg-1 border border-white/10 p-5 open:bg-white/[0.04] transition-colors"
                >
                  <summary className="font-heading font-bold text-base text-foreground flex items-center justify-between cursor-pointer list-none select-none">
                    <span>{faq.question}</span>
                    <ChevronDown className="w-4 h-4 text-accent-gold transition-transform duration-200 group-open:rotate-180 shrink-0 ml-3" />
                  </summary>
                  <p className="mt-3 text-xs sm:text-sm text-text-muted leading-relaxed border-t border-white/5 pt-3">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center p-8 rounded-3xl bg-white/[0.02] border border-white/5">
        <h3 className="font-heading font-bold text-lg text-foreground mb-2">Still have questions?</h3>
        <p className="text-xs text-text-muted mb-5">
          Our Sivakasi support desk is available to assist you with custom assortments or cargo inquiries.
        </p>
        <Link href="/contact">
          <Button variant="primary" size="md">
            Reach Out to Us
          </Button>
        </Link>
      </div>
    </div>
  );
}
