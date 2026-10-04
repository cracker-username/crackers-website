# Project Progress & Status Log

## Phase Overview
- [x] **Phase 1: Foundation** (COMPLETED & VERIFIED)
- [x] **Phase 2: Design system and global UI** (COMPLETED & VERIFIED)
- [ ] **Phase 3: Catalogue** (READY)
- [ ] **Phase 4: Enquiry engine** (PENDING)
- [ ] **Phase 5: Admin auth and dashboard** (PENDING)
- [ ] **Phase 6: Admin catalogue** (PENDING)
- [ ] **Phase 7: Admin enquiries, content and settings** (PENDING)
- [ ] **Phase 8: Integration, security, SEO, performance** (PENDING)
- [ ] **Phase 9: Full QA** (PENDING)
- [ ] **Phase 10: Final production audit** (PENDING)

---

## Phase 1: Foundation Status — Summary
- **Git & Tooling**: Initialized repository, strict `.gitignore` (secrets, data, build, logs, uploads), Next.js 15.5.27, Tailwind CSS 3.4.17, TypeScript 5.7.3 strict mode.
- **Design Tokens**: Configured dark and light CSS variable tokens in `globals.css` and `tailwind.config.ts`, including brand accents, WCAG AA price tokens (`#FFC83D` dark, `#B8860B` light), Baloo 2 and Poppins fonts via `next/font`.
- **Database & Schema**: Comprehensive `prisma/schema.prisma` with integer paise money, UTC timestamptz dates, optimistic locking `version`, foreign keys, and indexes. Tested and synchronized with PostgreSQL 18.4 with UTF8 encoding and `pg_trgm` extension.
- **Container & Environment**: `docker-compose.yml` created for containerized deployments; fully documented `.env.example` marking `CLIENT SAFE` vs `SERVER ONLY` variables.
- **Settings Registry**: `src/lib/settings/registry.ts` with typed Zod schemas, defaults, and safe parser fallback.
- **Rules Engine & Business Logic**:
  - `src/lib/utils/money.ts`: Integer paise arithmetic and Indian Rupee formatting (`Intl.NumberFormat('en-IN')`).
  - `src/lib/utils/dates.ts`: Asia/Kolkata timezone helpers and countdown calculators.
  - `src/lib/rules/deliveryResolver.ts`: State-specific delivery rule resolution over default rules.
  - `src/lib/rules/enquiryRules.ts`: Authoritative pure rule evaluator for minimum orders, stock availability, and free shipping thresholds.
  - `src/lib/services/counterService.ts`: Gap-free enquiry number format `PREFIX-YY-XXXXXX`.
  - `src/lib/services/whatsapp.ts`: Safe `wa.me` message generator with 1,500 character length safeguard.
  - `src/lib/services/statusMachine.ts`: Allowed status transitions machine with `SUPER_ADMIN` reopen guard.
  - `src/lib/validation/csv.ts`: CSV row validator with rupee to paise conversion.
  - `src/lib/services/enquiryService.ts`: Transactional submission pipeline with idempotency keying and immutable snapshots.
  - `src/lib/services/outboxService.ts`: Outbox queueing with exponential backoff and dead-letter queue.
- **Seed Dataset**: Seeded into real PostgreSQL:
  - 1 Super Admin (`admin@crackers.local`, bcrypt cost 12)
  - 36 Indian States and Union Territories
  - Demo Delivery Rules (TN/PY ₹3,000; Others ₹5,000; Free shipping threshold ₹10,000)
  - 12 Fireworks Categories with individual color gradients
  - 84 Realistic Fireworks Products with themed SVG placeholder illustrations
  - 8 Combo Packs with item breakdowns
  - Categorized FAQs
  - Inactive sample testimonials
  - Legal Markdown templates (Terms, Privacy, Delivery Policy, Safety, Compliance)
- **Quality Gates Run**:
  - `npm run typecheck`: PASSED (0 errors)
  - `npm run lint`: PASSED (0 warnings, 0 errors)
  - `npm run test`: PASSED (25/25 tests across 3 test files, including real PostgreSQL concurrency & idempotency)
  - `npm run build`: PASSED (production build succeeded)

---

## Phase 2: Design System & Global UI — Summary
- **Cart Store**: `src/store/useCartStore.ts` implemented with Zustand and persist middleware. Strictly persists items, quantities, and selected state only in localStorage with SSR/hydration safety.
- **Theme Architecture**: Dark theme default with light theme support and persistent toggle via `src/components/ui/ThemeToggle.tsx`. WCAG AA contrast prices (`#FFC83D` dark, `#B8860B` light).
- **Fireworks Canvas**: Native HTML5 `<canvas>` fireworks (`src/components/canvas/FireworksCanvas.tsx`) with capped particles (max 60), capped DPR (max 2), paused when off-screen via `IntersectionObserver` or tab hidden via `visibilitychange`, and static gradient for `prefers-reduced-motion`.
- **Global Shell & Components**:
  - `src/components/public/AnnouncementBar.tsx`: Dynamic marquee banner with pause on hover; hidden if disabled/empty.
  - `src/components/public/Header.tsx`: Sticky navigation with logo, brand links, search trigger (`Ctrl+K`), animated cart bump counter, theme toggle, Call and WhatsApp buttons.
  - `src/components/public/MobileNav.tsx`: 5-item bottom mobile navigation with 48px touch targets and live count badge.
  - `src/components/public/FloatingWhatsApp.tsx`: Mobile-safe launcher positioned to avoid bottom navigation and cart overlaps.
  - `src/components/public/TrustStrip.tsx`: Authentic Sivakasi badges; licence badge rendered conditionally.
  - `src/components/public/Footer.tsx`: Comprehensive footer with brand information, policy links, contact details, statutory fireworks notice, and smooth back-to-top button.
  - `src/components/public/AgeConsentModal.tsx`: Statutory 18+ verification modal remembered in localStorage.
  - `src/components/public/CommandPalette.tsx`: Debounced fast search modal triggered via `Ctrl+K` and `/` querying real PostgreSQL via `src/app/api/search/route.ts`.
  - `src/components/public/EnquiryDrawer.tsx`: Slide-out enquiry list with live minimum order progress meter (regional rules applied) and quantity steppers.
  - `src/components/public/Hero.tsx`: Dynamic fireworks hero with IST-aware countdown timer.
- **Verification Gates**:
  - `npm run typecheck`: PASSED (0 errors)
  - `npm run lint`: PASSED (0 warnings, 0 errors)
  - `npm run test`: PASSED (28/28 tests)
  - `npm run build`: PASSED (0 errors)

---

## Architectural Decisions & Observations
1. **Integer Paise Representation**: All price fields (`mrpPaise`, `pricePaise`, `subtotalPaise`, `minOrderPaise`) strictly use integers.
2. **PostgreSQL Database**: Configured cluster with UTF8 encoding to natively support INR symbol (`₹`) and `pg_trgm` extension.
3. **Optimistic Locking**: Implemented via integer `version` field; verified that stale edits fail cleanly without overwriting concurrent modifications.
