# Project Progress & Status Log

## Phase Overview
- [x] **Phase 1: Foundation** (COMPLETED & VERIFIED)
- [x] **Phase 2: Design system and global UI** (COMPLETED & VERIFIED)
- [x] **Phase 3: Catalogue** (COMPLETED & VERIFIED)
- [x] **Phase 4: Enquiry engine** (COMPLETED & VERIFIED)
- [x] **Phase 5: Admin auth and dashboard** (COMPLETED & VERIFIED)
- [x] **Phase 6: Admin catalogue** (COMPLETED & VERIFIED)
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

## Phase 3: Catalogue & Public Pages — Summary
- **Product Card & Quick Order Views**:
  - `src/components/public/ProductCard.tsx`: Grid & list view card with discount badge, stock status pill, quantity stepper, "Add to Enquiry" microcopy, visual spark burst animation, and Quick View trigger.
  - `src/components/public/QuickOrderTable.tsx`: High-speed Sivakasi festival tabular price list grouped by category with live row subtotals, inline quantity adjustments, and stock status indicators.
  - `src/components/public/QuickViewModal.tsx`: Accessible modal displaying pack size, piece details, description, safety tips, and live quantity stepper.
  - `src/components/public/StickyEnquiryBar.tsx`: Mobile & desktop bottom bar summarizing item count, subtotal, and link to review enquiry.
  - `src/components/public/PriceListFilterBar.tsx`: Filter bar supporting search query, category selection, stock filter, sort order (price asc/desc, name, discount), and view switch (Grid vs Table) synchronized with URL search params.
- **Catalogue & Static Routes**:
  - `/price-list`: Full festive catalogue supporting both High-Speed Table Mode and Visual Grid Mode with URL-synced search, sorting, filtering, and live cart syncing.
  - `/collections/[slug]`: Dedicated category collection page with category hero gradient, descriptions, and product grid.
  - `/products/[slug]`: Detailed product showcase with product gallery, pack specs, safety guidance, direct WhatsApp/Call enquiry buttons, and related items.
  - `/combos`: Dedicated family and mega festival combo packs with item breakdowns, savings calculations, and one-click add to enquiry.
  - `/about`: Authentic Sivakasi manufacturing heritage, history, compliance standards, and ethical craftsmanship.
  - `/contact`: Official contact information, Sivakasi warehouse address, phone/WhatsApp links, and map info.
  - `/faq`: Accordion FAQ loaded from PostgreSQL seed data categorized by Ordering, Delivery, and Safety.
  - `/safety`: Comprehensive fireworks safety guidelines, Dos and Don'ts, emergency protocols, and adult supervision requirements.
  - `/legal/[slug]`: Dynamic legal markdown page (Terms, Privacy, Delivery Policy, Safety Notice, Compliance Notice) loaded from database with fallback neutral templates.
  - `/_not-found`: Custom festival 404 page with return-to-catalogue navigation.
- **Verification Gates**:
  - `npm run typecheck`: PASSED (0 errors)
  - `npm run lint`: PASSED (0 warnings, 0 errors)
  - `npm run test`: PASSED (31/31 tests passing)
  - `npm run build`: PASSED (11/11 static/dynamic routes compiled successfully)

---

## Phase 4: Enquiry Engine — Summary
- **Core Engine & Security**:
  - `src/lib/services/enquiryService.ts`: Atomic transaction creating gap-free enquiry number from `Counter`, full per-item and rule snapshots, immutable `originalSnapshot`, initial customer status history, and `OutboxEvent` generation.
  - `src/lib/security/rateLimiter.ts`: Serverless-compatible database-backed rate limiter on `RateLimit` table with SHA-256 salted IP hashing.
  - `src/lib/utils/token.ts`: HMAC-SHA256 token generator and constant-time buffer verifier (`verifyEnquiryToken`) for protecting customer confirmation and printable estimate access.
  - `src/lib/services/whatsapp.ts`: Pure function generating encoded `wa.me` URL with automatic multi-item fallback truncation safely under 1,400 chars.
  - `src/lib/services/outboxService.ts` & `src/scripts/runOutbox.ts`: Notification queue runner with exponential backoff and dead-letter queueing.
- **Public Routes & Endpoints**:
  - `POST /api/enquiries`: Rate-limited submission handler validating customer details and items with Zod, detecting `PRICE_CHANGED` (409 Conflict), `ITEM_UNAVAILABLE` (409), `BELOW_MINIMUM` (409), and bot honeypot traps.
  - `POST /api/enquiries/track`: Privacy-first customer tracking endpoint matching enquiry number and registered mobile. Hides internal staff notes and customer address details.
  - `GET & POST /api/cron/outbox`: Protected outbox processing endpoint guarded by `CRON_SECRET`.
  - `GET /api/states`: Public list of all 36 Indian states and active regional delivery rules.
  - `/enquiry`: Customer review and submission page with live minimum-order progress meter, regional rule banners, 18+ statutory checkbox, honeypot, and cart management.
  - `/enquiry/success/[number]`: Token-protected confirmation page with festive celebration UI, mandatory "This is an Enquiry, NOT an Order" alert, one-click WhatsApp confirmation CTA, and Call button.
  - `/enquiry/summary/[number]`: Token-protected printable estimate document explicitly titled "ENQUIRY / ESTIMATE" with print styles (`@media print`).
  - `/track-enquiry`: Customer tracking portal with 7-stage vertical progress stepper, carrier tracking (Transporter & LR number), and WhatsApp escalation button.
- **Verification Gates**:
  - `npm run typecheck`: PASSED (0 errors)
  - `npm run lint`: PASSED (0 warnings, 0 errors)
  - `npm run test`: PASSED (42/42 tests passing across 7 test suites, including real PostgreSQL integration tests)
  - `npm run build`: PASSED (20/20 routes compiled successfully)

---

## Phase 5: Admin Auth & Dashboard — Summary
- **Authentication & Security Architecture**:
  - `src/lib/auth/jwt.ts`: 8-hour JWT signed with `jose` HS256 algorithm.
  - `src/lib/auth/permissions.ts`: Strict RBAC permissions matrix separating `SUPER_ADMIN` and `STAFF`.
  - `src/lib/auth/session.ts`: `getAdminSession()` verifying session and loading live database state on every call; `withAdminAuth(permission, handler)` server action and API route guard.
  - `src/middleware.ts`: Next.js middleware protecting `/admin/**` routes (redirects to `/admin/login`) and injecting `X-Robots-Tag: noindex, nofollow`.
  - Security policies: Account lockout for 15 minutes after 5 consecutive failed login attempts; password length >= 10; bcrypt cost 12; token version invalidation ("log out everywhere"); first login password change enforcement (`mustChangePassword`).
- **Admin Endpoints & UI**:
  - `POST /api/admin/auth/login`: IP rate-limited login handler with brute-force lockout and audit logging.
  - `POST /api/admin/auth/logout`: Clears `admin_session` cookie.
  - `POST /api/admin/auth/change-password`: Validates current password, updates to new bcrypt hash (cost 12), and clears `mustChangePassword`.
  - `POST /api/admin/auth/logout-everywhere`: Increments `tokenVersion` to invalidate all active session tokens.
  - `GET /api/admin/enquiries/count`: Polled every 30 seconds by sidebar badge for live new enquiry notifications.
  - `/admin/login`: Clean, festive dark theme admin sign-in portal.
  - `/admin/(dashboard)/layout.tsx`: Collapsible mobile drawer, active user role badge, change password modal, and live polling badge.
  - `/admin/(dashboard)`: Real-time operations dashboard with IST day-boundary metrics:
    - Enquiries Today (IST)
    - Enquiries This Week (IST)
    - Total Enquiries & Pipeline Estimated Value in ₹
    - "Confirmed or Later" conversion share (%)
    - 7-Day Performance Trend Chart (daily enquiry volumes)
    - 9-Status Operational Breakdown Grid
    - Inventory Health Alerts (Out of Stock & Limited Stock counts)
    - Top Fireworks Demand Products & Top Regional States
    - Recent Customer Enquiries Feed
- **Verification Gates**:
  - `npm run typecheck`: PASSED (0 errors)
  - `npm run lint`: PASSED (0 warnings, 0 errors)
  - `npm run test`: PASSED (49/49 tests passing across 9 test suites, including real PostgreSQL authentication & lockout tests)
  - `npm run build`: PASSED (23/23 routes compiled successfully)

---

## Phase 6: Admin Catalogue — Summary
- **Products Management & Optimistic Locking**:
  - `src/components/admin/ProductTable.tsx`: Full operations table with live pagination, debounced search, category filter, availability filter, multiselect row checkboxes, bulk actions bar, and quick toggles.
  - `src/components/admin/ProductModal.tsx`: Product create/edit modal with live MRP-to-Price discount calculation, stock alert indicators, primary image picker, and optimistic locking (`version`).
  - `src/app/api/admin/products`: CRUD endpoint with search, pagination, category filtering, and activity filtering.
  - `src/app/api/admin/products/[id]`: Optimistic locking check (`current.version === clientVersion`). If versions diverge, rejects with HTTP 409 Conflict (`VERSION_CONFLICT`). Atomic version increment and audit logging (`PRODUCT_UPDATE`).
- **Bulk Operations & Bulk Price Wizard**:
  - `src/components/admin/BulkPriceModal.tsx`: Visual preview table comparing current price vs. proposed price, percentage discount adjustments, nearest ₹1 rounding toggle, and validation guards.
  - `POST /api/admin/products/bulk`: Bulk availability updates, bulk active/archive toggles, bulk category moves, `BULK_PRICE_PREVIEW`, and transactional `BULK_PRICE_APPLY` with audit log entries.
- **CSV Import / Export**:
  - `GET /api/admin/products/export-csv`: Streams active products as CSV with rupee formatting.
  - `GET /api/admin/products/csv-template`: Standard downloadable layout template (`products_template.csv`).
  - `POST /api/admin/products/import-csv`: Parses with PapaParse, validates every row with Zod schema via `validateCsvRows`, robust header normalization, row-level error reporting, preview mode, and transactional upsert by SKU.
  - `src/components/admin/CsvImportModal.tsx`: Drag-and-drop / file upload modal with error diagnostics and dry-run preview.
- **Categories Management**:
  - `src/components/admin/CategoriesClient.tsx`: Category cards with live gradient previews (`colorFrom` & `colorTo`), product count badges, custom slug generator, and sort order.
  - `src/app/api/admin/categories` & `[id]`: Protected CRUD endpoints. Deletion/archiving is guarded: rejects with HTTP 400 (`CATEGORY_HAS_PRODUCTS`) if active products remain assigned to the category.
  - `/admin/categories`: Server component loading categories and active product counts.
- **Combos & Gift Boxes Management**:
  - `src/components/admin/CombosClient.tsx`: Interactive bundle manager with multi-product picker, quantity steppers, live aggregate value calculation, package pricing, customer savings % badges, and archive controls.
  - `src/app/api/admin/combos` & `[id]`: Transactional combo creation and update with product existence verification, aggregate value recalculation, and audit logging.
  - `/admin/combos`: Server component loading existing combos and active products.
- **Verification Gates**:
  - `npm run typecheck`: PASSED (0 errors)
  - `npm run lint`: PASSED (0 warnings, 0 errors)
  - `npm run test`: PASSED (60/60 tests passing across 10 test suites, including integration tests on real PostgreSQL)
  - `npm run build`: PASSED (33/33 static and dynamic routes compiled successfully)

---

## Architectural Decisions & Observations
1. **Integer Paise Representation**: All price fields (`mrpPaise`, `pricePaise`, `subtotalPaise`, `minOrderPaise`) strictly use integers.
2. **PostgreSQL Database**: Configured cluster with UTF8 encoding to natively support INR symbol (`₹`) and `pg_trgm` extension.
3. **Optimistic Locking**: Implemented via integer `version` field; verified that stale edits fail cleanly with HTTP 409 Conflict without overwriting concurrent modifications.
4. **Catalogue Flexibility**: Both tabular quick-order view (popular with bulk festive shoppers) and visual card view are supported with synchronized URL query parameters.
5. **Enquiry Integrity & Privacy**: Customer tracking and estimate printouts strictly isolate customer-facing timelines while concealing internal staff notes and preventing phone enumeration attacks.
6. **Live DB Auth Verification**: Middleware redirects unauthenticated requests, but `withAdminAuth` re-verifies `isActive` and `tokenVersion` from real PostgreSQL on every request so deactivations and password changes take immediate effect.
7. **CSV Import Header Normalization**: Added case-insensitive and spacing-tolerant normalization in `validateCsvRows` to seamlessly support various spreadsheet headers (`SKU`, `Name`, `Price`, `Category`, etc.).
8. **Test Serial Execution**: Configured Vitest `fileParallelism: false` so that integration test suites running real PostgreSQL transactions (gap-free counters, concurrency) do not cross-interfere.
