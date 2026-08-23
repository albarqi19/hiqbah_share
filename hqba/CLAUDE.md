# HQBA - Coffee Roastery Management System

## Project Overview
ERP system for Hiqbah coffee roastery. Full Bean-to-Cup traceability.
Central entity: **Crop (S/N)** — everything traces back to it.
Branch = internal customer of roastery (Inter-Location Transfer model).

## Architecture
- **Backend:** Laravel 12 API (Modular Monolith)
- **Frontend:** React 19 SPA + TypeScript + PWA
- **Database:** PostgreSQL 16
- **Pattern:** Laravel API + React SPA (NOT Inertia.js)

## Modular Structure (Backend)
```
app/Core/          → Users, Branches, Equipment, Settings (shared)
app/Modules/
  Procurement/     → Suppliers, PurchaseOrders
  Crops/           → Crop lifecycle (receiving → cupping → pricing → marketing)
  Recipes/         → Espresso & Pour-Over recipes
  Production/      → RoastBatches, QC, Packaging
  Orders/          → Customers, Orders (11-stage workflow)
  Inventory/       → Stock, Movements, Transfers, Audits
  Branch/          → Calibration, Cleaning
  Quality/         → WasteRecords, Complaints
  Reporting/       → Dashboards, Reports (read-only, no models)
```
Inter-module communication: **Events & Listeners** (see EVENT_MAP in PROJECT_PLAN.md §2.5)

## Key Tech Stack
Backend: Sanctum, Spatie Permission, Spatie Query Builder, Spatie Media Library, Spatie Activity Log, Maatwebsite Excel, DomPDF, bacon-qr-code, Laravel Boost
Frontend: Tailwind CSS 4, Shadcn/UI, Tremor (dashboards), ReactFlow (crop journey), Recharts, Zustand, React Hook Form + Zod, react-i18next

## Common Commands
```bash
# Backend
cd backend && php artisan serve
php artisan migrate
php artisan db:seed
php artisan test
php artisan route:list --json
php artisan queue:work

# Frontend
cd frontend && npm run dev
npm run build
npm run test
npm run lint
```

## Code Conventions
- API routes: `/api/v1/{module}/{resource}`
- Each module has its own `routes.php` loaded from `routes/api.php`
- Models use Enums for status fields (not raw strings)
- All API responses via API Resources (JsonResource)
- Validation via Form Requests
- Business logic in Services (not Controllers)
- Controllers are thin: validate → service → respond
- TypeScript strict mode, no `any` types
- React components: functional + hooks only
- State: Zustand stores (one per module)
- Forms: React Hook Form + Zod schemas
- i18n: all user-facing text via translation keys (ar/en)
- RTL support required for all UI components

## Screens
- **AdminLayout:** Desktop dashboard (sidebar + header)
- **StationLayout:** Touch screens, fullscreen, PIN login, large buttons
- 5 stations: Roaster, QC, Warehouse, Barista, Cleaning

## Important Rules
- Waste is ALWAYS automatic (never manual entry)
- Every inventory movement must have: crop_id + movement_type + reference
- PIN login for stations, Email+Password for admin
- All dates stored as UTC, displayed in Asia/Riyadh timezone
- Currency: SAR (Saudi Riyal)
- Bilingual: Arabic (primary) + English

## Reference
- Full plan: `PROJECT_PLAN.md` (phases, DB schema, tasks, API endpoints)
- Crop journey prototype: `coffee-journey-v2.jsx`
