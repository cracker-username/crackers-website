"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  FileText,
  Image as ImageIcon,
  HelpCircle,
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Save,
  Clock,
  Layers,
  Eye,
  X,
  Star,
} from "lucide-react";

interface BannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  linkUrl?: string | null;
  sortOrder: number;
  status: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

interface TestimonialItem {
  id: string;
  name: string;
  location: string;
  rating: number;
  content: string;
  isActive: boolean;
}

interface PageItem {
  slug: string;
  title: string;
  contentMd: string;
}

interface ContentManagerProps {
  initialBanners: BannerItem[];
  initialFaqs: FaqItem[];
  initialTestimonials: TestimonialItem[];
  initialPages: PageItem[];
  initialHomeSections: any;
}

export function ContentManager({
  initialBanners,
  initialFaqs,
  initialTestimonials,
  initialPages,
  initialHomeSections,
}: ContentManagerProps) {
  const [activeTab, setActiveTab] = useState<"banners" | "faqs" | "testimonials" | "pages" | "homepage">("banners");

  const [banners, setBanners] = useState<BannerItem[]>(initialBanners);
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(initialTestimonials);
  const [pages, setPages] = useState<PageItem[]>(initialPages);

  // Selected legal page for editor
  const [selectedPageSlug, setSelectedPageSlug] = useState<string>(initialPages[0]?.slug || "terms");
  const currentPage = pages.find((p) => p.slug === selectedPageSlug) || {
    slug: selectedPageSlug,
    title: "",
    contentMd: "",
  };
  const [pageTitle, setPageTitle] = useState(currentPage.title);
  const [pageMarkdown, setPageMarkdown] = useState(currentPage.contentMd);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSavingPage, setIsSavingPage] = useState(false);

  // Home sections & countdown
  const [countdownTitle, setCountdownTitle] = useState(initialHomeSections.countdownTitle || "");
  const [countdownTarget, setCountdownTarget] = useState(initialHomeSections.countdownTarget || "");
  const [countdownEnabled, setCountdownEnabled] = useState(Boolean(initialHomeSections.countdownEnabled));
  const [sectionsOrder, setSectionsOrder] = useState<Array<{ id: string; enabled: boolean }>>(
    initialHomeSections.homepageSectionsOrder || []
  );
  const [isSavingHome, setIsSavingHome] = useState(false);

  // Modal states for Banners
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [bannerLinkUrl, setBannerLinkUrl] = useState("");
  const [bannerStatus, setBannerStatus] = useState("PUBLISHED");

  // Modal states for FAQs
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqCategory, setFaqCategory] = useState("General");
  const [faqIsActive, setFaqIsActive] = useState(true);

  // Modal states for Testimonials
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTesti, setEditingTesti] = useState<TestimonialItem | null>(null);
  const [testiName, setTestiName] = useState("");
  const [testiLocation, setTestiLocation] = useState("");
  const [testiRating, setTestiRating] = useState(5);
  const [testiContent, setTestiContent] = useState("");
  const [testiIsActive, setTestiIsActive] = useState(true);

  const [feedback, setFeedback] = useState<string | null>(null);

  // Switch legal page in editor
  const handleSelectPage = (slug: string) => {
    setSelectedPageSlug(slug);
    const p = pages.find((item) => item.slug === slug);
    if (p) {
      setPageTitle(p.title);
      setPageMarkdown(p.contentMd);
    }
  };

  const handleSavePage = async () => {
    setIsSavingPage(true);
    try {
      const res = await fetch(`/api/admin/content/pages/${selectedPageSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: pageTitle, contentMd: pageMarkdown }),
      });
      const json = await res.json();
      if (json.ok) {
        setPages(
          pages.map((p) =>
            p.slug === selectedPageSlug ? { ...p, title: pageTitle, contentMd: pageMarkdown } : p
          )
        );
        setFeedback(`Page "${pageTitle}" saved successfully!`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      alert("Error saving page");
    } finally {
      setIsSavingPage(false);
    }
  };

  const handleSaveHome = async () => {
    setIsSavingHome(true);
    try {
      const res = await fetch("/api/admin/content/home-sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countdownTitle,
          countdownTarget,
          countdownEnabled,
          homepageSectionsOrder: sectionsOrder,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setFeedback("Homepage configuration saved successfully!");
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      alert("Error saving homepage settings");
    } finally {
      setIsSavingHome(false);
    }
  };

  // Banner Actions
  const openCreateBanner = () => {
    setEditingBanner(null);
    setBannerTitle("");
    setBannerSubtitle("");
    setBannerImage("/placeholders/sparkler.svg");
    setBannerLinkUrl("");
    setBannerStatus("PUBLISHED");
    setIsBannerModalOpen(true);
  };

  const openEditBanner = (b: BannerItem) => {
    setEditingBanner(b);
    setBannerTitle(b.title);
    setBannerSubtitle(b.subtitle || "");
    setBannerImage(b.image);
    setBannerLinkUrl(b.linkUrl || "");
    setBannerStatus(b.status);
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: bannerTitle,
      subtitle: bannerSubtitle || null,
      image: bannerImage,
      linkUrl: bannerLinkUrl || null,
      status: bannerStatus,
    };

    try {
      const url = editingBanner ? `/api/admin/content/banners/${editingBanner.id}` : "/api/admin/content/banners";
      const method = editingBanner ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        setIsBannerModalOpen(false);
        const listRes = await fetch("/api/admin/content/banners");
        const listJson = await listRes.json();
        if (listJson.ok) setBanners(listJson.data);
      }
    } catch {
      alert("Error saving banner");
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      await fetch(`/api/admin/content/banners/${id}`, { method: "DELETE" });
      setBanners(banners.filter((b) => b.id !== id));
    } catch {
      alert("Error deleting banner");
    }
  };

  // FAQ Actions
  const openCreateFaq = () => {
    setEditingFaq(null);
    setFaqQuestion("");
    setFaqAnswer("");
    setFaqCategory("General");
    setFaqIsActive(true);
    setIsFaqModalOpen(true);
  };

  const openEditFaq = (f: FaqItem) => {
    setEditingFaq(f);
    setFaqQuestion(f.question);
    setFaqAnswer(f.answer);
    setFaqCategory(f.category);
    setFaqIsActive(f.isActive);
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      question: faqQuestion,
      answer: faqAnswer,
      category: faqCategory,
      isActive: faqIsActive,
    };

    try {
      const url = editingFaq ? `/api/admin/content/faqs/${editingFaq.id}` : "/api/admin/content/faqs";
      const method = editingFaq ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        setIsFaqModalOpen(false);
        const listRes = await fetch("/api/admin/content/faqs");
        const listJson = await listRes.json();
        if (listJson.ok) setFaqs(listJson.data);
      }
    } catch {
      alert("Error saving FAQ");
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Delete this FAQ item?")) return;
    try {
      await fetch(`/api/admin/content/faqs/${id}`, { method: "DELETE" });
      setFaqs(faqs.filter((f) => f.id !== id));
    } catch {
      alert("Error deleting FAQ");
    }
  };

  // Testimonial Actions
  const openCreateTesti = () => {
    setEditingTesti(null);
    setTestiName("");
    setTestiLocation("");
    setTestiRating(5);
    setTestiContent("");
    setTestiIsActive(true);
    setIsTestimonialModalOpen(true);
  };

  const openEditTesti = (t: TestimonialItem) => {
    setEditingTesti(t);
    setTestiName(t.name);
    setTestiLocation(t.location);
    setTestiRating(t.rating);
    setTestiContent(t.content);
    setTestiIsActive(t.isActive);
    setIsTestimonialModalOpen(true);
  };

  const handleSaveTesti = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: testiName,
      location: testiLocation,
      rating: testiRating,
      content: testiContent,
      isActive: testiIsActive,
    };

    try {
      const url = editingTesti ? `/api/admin/content/testimonials/${editingTesti.id}` : "/api/admin/content/testimonials";
      const method = editingTesti ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        setIsTestimonialModalOpen(false);
        const listRes = await fetch("/api/admin/content/testimonials");
        const listJson = await listRes.json();
        if (listJson.ok) setTestimonials(listJson.data);
      }
    } catch {
      alert("Error saving testimonial");
    }
  };

  const handleDeleteTesti = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    try {
      await fetch(`/api/admin/content/testimonials/${id}`, { method: "DELETE" });
      setTestimonials(testimonials.filter((t) => t.id !== id));
    } catch {
      alert("Error deleting testimonial");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-brand-gold" />
          Content & Brand CMS
        </h1>
        <p className="text-xs text-brand-muted mt-1">
          Manage promotional banners, festival FAQs, customer testimonials, Markdown legal pages, and homepage layout.
        </p>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {feedback}
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("banners")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 ${
            activeTab === "banners" ? "bg-brand-primary text-white" : "bg-white/5 text-brand-muted hover:text-white"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Promotional Banners ({banners.length})
        </button>

        <button
          onClick={() => setActiveTab("faqs")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 ${
            activeTab === "faqs" ? "bg-brand-primary text-white" : "bg-white/5 text-brand-muted hover:text-white"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Festival FAQs ({faqs.length})
        </button>

        <button
          onClick={() => setActiveTab("testimonials")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 ${
            activeTab === "testimonials" ? "bg-brand-primary text-white" : "bg-white/5 text-brand-muted hover:text-white"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Testimonials ({testimonials.length})
        </button>

        <button
          onClick={() => setActiveTab("pages")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 ${
            activeTab === "pages" ? "bg-brand-primary text-white" : "bg-white/5 text-brand-muted hover:text-white"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Legal Pages (Markdown)
        </button>

        <button
          onClick={() => setActiveTab("homepage")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 ${
            activeTab === "homepage" ? "bg-brand-primary text-white" : "bg-white/5 text-brand-muted hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Homepage Sections & Countdown
        </button>
      </div>

      {/* Tab 1: Banners */}
      {activeTab === "banners" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-muted">
              Banners displayed on the homepage slider or promotional strips.
            </span>
            <Button onClick={openCreateBanner} size="sm" className="bg-brand-primary text-white text-xs">
              <Plus className="w-4 h-4 mr-1" />
              Add Banner
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className="bg-brand-bg-1/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === "PUBLISHED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {b.status}
                    </span>
                    <span className="text-[10px] text-brand-muted font-mono">Order: {b.sortOrder}</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{b.title}</h4>
                  {b.subtitle && <p className="text-xs text-brand-muted mt-0.5">{b.subtitle}</p>}
                  <div className="text-[11px] text-brand-muted/80 truncate mt-2 font-mono">
                    Img: {b.image}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditBanner(b)}
                    className="h-7 text-xs px-2.5"
                  >
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteBanner(b.id)}
                    className="h-7 text-xs px-2.5 text-red-400 border-red-500/20 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: FAQs */}
      {activeTab === "faqs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-muted">
              Frequently Asked Questions shown on `/faq` and the homepage FAQ accordion.
            </span>
            <Button onClick={openCreateFaq} size="sm" className="bg-brand-primary text-white text-xs">
              <Plus className="w-4 h-4 mr-1" />
              Add FAQ
            </Button>
          </div>

          <div className="space-y-3">
            {faqs.map((f) => (
              <div
                key={f.id}
                className="bg-brand-bg-1/80 border border-white/10 rounded-2xl p-4 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-brand-accent-cyan border border-white/10">
                      {f.category}
                    </span>
                    {!f.isActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white">{f.question}</h4>
                  <p className="text-xs text-brand-muted whitespace-pre-wrap">{f.answer}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditFaq(f)}
                    className="h-7 text-xs px-2.5"
                  >
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteFaq(f.id)}
                    className="h-7 text-xs px-2.5 text-red-400 border-red-500/20 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Testimonials */}
      {activeTab === "testimonials" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-muted">
              Authentic customer feedback and Diwali reviews.
            </span>
            <Button onClick={openCreateTesti} size="sm" className="bg-brand-primary text-white text-xs">
              <Plus className="w-4 h-4 mr-1" />
              Add Testimonial
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-brand-bg-1/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-zinc-500/10 text-zinc-400"
                      }`}
                    >
                      {t.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-xs text-white/90 italic mb-3">&quot;{t.content}&quot;</p>
                  <div className="text-xs font-bold text-white">{t.name}</div>
                  <div className="text-[10px] text-brand-muted">{t.location}</div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditTesti(t)}
                    className="h-7 text-xs px-2.5"
                  >
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteTesti(t.id)}
                    className="h-7 text-xs px-2.5 text-red-400 border-red-500/20 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Legal Pages (Markdown Editor) */}
      {activeTab === "pages" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Page Selector Tabs */}
            <div className="flex items-center gap-1 bg-brand-bg-0 p-1 rounded-xl border border-white/10 overflow-x-auto">
              {pages.map((p) => (
                <button
                  key={p.slug}
                  onClick={() => handleSelectPage(p.slug)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                    selectedPageSlug === p.slug
                      ? "bg-brand-primary text-white"
                      : "text-brand-muted hover:text-white"
                  }`}
                >
                  {p.title || p.slug}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="text-xs h-8"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                {isPreviewMode ? "Edit Markdown" : "Live Preview"}
              </Button>
              <Button
                onClick={handleSavePage}
                disabled={isSavingPage}
                size="sm"
                className="bg-brand-primary text-white text-xs h-8 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {isSavingPage ? "Saving..." : "Save Page"}
              </Button>
            </div>
          </div>

          <div className="bg-brand-bg-1/80 border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-muted uppercase mb-1">
                Page Title *
              </label>
              <input
                type="text"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-muted uppercase mb-1 flex items-center justify-between">
                <span>Markdown Content</span>
                <span className="text-[10px] text-brand-muted font-normal">
                  Route: `/legal/{selectedPageSlug}`
                </span>
              </label>

              {isPreviewMode ? (
                <div className="p-4 bg-brand-bg-0 border border-white/10 rounded-xl min-h-[300px] text-xs text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
                  {pageMarkdown}
                </div>
              ) : (
                <textarea
                  rows={16}
                  value={pageMarkdown}
                  onChange={(e) => setPageMarkdown(e.target.value)}
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl p-4 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-brand-primary"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Homepage Sections & Countdown */}
      {activeTab === "homepage" && (
        <div className="bg-brand-bg-1/80 border border-white/10 rounded-2xl p-5 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white">Homepage Layout & Festive Countdown</h3>
              <p className="text-xs text-brand-muted">
                Toggle visibility and configure Diwali festival countdown timer.
              </p>
            </div>
            <Button
              onClick={handleSaveHome}
              disabled={isSavingHome}
              size="sm"
              className="bg-brand-primary text-white text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingHome ? "Saving..." : "Save Homepage Config"}
            </Button>
          </div>

          {/* Countdown config */}
          <div className="bg-brand-bg-0/60 rounded-xl p-4 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-gold" />
                Festive Countdown Timer
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                <input
                  type="checkbox"
                  checked={countdownEnabled}
                  onChange={(e) => setCountdownEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-brand-bg-0 text-brand-primary"
                />
                <span>Enable Countdown</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-brand-muted uppercase mb-1">
                  Countdown Headline
                </label>
                <input
                  type="text"
                  value={countdownTitle}
                  onChange={(e) => setCountdownTitle(e.target.value)}
                  placeholder="e.g. Diwali 2026 Booking Season Closes In:"
                  className="w-full bg-brand-bg-1 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-brand-muted uppercase mb-1">
                  Target Timestamp (IST ISO)
                </label>
                <input
                  type="text"
                  value={countdownTarget}
                  onChange={(e) => setCountdownTarget(e.target.value)}
                  placeholder="2026-11-08T00:00:00+05:30"
                  className="w-full bg-brand-bg-1 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Sections Toggle List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-accent-cyan" />
              Homepage Section Visibility
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {sectionsOrder.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="flex items-center justify-between p-3 bg-brand-bg-0/60 rounded-xl border border-white/5 text-xs text-white"
                >
                  <span className="font-medium capitalize">{sec.id.replace(/([A-Z])/g, " $1")}</span>
                  <input
                    type="checkbox"
                    checked={sec.enabled}
                    onChange={(e) => {
                      const updated = [...sectionsOrder];
                      updated[idx] = { ...sec, enabled: e.target.checked };
                      setSectionsOrder(updated);
                    }}
                    className="w-4 h-4 rounded border-white/20 bg-brand-bg-1 text-brand-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Banner Modal */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-brand-bg-1 border border-white/20 rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsBannerModalOpen(false)}
              className="absolute top-4 right-4 text-brand-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">
              {editingBanner ? "Edit Banner" : "Create New Banner"}
            </h3>
            <form onSubmit={handleSaveBanner} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Subtitle</label>
                <input
                  type="text"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Image URL *</label>
                <input
                  type="text"
                  required
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Link URL</label>
                <input
                  type="text"
                  value={bannerLinkUrl}
                  onChange={(e) => setBannerLinkUrl(e.target.value)}
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Status</label>
                <select
                  value={bannerStatus}
                  onChange={(e) => setBannerStatus(e.target.value)}
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsBannerModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-brand-primary text-white">
                  Save Banner
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-brand-bg-1 border border-white/20 rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsFaqModalOpen(false)}
              className="absolute top-4 right-4 text-brand-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">{editingFaq ? "Edit FAQ" : "Add FAQ"}</h3>
            <form onSubmit={handleSaveFaq} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Question *</label>
                <input
                  type="text"
                  required
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Category</label>
                <input
                  type="text"
                  value={faqCategory}
                  onChange={(e) => setFaqCategory(e.target.value)}
                  placeholder="Ordering / Delivery / Safety"
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Answer *</label>
                <textarea
                  rows={4}
                  required
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl p-3 text-xs text-white resize-none"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={faqIsActive}
                  onChange={(e) => setFaqIsActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-brand-bg-0 border-white/20 text-brand-primary"
                />
                <span>Active / Published</span>
              </label>
              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsFaqModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-brand-primary text-white">
                  Save FAQ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Testimonial Modal */}
      {isTestimonialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-brand-bg-1 border border-white/20 rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsTestimonialModalOpen(false)}
              className="absolute top-4 right-4 text-brand-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">
              {editingTesti ? "Edit Testimonial" : "Add Testimonial"}
            </h3>
            <form onSubmit={handleSaveTesti} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={testiName}
                  onChange={(e) => setTestiName(e.target.value)}
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Location *</label>
                <input
                  type="text"
                  required
                  value={testiLocation}
                  onChange={(e) => setTestiLocation(e.target.value)}
                  placeholder="e.g. Madurai, Tamil Nadu"
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Rating (1-5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={testiRating}
                  onChange={(e) => setTestiRating(parseInt(e.target.value) || 5)}
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase mb-1">Review Content *</label>
                <textarea
                  rows={3}
                  required
                  value={testiContent}
                  onChange={(e) => setTestiContent(e.target.value)}
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl p-3 text-xs text-white resize-none"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={testiIsActive}
                  onChange={(e) => setTestiIsActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-brand-bg-0 border-white/20 text-brand-primary"
                />
                <span>Active on Public Site</span>
              </label>
              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsTestimonialModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-brand-primary text-white">
                  Save Testimonial
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
