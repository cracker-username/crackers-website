# Antigravity Super Prompt V3 — Crackers Enquiry Platform

## How to use

1. Create an empty workspace in Antigravity. Select the strongest Gemini model available and **Planning mode**.
2. Paste everything between `=== COPY FROM HERE ===` and `=== COPY UNTIL HERE ===`.
3. Review the plan the agent produces, then reply "Approved, proceed with Phase 1".
4. After each phase, read the agent's real test output. Reply "Proceed to next phase" only when it passes.
5. When everything is done, run the audit prompts from your own V2 file or the follow-ups from the first prompt file.

Why this version is shorter than V2: an agent follows a focused spec more reliably than a 100-section one. Features that are not safe to build now are listed under "Excluded", so they never leave half-built UI.

---

=== COPY FROM HERE ===

# 0. ROLE AND OPERATING RULES

You are one senior team: product designer, UX engineer, full-stack engineer, database architect, security engineer, QA automation engineer and DevOps engineer. You BUILD, TEST, INSPECT, FIX and VERIFY a complete production-grade application. This is not a mockup and not a static demo. Every visible control must work against a real database.

Operating rules:
1. **Planning first.** In your first response write no application code. Inspect the workspace, then produce: architecture plan, folder structure, data model plan, server/API plan, auth plan, design system plan, task lists (public and admin), testing plan, security plan, deployment plan, risk register and assumptions. The only file you may create at this stage is `docs/PROJECT_SPEC.md`, containing **this entire brief verbatim**. Wait for my approval.
2. **Memory files.** Keep `docs/PROJECT_SPEC.md` (this brief) and `docs/PROGRESS.md` (phase status, decisions, open issues). Re-read both at the start of every phase so nothing is forgotten in a long build.
3. **Git.** Initialise git, add a proper `.gitignore`, and commit at the end of each phase with a clear message. Never commit `.env` or secrets.
4. **Honest reporting.** Never claim a test passed, a screenshot exists, or a feature works unless you actually ran it. Paste the real command results (counts and failures). If screenshot tooling is unavailable, say so and do an equivalent reproducible viewport check instead. Do not fabricate.
5. **No fake functionality.** Forbidden: TODO handlers, "coming soon" alerts, fake search, fake pagination, fake stats, fake uploads, fake login, hard-coded admin data shown as live data. Demo data is allowed only as seed data.
6. **Do not stop to ask** unless truly blocked. Pick the safest sensible default, record it in `docs/PROGRESS.md`, and continue.
7. A later phase must not start while a critical defect from the current phase is open.

# 1. BUSINESS MODEL AND LEGAL GUARDRAILS

- Business: a Sivakasi-based fireworks seller. Model: **ENQUIRY-FIRST**.
- Customer flow: browse, search, filter, product, quantity, add to enquiry, choose location, see minimum-order progress, review, submit enquiry, get enquiry ID, confirm on WhatsApp or call, manual confirmation by the business.
- There is **no payment, no checkout, no "Buy Now", no automatic order confirmation**. Do not write any payment code at all. Online sale of firecrackers is restricted in India, so the site is a catalogue plus an enquiry tool.
- Microcopy to use: Add to Enquiry, Review Enquiry, Send Enquiry, Track Enquiry, Call Us, WhatsApp Us. Never use: Buy Now, Checkout, Payment Successful, Order Confirmed.
- Do not invent legal claims, licences, certifications, awards, registrations, "factory direct" claims or government approvals. Any credential comes from Admin Settings. If a field is empty, **hide that badge entirely**.
- Legal pages (Terms, Privacy, Enquiry Policy, Delivery Policy, Safety Information, Compliance Notice) are admin-editable Markdown, seeded with neutral template text clearly marked "Business-provided content, please review". Do not generate fake legal guarantees.
- Add a one-time 18+ and safety notice modal (remembered per browser), and an 18+ consent checkbox on the enquiry form. Show a state-restrictions notice near the location selector.
- Shipping wording is admin-controlled (see section 7). Never show "FREE SHIPPING" unless the active delivery rule explicitly enables it and its threshold is met.
- Pricing honesty: Settings has `showMrpAndDiscount`. MRP and discount % are always computed from stored values.

# 2. REFERENCE AND ORIGINALITY

The site https://www.niyaacrackers.com/ is a functional reference only (price list, categories, enquiry instead of payment, minimum order, WhatsApp/call confirmation). Do **not** copy its logo, text, images, layout, components, colours, typography, CSS or structure. Build an original brand experience under the placeholder name `[BRAND_NAME]`. Every business identity field is editable in Admin Settings.

# 3. TECH STACK (fixed, do not substitute)

- **Next.js latest stable, App Router, React Server Components**, **TypeScript strict** (no `any`), Node 20+, npm.
- **Tailwind CSS** with CSS-variable design tokens, **shadcn/ui** primitives, **lucide-react**, **Framer Motion**, native `<canvas>` for fireworks.
- **Zustand + persist** (enquiry cart), **Zod** (all validation, shared client and server), **React Hook Form** with Zod resolver.
- **Prisma + PostgreSQL**. `docker-compose.yml` for local Postgres. Enable the `pg_trgm` extension through a migration for search.
- **Auth**: `jose` signed JWT in an `httpOnly`, `Secure`, `SameSite=Lax` cookie, `bcryptjs` (cost 12). One auth system only. No Auth.js, no mixing.
- **Images**: `StorageProvider` interface with a local-disk driver (development) and a Cloudinary driver (production). `sharp` for WebP variants. Local disk must never be assumed persistent in production.
- Admin-only libraries: TanStack Table, Recharts, PapaParse, a Markdown editor. Do not ship them in the public bundle.
- **Tests**: Vitest and Playwright, run against a **real PostgreSQL test database** (not mocks) for the enquiry engine.
- Fonts via `next/font`: Baloo 2 (headings), Poppins (body); load only the weights you use; latin subset; `display: swap`.
- Pin exact dependency versions after install. Provide a fully documented `.env.example` marking each variable `CLIENT SAFE` or `SERVER ONLY`.

# 4. SCOPE TIERS

**P0 (must ship, fully tested):** everything in sections 5 to 16 except items marked P1.

**P1 (only after P0 passes the full quality gate):** OTP-based tracking, CMS draft/preview for homepage sections, basic analytics events, multi-language (Hindi, Tamil), server-generated PDF.

**EXCLUDED from this build (do not build, do not add placeholder UI or feature flags):** online payments, customer accounts and login, wishlist, reviews, WhatsApp Cloud API, server-side abandoned-enquiry storage, product video hosting, pincode lookup APIs, city database or autocomplete.

# 5. DESIGN DIRECTION: "FESTIVAL NIGHT SKY" (colourful, premium, fast)

The owner explicitly wants a **colourful, interesting, next-level** UI. Be vibrant and joyful, but disciplined: colour carries the brand (hero, category tiles, badges, CTAs, glows), while text and data surfaces stay calm and highly readable. It must not look like old WooCommerce, a generic Bootstrap template, a cheap festival template or a spreadsheet.

Tokens (CSS variables; dark default and a light theme; theme choice persists):
- Dark: `--bg-0 #070418`, `--bg-1 #0F0A33`, surface = white at 6 to 9 percent with blur, text `#F6F3FF`, muted `#B9B2D9`.
- Light: background cream `#FFF9F0`, surface `#FFFFFF`, text `#1B1038`.
- Accents: magenta `#FF2E93`, fire orange `#FF7A18`, gold `#FFC83D`, cyan `#22D3EE`, violet `#8B5CF6`, lime `#A3E635`.
- **Every category has its own `colorFrom` and `colorTo` gradient** (admin-editable). Category tiles, product badges, page headers and card glows use it.
- Prices and CTAs must have excellent contrast. Use gold in dark theme and a darker amber in light theme so prices meet WCAG AA. Verify contrast with an automated check.
- Typography tokens: display, h1, h2, h3, body, small, caption, price, button.

Signature interactions (all must respect `prefers-reduced-motion`, and none may hurt performance):
- **Hero fireworks canvas**: original generated art, bursts in brand colours, particle count capped, devicePixelRatio capped, `requestAnimationFrame`, paused when the tab is hidden or the hero is off-screen, loaded dynamically after the main content. With reduced motion, show a static glowing gradient with a few sparkles.
- **Add-to-Enquiry spark burst** (under 600 ms), enquiry badge bump, animated count-up of the total.
- Marquee announcement bar (pauses on hover; static under reduced motion), gradient-border glow on featured cards, card hover lift on pointer devices only, skeleton shimmer, short page transitions (200 ms or less), a clean countdown.
- No large videos, no heavy particle engines, no copyrighted images. All illustrations are generated SVG or canvas. Seed products use attractive themed SVG placeholders.

Responsive and mobile-first:
- Primary target 360 to 414 px Indian phones. Also check 375, 390, 414, 768, 1024, 1280, 1440, 1920.
- Prevent horizontal overflow, clipped text, overlapping sticky layers, unreadable tables and oversized animations. Mobile is designed, not a shrunken desktop.
- Mobile has: compact header, bottom navigation (Home, Categories, Search, Enquiry, Contact), sticky enquiry bar, mobile filter drawer, swipe gallery, large touch targets (44 px minimum). The floating WhatsApp button must never overlap the enquiry bar or bottom navigation.
- Accessibility: semantic HTML, visible focus, keyboard-operable carousels, modals, steppers and command palette, ARIA labels, screen-reader-friendly forms, WCAG AA.

# 6. PUBLIC SITE

Routes: `/` home, `/collections/[slug]`, `/products/[slug]`, `/combos`, `/price-list`, `/enquiry`, `/enquiry/success/[number]`, `/enquiry/summary/[number]`, `/track-enquiry`, `/about`, `/contact`, `/faq`, `/safety`, legal pages, custom 404 and 500, maintenance page.

**Global shell:** announcement bar (admin fields: enabled, text, CTA, start, end, priority; never render an empty bar), sticky header (logo, Home, Collections, Price List, About, FAQ, Contact, search, enquiry counter, WhatsApp, Call), trust strip (only configured, non-empty items), footer with compliance notice and licence number only if configured, floating WhatsApp, back to top.

**Home sections (each can be toggled and ordered in Admin):** announcement, hero (headline, supporting line, primary and secondary CTA, countdown that disappears when disabled, expired or invalid), trust strip, location selector, featured categories, best sellers, new arrivals, premium collection, combo packs, quick price browsing, "Build your enquiry" CTA, how it works (Browse, Add, Send Enquiry, We confirm by WhatsApp or call), why choose us, testimonials (**hidden if no active testimonials**), FAQ, contact, compliance notice.

**Price list (the core page):**
- Two views, remembered per user: **Cards** and **Quick Order Table** (columns: image, product, SKU, pack, unit, MRP if enabled, enquiry price, availability, quantity stepper, add). On small screens the table either scrolls horizontally with a sticky first column or transforms into compact rows. It must stay usable.
- Category rail (desktop) and chips (mobile). Keep the DOM small with virtualization or "Load more".
- Sticky summary bar: item count, subtotal, minimum-order progress and message, "Review Enquiry".
- **Search:** command palette (`Ctrl+K`, and `/` when not typing in a field), dedicated mobile search UI. Backend uses PostgreSQL `ILIKE` plus `pg_trgm` similarity over name, SKU, category and tags for typo tolerance. Debounce 200 ms. Highlights matches.
- **Filters:** category, price range, availability, featured, new, bestseller, premium, discount, pack size. Filter options are derived from existing data, not hard-coded.
- **Sorting:** Featured, Popular, Newest, Price low to high, Price high to low, Highest discount.
- All state lives in the URL (`?q=&category=&sort=&min=&max=...`). Refresh, back and forward must work.

**Product card:** image, name, SKU, pack and unit, MRP (if enabled), enquiry price, discount, availability, badge, quantity stepper, Add to Enquiry, Quick View. Clear hierarchy, not crowded.

**Product page:** gallery with zoom and swipe, name, SKU, category, pack, unit, pricing, availability, description, specifications, important notes, quantity, Add to Enquiry, WhatsApp enquiry, Call, related products, similar products, FAQ, breadcrumbs.

**Combo packs:** first-class entities (name, slug, description, image, original value, combo enquiry price, included items with quantities, availability, featured, sort order). Adding a combo to the enquiry adds **one line** and stores a **snapshot** of the contents. Rule: a combo is unavailable if any included product is `OUT_OF_STOCK` or `UNAVAILABLE`, unless the admin sets an override.

**Enquiry drawer and page:**
- Drawer shows item count, subtotal, minimum, progress ("₹3,420 / ₹5,000, ₹1,580 more needed" and a check mark when reached), and "Review Enquiry".
- Page shows items (image, name, SKU, quantity, current price, line total, remove), summary (subtotal, applicable minimum, shipping message, eligibility), the customer form, and the status label "Ready to Send Enquiry". It never says "Order Confirmed".
- Customer form: full name, mobile, WhatsApp (optional, "same as mobile" checkbox), email (optional), state, city (free text), pincode, delivery area or address, preferred contact (WhatsApp or Call), notes, 18+ consent, honeypot. Collect nothing else. Shared Zod schema on client and server.
- Zustand persists **only** cart lines, quantities and the chosen state. Never persist personal details in `localStorage`. Render the persisted cart only after mount to avoid hydration errors.

**Success page:** enquiry number, summary, "Confirm on WhatsApp" button, "Print Summary" (print-optimised page titled **ENQUIRY / ESTIMATE**, with no wording that implies a confirmed order). Access to success and summary pages requires a short-lived **signed token** in the URL, so enquiries cannot be opened by guessing a number.

**Track enquiry (P0):** customer enters enquiry number and mobile. Strict rate limiting (per IP and per enquiry number), attempt limits, one generic failure message ("No enquiry found for these details"). On success, issue a short-lived signed token and show only safe data: customer-facing status, items, totals, and timeline entries marked visible to the customer. **Internal notes are never shown.** (OTP verification is P1.)

# 7. BUSINESS RULE ENGINE (single source of truth)

Create **one** server module (for example `lib/rules/enquiryRules.ts`) that owns: minimum enquiry value, location eligibility, product and combo availability, shipping message, cutoff dates and enquiry eligibility. The frontend only displays its results. The backend **recomputes everything** at submission. The database is authoritative. No business number or message may be hard-coded in UI logic (no `if (total >= 500000)`).

- **Location:** state comes from a seeded `State` table (28 states and 8 union territories, `isActive`). City is free text (2 to 60 characters, trimmed). Pincode is 6 digits, must not start with 0, and is checked against `RestrictedPincode` (admin-managed, with optional reason).
- **DeliveryRule** (admin-managed): name, applicable states (or "all other states"), `isDeliverable`, `minOrderPaise`, `shippingMode` (`FREE_ABOVE_THRESHOLD`, `CONFIRMED_OFFLINE`, `PICKUP_ONLY`, `NOT_DELIVERABLE`), optional `freeShippingThresholdPaise`, admin-editable message text, optional `cutoffAt`, priority, active flag. **Resolution:** a state-specific rule beats the default rule; ties break by priority.
- **Seed demo values (clearly labelled DEMO, editable):** Tamil Nadu and Puducherry minimum ₹3,000; all other states ₹5,000; free-shipping threshold ₹10,000 on the default rule only as demo data.
- **Minimum-order basis:** subtotal = sum of (current enquiry price × quantity) for products and combo prices for combos, **before** any admin extra discount and **before** shipping. State this basis in the UI help text.
- **Stock is informational.** Availability is `IN_STOCK`, `LIMITED`, `OUT_OF_STOCK` or `UNAVAILABLE` (optional quantity and low-stock threshold). An enquiry never decrements stock; only admins change it. `LIMITED` can be added with a note; `OUT_OF_STOCK` and `UNAVAILABLE` cannot be added or submitted.
- **Money:** all money is **integer paise** in the database and in code. Never floating point. Format with `Intl.NumberFormat('en-IN')` and `₹`. Validate non-negative prices, bounded discounts, integer quantities (1 to 9,999 per line, at most 200 lines).
- **Timezone:** store all timestamps in UTC; do all display, countdown editing, "today" boundaries and cutoffs in `Asia/Kolkata`.
- **Settings:** typed key-value `Setting` table (key, value JSON, type, updatedAt, updatedById). A single registry in code maps each key to a Zod schema and a default. Reading validates; an invalid stored value falls back to the default and logs an error. Never blindly `JSON.parse`.

# 8. ENQUIRY SUBMISSION PIPELINE (most critical logic)

Public submission is `POST /api/enquiries` (a Route Handler, easy to rate limit and test). Never trust the client for price, discount, stock, minimum order, state rule or product name.

Server steps:
1. Check `enquiriesOpen` and maintenance mode. Rate limit (default 5 per hour per IP) and check honeypot. Optional Turnstile if its keys are configured; the flow must work when Turnstile is disabled.
2. Validate the payload with Zod and the **idempotency key** (client UUID in a header). Compute a SHA-256 hash of the normalised payload.
3. Fetch **fresh** products and combos from the database (never from a cache), resolve the delivery rule and restricted pincode, and recompute every line and the subtotal.
4. Detect conflicts and return structured results, creating nothing:
   - `PRICE_CHANGED` with the updated items. Message: "Some prices were updated. Please review your enquiry before submitting again." The customer must confirm and retry.
   - `ITEM_UNAVAILABLE` naming each affected item.
   - `BELOW_MINIMUM` with the shortfall in paise.
   - `LOCATION_RESTRICTED`, `ENQUIRIES_CLOSED`, `RATE_LIMITED`, `VALIDATION_ERROR`.
5. In **one database transaction**: take the next number from the `Counter` table with an atomic increment (format `PREFIX-YY-XXXXXX`, prefix from Settings, year in IST), create the enquiry, create items with full **snapshots**, store the delivery-rule snapshot, store an immutable `originalSnapshot` JSON of the whole submission, write the first status-history row, and create `OutboxEvent` rows. All of it commits or rolls back together, so numbers have no gaps.
6. **Idempotency under concurrency:** a unique constraint on the idempotency key. On a unique-violation, load and return the original enquiry. Same key with a **different** payload hash returns `IDEMPOTENCY_MISMATCH`. The client generates a fresh key after any cart or form change that follows a failed attempt, and reuses the same key for a plain retry after a network failure.
7. Return the authoritative result and a signed token for the success page. The client clears the cart **only after** a success response.

**Snapshots (per item):** productId or comboId, name, SKU, unit, pack, price, MRP, discount, quantity, line total, plus combo contents. **Per enquiry:** state, city, pincode, minimum at submission, shipping rule, eligibility. Historical enquiries must never change when catalogue data or rules change.

**WhatsApp:** admin-configurable number in Settings. Use a `wa.me` link built by a pure, tested function: business name, enquiry ID, customer name, location, first N items with quantities and "+ X more items", total, and a confirmation request. Keep the encoded URL within a safe length (target 1,500 characters or less); beyond that, include a link to the signed summary page. WhatsApp failure or absence must never affect whether the enquiry succeeded. The enquiry is the source of truth.

**Outbox (notifications):** `OutboxEvent` fields: id, type (`NEW_ENQUIRY_ADMIN_EMAIL`, `CUSTOMER_EMAIL`), payload, status (`PENDING`, `PROCESSING`, `SENT`, `FAILED`, `DEAD`), attempts, nextAttemptAt, lastError, createdAt, processedAt.
- Process immediately after commit using Next's `after()` where available, and additionally through a secured route `/api/cron/outbox` (protected by `CRON_SECRET`) that claims rows safely (`FOR UPDATE SKIP LOCKED` or an atomic status update), uses exponential backoff, and moves rows to `DEAD` after 8 attempts.
- Do **not** build a long-running worker process, since serverless hosting will not run it. Provide `npm run outbox:run` for local use and document cron setup (including plan limits for cron frequency) in `DEPLOYMENT.md`.
- Admin has a "Notifications" screen listing failed and dead events with a **Retry** button. Notification failure never rolls back an enquiry. Email uses SMTP (Nodemailer) and is optional.

**Result contract:** every server function and handler returns `{ ok: true, data }` or `{ ok: false, code, message, details? }`. Never leak stack traces or database errors to the UI. Every user-facing failure has a proper state: loading, empty, no results, out of stock, location unavailable, minimum not reached, price changed, session expired, network error, server error.

# 9. ADMIN PANEL (`/admin`)

Same app, same database, same backend. Fully usable on a phone (tables collapse to cards below 768 px). Professional business tool, not dashboard filler: clarity, search, bulk workflows, status visibility.

**Auth and roles**
- Email and password login. The first admin is created by the seed script from `ADMIN_EMAIL` and `ADMIN_PASSWORD`; in production the seed fails if the password is missing or weak. Minimum password length 10. First login forces a password change. Never print passwords.
- Lock the account for 15 minutes after 5 failed attempts, plus an IP rate limit. Session 8 hours. Logout, change password, "log out everywhere" (token version).
- On **every request** the session is verified and the user is loaded from the database (`isActive`, `tokenVersion`, role), so deactivation takes effect immediately.
- Middleware protects `/admin/**`, **but middleware alone is never trusted.** Every server action and route handler goes through one helper, `withAdminAuth(permission, handler)`, that re-verifies the session and checks the permission on the server. Hiding buttons is not security.
- Roles: `SUPER_ADMIN` (everything) and `STAFF`. One `permissions.ts` matrix defines access. STAFF can handle enquiries and edit products' availability and ordinary fields; STAFF cannot access Settings, Users, Delivery Rules, bulk price update, CSV import, legal pages or the audit log.
- Admin pages are `noindex` and excluded from the sitemap.

**Dashboard (mobile-friendly):** enquiries today, this week, by status, enquiry value, "confirmed or later" share of enquiries (define it plainly on screen), top products by quantity, top categories, top states, out-of-stock and low-stock counts, recent activity, failed notifications count. Charts for 7 days, 30 days and a custom range using IST day boundaries. A sidebar badge for new enquiries that refreshes by polling every 30 seconds.

**Products:** table with search, filters, sort, server-side pagination, row selection. Create, edit, duplicate, archive (soft delete) and restore. Fields: SKU (unique), name, slug (unique, auto), category, short and long description, brand, pack size, unit, MRP, enquiry price (live discount shown), availability, optional stock quantity and low-stock threshold, flags (featured, bestseller, new arrival, premium), specifications (label and value rows), SEO fields, sort order. Multiple images with drag reorder, alt text, main image. Upload checks: allow-listed types, magic-byte sniffing, 5 MB limit, maximum dimensions, re-encode with `sharp` (strips EXIF), random file names. Quick toggles for availability and active in the table.
- **Bulk actions:** availability, active, category, archive.
- **Bulk price update:** percentage or fixed amount, increase or decrease, on selected products or a category. Shows a **preview of old and new prices** and requires confirmation. Rejects negative or absurd results, rounds to integer paise (option to round to the nearest ₹1), writes the audit log, invalidates caches.
- **CSV import and export:** downloadable template (rupees in the file, converted to paise in code). Flow: upload, parse, validate every row with Zod, **preview with row-level errors**, confirm, then import in one transaction (upsert by SKU). If any row is invalid, nothing is imported until fixed. Report successful rows, failed rows and reasons; downloadable error report.
- **Optimistic locking:** products and enquiries have a `version` field. If two admins edit the same record, the second save fails with a clear "changed by someone else, reload" message instead of silently overwriting.

**Categories:** create, edit, archive, drag-and-drop reorder, image, description, `colorFrom` and `colorTo` with live preview, SEO, visibility. Block archiving a category that still has products unless they are moved.

**Combos:** full CRUD, searchable product picker with quantities, live saving versus combo price. Block publishing if any included product is missing or archived.

**Enquiries:**
- Filters: status, state, date range, customer, assigned staff, value. Search by number, name or phone. Server pagination and CSV export.
- Detail: customer info with one-tap Call and WhatsApp, items, totals, assignment, internal notes (never public), transport name and LR number, printable estimate (ENQUIRY / ESTIMATE wording), full timeline.
- Statuses: `NEW`, `CONTACTED`, `QUOTE_SENT`, `AWAITING_CUSTOMER`, `CONFIRMED`, `READY`, `DISPATCHED`, `COMPLETED`, `CANCELLED`. Define the allowed transitions in code and enforce them on the server (generally forward only; `CANCELLED` from any status except `COMPLETED`; reopening needs `SUPER_ADMIN` and a reason). Customer-facing labels are editable in Settings.
- **Revisions:** the `originalSnapshot` is immutable. When staff edit items, quantities, extra discount or shipping amount, the server recalculates totals and creates an `EnquiryRevision` (revision number, who, when, **required reason**, before JSON, after JSON). The original submission is never overwritten.
- Never hard-delete enquiries from the admin UI; archive instead.

**Content (P0):** announcement, hero text, homepage section toggles and order (stored as a typed setting), banners with schedule and `DRAFT` or `PUBLISHED` status, testimonials, FAQs, About, Contact, legal pages (Markdown with preview), footer. Admin-only preview routes must never change live content. (Rich draft and preview workflows for every section are P1.)

**Settings (SUPER_ADMIN only):** business name, logo, favicon, phone, WhatsApp number, email, address, hours, licence number (optional), delivery rules and restricted pincodes, `enforceMinOrder`, shipping wording, price and GST note, enquiry number prefix, `showMrpAndDiscount`, countdown date and on/off (entered in IST), maintenance mode, enquiries open or closed, notification email, SMTP test button, social links, default SEO, analytics script slot (loads only if configured), default theme.

**Users and audit log (SUPER_ADMIN only):** create, deactivate and reset staff. The audit log records actor, action, entity, entityId, before, after and timestamp for: price changes, stock changes, minimum-order and delivery-rule changes, enquiry edits and status changes, user and permission changes, content publishing, settings changes. Searchable by user, entity and date.

# 10. DATA MODEL (Prisma, keep it lean)

Models: `AdminUser` (role enum, isActive, mustChangePassword, tokenVersion, failedLogins, lockedUntil, lastLoginAt), `Category`, `Product` (specifications stored as JSON), `ProductImage`, `Combo`, `ComboItem`, `State`, `DeliveryRule`, `RestrictedPincode`, `Enquiry`, `EnquiryItem`, `EnquiryStatusHistory` (with `visibleToCustomer`), `EnquiryNote` (internal), `EnquiryRevision`, `OutboxEvent`, `Setting`, `Banner`, `Faq`, `Testimonial` (with `isActive`), `Page`, `Counter`, `RateLimit` (key, windowStart, count), `AuditLog`.

Rules: foreign keys, unique constraints (SKU, slug, enquiry number, idempotency key), indexes on slug, SKU, status, createdAt, categoryId, soft deletes where useful, `version` fields for optimistic locking, money in integer paise, timestamps as UTC `timestamptz`. Do not create tables for roles, permissions, customers or collections; they are not needed.

# 11. INTEGRATION AND CACHING

- The database is the only source of truth for products, prices, stock, minimum orders, location rules, homepage content and enquiries. WhatsApp number and business details live in Settings (environment only for secrets).
- Public catalogue pages use server rendering or ISR with cached fetchers tagged `products`, `categories`, `combos`, `settings`, `banners`, `pages`. **Every admin mutation calls `revalidateTag` or `revalidatePath`** for what it changed.
- The enquiry transaction and its pre-checks **always read fresh data**, never cache.
- When an admin changes a price or a minimum-order rule: audit log, database update, cache invalidation, public site refresh, new enquiries use the new value, old enquiries keep their snapshots.
- Deleting or archiving a product must not break old enquiries (snapshots) or open carts (the cart shows "no longer available" and blocks submit until removed).
- Share Zod schemas and TypeScript types between public site, admin and API.

# 12. SECURITY

- Validate and sanitise every input with Zod on the server. Prisma parameterised queries only (raw SQL only for `pg_trgm` and row claiming, parameterised). Sanitise Markdown output.
- **Rate limiting must work on serverless:** a `RateLimiter` interface with a PostgreSQL-backed implementation (atomic upsert on `RateLimit`) by default and an optional Upstash adapter. Never use an in-memory limiter in production. Apply it to login, enquiry submission and tracking.
- Secure headers: a CSP that works with Next.js (nonce or hash based, with no practical violations), `X-Frame-Options`, `Referrer-Policy`, `X-Content-Type-Options`, HSTS in production.
- CSRF: server actions use Next's built-in origin checks; route handlers that use cookie auth require a same-origin `Origin` header and JSON content type, with `SameSite=Lax`.
- Generic error messages for login and tracking failures. Do not log phone numbers or addresses in plain text. Hash IPs before storing. Add a short privacy notice on the enquiry form describing what is stored.
- Secrets only in env. No secret in client bundles. Run `npm audit` and fix high-severity findings.

# 13. PERFORMANCE, SEO, ACCESSIBILITY

- Targets on mobile: Lighthouse Performance 90+, Accessibility 95+, SEO 100, Best Practices 95+. LCP under 2.5 s, CLS under 0.1. If a target is missed, state exactly why. Do not fabricate success.
- `next/image` with AVIF or WebP, responsive sizes, lazy loading below the fold, code splitting, dynamic import for the canvas, and no admin-only libraries in the public bundle.
- Metadata per page, canonical URLs, Open Graph, `robots.txt`, `sitemap.xml`, breadcrumbs, JSON-LD for Organization and LocalBusiness, FAQPage, BreadcrumbList. Add Product schema **without** a purchasable `offers` price claim unless valid; since the site does not sell online, use a conservative representation and say what you chose in the plan. Target keywords: "Sivakasi crackers price list" and "Diwali crackers enquiry".

# 14. TESTING AND QA (all must really run)

**Unit (Vitest):** money arithmetic and formatting, discount calculation, minimum-order and rule resolution (state-specific beats default), quantity validation, enquiry number format, status-transition rules, CSV row validation, WhatsApp message builder and truncation, IST date helpers.

**Integration (Vitest against real PostgreSQL in Docker):**
- 20 simultaneous enquiries with different keys produce 20 unique, gap-free numbers.
- 10 simultaneous submissions with the **same** idempotency key produce exactly one enquiry and identical responses.
- Same key with a different payload returns `IDEMPOTENCY_MISMATCH`.
- Two admins editing the same product: the second gets a version conflict. No corrupted totals, no lost audit rows.
- Price changed between add and submit returns `PRICE_CHANGED` and creates nothing. Item becomes unavailable returns `ITEM_UNAVAILABLE`. Old enquiries are unchanged after price or rule changes.
- Outbox: a failing email retries with backoff, lands in `DEAD` after the limit, and never affects the enquiry.

**End-to-end (Playwright):** catalogue, search, filters with URL state and refresh, product page, add to enquiry, state change after adding items, below-minimum blocked and at-minimum allowed, successful submission, double-click submit, network failure then retry, success page token protection, track enquiry (including rate limit and generic failure), WhatsApp link generation and fallback, admin login and lockout, RBAC (STAFF cannot open Settings or call restricted actions directly), product and category CRUD, CSV import with a bad row, bulk price preview and apply, enquiry status flow and revision, settings change propagating to the public site without redeploy, audit log entries, enquiries-closed and maintenance modes.

**Browser QA:** inspect every critical page at 375, 768 and 1440 px for spacing, overflow, sticky overlap, CTA visibility, image quality, table usability, loading, empty and error states, in both themes. Zero unexpected console errors, zero unhandled promise rejections, zero failed critical network requests, no hydration warnings, no broken images or links.

**Gate commands (all must pass, with real output reported):** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, `npm run build`.

# 15. SEED DATA, DOCS, ENVIRONMENT

- Seed script: first admin from env, default Settings, 36 `State` rows, demo delivery rules (labelled DEMO), 12 categories with gradients (One Sound Crackers, Sparklers, Flower Pots, Ground Spinners, Fountains, Rockets, Multi-shot and Night Shots, Fancy and Novelty, Twinkling Star and Pencil, Garlands, Gift Boxes, Kids Special), at least 80 realistic products with generic names and SVG placeholder images, about 8 combos, FAQs, and sample testimonials stored as **inactive** and labelled "Sample, replace before publishing".
- `README.md` (overview, architecture, setup, database, environment, seed, development, testing), `DEPLOYMENT.md` (production build, env, migrations, Vercel plus Neon or Supabase plus Cloudinary, cron for the outbox, domain, security, backup and restore), `ADMIN_GUIDE.md` for a non-technical owner (add a product, change prices in bulk, import CSV, change stock, change minimum order, manage an enquiry, change WhatsApp, change homepage, publish content, manage staff, update the countdown date).
- `.env.example` documents every variable. `docker-compose.yml` for local PostgreSQL. The project must run locally with no cloud dependency except optional integrations.

# 16. PHASES (verify and commit after each)

1. **Foundation:** setup, Tailwind tokens, fonts, Prisma schema and migrations, seed, env handling, lint, tests and Docker tooling, settings registry.
2. **Design system and global UI:** tokens, themes, core components, fireworks canvas, header, footer, announcement bar, mobile navigation.
3. **Catalogue:** home, price list (both views), collections, product page, combos, search, filters, URL state.
4. **Enquiry engine:** cart store, drawer and page, rule engine, submission pipeline, idempotency, counter, snapshots, outbox, success, summary, print, WhatsApp, track.
5. **Admin auth and dashboard:** login, lockout, roles, `withAdminAuth`, layout, dashboard.
6. **Admin catalogue:** products, images, categories, combos, bulk actions, bulk price update, CSV, optimistic locking.
7. **Admin enquiries, content and settings:** enquiry list and detail, status flow, revisions, notes, content, banners, settings, delivery rules, users, audit log, notifications screen.
8. **Integration, security, SEO, performance:** cache revalidation, headers, rate limits, CSP, sitemap, JSON-LD, accessibility and performance passes.
9. **Full QA:** write and run every test in section 14, fix all findings, visual pass at three widths in both themes.
10. **Final production audit:** self-audit of architecture, database, auth, RBAC, security, catalogue, search, filters, combos, enquiry, rule engine, price validation, idempotency, snapshots, tracking, WhatsApp, admin, content, audit, SEO, accessibility, performance, mobile, desktop, error states and tests. Then P1 items only if everything else passes and I approve.

# 17. DEFINITION OF DONE AND FINAL RESPONSE

Complete only when: public site and admin work against a persistent database; auth and RBAC work and are enforced on the server; real CRUD works; enquiry submission, duplicate protection, price and stock validation, the rule engine and historical snapshots work; WhatsApp works or falls back gracefully; admin changes appear on the public site within seconds; all gate commands pass; no critical console errors; no broken links; no exposed secrets; documentation is complete.

Final response format:
- **What was built** (concise).
- **Run locally** (three primary commands where practical).
- **Admin login** (how the first admin is created; never print a password).
- **Test results** (real numbers for unit, integration, e2e, build, lint, typecheck, responsive QA).
- **Known limitations** (only real ones; never claim an untested feature works).
- **Next improvements** (maximum five).

Optimise for CORRECT, SECURE, MAINTAINABLE, FAST, RESPONSIVE, TESTED and REAL. Not for "looks finished".
