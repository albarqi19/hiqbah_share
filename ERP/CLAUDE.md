# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Next.js Version Warning

This project runs **Next.js 16.2.4** — a version with breaking changes from training data. Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Route handler signatures, cache APIs, and params handling differ from what you may expect.

Notable differences already in use:
- `params` in dynamic route handlers is a `Promise`: `const { id } = await params`
- `cookies()` from `next/headers` is async: `const cookieStore = await cookies()`
- Tailwind CSS v4 uses `@import "tailwindcss"` and `@theme inline {}` — no `tailwind.config.js`

---

## Commands

```bash
npm run dev          # start dev server (webpack mode, not turbopack)
npm run build        # prisma generate + migrate deploy + next build
npx tsc --noEmit     # type check without emitting
npm run lint         # eslint
npm run seed         # seed the database (prisma/seed.ts)
npx prisma studio    # open Prisma Studio GUI
```

The `build` script always runs `prisma migrate deploy` against the configured `DATABASE_URL`. Do not run `npm run build` if you want to avoid touching the database.

There are no automated tests in this project.

---

## Environment

- `DATABASE_URL` — Neon PostgreSQL pooler connection string (required)
- `JWT_SECRET` — minimum 32 chars; startup throws if missing, too short, or a known weak value
- `RATE_LIMIT_SECRET` — used for hashing rate limit keys
- `TRANSLATION_API_KEY` — optional; powers the auto-translate feature in forms

Two Neon branches exist: **demo** (`ep-dawn-dust-aqn1u1uf`) and **production** (`ep-icy-field-aq4upc3z`). The `.env` file should only ever contain the demo endpoint. The production endpoint must never be added.

---

## Architecture

### Stack
Next.js 16 App Router · TypeScript · Prisma 7 (PostgreSQL via `@prisma/adapter-pg`) · Tailwind CSS v4 · JWT auth (httpOnly cookie `token`, 8-hour expiry) · Recharts · jsPDF + ExcelJS for exports

### Directory layout (non-obvious parts)
```
src/
  app/
    api/              # Route handlers — one file per resource
    dashboard/        # All authenticated pages (Client Components)
    login/            # PIN pad + password login
    guest-qc/         # Unauthenticated QC submission page
    guest-cupping/    # Unauthenticated cupping score page
  lib/
    auth.ts           # JWT sign/verify + re-exports auth-shared
    auth-shared.ts    # Permission helpers (hasModuleAccess, hasSubPrivilege, buildDefaultPermissions)
    auth-server.ts    # Server-side guards (requireAuth, requireModule, requireEdit, requireSub, requireAnyModule)
    db.ts             # Prisma client singleton (auto-selects pg adapter vs libsql for local dev)
    export.ts         # Synchronous PDF/Excel/DOCX generation
    services/
      order-fulfillment.ts    # recalcOrderItemStatus — called inside $transaction on writes
      production-planning.ts  # recalcProductionOrderStatus — same pattern
  components/         # Only two shared components exist here; most UI is co-located in pages
  generated/prisma/   # Prisma generated client — never edit manually
```

### Authentication & Permissions

Every authenticated API call goes through `getUserWithPermissions()` in `auth-server.ts`, which:
1. Reads the `token` cookie
2. Verifies the JWT (contains `id`, `name`, `role`, `preferredLanguage`)
3. Fetches the live `permissions` JSON from the `Employee` DB record
4. Falls back to `buildDefaultPermissions(role)` if the stored JSON is empty

**Built-in role defaults** (from `buildDefaultPermissions` in `auth-shared.ts`):
- `admin` → all modules, all sub-privileges, edit access
- `inventory` → dashboard + inventory edit
- `roasting` → dashboard/production/packaging/cupping edit; inventory/orders view
- `qc` → dashboard/qc/cupping edit
- `dispatch` → dashboard/dispatch/labels edit; orders view
- `custom` → all none (permissions live entirely in DB)

**Guard hierarchy** (use in this order in route handlers):
```typescript
requireAuth()                        // 401 if no valid session
requireModule("moduleName")          // 403 if access === "none"
requireEdit("moduleName")            // 403 if access !== "edit"
requireSub("moduleName", "subKey")   // 403 if sub[subKey] !== true
requireAnyModule("a", "b", "c")      // 403 if none of the listed modules are accessible
```

Guards call `getUserWithPermissions()` internally — never call it separately before calling a guard.

### API Route Patterns

All route handlers follow this structure:
1. Permission guard at top (before `request.json()`)
2. Parse and validate body
3. Business logic (often inside `prisma.$transaction`)
4. Return `NextResponse.json()`

Error handling uses `handlePrismaError(err)` from `src/lib/api-error.ts` for Prisma errors. App-level errors thrown inside transactions use `{ _appCode: number, message: string }` shape and are caught by the outer try/catch.

Atomic write pattern used throughout — example from deliveries:
```typescript
const updated = await tx.model.updateMany({
  where: { id, fieldToCheck: { gte: value } },  // condition evaluated at write time
  data: { field: { decrement: value } },
});
if (updated.count === 0) throw { _appCode: 409, message: "..." };
```

### Inventory Ledger

Every stock-changing operation creates an `InventoryMovement` record inside the same `$transaction` as the operational write. The ledger is append-only — never update or delete movements. Categories: `RAW_MATERIAL` (green beans) and `FINISHED_GOODS` (packaged lots).

### Finished Goods Lots (FGL)

One `FinishedGoodsLot` per `RoastingBatch` (enforced by `@@unique([roastingBatchId])`). Created on first packaging, updated (not re-created) on subsequent packaging runs via `upsert`. The `Delivery` model has no FK to `FinishedGoodsLot` — linkage is through `InventoryMovement.referenceEntityId` (plain string, not a FK).

### Batch Status Machine

Transitions are enforced by `isValidTransition` in `src/lib/batch-transitions.ts`:
```
Pending QC → Passed | Rejected | Blended
Passed     → Partially Packaged | Packaged | Blended
Partially Packaged → Partially Packaged | Packaged
Packaged / Rejected / Blended → (terminal, no transitions)
```

### Styling

Tailwind CSS v4 with CSS custom properties as the token layer. All brand colors are defined as CSS variables in `src/app/globals.css` `:root` and exposed to Tailwind via `@theme inline {}`. The current theme is purple/white/neutral. To change a color system-wide, update the variable in `:root` — it cascades automatically to all `bg-orange`, `text-brown`, etc. classes.

Hardcoded hex values (bypassing the token system) exist only in: chart color constants in `dashboard/page.tsx`, inline `style={{}}` props in `layout.tsx` and `login/page.tsx`, and Recharts `stroke`/`fill` props in cupping pages.

### i18n

Arabic/English support via a custom context in `src/lib/i18n/`. Language is stored on the `Employee` record and read from the JWT. The `useI18n()` hook provides a `t(key)` function. Translation keys are typed in `src/lib/i18n/translations.ts`. Direction (`rtl`/`ltr`) is set at the `<html>` level in `src/app/layout.tsx`.

### Export

`src/lib/export.ts` generates PDF (jsPDF + jspdf-autotable) and Excel (ExcelJS) files **synchronously in the HTTP request path**. Arabic text requires reshaping via `arabic-reshaper` + `bidi-js` before rendering. Both `xlsx` and `exceljs` are installed; only `exceljs` is used in export.ts.

---

## Known Architectural Constraints

- **No caching layer** — every API call hits the database. The analytics endpoint (`/api/analytics`) runs 13 parallel queries on every dashboard render.
- **No job queue** — exports, future invoice generation, and any email sending must happen synchronously in the request.
- **Indexes missing** — only auth tables (`LoginAttempt`, `RateLimit`) and `RoastingBatch([greenBeanId, createdAt])` have explicit `@@index` declarations. Columns like `RoastingBatch.status`, `OrderItem.productionStatus`, `InventoryMovement.timestamp` are unindexed.
- **Unbounded queries** — several GET endpoints (`/api/purchases`, `/api/customers`, `/api/green-beans`, `/api/finished-goods-lots`, `/api/dashboard/predictions`) have no `take:` limit.
- **Connection pool** — `src/lib/db.ts` creates a `pg.Pool` with no explicit `max` or timeout. Default is 10 connections.
