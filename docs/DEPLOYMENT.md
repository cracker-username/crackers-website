# Production Deployment & Operations Guide

This guide details the steps required to deploy, configure, and maintain the **Festive Fireworks Enquiry Platform** in production environments.

---

## 1. Architecture Overview

- **Framework**: Next.js 15+ (App Router, React Server Components)
- **Language**: TypeScript Strict (`noImplicitAny`, zero `any` in business logic)
- **Database**: PostgreSQL 15+ with `pg_trgm` extension (UTF-8 encoding required for INR `₹` currency symbols)
- **ORM**: Prisma Client v6+ with schema migrations
- **Authentication**: `jose` signed JWT in `httpOnly`, `Secure`, `SameSite=Lax` cookies; `bcryptjs` password hashing (cost 12); token-version revocation
- **Security**: Content-Security-Policy (CSP), CSRF origin verification on state-mutating admin requests, `X-Robots-Tag: noindex, nofollow` on admin routes, atomic PostgreSQL-backed IP rate limiting
- **Storage**: `StorageProvider` interface with Local Disk driver (development) and Cloudinary driver (production)
- **Email / Outbox**: Asynchronous transactional outbox pattern processed via cron endpoint (`/api/cron/outbox`)

---

## 2. Prerequisites

- **Node.js**: `v20.x` LTS or `v22.x`
- **npm**: `v10.x` or higher
- **PostgreSQL**: `v15` or `v16` (hosted via AWS RDS, Supabase, Neon, or self-hosted Docker)
- **Reverse Proxy**: Nginx, Cloudflare, or AWS ALB handling SSL/TLS termination

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env` on your production server.

```bash
cp .env.example .env
```

Ensure all variables are configured:

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Client Safe | Full canonical domain (e.g., `https://www.festivecrackers.com`) |
| `NEXT_PUBLIC_BRAND_NAME` | Client Safe | Default brand title displayed before database load |
| `NEXT_PUBLIC_DEFAULT_WHATSAPP` | Client Safe | 10-digit WhatsApp phone without spaces or symbols (e.g. `919876543210`) |
| `NEXT_PUBLIC_DEFAULT_PHONE` | Client Safe | Display phone string for customer service |
| `DATABASE_URL` | Server Only | PostgreSQL connection pool URL with `schema=public` |
| `DIRECT_URL` | Server Only | Direct connection string for Prisma migrations (bypassing PgBouncer) |
| `JWT_SECRET` | Server Only | Cryptographically random 32+ character string for admin JWT auth |
| `URL_SIGNING_SECRET` | Server Only | Random 32+ character string for HMAC signing enquiry success URLs |
| `CRON_SECRET` | Server Only | Bearer token for triggering `/api/cron/outbox` |
| `ADMIN_EMAIL` | Server Only | Initial administrator email for database seeding |
| `ADMIN_PASSWORD` | Server Only | Initial administrator password (minimum 10 characters) |
| `STORAGE_DRIVER` | Server Only | Set to `cloudinary` for persistent cloud media storage |
| `CLOUDINARY_CLOUD_NAME` | Server Only | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Server Only | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Server Only | Cloudinary API secret |
| `SMTP_HOST` | Server Only | Outbox SMTP server host |
| `SMTP_PORT` | Server Only | SMTP port (typically `587` or `465`) |
| `SMTP_USER` | Server Only | SMTP authentication username |
| `SMTP_PASSWORD` | Server Only | SMTP authentication password |

---

## 4. Database Setup & Initialization

### A. PostgreSQL UTF-8 & Extension Setup
Ensure your PostgreSQL database is created with UTF-8 encoding:

```sql
CREATE DATABASE crackers_db WITH ENCODING 'UTF8';
```

The database user must have permission to create the `pg_trgm` extension:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### B. Run Migrations
Execute Prisma schema migrations to set up tables, indexes, and triggers:

```bash
npx prisma migrate deploy
```

### C. Seed Initial Data
Seed initial admin user, Indian states (36 states/UTs), default regional delivery rules, settings, categories, and initial products:

```bash
npx prisma db seed
```

> **Note**: On first sign-in with the seeded `admin@crackers.local` credentials, the application requires an immediate password change.

---

## 5. Building & Starting the Application

### A. Build the Next.js Production Bundle
```bash
npm run build
```

This will run type checks, Prisma client generation, and compile all static and server-rendered routes into `.next`.

### B. Run with Node.js / Process Manager (PM2)
```bash
# Using PM2
pm2 start npm --name "crackers-platform" -- start

# Or directly with npm
npm run start
```

### C. Docker Deployment (Optional)
If deploying via Docker, ensure `docker-compose.yml` or container definitions mount persistent storage or configure Cloudinary for media uploads.

---

## 6. Background Outbox Worker (Cron Setup)

The platform uses an asynchronous transactional outbox to deliver notifications (customer enquiry confirmation, staff WhatsApp alerts, and dispatch updates) without blocking customer requests.

Configure a system cron or external scheduler (e.g. AWS EventBridge, Vercel Cron, GitHub Actions) to hit `/api/cron/outbox` every 1 to 5 minutes:

```bash
# Example cron entry: runs every 2 minutes
*/2 * * * * curl -X POST https://yourdomain.com/api/cron/outbox \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" > /dev/null 2>&1
```

---

## 7. Operational & Legal Guardrails

1. **Strict Enquiry-Only Model**:
   - The platform strictly does **not** process online payments or checkout.
   - Microcopy is strictly: *Add to Enquiry*, *Review Enquiry*, *Send Enquiry*, *Track Enquiry*, *Call Us*, *WhatsApp Us*.
   - Never introduce "Buy Now" or "Order Confirmed" terminology.
2. **Statutory 18+ Verification**:
   - Customer age verification modal persists per browser (`localStorage.getItem("age_verified_18")`).
   - The enquiry form includes a mandatory 18+ legal consent checkbox.
3. **Integer Paise Financial Precision**:
   - All product prices, delivery minimums, shipping fees, and estimates are stored in integer paise (`₹1 = 100 paise`).
4. **Optimistic Locking**:
   - Critical models (`Product`, `Enquiry`) use an integer `version` field. Stale updates return HTTP 409 Conflict.
5. **Auditing**:
   - Every administrative mutation (pricing change, status update, user creation) is logged in the `AuditLog` table with actor ID and client IP.

---

## 8. Verification & Health Checks

Run the automated verification suite before promoting to production:

```bash
# 1. Typecheck
npm run typecheck

# 2. Linting
npm run lint

# 3. Unit and integration tests (against real PostgreSQL)
npm run test

# 4. Playwright End-to-End Suite
npx playwright test
```
