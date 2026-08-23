# HQBA - خطة المشروع التفصيلية
# نظام إدارة المحمصة والفروع - حِقبة

---

## 1. نظرة عامة

### 1.1 وصف المشروع
نظام متكامل لإدارة محمصة قهوة حِقبة (Hiqbah) يغطي دورة حياة البن الكاملة من الشراء حتى بيع الكوب، مع تتبع كامل (Bean-to-Cup Traceability) يربط كل كوب قهوة يُباع بالمحصول الأصلي ودفعة التحميص.

### 1.2 الأهداف
- رقمنة جميع العمليات الورقية
- تتبع كامل لكل حبة بن من المزرعة إلى الكوب
- توحيد جودة القهوة بين الفروع
- دقة المخزون ومنع الفروقات غير المفسرة
- تقارير ربحية لكل محصول
- كفاءة التشغيل (تقليل الهدر، سرعة المعايرة)

### 1.3 المبدأ المعماري الأساسي
**الفرع = عميل داخلي للمحمصة**
- المحمصة لها مخزون مستقل
- كل فرع له مخزون مستقل
- التحويل بينهم عبر أوامر تحويل (Transfer Orders)

---

## 2. المواصفات التقنية

### 2.1 Technology Stack
| المكون | التقنية | السبب |
|--------|---------|-------|
| Backend | Laravel 12 | أفضل PHP framework, ORM قوي, Queue, Notifications |
| Frontend | React 19 + TypeScript | SPA سريع, مناسب لـ PWA, مكونات قابلة لإعادة الاستخدام |
| CSS | Tailwind CSS 4 | سريع في التطوير, responsive, RTL support |
| UI Components | Shadcn/UI | مكونات جاهزة عالية الجودة, قابلة للتخصيص |
| Database | PostgreSQL 16 | دعم JSON, بحث متقدم, أداء عالي |
| PWA | Workbox | Service Worker, offline caching, installability |
| State Management | Zustand | خفيف, بسيط, مناسب للمشروع |
| Forms | React Hook Form + Zod | أداء عالي, validation قوي |
| Charts | Recharts | رسوم بيانية للداشبوردات |
| Flow Diagrams | ReactFlow | خريطة رحلة المحصول التفاعلية (Crop Journey) |
| i18n | react-i18next + Laravel Lang | ثنائية اللغة (عربي/إنجليزي) |
| PDF | DomPDF (Laravel) | توليد ملصقات وتقارير |
| QR Code | bacon/bacon-qr-code | توليد QR للأكياس |
| Excel | Maatwebsite/Excel | تصدير لقيود المحاسبي |
| Auth | Laravel Sanctum | API tokens + SPA authentication |
| Permissions | Spatie Permission | أدوار وصلاحيات مرنة |
| API Filtering | Spatie Query Builder | فلترة, ترتيب, include عبر query params |
| Media | Spatie Media Library | رفع صور ومرفقات (فحوصات, تنظيف, منتجات) |
| Activity Log | Spatie Activity Log | تسجيل كل العمليات |
| Dashboard Components | Tremor | KPI cards, charts, filters - مبنية على Tailwind |
| Search | Laravel Scout + Meilisearch | بحث سريع |
| Queue | Laravel Queue (database driver) | إشعارات, تقارير, تصدير |
| Queue Monitor | Laravel Horizon | مراقبة الـ Queues والـ Jobs |
| Performance | Laravel Pulse | مراقبة أداء التطبيق |
| Dev AI Tools | Laravel Boost | MCP server يعطي Claude وصول مباشر للمشروع |
| Testing | PHPUnit + Vitest | اختبارات Backend + Frontend |

### 2.2 النمط المعماري: Modular Monolith
المشروع مقسّم إلى **وحدات مستقلة (Modules)** — كل وحدة تحتوي على Models, Controllers, Services, Events الخاصة بها.
التواصل بين الوحدات عبر **Events & Listeners** لضمان العزل.

### 2.3 هيكل المشروع
```
hqba/
├── backend/                           # Laravel API
│   ├── app/
│   │   ├── Core/                      # ━━ مشترك بين الكل ━━
│   │   │   ├── Models/                (User, Branch, Equipment, Setting)
│   │   │   ├── Controllers/           (AuthController, BranchController, etc.)
│   │   │   ├── Services/             (AuthService)
│   │   │   ├── Requests/
│   │   │   ├── Resources/
│   │   │   ├── Traits/               (HasCropTraceability, Auditable)
│   │   │   ├── Enums/                (StatusEnums مشتركة)
│   │   │   ├── Middleware/           (SetLocale, CheckPermission)
│   │   │   └── Providers/           (CoreServiceProvider)
│   │   │
│   │   └── Modules/
│   │       ├── Procurement/           # ━━ الشراء والموردين ━━
│   │       │   ├── Models/            (Supplier, PurchaseOrder)
│   │       │   ├── Controllers/
│   │       │   ├── Services/          (PurchaseOrderService)
│   │       │   ├── Requests/
│   │       │   ├── Resources/
│   │       │   ├── Events/            (PurchaseOrderApproved)
│   │       │   ├── Policies/
│   │       │   └── routes.php
│   │       │
│   │       ├── Crops/                 # ━━ دورة حياة المحصول ━━
│   │       │   ├── Models/            (Crop, GreenCoffeeLot, GreenCoffeeInspection,
│   │       │   │                       TrialRoast, CuppingSession, CropPricing,
│   │       │   │                       CropMarketing)
│   │       │   ├── Controllers/
│   │       │   ├── Services/          (CropService, QualityService, PricingService)
│   │       │   ├── Requests/
│   │       │   ├── Resources/         (CropTimelineResource - لرحلة المحصول)
│   │       │   ├── Events/            (CropStatusChanged, CuppingApproved)
│   │       │   ├── Policies/
│   │       │   └── routes.php
│   │       │
│   │       ├── Recipes/               # ━━ الوصفات ━━
│   │       │   ├── Models/            (Recipe, EspressoRecipe, PourOverRecipe,
│   │       │   │                       EspressoRecipeTrial)
│   │       │   ├── Controllers/
│   │       │   ├── Services/          (RecipeService)
│   │       │   ├── Events/            (RecipePublished)
│   │       │   └── routes.php
│   │       │
│   │       ├── Production/            # ━━ الإنتاج والتحميص ━━
│   │       │   ├── Models/            (RoastBatch, RoastQualityCheck, PackagingLot)
│   │       │   ├── Controllers/
│   │       │   ├── Services/          (RoastingService, PackagingService)
│   │       │   ├── Events/            (RoastBatchCompleted, QualityCheckDone)
│   │       │   └── routes.php
│   │       │
│   │       ├── Orders/                # ━━ الطلبات والعملاء ━━
│   │       │   ├── Models/            (Customer, Order, OrderItem, OrderStatusHistory)
│   │       │   ├── Controllers/
│   │       │   ├── Services/          (OrderService - state machine)
│   │       │   ├── Events/            (OrderStatusChanged)
│   │       │   └── routes.php
│   │       │
│   │       ├── Inventory/             # ━━ المخزون والجرد ━━
│   │       │   ├── Models/            (InventoryItem, InventoryMovement,
│   │       │   │                       TransferOrder, TransferOrderItem,
│   │       │   │                       InventoryAudit, InventoryAuditItem,
│   │       │   │                       AccountingExport)
│   │       │   ├── Controllers/
│   │       │   ├── Services/          (InventoryService, TransferService,
│   │       │   │                       AuditService, AccountingExportService)
│   │       │   ├── Listeners/         (يستمع لأحداث من وحدات أخرى)
│   │       │   │   ├── OnRoastBatchCompleted.php
│   │       │   │   ├── OnCalibrationFinished.php
│   │       │   │   ├── OnQualityCheckDone.php
│   │       │   │   └── OnGreenCoffeeReceived.php
│   │       │   ├── Events/            (InventoryLow, TransferShipped)
│   │       │   └── routes.php
│   │       │
│   │       ├── Branch/                # ━━ عمليات الفرع ━━
│   │       │   ├── Models/            (CalibrationSession, CalibrationShot,
│   │       │   │                       AdaptiveTarget, CleaningSchedule,
│   │       │   │                       CleaningTask)
│   │       │   ├── Controllers/
│   │       │   ├── Services/          (CalibrationService, CleaningService,
│   │       │   │                       AdaptiveTargetService, CupConsumptionService)
│   │       │   ├── Events/            (CalibrationCompleted, CleaningTaskOverdue)
│   │       │   ├── Jobs/              (GenerateDailyCleaningTasks)
│   │       │   └── routes.php
│   │       │
│   │       ├── Quality/               # ━━ الجودة والهدر والشكاوى ━━
│   │       │   ├── Models/            (WasteRecord, Complaint)
│   │       │   ├── Controllers/
│   │       │   ├── Services/          (WasteService, ComplaintService)
│   │       │   ├── Listeners/         (يسجل الهدر تلقائياً من كل الوحدات)
│   │       │   │   ├── OnCalibrationCompleted.php
│   │       │   │   ├── OnRoastBatchCompleted.php
│   │       │   │   └── OnQualityCheckDone.php
│   │       │   └── routes.php
│   │       │
│   │       └── Reporting/             # ━━ التقارير والداشبوردات ━━
│   │           ├── Controllers/
│   │           ├── Services/          (DashboardService, CropReportService,
│   │           │                       WasteReportService)
│   │           └── routes.php         (لا يحتاج Models - يقرأ من باقي الوحدات)
│   │
│   ├── database/
│   │   ├── migrations/                # كل الـ migrations هنا (ترتيب مركزي)
│   │   ├── seeders/
│   │   └── factories/
│   ├── routes/
│   │   └── api.php                    # يجمع routes.php من كل Module
│   └── tests/
│       ├── Unit/
│       │   ├── Procurement/
│       │   ├── Crops/
│       │   ├── Production/
│       │   └── ...
│       └── Feature/
│
├── frontend/                          # React SPA
│   ├── src/
│   │   ├── api/                       # API client (Axios + interceptors)
│   │   ├── components/                # مكونات مشتركة
│   │   │   ├── ui/                    # Shadcn/UI components
│   │   │   ├── CropJourneyFlow/       # ★ ReactFlow - خريطة رحلة المحصول
│   │   │   ├── DataTable/
│   │   │   ├── StatusBadge/
│   │   │   └── ...
│   │   ├── layouts/
│   │   │   ├── AdminLayout/           # لوحة الإدارة (sidebar + header)
│   │   │   ├── StationLayout/         # محطات اللمس (fullscreen + touch)
│   │   │   └── AuthLayout/            # تسجيل الدخول
│   │   ├── pages/
│   │   │   ├── admin/                 # صفحات الإدارة
│   │   │   │   ├── dashboard/
│   │   │   │   ├── crops/             # يتضمن CropJourneyFlow
│   │   │   │   ├── orders/
│   │   │   │   ├── inventory/
│   │   │   │   ├── users/
│   │   │   │   └── settings/
│   │   │   ├── stations/              # صفحات المحطات
│   │   │   │   ├── roaster/           # محطة المحمّص
│   │   │   │   ├── barista/           # محطة الباريستا
│   │   │   │   ├── qc/               # محطة الجودة
│   │   │   │   ├── warehouse/         # محطة المستودع
│   │   │   │   └── cleaning/          # محطة التنظيف
│   │   │   └── shared/
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── stores/                    # Zustand stores
│   │   ├── i18n/                      # ملفات الترجمة
│   │   │   ├── ar/
│   │   │   └── en/
│   │   ├── types/                     # TypeScript types
│   │   └── utils/                     # دوال مساعدة
│   ├── public/
│   │   ├── manifest.json              # PWA manifest
│   │   └── sw.js                      # Service Worker
│   └── tests/
│
└── docs/                              # وثائق المشروع
```

### 2.4 قواعد التواصل بين الوحدات (Module Communication Rules)

| الطريقة | متى تُستخدم | مثال |
|---------|-------------|------|
| **Events → Listeners** | عند تغيير حالة يهم وحدات أخرى | `RoastBatchCompleted` → Inventory يخصم أخضر ويضيف محمص |
| **قراءة مباشرة للـ Model** | عند الحاجة لبيانات من وحدة أخرى (read-only) | Orders يقرأ `InventoryItem::where(...)` |
| **استدعاء Service** | عند الحاجة لمنطق من وحدة أخرى | Orders يستدعي `InventoryService::checkAvailability()` |

**اتجاه الاعتماد:**
```
Reporting  → يقرأ من الكل (read-only)
Quality    → يستمع لأحداث من: Production, Branch, Crops
Inventory  → يستمع لأحداث من: Production, Branch, Crops, Orders
Orders     → يستدعي: Inventory (فحص), Crops (بيانات)
Production → يعرف: Crops (المحصول)
Branch     → يعرف: Recipes (الوصفات), Crops (المحصول)
Crops      → يعرف: Procurement (أمر الشراء)
Core       → لا يعتمد على أحد
```

### 2.5 خريطة الأحداث (Event Map)

| # | Event | Fired By | Listened By | ماذا يحدث |
|---|-------|----------|-------------|-----------|
| 1 | `PurchaseOrderApproved` | Procurement | Crops | ينشئ سجل محصول جديد (Crop) |
| 2 | `GreenCoffeeReceived` | Crops | Inventory | يضيف مخزون بن أخضر |
| 3 | `CropStatusChanged` | Crops | Core (Notifications) | إشعار لأصحاب العلاقة |
| 4 | `CuppingCompleted` | Crops | Quality | يسجل هدر الكَبِّينغ (كؤوس × جرعة) |
| 5 | `RecipePublished` | Recipes | Branch | يحدّث الوصفات المتاحة في الفروع |
| 6 | `RoastBatchStarted` | Production | Inventory | يخصم وزن البن الأخضر |
| 7 | `RoastBatchCompleted` | Production | Inventory, Quality | يضيف محمص + يسجل فاقد التحميص كهدر |
| 8 | `QualityCheckDone` | Production | Quality, Inventory | يسجل هدر فحص الجودة + يخصمه |
| 9 | `PackagingCompleted` | Production | Inventory | يخصم محمص + يضيف منتج نهائي |
| 10 | `OrderStatusChanged` | Orders | Core (Notifications) | إشعار للمندوب + المبيعات + العميل |
| 11 | `OrderAllocated` | Orders | Inventory | يحجز الكمية المطلوبة من المخزون |
| 12 | `OrderShipped` | Orders | Inventory | يخصم المخزون المحجوز نهائياً |
| 13 | `InventoryLow` | Inventory | Core (Notifications) | تنبيه: المخزون وصل الحد الأدنى |
| 14 | `TransferShipped` | Inventory | Core (Notifications) | إشعار الفرع: شحنة في الطريق |
| 15 | `TransferReceived` | Inventory | Inventory | يحدّث مخزون الفرع المستلم |
| 16 | `CalibrationCompleted` | Branch | Quality, Inventory | يسجل هدر المعايرة + يخصم من بار الفرع |
| 17 | `CleaningTaskOverdue` | Branch | Core (Notifications) | تنبيه: مهمة تنظيف متأخرة |
| 18 | `ComplaintCreated` | Quality | Core (Notifications) | إشعار لمسؤول الجودة + الإدارة |

**قاعدة ذهبية:** الوحدة تُطلق الحدث فقط ولا تعرف مَن يستمع. المستمعون يتعاملون مع الحدث بشكل مستقل.

### 2.6 البيئة
| البيئة | الأداة |
|--------|--------|
| تطوير محلي | Laragon (Windows) |
| قاعدة البيانات | PostgreSQL (محلي) |
| نشر | GitHub → Coolify → السيرفر |

---

## 3. قاعدة البيانات - الكيانات والعلاقات

### 3.1 خريطة العلاقات الرئيسية
```
Supplier ──→ PurchaseOrder ──→ Crop (S/N) ──→ GreenCoffeeLot
                                    │
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
              TrialRoast      CuppingSession    CropPricing
                    │               │
                    ↓               ↓
               Recipe ←──── FlavorProfile
                    │
        ┌───────────┼───────────────┐
        ↓                           ↓
  EspressoRecipe              PourOverRecipe
        │
        ↓
  RoastBatch ──→ RoastQC ──→ PackagingLot ──→ InventoryItem
        │                                          │
        ↓                                          ↓
  WasteRecord                              TransferOrder ──→ Branch
                                                    │
                                               BranchInventory
                                                    │
                                            CalibrationSession
                                                    │
                                              CalibrationShot
                                                    │
                                              WasteRecord (auto)
```

### 3.2 جداول قاعدة البيانات (Database Tables)

---

#### مجموعة 1: المستخدمون والنظام

**users** - المستخدمون
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| name | varchar | الاسم بالإنجليزي |
| name_ar | varchar | الاسم بالعربي |
| email | varchar unique | البريد الإلكتروني |
| password | varchar | كلمة المرور (للإدارة) |
| pin | varchar(6) | رقم PIN (للمحطات) |
| branch_id | FK → branches | الفرع الحالي |
| is_active | boolean | فعّال/معطّل |
| language | enum(ar,en) | اللغة المفضلة |
| avatar | varchar null | صورة الملف الشخصي |
| last_login_at | timestamp | آخر دخول |

**branches** - الفروع
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| name | varchar | الاسم بالإنجليزي |
| name_ar | varchar | الاسم بالعربي |
| type | enum(roastery, branch) | محمصة أو فرع |
| city | varchar | المدينة |
| address | text | العنوان |
| phone | varchar | الهاتف |
| is_active | boolean | فعّال |
| settings | jsonb | إعدادات خاصة بالفرع |

**equipment** - المعدات
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| branch_id | FK → branches | الفرع |
| type | enum(espresso_machine, grinder, brewer, roaster) | نوع المعدة |
| code | varchar | رمز المعدة (M01, G02) |
| name | varchar | الاسم |
| brand | varchar null | الماركة |
| model | varchar null | الموديل |
| status | enum(active, maintenance, inactive) | الحالة |
| notes | text null | ملاحظات |

---

#### مجموعة 2: الشراء والمحصول

**suppliers** - الموردون
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| name | varchar | اسم المورد |
| country | varchar | الدولة |
| contact_person | varchar null | اسم جهة الاتصال |
| email | varchar null | البريد |
| phone | varchar null | الهاتف |
| notes | text null | ملاحظات |
| is_active | boolean | فعّال |

**purchase_orders** - أوامر الشراء
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| po_number | varchar unique | رقم أمر الشراء (PO-2026-001) |
| supplier_id | FK → suppliers | المورد |
| origin_country | varchar | دولة المنشأ |
| region | varchar | المنطقة |
| farm | varchar null | المزرعة |
| process | varchar | المعالجة (Washed/Natural/Honey) |
| variety | varchar null | الصنف |
| altitude | varchar null | الارتفاع |
| quantity_kg | decimal | الكمية بالكيلو |
| price_per_kg | decimal | سعر الكيلو |
| shipping_cost | decimal | تكلفة الشحن |
| customs_cost | decimal | تكلفة الجمارك |
| total_cost | decimal | التكلفة الإجمالية |
| currency | varchar default SAR | العملة |
| expected_date | date | تاريخ التوريد المتوقع |
| status | enum(draft, pending_approval, approved, ordered, shipped, in_customs, received, cancelled) | الحالة |
| created_by | FK → users | المُنشئ |
| approved_by | FK → users null | المُعتمِد |
| approved_at | timestamp null | تاريخ الاعتماد |
| notes | text null | ملاحظات |

**crops** - المحاصيل (الكيان المركزي)
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| serial_number | varchar unique | الرقم التسلسلي (CR-2026-ETH-001) |
| purchase_order_id | FK → purchase_orders | أمر الشراء |
| supplier_id | FK → suppliers | المورد |
| name | varchar | اسم المحصول (Ethiopia Hambella) |
| name_ar | varchar | الاسم بالعربي |
| origin_country | varchar | دولة المنشأ |
| region | varchar | المنطقة |
| farm | varchar null | المزرعة |
| process | varchar | المعالجة |
| variety | varchar null | الصنف |
| altitude | varchar null | الارتفاع |
| lot_number | varchar | رقم اللوت من المصدر |
| status | enum(ordered, received, inspecting, trial_roasting, cupping, approved, pricing, marketing, production_ready, in_production, depleted, closed) | الحالة |
| total_green_weight | decimal | إجمالي الوزن الأخضر |
| remaining_green_weight | decimal | الوزن الأخضر المتبقي |
| usage_type | enum(espresso, filter, both) null | نوع الاستخدام |
| flavor_notes | jsonb null | الإيحاءات ['Chocolate', 'Berry'] |
| description | text null | الوصف |
| description_ar | text null | الوصف بالعربي |
| brew_recommendations | text null | توصيات التحضير |
| closed_at | timestamp null | تاريخ الإغلاق |

---

#### مجموعة 3: الاستلام والفحص

**green_coffee_lots** - شحنات البن الأخضر
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| crop_id | FK → crops | المحصول |
| purchase_order_id | FK → purchase_orders | أمر الشراء |
| batch_id | varchar unique | رقم الدفعة (GC-2026-001) |
| bags_count | integer | عدد الخياش |
| expected_weight | decimal | الوزن المتوقع |
| actual_weight | decimal | الوزن الفعلي |
| weight_variance | decimal | فرق الوزن |
| arrival_date | date | تاريخ الوصول |
| barcode | varchar null | الباركود |
| qr_code | varchar null | رمز QR |
| shipping_document | varchar null | بوليصة الشحن (مرفق) |
| received_by | FK → users | المُستلِم |
| status | enum(received, inspecting, approved, rejected, conditional) | الحالة |
| notes | text null | ملاحظات |

**green_coffee_inspections** - فحوصات البن الأخضر
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| green_coffee_lot_id | FK → green_coffee_lots | الشحنة |
| inspector_id | FK → users | الفاحص |
| moisture_percent | decimal null | نسبة الرطوبة |
| water_activity | decimal null | النشاط المائي |
| density | decimal null | الكثافة |
| screen_size | varchar null | حجم الحبة |
| defect_count | integer null | عدد العيوب |
| defect_notes | text null | ملاحظات العيوب |
| visual_notes | text null | ملاحظات بصرية |
| decision | enum(approved, rejected, conditional) | القرار |
| rejection_reason | text null | سبب الرفض |
| condition_notes | text null | شروط القبول المشروط |
| photos | jsonb null | صور الفحص |
| inspected_at | timestamp | تاريخ الفحص |

---

#### مجموعة 4: التحميص التجريبي والتقييم

**trial_roasts** - التحميص التجريبي
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| crop_id | FK → crops | المحصول |
| green_coffee_lot_id | FK → green_coffee_lots | شحنة البن |
| roaster_id | FK → users | المحمّص |
| trial_number | integer | رقم التجربة (1, 2, 3...) |
| sample_weight_grams | decimal | وزن العينة (جرام) |
| charge_temp | decimal null | درجة حرارة الإدخال |
| drying_time | varchar null | وقت التجفيف |
| maillard_time | varchar null | وقت Maillard |
| first_crack_time | varchar null | وقت أول Crack |
| first_crack_temp | decimal null | درجة حرارة أول Crack |
| development_time | varchar null | وقت التطوير |
| development_percent | decimal null | نسبة التطوير |
| drop_temp | decimal null | درجة الحرارة النهائية |
| total_roast_time | varchar null | إجمالي وقت التحميص |
| roast_curve_data | jsonb null | بيانات منحنى التحميص |
| roast_level | enum(light, medium_light, medium, medium_dark, dark) null | درجة التحميص |
| usage_type | enum(espresso, filter, both) null | نوع الاستخدام |
| notes | text null | ملاحظات |
| status | enum(in_progress, completed, selected) | الحالة |
| roasted_at | timestamp | تاريخ التحميص |

**cupping_sessions** - جلسات الكَبِّينغ
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| crop_id | FK → crops | المحصول |
| trial_roast_id | FK → trial_roasts | التحميص التجريبي |
| grader_id | FK → users | المُقيّم (Q Grader) |
| scheduled_date | date | التاريخ المجدول |
| cups_count | integer | عدد الكؤوس |
| dose_per_cup | decimal | جرعة كل كوب (جرام) |
| total_coffee_used | decimal | إجمالي القهوة المستخدمة (جرام) |
| fragrance | decimal(3,1) null | العطر (1-10) |
| aroma | decimal(3,1) null | الرائحة (1-10) |
| flavor | decimal(3,1) null | النكهة (1-10) |
| acidity | decimal(3,1) null | الحموضة (1-10) |
| body | decimal(3,1) null | القوام (1-10) |
| aftertaste | decimal(3,1) null | ما بعد التذوق (1-10) |
| balance | decimal(3,1) null | التوازن (1-10) |
| sweetness | decimal(3,1) null | الحلاوة (1-10) |
| overall_score | decimal(4,1) null | التقييم الكلي (/100) |
| flavor_notes | jsonb null | الإيحاءات المستخرجة |
| description | text null | الوصف |
| brew_recommendations | text null | توصيات التحضير |
| decision | enum(approved, rejected, retest) | القرار |
| rejection_reason | text null | سبب الرفض |
| notes | text null | ملاحظات |
| photos | jsonb null | صور |
| status | enum(scheduled, in_progress, completed) | الحالة |

---

#### مجموعة 5: الوصفات

**recipes** - الوصفات
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| crop_id | FK → crops | المحصول |
| recipe_code | varchar unique | كود الوصفة (HB-ESP-ETH-001) |
| recipe_type | enum(espresso, pour_over) | نوع الوصفة |
| created_by | FK → users | المُنشئ |
| status | enum(draft, calibrating, pending_approval, approved, published) | الحالة |
| approved_by | FK → users null | المُعتمِد |
| approved_at | timestamp null | تاريخ الاعتماد |
| published_at | timestamp null | تاريخ النشر |

**espresso_recipe_trials** - محاولات معايرة الإسبريسو
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| recipe_id | FK → recipes | الوصفة |
| trial_number | integer | رقم المحاولة |
| dose | decimal | الجرعة (جرام) |
| grind_setting | varchar | إعداد الطحن |
| extraction_time | integer | وقت الاستخلاص (ثانية) |
| yield | decimal | العائد (جرام) |
| tds | decimal null | TDS |
| extraction_percent | decimal null | نسبة الاستخلاص |
| acidity | integer null | الحموضة (1-10) |
| finish | integer null | النهاية (1-10) |
| balance | integer null | التوازن (1-10) |
| is_best_shot | boolean default false | هل هي أفضل محاولة |
| notes | text null | ملاحظات |

**espresso_recipes** - وصفة الإسبريسو المعتمدة
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| recipe_id | FK → recipes | الوصفة |
| dose | decimal | الجرعة (جرام) |
| grind_setting | varchar | إعداد الطحن |
| extraction_time | integer | وقت الاستخلاص (ثانية) |
| yield | decimal | العائد (جرام) |
| tds | decimal | TDS |
| extraction_percent | decimal | نسبة الاستخلاص |

**pour_over_recipes** - وصفة الدريب المعتمدة
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| recipe_id | FK → recipes | الوصفة |
| dose | decimal | الجرعة (جرام) |
| grind_setting | varchar | إعداد الطحن |
| brew_type | enum(hot, iced) | نوع التحضير |
| bloom_time | integer | وقت التفتح (ثانية) |
| bloom_water | decimal | ماء التفتح (جرام) |
| pours | jsonb | الصبات [{pour: 1, water: 80}, ...] |
| total_water | decimal | إجمالي الماء (جرام) |
| total_time | integer | إجمالي الوقت (ثانية) |

---

#### مجموعة 6: التسعير والتسويق

**crop_pricing** - تسعير المحصول
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| crop_id | FK → crops unique | المحصول |
| green_cost_per_kg | decimal | تكلفة الكيلو الأخضر |
| roasting_loss_percent | decimal | نسبة فاقد التحميص |
| roasting_cost_per_kg | decimal | تكلفة التحميص للكيلو |
| packaging_cost_per_unit | decimal | تكلفة التعبئة للوحدة |
| operation_cost_per_kg | decimal | تكلفة التشغيل للكيلو |
| shipping_cost_per_kg | decimal | تكلفة الشحن للكيلو |
| total_cost_per_kg_roasted | decimal | التكلفة الإجمالية للكيلو المحمص |
| target_margin_percent | decimal | هامش الربح المستهدف |
| retail_price_250g | decimal null | سعر التجزئة 250g |
| retail_price_500g | decimal null | سعر التجزئة 500g |
| retail_price_1kg | decimal null | سعر التجزئة 1kg |
| wholesale_price_kg | decimal null | سعر الجملة للكيلو |
| status | enum(draft, pending_approval, approved) | الحالة |
| set_by | FK → users | المحاسب |
| approved_by | FK → users null | المُعتمِد (المدير) |
| approved_at | timestamp null | تاريخ الاعتماد |

**crop_marketing** - تسويق المحصول
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| crop_id | FK → crops unique | المحصول |
| product_name | varchar | اسم المنتج |
| product_name_ar | varchar | اسم المنتج بالعربي |
| marketing_description | text null | الوصف التسويقي |
| marketing_description_ar | text null | الوصف التسويقي بالعربي |
| flavor_display | varchar null | عرض الإيحاءات |
| label_template | varchar null | قالب الملصق |
| label_pdf_url | varchar null | رابط PDF الملصق |
| social_media_text | text null | نص السوشال ميديا |
| social_media_text_ar | text null | نص السوشال ميديا بالعربي |
| photos | jsonb null | صور المنتج |
| status | enum(draft, approved) | الحالة |
| created_by | FK → users | المُنشئ |

---

#### مجموعة 7: الإنتاج

**roast_batches** - دفعات التحميص
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| batch_number | varchar unique | رقم الدفعة (RB-2026-0045) |
| crop_id | FK → crops | المحصول |
| green_coffee_lot_id | FK → green_coffee_lots | شحنة البن |
| order_id | FK → orders null | الطلب (إن وُجد) |
| roaster_id | FK → users | المحمّص |
| machine_id | FK → equipment | ماكينة التحميص |
| green_weight | decimal | وزن البن الأخضر (كجم) |
| roasted_weight | decimal null | وزن البن المحمص (كجم) |
| roast_loss_weight | decimal null | وزن الفاقد (كجم) |
| roast_loss_percent | decimal null | نسبة الفاقد |
| target_roast_level | varchar null | مستوى التحميص المطلوب |
| charge_temp | decimal null | درجة حرارة الإدخال |
| turning_point | varchar null | نقطة التحول |
| first_crack_time | varchar null | وقت أول Crack |
| first_crack_temp | decimal null | درجة حرارة أول Crack |
| drop_temp | decimal null | درجة الحرارة النهائية |
| total_roast_time | varchar null | إجمالي وقت التحميص |
| roast_profile_data | jsonb null | بيانات البروفايل |
| status | enum(queued, roasting, cooling, qc_pending, qc_approved, qc_rejected, packaged) | الحالة |
| priority | integer default 0 | الأولوية في الطابور |
| queue_position | integer null | الترتيب في الطابور |
| started_at | timestamp null | وقت البدء |
| completed_at | timestamp null | وقت الانتهاء |
| notes | text null | ملاحظات |

**roast_quality_checks** - فحوصات جودة التحميص
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| roast_batch_id | FK → roast_batches | الدفعة |
| inspector_id | FK → users | الفاحص |
| test_type | enum(cupping, espresso, filter) | نوع الاختبار |
| color_consistency | enum(pass, minor_issue, fail) null | تناسق اللون |
| quakers | integer null | عدد الحبوب غير الناضجة |
| uneven_roast | boolean null | تحميص غير متساوي |
| broken_beans | boolean null | حبوب مكسورة |
| oil_presence | boolean null | وجود زيت |
| visual_result | enum(pass, minor_issue, fail) | نتيجة الفحص البصري |
| fragrance_result | enum(excellent, good, acceptable, defect) null | نتيجة الرائحة |
| flavor | decimal(3,1) null | النكهة |
| acidity | decimal(3,1) null | الحموضة |
| body | decimal(3,1) null | القوام |
| sweetness | decimal(3,1) null | الحلاوة |
| balance | decimal(3,1) null | التوازن |
| aftertaste | decimal(3,1) null | ما بعد التذوق |
| score | decimal(4,1) null | الدرجة /100 |
| cups_used | integer null | عدد الكؤوس المستخدمة |
| dose_per_cup | decimal null | جرعة كل كوب |
| total_coffee_used_grams | decimal null | إجمالي القهوة المستخدمة |
| decision | enum(accepted, rejected, conditional) | القرار |
| remark | text null | ملاحظات |
| corrective_action | enum(none, re_roast, adjust_profile, downgrade, stop_selling) null | الإجراء التصحيحي |
| photos | jsonb null | صور |
| checked_at | timestamp | تاريخ الفحص |

**packaging_lots** - دفعات التعبئة
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| lot_number | varchar unique | رقم الدفعة (PK-2026-0089) |
| roast_batch_id | FK → roast_batches | دفعة التحميص |
| crop_id | FK → crops | المحصول |
| staff_id | FK → users | موظف التعبئة |
| package_size | enum(250, 500, 1000) | حجم العبوة (جرام) |
| bags_count | integer | عدد الأكياس |
| total_weight_grams | decimal | الوزن الإجمالي |
| production_date | date | تاريخ الإنتاج |
| expiry_date | date | تاريخ الانتهاء |
| qr_data | jsonb null | بيانات QR لكل كيس |
| status | enum(packed, in_inventory, distributed) | الحالة |
| packed_at | timestamp | تاريخ التعبئة |

---

#### مجموعة 8: الطلبات والعملاء

**customers** - العملاء
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| name | varchar | اسم العميل |
| name_ar | varchar null | الاسم بالعربي |
| type | enum(wholesale, retail) | نوع العميل |
| company | varchar null | الشركة |
| contact_person | varchar null | جهة الاتصال |
| email | varchar null | البريد |
| phone | varchar | الهاتف |
| address | text null | العنوان |
| city | varchar null | المدينة |
| tax_number | varchar null | الرقم الضريبي |
| credit_terms | integer null | مدة الائتمان (أيام) |
| sales_rep_id | FK → users null | المندوب المسؤول |
| is_active | boolean | فعّال |
| notes | text null | ملاحظات |

**orders** - الطلبات
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| order_number | varchar unique | رقم الطلب (ORD-2026-0452) |
| customer_id | FK → customers | العميل |
| sales_rep_id | FK → users | المندوب |
| branch_id | FK → branches null | الفرع (للتحويلات الداخلية) |
| order_type | enum(wholesale, branch_transfer) | نوع الطلب |
| status | enum(new, sales_review, inventory_check, accounting, sales_confirmed, payment_pending, payment_confirmed, allocated, in_production, packed, shipped, delivered, closed, cancelled) | الحالة |
| priority | enum(normal, high, urgent) | الأولوية |
| subtotal | decimal | المجموع قبل الضريبة |
| tax_amount | decimal | الضريبة |
| total_amount | decimal | الإجمالي |
| payment_status | enum(unpaid, partial, paid) | حالة الدفع |
| paid_amount | decimal default 0 | المبلغ المدفوع |
| remaining_amount | decimal default 0 | المبلغ المتبقي |
| payment_proof | varchar null | إثبات الدفع (مرفق) |
| quotation_pdf | varchar null | عرض السعر PDF |
| shipping_company | varchar null | شركة الشحن |
| tracking_number | varchar null | رقم التتبع |
| shipped_at | timestamp null | تاريخ الشحن |
| delivered_at | timestamp null | تاريخ التسليم |
| closed_at | timestamp null | تاريخ الإغلاق |
| closed_by | FK → users null | أغلق بواسطة |
| notes | text null | ملاحظات |
| internal_notes | text null | ملاحظات داخلية |

**order_items** - عناصر الطلب
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| order_id | FK → orders | الطلب |
| crop_id | FK → crops | المحصول |
| product_name | varchar | اسم المنتج |
| package_size | enum(250, 500, 1000, bulk_kg) | حجم العبوة |
| quantity | integer | الكمية |
| unit_price | decimal | سعر الوحدة |
| total_price | decimal | الإجمالي |
| roast_batch_id | FK → roast_batches null | دفعة التحميص (بعد الربط) |
| packaging_lot_id | FK → packaging_lots null | دفعة التعبئة (بعد الربط) |

**order_status_history** - سجل حالات الطلب
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| order_id | FK → orders | الطلب |
| from_status | varchar | الحالة السابقة |
| to_status | varchar | الحالة الجديدة |
| changed_by | FK → users | تم بواسطة |
| notes | text null | ملاحظات |
| created_at | timestamp | التاريخ |

---

#### مجموعة 9: المخزون

**inventory_items** - عناصر المخزون
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| branch_id | FK → branches | الفرع/المحمصة |
| crop_id | FK → crops | المحصول |
| item_type | enum(green, roasted, finished_250, finished_500, finished_1kg, bar) | نوع المخزون |
| roast_batch_id | FK → roast_batches null | دفعة التحميص |
| packaging_lot_id | FK → packaging_lots null | دفعة التعبئة |
| quantity | decimal | الكمية |
| unit | enum(kg, bags, grams) | الوحدة |
| min_threshold | decimal null | الحد الأدنى (للتنبيه) |
| last_movement_at | timestamp null | آخر حركة |

**inventory_movements** - حركات المخزون
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| inventory_item_id | FK → inventory_items | عنصر المخزون |
| branch_id | FK → branches | الفرع |
| crop_id | FK → crops | المحصول |
| movement_type | enum(receiving, roasting_in, roasting_out, roast_loss, packaging_in, packaging_out, sale, transfer_out, transfer_in, calibration_waste, qc_waste, trial_waste, adjustment_in, adjustment_out, cup_consumption) | نوع الحركة |
| quantity | decimal | الكمية (+ إضافة / - خصم) |
| reference_type | varchar null | نوع المرجع (order, roast_batch, calibration, etc.) |
| reference_id | bigint null | رقم المرجع |
| cost_per_unit | decimal null | التكلفة للوحدة |
| total_cost | decimal null | التكلفة الإجمالية |
| staff_id | FK → users | الموظف |
| notes | text null | ملاحظات |

**transfer_orders** - أوامر التحويل (المحمصة ↔ الفرع)
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| transfer_number | varchar unique | رقم التحويل |
| from_branch_id | FK → branches | من |
| to_branch_id | FK → branches | إلى |
| requested_by | FK → users | طلب بواسطة |
| approved_by | FK → users null | اعتمد بواسطة |
| status | enum(requested, approved, preparing, shipped, received, confirmed, cancelled) | الحالة |
| shipped_at | timestamp null | تاريخ الشحن |
| received_at | timestamp null | تاريخ الاستلام |
| confirmed_at | timestamp null | تاريخ التأكيد |
| notes | text null | ملاحظات |

**transfer_order_items** - عناصر أمر التحويل
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| transfer_order_id | FK → transfer_orders | أمر التحويل |
| crop_id | FK → crops | المحصول |
| product_name | varchar | اسم المنتج |
| package_size | varchar | حجم العبوة |
| quantity_sent | decimal | الكمية المرسلة |
| quantity_received | decimal null | الكمية المستلمة |
| variance | decimal null | الفرق |

---

#### مجموعة 10: المعايرة اليومية

**calibration_sessions** - جلسات المعايرة
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| branch_id | FK → branches | الفرع |
| barista_id | FK → users | الباريستا |
| machine_id | FK → equipment | الماكينة |
| grinder_id | FK → equipment | الطاحونة |
| crop_id | FK → crops | المحصول |
| recipe_id | FK → recipes | الوصفة |
| brew_method | enum(espresso, pour_over) | طريقة التحضير |
| date | date | التاريخ |
| total_shots | integer default 0 | عدد المحاولات |
| total_waste_grams | decimal default 0 | إجمالي الهدر (جرام) |
| status | enum(in_progress, approved, needs_adjustment) | الحالة |
| approved_at | timestamp null | تاريخ الاعتماد |
| notes | text null | ملاحظات |

**calibration_shots** - محاولات المعايرة
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| session_id | FK → calibration_sessions | الجلسة |
| shot_number | integer | رقم المحاولة |
| dose | decimal | الجرعة (جرام) |
| grind_setting | varchar null | إعداد الطحن |
| time | integer null | الوقت (ثانية) |
| yield | decimal null | العائد (جرام) |
| tds | decimal null | TDS |
| extraction_percent | decimal null | نسبة الاستخلاص |
| acidity | integer null | الحموضة (1-10) |
| finish | integer null | النهاية (1-10) |
| balance | integer null | التوازن (1-10) |
| is_best_shot | boolean default false | أفضل محاولة |
| notes | text null | ملاحظات |

**adaptive_targets** - الأهداف الذكية
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| crop_id | FK → crops | المحصول |
| branch_id | FK → branches | الفرع |
| grinder_id | FK → equipment | الطاحونة |
| machine_id | FK → equipment | الماكينة |
| brew_method | enum(espresso, pour_over) | طريقة التحضير |
| target_dose | decimal null | الجرعة المستهدفة |
| target_yield | decimal null | العائد المستهدف |
| target_time | integer null | الوقت المستهدف |
| target_extraction | decimal null | الاستخلاص المستهدف |
| target_tds | decimal null | TDS المستهدف |
| tolerances | jsonb null | نطاقات التسامح |
| data_points_count | integer | عدد نقاط البيانات |
| confidence_score | decimal null | مستوى الثقة |
| reason | text null | السبب |
| status | enum(suggestion, published) | الحالة |
| published_by | FK → users null | نشر بواسطة |
| published_at | timestamp null | تاريخ النشر |

---

#### مجموعة 11: النظافة

**cleaning_schedules** - جداول النظافة
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| branch_id | FK → branches | الفرع |
| category | enum(equipment, area) | التصنيف |
| target_name | varchar | اسم المعدة/المنطقة |
| target_name_ar | varchar | الاسم بالعربي |
| equipment_id | FK → equipment null | المعدة (إن كان equipment) |
| task_name | varchar | اسم المهمة |
| task_name_ar | varchar | الاسم بالعربي |
| frequency | enum(per_use, hourly, bi_hourly, end_of_shift, daily, weekly) | التكرار |
| steps | jsonb null | خطوات التنظيف |
| is_active | boolean | فعّال |

**cleaning_tasks** - مهام النظافة
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| schedule_id | FK → cleaning_schedules | الجدول |
| branch_id | FK → branches | الفرع |
| assigned_date | date | التاريخ |
| due_time | time | الوقت المحدد |
| employee_id | FK → users null | الموظف |
| status | enum(pending, in_progress, completed, late, missed) | الحالة |
| started_at | timestamp null | وقت البدء |
| completed_at | timestamp null | وقت الانتهاء |
| before_photo | varchar null | صورة قبل |
| after_photo | varchar null | صورة بعد |
| notes | text null | ملاحظات |
| reviewed_by | FK → users null | المراجع |
| review_status | enum(pending, approved, redo) null | حالة المراجعة |
| review_notes | text null | ملاحظات المراجعة |

---

#### مجموعة 12: الجرد

**inventory_audits** - مهام الجرد
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| audit_number | varchar unique | رقم الجرد |
| branch_id | FK → branches | الفرع |
| scope | enum(roastery, bar, full) | نطاق الجرد |
| audit_date | date | التاريخ |
| responsible_id | FK → users | المسؤول |
| status | enum(open, counting, review, approved, closed) | الحالة |
| total_variance_value | decimal null | إجمالي قيمة الفروقات |
| approved_by | FK → users null | اعتمد بواسطة |
| approved_at | timestamp null | تاريخ الاعتماد |
| closed_at | timestamp null | تاريخ الإغلاق |
| notes | text null | ملاحظات |

**inventory_audit_items** - عناصر الجرد
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| audit_id | FK → inventory_audits | الجرد |
| inventory_item_id | FK → inventory_items | عنصر المخزون |
| item_name | varchar | اسم العنصر |
| item_type | varchar | نوع المخزون |
| system_quantity | decimal | الكمية في النظام |
| actual_quantity | decimal | الكمية الفعلية |
| variance | decimal | الفرق |
| variance_value | decimal null | قيمة الفرق (ريال) |
| notes | text null | ملاحظات |

**accounting_exports** - تصدير القيود المحاسبية
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| audit_id | FK → inventory_audits null | الجرد (إن وُجد) |
| export_type | enum(inventory_adjustment, purchase, sale) | نوع التصدير |
| file_format | enum(csv, excel) | صيغة الملف |
| file_url | varchar | رابط الملف |
| entries | jsonb | القيود المحاسبية |
| exported_by | FK → users | صدّر بواسطة |
| exported_at | timestamp | تاريخ التصدير |

---

#### مجموعة 13: الهدر والشكاوى

**waste_records** - سجلات الهدر (تلقائية)
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| branch_id | FK → branches | الفرع |
| crop_id | FK → crops | المحصول |
| roast_batch_id | FK → roast_batches null | دفعة التحميص |
| waste_type | enum(calibration, qc_testing, roast_loss, trial_roast, training, brewing) | نوع الهدر |
| source_type | varchar | مصدر الهدر (calibration_session, roast_batch, etc.) |
| source_id | bigint | رقم المصدر |
| quantity_grams | decimal | الكمية (جرام) |
| cost_sar | decimal null | التكلفة (ريال) |
| staff_id | FK → users null | الموظف |
| auto_generated | boolean default true | تم إنشاؤه تلقائياً |
| notes | text null | ملاحظات |

**complaints** - الشكاوى
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| complaint_number | varchar unique | رقم الشكوى |
| customer_id | FK → customers null | العميل |
| order_id | FK → orders null | الطلب |
| crop_id | FK → crops null | المحصول |
| roast_batch_id | FK → roast_batches null | دفعة التحميص |
| branch_id | FK → branches null | الفرع |
| complaint_type | enum(taste, packaging, stale, roast, service, other) | نوع الشكوى |
| description | text | الوصف |
| severity | enum(low, medium, high, critical) | الخطورة |
| status | enum(open, investigating, resolved, closed) | الحالة |
| investigation_notes | text null | ملاحظات التحقيق |
| root_cause | enum(no_issue, batch_problem, storage_problem, brewing_problem, packaging_problem, other) null | السبب الجذري |
| corrective_action | enum(none, adjust_profile, recall_batch, replace_product, compensation, other) null | الإجراء التصحيحي |
| corrective_notes | text null | تفاصيل الإجراء |
| resolved_by | FK → users null | حُل بواسطة |
| resolved_at | timestamp null | تاريخ الحل |

---

#### مجموعة 14: الإشعارات والإعدادات

**notifications** - الإشعارات (Laravel built-in)
- يتم استخدام نظام Laravel المدمج للإشعارات
- أنواع: in-app, email, push (PWA)

**settings** - الإعدادات
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | bigint PK | - |
| group | varchar | المجموعة (general, inventory, calibration, etc.) |
| key | varchar | المفتاح |
| value | text | القيمة |
| type | enum(string, integer, boolean, json) | النوع |

**activity_log** - سجل النشاطات
- يتم استخدام Spatie Activity Log
- يسجل كل عملية: إنشاء, تعديل, حذف, تغيير حالة

---

## 4. الأدوار والصلاحيات

### 4.1 الأدوار (Roles)

| الدور | الوصف | طريقة الدخول | الشاشات |
|-------|-------|-------------|---------|
| **super_admin** | المدير العام | Email + Password | كل شيء |
| **admin** | مدير النظام | Email + Password | الإدارة + التقارير |
| **accountant** | المحاسب | Email + Password أو PIN | المحاسبة + الطلبات + الجرد |
| **sales_manager** | مدير المبيعات | Email + Password | المبيعات + الطلبات |
| **sales_rep** | المندوب | PIN | إنشاء الطلبات |
| **master_roaster** | الماستر روستر | PIN | التحميص التجريبي + الوصفات + الجودة |
| **roaster** | المحمّص | PIN | محطة المحمّص |
| **q_grader** | مسؤول الجودة | PIN | محطة الجودة + الكَبِّينغ |
| **head_barista** | الباريستا الرئيسي | PIN | الوصفات + المعايرة |
| **barista** | باريستا | PIN | محطة الباريستا |
| **warehouse** | أمين المستودع | PIN | محطة المستودع |
| **packaging** | موظف التعبئة | PIN | التعبئة |
| **branch_manager** | مدير الفرع | Email + Password أو PIN | إدارة الفرع + التقارير |
| **marketing** | التسويق | Email + Password | التسويق + المنتجات |

### 4.2 مصفوفة الصلاحيات التفصيلية

#### المحاصيل والشراء
| الصلاحية | super_admin | accountant | master_roaster | warehouse |
|----------|:-----------:|:----------:|:--------------:|:---------:|
| إنشاء أمر شراء | ✅ | ✅ | ❌ | ❌ |
| اعتماد أمر شراء | ✅ | ❌ | ❌ | ❌ |
| استلام شحنة | ✅ | ❌ | ❌ | ✅ |
| فحص البن الأخضر | ✅ | ❌ | ✅ | ❌ |
| تحميص تجريبي | ✅ | ❌ | ✅ | ❌ |
| كَبِّينغ وتقييم | ✅ | ❌ | ✅ | ❌ |

#### الأسعار والتسويق
| الصلاحية | super_admin | accountant | marketing |
|----------|:-----------:|:----------:|:---------:|
| تحديد السعر | ✅ | ✅ | ❌ |
| اعتماد السعر | ✅ | ❌ | ❌ |
| إنشاء محتوى تسويقي | ✅ | ❌ | ✅ |
| توليد ملصقات | ✅ | ❌ | ✅ |

#### الإنتاج
| الصلاحية | super_admin | master_roaster | roaster | q_grader | packaging |
|----------|:-----------:|:--------------:|:-------:|:--------:|:---------:|
| إدارة طابور التحميص | ✅ | ✅ | ❌ | ❌ | ❌ |
| بدء دفعة تحميص | ✅ | ✅ | ✅ | ❌ | ❌ |
| إنهاء دفعة تحميص | ✅ | ✅ | ✅ | ❌ | ❌ |
| فحص جودة الدفعة | ✅ | ✅ | ❌ | ✅ | ❌ |
| رفض دفعة | ✅ | ✅ | ❌ | ✅ | ❌ |
| تعبئة | ✅ | ❌ | ❌ | ❌ | ✅ |

#### الطلبات
| الصلاحية | super_admin | sales_manager | sales_rep | accountant |
|----------|:-----------:|:-------------:|:---------:|:----------:|
| إنشاء طلب | ✅ | ✅ | ✅ | ❌ |
| مراجعة طلب | ✅ | ✅ | ❌ | ❌ |
| إصدار عرض سعر | ✅ | ❌ | ❌ | ✅ |
| اعتماد طلب | ✅ | ✅ | ❌ | ❌ |
| شحن | ✅ | ✅ | ❌ | ❌ |
| إغلاق طلب | ✅ | ❌ | ❌ | ✅ |

#### الفروع
| الصلاحية | super_admin | branch_manager | head_barista | barista |
|----------|:-----------:|:--------------:|:------------:|:-------:|
| المعايرة اليومية | ✅ | ✅ | ✅ | ✅ |
| إنشاء وصفة | ✅ | ❌ | ✅ | ❌ |
| اعتماد وصفة | ✅ | ❌ | ❌ | ❌ |
| مهام النظافة | ✅ | ✅ | ✅ | ✅ |
| مراجعة النظافة | ✅ | ✅ | ❌ | ❌ |
| طلب تحويل مخزون | ✅ | ✅ | ❌ | ❌ |
| الجرد | ✅ | ✅ | ✅ | ❌ |

---

## 5. مراحل التنفيذ التفصيلية

---

### المرحلة 1: الأساس (Foundation)
**الهدف:** إعداد المشروع والبنية التحتية

#### 1.1 إعداد مشروع Laravel
- [x] إنشاء مشروع Laravel 12 جديد
- [x] تهيئة PostgreSQL وملف .env
- [x] تثبيت الحزم الأساسية:
  - laravel/sanctum
  - spatie/laravel-permission
  - spatie/laravel-activitylog
  - maatwebsite/excel
  - barryvdh/laravel-dompdf
  - bacon/bacon-qr-code
- [x] إعداد هيكل المجلدات (Services, Enums, etc.)
- [x] إعداد API versioning (api/v1/)
- [x] إعداد CORS للـ React frontend
- [x] إعداد Rate Limiting
- [x] إعداد Error Handling وAPI responses موحدة

#### 1.2 إعداد مشروع React
- [x] إنشاء مشروع React مع Vite + TypeScript
- [x] تثبيت وتهيئة Tailwind CSS مع دعم RTL
- [x] تثبيت وتهيئة Shadcn/UI
- [x] إعداد Axios API client مع interceptors
- [x] إعداد React Router مع حماية المسارات
- [x] إعداد Zustand stores
- [x] إعداد react-i18next مع ملفات الترجمة (ar/en)
- [x] إعداد React Hook Form + Zod
- [x] إنشاء Layout components:
  - AdminLayout (sidebar, header, content)
  - StationLayout (fullscreen, touch-optimized)
  - AuthLayout (login pages)
- [x] إعداد Theme (ألوان، خطوط، مقاسات)

#### 1.3 نظام PWA
- [x] إنشاء manifest.json
- [ ] إعداد Service Worker مع Workbox
- [ ] تهيئة caching strategies
- [ ] إعداد offline fallback page
- [ ] اختبار التثبيت على الأجهزة

#### 1.4 نظام المصادقة (Authentication)
- [x] إنشاء migration للـ users
- [x] إنشاء User model مع العلاقات
- [x] إعداد Sanctum للـ SPA authentication
- [x] API: POST /api/v1/auth/login (email + password)
- [x] API: POST /api/v1/auth/pin-login (PIN)
- [x] API: POST /api/v1/auth/logout
- [x] API: GET /api/v1/auth/user
- [x] شاشة تسجيل الدخول (Email + Password) للإدارة
- [x] شاشة PIN Login (لوحة أرقام) للمحطات
- [x] حماية المسارات (Auth Guard)
- [x] تخزين Token في localStorage / httpOnly cookie

#### 1.5 نظام الأدوار والصلاحيات
- [x] إعداد Spatie Permission
- [x] إنشاء Seeder للأدوار الـ 14
- [x] إنشاء Seeder للصلاحيات
- [x] إنشاء Middleware للتحقق من الصلاحيات
- [x] إنشاء Policy لكل Model

#### 1.6 إدارة الفروع
- [x] إنشاء migration للـ branches
- [x] إنشاء Branch model
- [x] API: CRUD /api/v1/branches
- [x] شاشة إدارة الفروع (Admin)
- [x] Seeder: فرع المحمصة + الفرع الأول

#### 1.7 إدارة المعدات
- [x] إنشاء migration للـ equipment
- [x] إنشاء Equipment model
- [x] API: CRUD /api/v1/equipment
- [x] شاشة إدارة المعدات (Admin)
- [x] ربط المعدات بالفروع

#### 1.8 إدارة المستخدمين
- [x] API: CRUD /api/v1/users
- [x] شاشة إدارة المستخدمين (Admin)
- [x] تعيين الأدوار والفروع
- [x] إنشاء/تعديل PIN
- [x] تفعيل/تعطيل المستخدم

#### 1.9 الإعدادات العامة
- [x] إنشاء migration للـ settings
- [x] API: GET/PUT /api/v1/settings
- [x] شاشة الإعدادات (Admin)
- [x] إعدادات عامة (اسم الشركة, العملة, الضريبة, etc.)

---

### المرحلة 2: دورة حياة البن (Coffee Lifecycle)
**الهدف:** من الشراء حتى المنتج الجاهز

#### 2.1 إدارة الموردين
- [x] إنشاء migration للـ suppliers
- [x] إنشاء Supplier model
- [x] API: CRUD /api/v1/suppliers
- [x] شاشة إدارة الموردين (Admin)

#### 2.2 أوامر الشراء
- [x] إنشاء migration للـ purchase_orders
- [x] إنشاء PurchaseOrder model مع العلاقات
- [x] إنشاء PurchaseOrderService (business logic)
- [x] API: CRUD /api/v1/purchase-orders
- [x] API: POST /api/v1/purchase-orders/{id}/approve
- [x] API: PUT /api/v1/purchase-orders/{id}/status
- [x] توليد رقم أمر الشراء تلقائياً (PO-YYYY-NNN)
- [x] شاشة إنشاء أمر شراء
- [x] شاشة قائمة أوامر الشراء
- [x] شاشة تفاصيل أمر الشراء
- [x] Workflow: اعتماد المدير
- [x] إشعار عند إنشاء/اعتماد أمر شراء

#### 2.3 المحاصيل (Crops)
- [x] إنشاء migration للـ crops
- [x] إنشاء Crop model مع العلاقات
- [x] إنشاء CropService
- [x] توليد الرقم التسلسلي تلقائياً (CR-YYYY-XXX-NNN)
- [x] API: CRUD /api/v1/crops
- [x] API: GET /api/v1/crops/{id}/timeline (سجل كامل للمحصول)
- [x] API: GET /api/v1/crops/{id}/traceability (سلسلة التتبع)
- [x] شاشة قائمة المحاصيل
- [x] شاشة تفاصيل المحصول (timeline view)
- [x] شاشة حالة المحصول (status board)

#### 2.4 خريطة رحلة المحصول (Crop Journey Flow) ★
- [x] تثبيت ReactFlow في مشروع React
- [x] إنشاء مكوّن CropJourneyFlow:
  - عرض المراحل كـ nodes بتخطيط Snake (صفوف متعاكسة)
  - كل مرحلة: بطاقة بالبيانات الحية من API
  - ألوان الحالة: أخضر (مكتمل) / برتقالي متحرك (جاري) / رمادي (قادم)
  - خطوط ربط متحركة (animated edges)
  - Zoom & Pan للتنقل
  - Mini Map للنظرة الشاملة
- [x] API: GET /api/v1/crops/{id}/journey
  - يُرجع كل المراحل مع بياناتها وحالاتها والتواريخ
  - يشمل sub-nodes (مثلاً: 10 دفعات تحميص داخل مرحلة الإنتاج)
- [x] Drawer (لوحة جانبية) عند الضغط على أي مرحلة:
  - عرض KPIs والبيانات التفصيلية
  - زر "عرض السجلات" → ينتقل لصفحة المرحلة
  - زر "طباعة" → PDF
- [x] شريط علوي: اسم المحصول + شريط التقدم + المرحلة الحالية
- [x] زر في صفحة المحصول: [🗺️ عرض رحلة المحصول] يفتح هذه الشاشة
- [x] المراحل الـ 12:
  1. طلب المحصول (Purchase Order)
  2. الشحن والنقل (Shipping)
  3. الاستلام والتخزين (Receiving)
  4. فحص العينات (Sample Analysis)
  5. تحميص تجريبي (Sample Roasting)
  6. التذوق والتقييم (Cupping)
  7. قرار القبول (Approval)
  8. المعايرة والوصفة (Calibration & Recipe)
  9. الإنتاج والتحميص (Production) — sub-nodes: كل دفعة تحميص
  10. التعبئة والتغليف (Packaging)
  11. البيع والتوزيع (Sales & Distribution)
  12. التقرير النهائي (Final Report)

#### 2.5 استلام البن الأخضر
- [x] إنشاء migration للـ green_coffee_lots
- [x] إنشاء GreenCoffeeLot model
- [x] إنشاء GreenCoffeeService
- [x] API: POST /api/v1/green-coffee/receive
- [x] API: GET /api/v1/green-coffee/lots
- [x] توليد Batch ID تلقائياً
- [x] توليد Barcode/QR
- [x] حساب فرق الوزن مع أمر الشراء
- [x] إضافة المخزون الأخضر تلقائياً (Inventory IN)
- [x] شاشة الاستلام (محطة المستودع - touch)
- [x] شاشة قائمة الشحنات
- [x] رفع المرفقات (بوليصة الشحن)

#### 2.5 فحص البن الأخضر
- [x] إنشاء migration للـ green_coffee_inspections
- [x] إنشاء GreenCoffeeInspection model
- [x] API: POST /api/v1/green-coffee/{lot_id}/inspect
- [x] API: PUT /api/v1/green-coffee/inspections/{id}/decide
- [x] شاشة الفحص (محطة الجودة)
- [x] نموذج الفحص (Moisture, Water Activity, Density, Defects)
- [x] قرار: قبول / رفض / مشروط
- [x] إشعار بالنتيجة
- [x] تحديث حالة المحصول تلقائياً

#### 2.6 التحميص التجريبي
- [x] إنشاء migration للـ trial_roasts
- [x] إنشاء TrialRoast model
- [x] API: CRUD /api/v1/crops/{crop_id}/trial-roasts
- [x] دعم محاولات متعددة (Trial 1, 2, 3...)
- [x] خصم وزن العينة من المخزون الأخضر
- [x] تسجيل الهدر تلقائياً (waste_records)
- [x] حفظ بيانات البروفايل (JSON)
- [x] شاشة التحميص التجريبي
- [x] جدولة كَبِّينغ تلقائياً

#### 2.7 الكَبِّينغ والتقييم
- [x] إنشاء migration للـ cupping_sessions
- [x] إنشاء CuppingSession model
- [x] إنشاء QualityService
- [x] API: CRUD /api/v1/crops/{crop_id}/cupping-sessions
- [x] API: POST /api/v1/cupping-sessions/{id}/decide
- [x] نموذج التقييم (Fragrance → Overall Score)
- [x] استخراج الإيحاءات (3-5 نكهات)
- [x] قرار: اعتماد / رفض / إعادة
- [x] خصم القهوة المستخدمة من المخزون (هدر تلقائي)
- [x] شاشة الكَبِّينغ (محطة الجودة)
- [x] إشعار بالنتيجة
- [x] تحديث حالة المحصول

#### 2.8 إدارة الوصفات
- [x] إنشاء migrations للوصفات (recipes, espresso_recipe_trials, espresso_recipes, pour_over_recipes)
- [x] إنشاء Recipe model مع العلاقات
- [x] إنشاء RecipeService
- [x] API: CRUD /api/v1/recipes
- [x] API: POST /api/v1/recipes/{id}/espresso-trials (محاولات المعايرة)
- [x] API: POST /api/v1/recipes/{id}/select-best-shot
- [x] API: POST /api/v1/recipes/{id}/approve
- [x] API: POST /api/v1/recipes/{id}/publish
- [x] حساب Extraction Yield تلقائياً
- [x] نموذج وصفة الإسبريسو (محاولات متعددة + Best Shot)
- [x] نموذج وصفة الدريب (Hot/Iced + Pours)
- [x] شاشة الوصفات (Head Barista)
- [x] شاشة اعتماد الوصفات (Master Roaster)
- [x] نشر الوصفات للفروع
- [x] Recipes Dashboard في الفروع

#### 2.9 التسعير
- [x] إنشاء migration للـ crop_pricing
- [x] إنشاء CropPricing model
- [x] إنشاء PricingService
- [x] API: CRUD /api/v1/crops/{crop_id}/pricing
- [x] API: POST /api/v1/crops/{crop_id}/pricing/approve
- [x] حساب التكلفة التلقائي:
  - تكلفة الكيلو الأخضر (من أمر الشراء)
  - نسبة فاقد التحميص (من التحميص التجريبي)
  - تكلفة التعبئة + التشغيل + الشحن (من الإعدادات)
- [x] حساب سعر البيع المقترح
- [x] شاشة التسعير (المحاسب)
- [x] اعتماد المدير
- [x] إشعار بالاعتماد

#### 2.10 التسويق والملصقات
- [x] إنشاء migration للـ crop_marketing
- [x] إنشاء CropMarketing model
- [x] API: CRUD /api/v1/crops/{crop_id}/marketing
- [x] تعبئة البيانات تلقائياً من المحصول
- [x] توليد Label PDF (DomPDF)
- [x] تصدير نص تسويقي
- [x] شاشة التسويق
- [x] معاينة الملصق

---

### المرحلة 3: الإنتاج والطلبات (Production & Orders)
**الهدف:** العمليات اليومية المتكررة

#### 3.1 طابور التحميص ومحطة المحمّص
- [x] إنشاء migration للـ roast_batches
- [x] إنشاء RoastBatch model
- [x] إنشاء RoastingService
- [x] API: GET /api/v1/roasting/queue (الطابور)
- [x] API: POST /api/v1/roasting/batches (إنشاء دفعة)
- [x] API: PUT /api/v1/roasting/batches/{id}/start
- [x] API: PUT /api/v1/roasting/batches/{id}/complete
- [x] API: PUT /api/v1/roasting/batches/{id}/reorder (إعادة ترتيب)
- [x] خصم البن الأخضر من المخزون عند بدء التحميص
- [x] إضافة البن المحمص للمخزون عند الانتهاء
- [x] حساب فاقد التحميص تلقائياً
- [x] تسجيل الهدر تلقائياً (waste_records)
- [x] محطة المحمّص (touch screen):
  - عرض الطابور
  - تفاصيل الدفعة الحالية
  - نموذج إدخال بيانات التحميص
  - زر إنهاء الدفعة
  - عرض البروفايل المطلوب

#### 3.2 فحص جودة الدفعات (QC Station)
- [x] إنشاء migration للـ roast_quality_checks
- [x] إنشاء RoastQualityCheck model
- [x] API: POST /api/v1/roasting/batches/{id}/quality-check
- [x] API: PUT /api/v1/quality-checks/{id}/decide
- [x] خصم القهوة المستخدمة في الفحص (هدر تلقائي)
- [x] محطة الجودة (touch screen):
  - قائمة العينات المنتظرة
  - نموذج الفحص السريع (أزرار 1-10)
  - قرار القبول/الرفض
  - الإجراءات التصحيحية
- [x] إشعار عند الرفض
- [x] تحديث حالة الدفعة

#### 3.3 التعبئة
- [x] إنشاء migration للـ packaging_lots
- [x] إنشاء PackagingLot model
- [x] إنشاء PackagingService
- [x] API: POST /api/v1/packaging/lots
- [x] API: GET /api/v1/packaging/lots
- [x] خصم البن المحمص من المخزون
- [x] إضافة المنتج النهائي للمخزون
- [x] توليد QR Code لكل كيس
- [x] سلسلة التتبع في QR: Crop S/N → Lot → Batch → Pack → SKU
- [x] شاشة التعبئة (API جاهز — الشاشة ستُبنى ضمن Admin)
- [x] إشعار عند اكتمال التعبئة

#### 3.4 إدارة العملاء
- [x] إنشاء migration للـ customers
- [x] إنشاء Customer model
- [x] API: CRUD /api/v1/customers
- [x] تسجيل الفروع كعملاء داخليين تلقائياً
- [x] شاشة إدارة العملاء (API جاهز)

#### 3.5 إدارة الطلبات (11 مرحلة)
- [x] إنشاء migrations (orders, order_items, order_status_history)
- [x] إنشاء Order model مع العلاقات
- [x] إنشاء OrderService (state machine)
- [x] إنشاء OrderPolicy (عبر allowedTransitions في Enum)
- [x] توليد رقم الطلب تلقائياً (ORD-YYYY-NNNN)
- [x] APIs:
  - POST /api/v1/orders (إنشاء طلب)
  - GET /api/v1/orders (قائمة الطلبات مع فلترة)
  - GET /api/v1/orders/{id} (تفاصيل)
  - PUT /api/v1/orders/{id}/transition (State Machine — كل التحولات)
  - GET /api/v1/orders/{id}/inventory-check (فحص المخزون - تلقائي)
  - PUT /api/v1/orders/{id}/payment (تأكيد الدفع)
  - PUT /api/v1/orders/{id}/cancel (إلغاء)
- [x] تسجيل سجل الحالات (order_status_history)
- [x] شاشات (API جاهز)
- [x] إشعارات عند كل تغيير حالة
- [ ] توليد عرض سعر PDF (مؤجل — يحتاج DomPDF template)
- [x] ربط الطلب بدفعة التحميص (عبر crop_id)

#### 3.6 نظام المخزون
- [x] إنشاء migrations (inventory_items, inventory_movements)
- [x] إنشاء InventoryItem model
- [x] إنشاء InventoryMovement model
- [x] إنشاء InventoryService
- [x] API: GET /api/v1/inventory (مع فلترة: branch, type, crop)
- [x] API: GET /api/v1/inventory/movements (سجل الحركات)
- [x] API: GET /api/v1/inventory/alerts (تنبيهات الحد الأدنى)
- [x] API: POST /api/v1/inventory/adjust (تعديل يدوي)
- [x] API: POST /api/v1/inventory/reconcile (تسوية جرد)
- [x] API: GET /api/v1/inventory/valuation (تقييم المخزون)
- [x] حركات تلقائية:
  - استلام بن أخضر → +green (Listener مفعّل)
  - تحميص → -green, +roasted, +roast_loss(waste) (جاهز للربط عند بناء Production)
  - تعبئة → -roasted, +finished (جاهز للربط عند بناء Production)
  - بيع → -finished (جاهز للربط عند بناء Orders)
  - تحويل للفرع → -finished(roastery), +bar(branch) (جاهز للربط عند بناء Transfers)
  - معايرة → -bar(waste) (جاهز للربط عند بناء Branch)
  - فحص جودة → -roasted(waste) (جاهز للربط عند بناء Production)
- [x] شاشة المخزون (مع فلترة وبحث)
- [x] شاشة حركات المخزون
- [x] تنبيهات الحد الأدنى
- [x] لوحة المخزون الحية (live dashboard)

#### 3.7 أوامر التحويل (المحمصة ↔ الفروع)
- [x] إنشاء migrations (transfer_orders, transfer_order_items)
- [x] إنشاء TransferOrder model
- [x] إنشاء TransferService
- [x] API: CRUD /api/v1/transfers
- [x] API: PUT /api/v1/transfers/{id}/approve
- [x] API: PUT /api/v1/transfers/{id}/ship
- [x] API: PUT /api/v1/transfers/{id}/receive
- [x] API: PUT /api/v1/transfers/{id}/confirm
- [x] حركات مخزون تلقائية عند الشحن والاستلام
- [x] حساب الفروقات عند الاستلام
- [x] شاشة أوامر التحويل (API جاهز)
- [x] شاشة الاستلام (API جاهز)
- [x] إشعارات

---

### المرحلة 4: عمليات الفرع (Branch Operations)
**الهدف:** العمليات اليومية في الفرع

#### 4.1 المعايرة اليومية (Barista Station)
- [x] إنشاء migrations (calibration_sessions, calibration_shots)
- [x] إنشاء CalibrationSession model + CalibrationShot model
- [x] إنشاء CalibrationService
- [x] API: POST /api/v1/calibration/sessions (بدء جلسة)
- [x] API: POST /api/v1/calibration/sessions/{id}/shots (New Shot)
- [x] API: PUT /api/v1/calibration/sessions/{id}/finish
- [x] API: PUT /api/v1/calibration/sessions/{id}/approve
- [x] حساب الهدر تلقائياً + خصم من مخزون البار (CalibrationCompleted Event)
- [x] مقارنة النتائج مع الوصفة المعتمدة (is_within_range)
- [x] محطة الباريستا (touch screen) — /stations/barista/calibration
- [x] سجل المعايرة (API list)

#### 4.2 حساب استهلاك الأكواب
- [x] إنشاء CupConsumptionService
- [x] حساب تلقائي من حركات المخزون

#### 4.3 النظافة (Cleaning Station)
- [x] إنشاء migrations (cleaning_schedules, cleaning_tasks)
- [x] إنشاء CleaningSchedule + CleaningTask models
- [x] إنشاء CleaningService (مع generateDailyTasks + cleanlinessScore)
- [x] API: CRUD /api/v1/cleaning/schedules
- [x] API: GET /api/v1/cleaning/tasks/today + start + complete + review
- [x] API: GET /api/v1/cleaning/score
- [x] توليد المهام اليومية تلقائياً
- [x] محطة التنظيف (touch screen) — /stations/cleaning
- [x] حساب Cleanliness Score

#### 4.4 الجرد الدوري
- [x] إنشاء migrations (inventory_audits, inventory_audit_items)
- [x] إنشاء InventoryAudit + InventoryAuditItem models
- [x] إنشاء AuditService (open, count, approve → reconcile, close)
- [x] API: POST /api/v1/audits (فتح جرد)
- [x] API: PUT /api/v1/audits/{id}/items/{item_id} (إدخال الكمية الفعلية)
- [x] API: PUT /api/v1/audits/{id}/approve (اعتماد + تسوية تلقائية)
- [x] API: PUT /api/v1/audits/{id}/close (إغلاق)
- [x] حساب الفروقات تلقائياً
- [x] تعديل المخزون بعد الاعتماد (عبر InventoryService::reconcile)
- [x] 5 أنواع: أخضر, محمص, منتجات جاهزة, بار, شامل

---

### المرحلة 5: الذكاء والتقارير (Intelligence & Reports)
**الهدف:** لوحات التحكم، التحليلات، والتقارير

#### 5.1 داشبورد الإدارة
- [x] API: GET /api/v1/dashboard/admin
- [x] بطاقات KPI (8): محاصيل، طلبات، إيرادات، مخزون، تحميص، هدر، عناصر مخزون، طلبات معلقة
- [x] رسوم بيانية: مبيعات شهرية (BarChart) + هدر حسب النوع (PieChart)
- [x] آخر 10 نشاطات + تنبيهات عاجلة
- [x] شاشة DashboardPage معاد بناؤها بالكامل (Recharts)

#### 5.2 تقرير المحصول الشامل (Crop Report)
- [x] API: GET /api/v1/reports/crop/{id}
- [x] CropReportService: أخضر، دفعات، محمص، فاقد، أكياس، مبيعات، ربح، مخزون حالي

#### 5.3 تقرير الهدر
- [x] API: GET /api/v1/reports/waste
- [x] يستخدم WasteService الموجود مع getSummary

#### 5.4 نظام AI للمعايرة — OpenRouter (Gemini Flash 3)
- [x] Migration: ai_calibration_suggestions
- [x] AiCalibrationService: collectData → buildPrompt → callOpenRouter → parseResponse
- [x] API: POST /api/v1/calibration/ai-analyze
- [x] API: GET /api/v1/calibration/ai-suggestions
- [x] Config: OPENROUTER_API_KEY في .env + services.openrouter

#### 5.5 نظام الإشعارات
- [x] Backend جاهز أصلاً (Model + Service + Controller + Routes)
- [x] صفحة الإشعارات الكاملة (/notifications)
- [x] رابط في Sidebar

#### 5.6 نظام الشكاوى
- [x] Migration: complaints
- [x] Complaint model + ComplaintService
- [x] API: CRUD + investigate + resolve (5 endpoints)
- [x] ربط بالمحصول والدفعة والطلب والعميل
- [x] شاشة ComplaintsPage

#### 5.7 تصدير القيود المحاسبية
- [x] AccountingExportService (purchases, sales, inventory_adjustments)
- [x] API: POST /api/v1/accounting/export

#### 5.8 سجل النشاطات (Activity Log)
- [x] Spatie Activity Log مفعّل على كل الموديلات
- [x] API: GET /api/v1/activity-log (مع فلترة)
- [x] شاشة ActivityLogPage

---

### المرحلة 6: التكامل المستقبلي (Future Integrations)
**ملاحظة: هذه المرحلة مستقبلية وليست ضمن التنفيذ الحالي**

#### 6.1 ربط POS عبر API
- [ ] API endpoints لاستقبال بيانات المبيعات
- [ ] Webhook لتحديث المخزون
- [ ] مطابقة المنتجات

#### 6.2 ربط سلة (Salla) عبر API
- [ ] API endpoints لمزامنة المنتجات
- [ ] Webhook لاستقبال الطلبات
- [ ] تحديث المخزون

#### 6.3 ربط قيود المحاسبي عبر API
- [ ] API integration مباشر (بدلاً من CSV)
- [ ] مزامنة تلقائية

#### 6.4 تطبيق موبايل (React Native)
- [ ] تطبيق المندوب
- [ ] تطبيق الباريستا
- [ ] إشعارات Push أصلية

---

## 6. المحطات (Stations) - تفاصيل الشاشات ✅ مكتملة

### 6.1 محطة المحمّص (Roaster Station) ✅
**المسار:** `/stations/roaster` — **ملف:** `RoasterStationPage.tsx`
**الشاشة:** لمس، عرض كامل، أزرار كبيرة
**الدخول:** PIN
**المحتوى:**
```
┌─────────────────────────────────────────────┐
│  🔥 محطة المحمّص          [اسم المحمّص] [خروج] │
├────────────────┬────────────────────────────┤
│  طابور التحميص  │    الدفعة الحالية          │
│                │                            │
│  1. Ethiopia   │  RB-2026-0045              │
│     5kg ⭐عاجل │  Ethiopia Hambella          │
│                │  الوزن الأخضر: 10 kg       │
│  2. Colombia   │  البروفايل المطلوب:        │
│     8kg        │  Charge: 200°C             │
│                │  FC: 195°C / 9:30          │
│  3. Blend      │  Drop: 210°C / 11:00       │
│     12kg       │                            │
│                │  [بدء التحميص]              │
│                │  [إدخال البيانات]           │
│                │  [إنهاء الدفعة]             │
└────────────────┴────────────────────────────┘
```

### 6.2 محطة الجودة (QC Station) ✅
**المسار:** `/stations/qc` + `/stations/qc/roast` — **ملفات:** `QcInspectionPage.tsx` + `QcRoastBatchPage.tsx`
**الشاشة:** لمس
**الدخول:** PIN
**المحتوى:**
```
┌─────────────────────────────────────────────┐
│  🔬 محطة الجودة           [اسم الفاحص] [خروج] │
├────────────────┬────────────────────────────┤
│  عينات منتظرة  │    فحص الدفعة              │
│                │                            │
│  ● RB-0045     │  RB-0043 - Colombia        │
│    Ethiopia    │                            │
│                │  اللون [1-10] ████████ 8    │
│  ● RB-0044     │  الرائحة [1-10] ██████ 7   │
│    Colombia    │  النكهة [1-10] ████████ 8   │
│                │  الحموضة [1-10] ██████ 7    │
│                │  القوام [1-10] ████████ 8   │
│                │  التوازن [1-10] ███████ 8   │
│                │  الدرجة: 86/100            │
│                │                            │
│                │  [✅ قبول] [❌ رفض] [⚠️ مشروط]│
└────────────────┴────────────────────────────┘
```

### 6.3 محطة المستودع (Warehouse Terminal) ✅
**المسار:** `/stations/warehouse` — **ملف:** `WarehouseStationPage.tsx`
**الشاشة:** لمس
**الدخول:** PIN
**المحتوى:**
```
┌─────────────────────────────────────────────┐
│  📦 محطة المستودع         [اسم الموظف] [خروج] │
├────────────────┬────────────────────────────┤
│  شحنات متوقعة  │    استلام شحنة             │
│                │                            │
│  ● PO-2026-005│  [مسح الباركود]            │
│    Ethiopia    │                            │
│    500kg       │  المورد: ABC Trading       │
│    متوقع: غداً │  المحصول: Ethiopia Hambella │
│                │  الوزن المتوقع: 500 kg     │
│  ● PO-2026-006│  الوزن الفعلي: [    ] kg    │
│    Colombia    │  عدد الخياش: [    ]         │
│    300kg       │  الحالة: [سليم ▼]          │
│    متوقع: 3/20 │                            │
│                │  [📷 صورة] [📎 بوليصة]       │
│                │  [✅ تأكيد الاستلام]         │
└────────────────┴────────────────────────────┘
```

### 6.4 محطة الباريستا (Barista Station) ✅
**المسار:** `/stations/barista/recipes` + `/stations/barista/calibration` — **ملفات:** `BaristaRecipesPage.tsx` + `BaristaCalibrationPage.tsx`
**الشاشة:** لمس
**الدخول:** PIN
**المحتوى:**
```
┌─────────────────────────────────────────────┐
│  ☕ محطة الباريستا       [اسم الباريستا] [خروج]│
├─────────────────────────────────────────────┤
│  الفرع: الخبر | الماكينة: M01 | الطاحونة: G02 │
├────────────────┬────────────────────────────┤
│  الوصفة المعتمدة│    المعايرة                │
│                │                            │
│  Ethiopia      │  Shot #3                   │
│  Hambella      │                            │
│                │  Dose:  [18  ]g             │
│  Dose: 18g     │  Grind: [4.5 ]             │
│  Yield: 36g    │  Time:  [27  ]s             │
│  Time: 28s     │  Yield: [35  ]g             │
│  Ext: 19.5%    │  TDS:   [9.6 ]             │
│                │  Ext:   [19.2]%             │
│  ──────────────│                            │
│  Target vs     │  ⚠️ Time أقل من المطلوب     │
│  Actual:       │  اقتراح: Grind أنعم بخطوة   │
│  Time: 28→27 ⚠️│                            │
│  Ext: 19.5→19.2│  [New Shot] [✅ اعتماد]     │
└────────────────┴────────────────────────────┘
```

### 6.5 محطة التنظيف (Cleaning Station) ✅
**المسار:** `/stations/cleaning` — **ملف:** `CleaningStationPage.tsx`
**الشاشة:** لمس
**الدخول:** PIN
**المحتوى:**
```
┌─────────────────────────────────────────────┐
│  🧹 محطة التنظيف        [اسم الموظف] [خروج] │
├─────────────────────────────────────────────┤
│  مهام اليوم - الخبر           النظافة: 92%  │
├─────────────────────────────────────────────┤
│                                             │
│  09:00  دورات المياه - تنظيف المغاسل  [✅ تم] │
│  09:30  الطاولات - تعقيم             [✅ تم] │
│  10:00  الأرضيات - مسح        [🟡 قيد التنفيذ]│
│  10:00  ماكينة - Backflush           [⏳ قادم]│
│  12:00  الطاحونة - تنظيف المخرج      [⏳ قادم]│
│  12:00  دورات المياه - تعبئة صابون   [⏳ قادم]│
│                                             │
│  ──────────── المهمة الحالية ──────────────  │
│  الأرضيات - مسح الأرضيات                    │
│  1. ☑ كنس الأرضية                          │
│  2. ☑ مسح بالماء والمنظف                    │
│  3. ☐ تجفيف                                │
│                                             │
│  [📷 صورة قبل] [📷 صورة بعد] [✅ إنهاء المهمة]│
└─────────────────────────────────────────────┘
```

---

## 7. API Structure Overview

### 7.1 Authentication
```
POST   /api/v1/auth/login          # Email + Password
POST   /api/v1/auth/pin-login      # PIN Login
POST   /api/v1/auth/logout
GET    /api/v1/auth/user
```

### 7.2 Admin & Setup
```
CRUD   /api/v1/users
CRUD   /api/v1/branches
CRUD   /api/v1/equipment
CRUD   /api/v1/suppliers
GET/PUT /api/v1/settings
```

### 7.3 Coffee Lifecycle
```
CRUD   /api/v1/purchase-orders
POST   /api/v1/purchase-orders/{id}/approve
CRUD   /api/v1/crops
GET    /api/v1/crops/{id}/timeline
GET    /api/v1/crops/{id}/journey         # ★ بيانات ReactFlow - رحلة المحصول
GET    /api/v1/crops/{id}/traceability
POST   /api/v1/green-coffee/receive
POST   /api/v1/green-coffee/{lot_id}/inspect
CRUD   /api/v1/crops/{crop_id}/trial-roasts
CRUD   /api/v1/crops/{crop_id}/cupping-sessions
CRUD   /api/v1/recipes
POST   /api/v1/recipes/{id}/approve
POST   /api/v1/recipes/{id}/publish
CRUD   /api/v1/crops/{crop_id}/pricing
POST   /api/v1/crops/{crop_id}/pricing/approve
CRUD   /api/v1/crops/{crop_id}/marketing
```

### 7.4 Production
```
GET    /api/v1/roasting/queue
CRUD   /api/v1/roasting/batches
PUT    /api/v1/roasting/batches/{id}/start
PUT    /api/v1/roasting/batches/{id}/complete
POST   /api/v1/roasting/batches/{id}/quality-check
POST   /api/v1/packaging/lots
```

### 7.5 Orders
```
CRUD   /api/v1/customers
CRUD   /api/v1/orders
PUT    /api/v1/orders/{id}/sales-review
PUT    /api/v1/orders/{id}/accounting
PUT    /api/v1/orders/{id}/sales-confirm
PUT    /api/v1/orders/{id}/payment
PUT    /api/v1/orders/{id}/ship
PUT    /api/v1/orders/{id}/close
```

### 7.6 Inventory
```
GET    /api/v1/inventory
GET    /api/v1/inventory/movements
POST   /api/v1/inventory/adjust
CRUD   /api/v1/transfers
PUT    /api/v1/transfers/{id}/approve
PUT    /api/v1/transfers/{id}/ship
PUT    /api/v1/transfers/{id}/receive
```

### 7.7 Branch Operations
```
POST   /api/v1/calibration/sessions
POST   /api/v1/calibration/sessions/{id}/shots
PUT    /api/v1/calibration/sessions/{id}/approve
CRUD   /api/v1/cleaning/schedules
GET    /api/v1/cleaning/tasks/today
PUT    /api/v1/cleaning/tasks/{id}/start
PUT    /api/v1/cleaning/tasks/{id}/complete
POST   /api/v1/audits
PUT    /api/v1/audits/{id}/items/{item_id}
PUT    /api/v1/audits/{id}/approve
```

### 7.8 Reports & Intelligence
```
GET    /api/v1/dashboard/admin
GET    /api/v1/crops/{id}/report
GET    /api/v1/reports/waste
GET    /api/v1/calibration/ai-targets
GET    /api/v1/notifications
CRUD   /api/v1/complaints
POST   /api/v1/accounting/export
GET    /api/v1/activity-log
```

---

## 8. ملخص الأرقام

| العنصر | العدد |
|--------|-------|
| جداول قاعدة البيانات | ~38 جدول |
| الأدوار | 14 دور |
| الوحدات (Modules) | 9 وحدات + Core |
| المحطات | 5 محطات (لمس) |
| مراحل التنفيذ | 5 مراحل + مرحلة مستقبلية |
| API Endpoints | ~85+ endpoint |
| المهام التفصيلية | ~210+ مهمة |
| الأحداث (Events) | ~18 حدث رئيسي |

---

## 9. ملاحظات مهمة

1. **الأمان:** كل API محمي بـ Sanctum + Permission middleware
2. **التتبع:** كل جدول فيه created_at, updated_at + Activity Log
3. **الترجمة:** كل النصوص قابلة للترجمة (عربي/إنجليزي)
4. **الاستجابة:** كل الشاشات responsive (desktop + tablet + mobile)
5. **المحطات:** مصممة للمس، أزرار كبيرة، PIN login، بدون لوحة مفاتيح
6. **الهدر:** تلقائي 100% - لا يوجد إدخال يدوي للهدر
7. **المخزون:** كل حركة مسجلة ومرتبطة بالمصدر (traceability)
8. **الإشعارات:** عند كل تغيير حالة مهم
9. **التقارير:** قابلة للتصدير PDF/Excel
10. **القيود المحاسبية:** بتنسيق قيود (Qoyod) جاهز للاستيراد

---

**الخطوة التالية:** بعد اعتمادك على هذه الخطة، سيتم البدء بالمرحلة 1 (الأساس) مع تقسيم العمل على وكلاء متعددين لتسريع التنفيذ.
