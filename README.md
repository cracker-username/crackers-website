# Festive Crackers Enquiry Platform

An enquiry-first festive fireworks catalogue and quotation platform for Sivakasi cracker merchants. Built with **Next.js 15 (App Router)**, **TypeScript Strict**, **Tailwind CSS**, **Prisma ORM**, and **PostgreSQL**.

---

## 🌟 Key Features

### 1. Enquiry-First Model (Zero Online Payment / Compliant Architecture)
- **Legal Compliance**: Compliant with Indian fireworks regulations. No online payments, no automated order commitments, and no consumer checkout.
- **Microcopy Discipline**: Strictly uses *Add to Enquiry*, *Review Enquiry*, *Send Enquiry*, *Track Enquiry*, *Call Us*, *WhatsApp Us*.
- **18+ Statutory Gate**: Browser-remembered statutory 18+ modal and mandatory consent verification on enquiry submission.
- **Two Enquiry Submission Workflows**:
  - Direct WhatsApp Enquiry (pre-filled message with product details and estimate).
  - Web Enquiry Submission with atomic sequential ID generation (`CE-26-XXXXXX`).

### 2. Public Experience & "Festival Night Sky" Design
- **Signature UI Interactions**:
  - Native HTML5 `<canvas>` festive fireworks hero bursts (dynamic DPR, throttled, pauses offscreen / tab blur).
  - Add-to-Enquiry spark bursts, animated counter, and marquee announcement bar.
  - Dark mode default with persistent light mode option.
  - Category-driven dynamic gradient theming (`colorFrom` & `colorTo`).
- **Flexible Catalogue Exploration**:
  - Synchronized Card Grid view and fast Quick-Order Table view.
  - Real-time client & server filtering by category, sound level, price range, and search.
- **Transparent Estimations**:
  - Regional minimum-order progress bar and shipping thresholds.
  - Printable estimate documents (`@media print` formatted).
  - Secure 7-stage order status tracking by enquiry reference and mobile number.

### 3. Back-Office Operations Portal
- **Operations Dashboard**:
  - Live IST day-boundary metrics: Enquiries Today, Pipeline Value, Conversion Share, 7-Day Performance Trend chart, and Inventory Health alerts.
- **Enquiry Lifecycle Management**:
  - Complete state machine: `NEW` ➔ `CONTACTED` ➔ `QUOTE_SENT` ➔ `CONFIRMED` ➔ `READY` ➔ `DISPATCHED` ➔ `COMPLETED` (or `CANCELLED`).
  - Immutable customer submission snapshot with versioned audit trail for staff item revisions.
  - Transporter name and Lorry Receipt (LR) tracking dispatch modal.
- **Catalogue & Pricing Management**:
  - Optimistic locking via integer `version` field preventing stale overwrites.
  - Bulk actions, CSV price-list import/export with schema normalization, and category gradient editors.
- **Content & Configuration**:
  - Content Management System (Banners, FAQs, Testimonials, Home Sections, Legal Markdown pages).
  - Regional delivery rules management and restricted pincodes manager.
  - Staff user management with Role-Based Access Control (`SUPER_ADMIN` vs `STAFF`).
  - Comprehensive immutable Audit Log and background Notification Outbox inspector.

---

## 🛠 Tech Stack

- **Framework**: Next.js 15+ (App Router, Server Components & Server Actions)
- **Language**: TypeScript Strict (`noImplicitAny`, zero `any` in business logic)
- **Database**: PostgreSQL 15+ (UTF-8 encoding with `pg_trgm` extension)
- **ORM**: Prisma Client v6+
- **Styling**: Tailwind CSS with CSS Variables tokens, Lucide Icons, Framer Motion
- **State & Forms**: Zustand (with localStorage persistence), React Hook Form, Zod
- **Authentication**: `jose` signed JWT in `httpOnly` cookies, `bcryptjs` (cost 12), token version revocation
- **Testing**: Vitest (real PostgreSQL integration tests), Playwright (multi-viewport E2E testing)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `20.x` LTS or `22.x`
- PostgreSQL `15+` running locally or via Docker
- npm `10+`

### 2. Installation
```bash
git clone <repo-url>
cd cracker-website
npm install
```

### 3. Environment Setup
Copy the template configuration:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL`, `JWT_SECRET`, and `URL_SIGNING_SECRET` are configured.

### 4. Database Setup & Seeding
```bash
# Push schema migrations to PostgreSQL
npx prisma migrate deploy

# Seed admin user, Indian states, categories, and initial products
npx prisma db seed
```

Default administrator credentials:
- **Email**: `admin@crackers.local`
- **Password**: `ChangeMeImmediately123!`

### 5. Running Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the public site or [http://localhost:3000/admin](http://localhost:3000/admin) for the admin portal.

---

## 🧪 Testing

```bash
# Unit & real PostgreSQL integration tests (Vitest)
npm run test

# TypeScript typechecking
npm run typecheck

# Code linting
npm run lint

# End-to-End browser tests (Playwright)
npx playwright test
```

---

## 📖 Documentation
- [Project Specification](file:///docs/PROJECT_SPEC.md)
- [Build Progress & Architecture Log](file:///docs/PROGRESS.md)
- [Production Deployment Guide](file:///docs/DEPLOYMENT.md)
