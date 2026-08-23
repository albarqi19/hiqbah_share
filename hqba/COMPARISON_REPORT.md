# تقرير المقارنة الشاملة: ملفات المواصفات (txt) مقابل الكود الفعلي

> **آخر تحديث:** 2026-03-14 — بعد الفحص الشامل وإصلاح 14 مشكلة (4 حرجة + 6 عالية + 4 متوسطة)

## ملخص تنفيذي

تم فحص 11 ملف مواصفات في مجلد `txt/` ومقارنتها بالكود الفعلي في Backend (Laravel) و Frontend (React).
كما تم إجراء فحص معمّق لسير العمل (Workflows) واكتشاف وإصلاح 14 مشكلة منطقية.

### النتيجة العامة:
- **التغطية الإجمالية للـ Backend: ~92%** — معظم المتطلبات مُنفذة + تم إصلاح مشاكل سير العمل
- **التغطية الإجمالية للـ Frontend: ~75%** — الصفحات الأساسية موجودة لكن بعض اللوحات والتقارير ناقصة
- **عدد الفجوات المتبقية: 20 فجوة** موزعة على الأقسام المختلفة
- **عدد المشاكل المُصلحة: 14 مشكلة** في سير العمل والمنطق البرمجي

---

## الإصلاحات المُطبقة (14 إصلاح)

> هذا القسم يوثق المشاكل التي تم اكتشافها أثناء الفحص وإصلاحها مباشرة.

### إصلاحات حرجة (CRITICAL)

| # | المشكلة | الملفات المُعدّلة | التفاصيل |
|---|---------|-------------------|----------|
| C1 | `marketing → production_ready` كان مسدودًا | `MarketingService.php`, `CropMarketingController.php`, `routes.php` | أُضيف `approve()` method + endpoint `POST /crops/{id}/marketing/approve` + تقدم المحصول تلقائيًا لـ `production_ready` |
| C2 | تخطي مراحل الطلبات من `Allocated` | `OrderStatus.php` سطر 65 | `Allocated` الآن يسمح فقط بـ `InProduction` (كان يسمح بالقفز لـ Packing/Shipped مباشرة) |
| C3 | فحص المخزون غير إلزامي | `OrderService.php` | الانتقال من `inventory_check → accounting` يفحص توفر المخزون الآن. إذا غير كافي = يرمي خطأ 422 |
| C4 | لا يوجد تصريحات (Authorization) للطلبات | `OrderPolicy.php` (**جديد**), `OrderController.php`, `AppServiceProvider.php` | كل endpoint محمي بصلاحيات حسب مرحلة الطلب ودور المستخدم |

### إصلاحات عالية الأهمية (HIGH)

| # | المشكلة | الملف | التفاصيل |
|---|---------|-------|----------|
| H1 | Retest في Cupping يتجاوز Events | `CuppingService.php` سطر 111 | كان يستخدم `$crop->update()` مباشرة بدون إطلاق `CropStatusChanged` event — أُصلح لاستخدام `advanceStatus()` |
| H2 | `RecipePublished` event غير مسجل | `EventServiceProvider.php`, `OnRecipePublished.php` (**جديد**) | أُضيف listener يرسل إشعار للأدمن عند نشر وصفة |
| H3 | QC `conditional` لا يغير حالة الباتش | `QualityCheckService.php` | الباتش كان يعلق في `pending_qc` عند قرار conditional — الآن يعود لحالة `cooling` مع إشعار |
| H4 | حركة `Sale` غير مربوطة | `OrderService.php` | عند شحن الطلب (`shipped`) يتم خصم المنتجات من المخزون تلقائيًا عبر `InventoryService::recordMovement()` |
| H5 | وزن المحصول قد يصبح سالبًا | `Crop.php` | `deductGreenWeight()` و `deductGreenWeightKg()` يتحققان أن الوزن المتبقي كافي قبل الخصم |
| H6 | VAT غير مُحقق في الطلبات | `CreateOrderRequest.php` | `vat_percent` الآن: `numeric, min:0, max:100` |

### إصلاحات متوسطة (MEDIUM)

| # | المشكلة | الملف | التفاصيل |
|---|---------|-------|----------|
| M1 | فورم التعبئة ناقص `roast_batch_id` | `PackagingPage.tsx` | dropdown لاختيار roast batch من الباتشات المعتمدة + auto-fill crop_id + toast notifications |
| M2 | Error handling فارغ في الطلبات | `OrderDetailPage.tsx` | toast notifications لكل عملية (نجاح/فشل) مع عرض رسالة الخطأ من السيرفر |
| M3 | لا يوجد زر اعتماد التسويق | `CropDetailPage.tsx`, `crops.ts` | زر "اعتماد التسويق" أخضر يظهر عندما المحصول في مرحلة `marketing` والتسويق `draft` |
| M4 | طريقة الدفع بدون whitelist | `OrderController.php` | `payment_method` محصور في: `bank_transfer, cash, check, credit_card` + validation على status enum |

---

## 1. إدارة الطلبات (ادارة الطلبات/مراحل سير الطلب المتقدمة للمحمصة.txt)

### ما يصفه الملف:
- 11 مرحلة لسير الطلب: إنشاء → مراجعة مبيعات → فحص مخزون → محاسبة → تأكيد مبيعات → دفع → تخصيص مخزون → إنتاج/تحميص → تعبئة → شحن → تأكيد استلام
- أدوار: Admin, Sales, Accounting, Production, Packaging, Shipping, Sales Rep
- إشعارات: SMS, Email, App Notification
- ربط الطلب بدفعة التحميص (Order → Roasting Batch)
- طباعة كشف تجميع وبوليصة شحن

### ما هو موجود في Backend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| OrderStatus Enum | ✅ موجود | 12 حالة: draft, sales_review, inventory_check, accounting, sales_confirm, pending_payment, allocated, in_production, packing, shipped, closed, cancelled |
| Order Model | ✅ موجود | `app/Modules/Orders/Models/Order.php` - يشمل customer, items, status_history |
| OrderItem Model | ✅ موجود | `app/Modules/Orders/Models/OrderItem.php` |
| OrderStatusHistory | ✅ موجود | `app/Modules/Orders/Models/OrderStatusHistory.php` |
| OrderService | ✅ موجود | `app/Modules/Orders/Services/OrderService.php` - transition, inventoryCheck, confirmPayment |
| allowedTransitions() | ✅ مُصلح | منطق الانتقال مُحكم — لا يمكن تخطي `InProduction` من `Allocated` |
| Inventory Check API | ✅ مُصلح | `GET /api/v1/orders/{order}/inventory-check` — الفحص **إلزامي** قبل الانتقال لـ accounting |
| Payment Confirmation | ✅ مُصلح | `PUT /api/v1/orders/{order}/payment` — whitelist لطرق الدفع |
| OrderPolicy | ✅ مُضاف | `app/Modules/Orders/Policies/OrderPolicy.php` — صلاحيات لكل مرحلة حسب الدور |
| Sale Inventory Movement | ✅ مُضاف | عند الشحن يتم خصم المنتجات من المخزون تلقائيًا |
| Customer Model | ✅ موجود | `app/Modules/Orders/Models/Customer.php` مع sync branches |
| إشعارات تغيير الحالة | ✅ موجود | NotificationService في OrderService عند كل transition |
| VAT Validation | ✅ مُصلح | `vat_percent: numeric, min:0, max:100` |

### ما هو موجود في Frontend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| OrdersPage | ✅ موجود | `frontend/src/pages/admin/orders/OrdersPage.tsx` |
| OrderDetailPage | ✅ مُصلح | `frontend/src/pages/admin/orders/OrderDetailPage.tsx` — مع toast notifications للأخطاء |
| CustomersPage | ✅ موجود | `frontend/src/pages/admin/customers/CustomersPage.tsx` |
| Orders API | ✅ موجود | `frontend/src/api/orders.ts` |
| Order Types | ✅ موجود | في `frontend/src/types/index.ts` |

### حالة سير الطلبات بعد الإصلاح:
```
draft ✅ → sales_review ✅ → inventory_check ✅ (فحص إلزامي) → accounting ✅
→ sales_confirm ✅ → pending_payment ✅ → allocated ✅ → in_production ✅ (لا تخطي)
→ packing ✅ → shipped ✅ (يخصم المخزون) → closed ✅
```

### الفجوات المتبقية:

| # | الفجوة | الأهمية |
|---|--------|---------|
| 1 | **تطبيق مندوب المبيعات (Sales Rep App)** - الملف يصف واجهة خاصة للمندوب لإنشاء الطلبات من التطبيق | عالية |
| 2 | **طباعة كشف تجميع الطلب** - لا يوجد endpoint لطباعة | متوسطة |
| 3 | **طباعة بوليصة الشحن** - لا يوجد endpoint لإنشاء بوليصة شحن | متوسطة |
| 4 | **إشعارات SMS و Email** - الإشعارات حالياً App Notification فقط | متوسطة |
| 5 | **ربط الطلب بدفعة التحميص مباشرة** (Order → Roasting Batch) - العلاقة غير مباشرة حالياً | منخفضة |

---

## 2. الجرد الدوري (الجرد/مراحل سير الجرد الدوري.txt)

### ما يصفه الملف:
- 8 خطوات: إنشاء جرد → جرد بن أخضر → جرد إنتاج محمص → جرد منتجات نهائية → جرد بار → مراجعة مالية → تصدير لقيود → اعتماد وإغلاق
- Inventory Scope: Roastery, Bar, Full Inventory
- حساب الفرق (Variance) والأثر المالي (Financial Impact)
- تصدير ملف Qoyod (Excel/CSV)
- لوحة Inventory Accuracy و Roastery Yield Tracking

### ما هو موجود في Backend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| InventoryAudit Model | ✅ موجود | `app/Modules/Inventory/Models/InventoryAudit.php` - branch_id, audit_type, status |
| InventoryAuditItem Model | ✅ موجود | `app/Modules/Inventory/Models/InventoryAuditItem.php` - system_quantity, actual_quantity, variance |
| AuditService | ✅ موجود | `app/Modules/Inventory/Services/AuditService.php` - open, countItem, approve, close |
| Audit Types | ✅ موجود | green, roasted, finished, bar, full - في AuditService |
| Reconciliation | ✅ موجود | في approve() يتم تطبيق reconciliation لكل item بفرق |
| Migration | ✅ موجود | `2026_03_14_800003_create_inventory_audits_table.php` |
| API Routes | ✅ موجود | GET/POST audits, PUT items count, approve, close |
| AccountingExportService | ✅ موجود | `app/Modules/Reporting/Services/AccountingExportService.php` - purchases, sales, inventory_adjustments |

### ما هو موجود في Frontend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| صفحة جرد مخصصة | ❌ غير موجود | لا توجد صفحة Audit في الفرونت اند |
| Inventory Dashboard | ✅ موجود | `frontend/src/pages/admin/inventory/InventoryDashboardPage.tsx` |

### الفجوات:

| # | الفجوة | الأهمية |
|---|--------|---------|
| 1 | **صفحة الجرد في Frontend** - لا توجد صفحة مخصصة للجرد (Audit Page) في الفرونت اند | عالية |
| 2 | **تصدير ملف Qoyod بصيغة Excel/CSV** - الـ AccountingExportService موجود لكن يعيد JSON وليس ملف Excel | متوسطة |
| 3 | **Inventory Accuracy Dashboard** - لا يوجد تقرير دقة الجرد بنسب مئوية لكل فرع | متوسطة |
| 4 | **Roastery Yield Tracking** - تتبع فاقد التحميص (Green → Roasted Loss) كتقرير مستقل | منخفضة |

---

## 3. الرقمنة (الرقمنة.txt)

### ما يصفه الملف:
قائمة متطلبات عامة تشمل:
- إدارة كامل مراحل المحصول
- ربط المورد بالمحصول بالطلبات
- إدارة المعايرة والوصفات والنظافة
- الفواتير والمحاسبة
- ربط API
- رقابة على الصلاحيات
- نقاط البيع (POS) خارجية
- ربط Salla
- SOP إجراءات تشغيل قياسية

### ما هو موجود:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| إدارة المحصول | ✅ موجود | Module كامل: Crops — دورة حياة كاملة من ordered حتى closed |
| ربط المورد | ✅ موجود | Procurement Module — PO → Crop تلقائي عبر Events |
| المعايرة | ✅ موجود | Branch Module - Calibration + AI suggestions |
| الوصفات | ✅ موجود | Recipes Module — espresso + pour over + versioning |
| النظافة | ✅ موجود | Branch Module - Cleaning — جداول + مهام يومية |
| الطلبات | ✅ مُصلح | Orders Module — 11 مرحلة + صلاحيات + فحص مخزون إلزامي |
| رقابة الصلاحيات | ✅ موجود | Spatie Permission — 14 دور + 55 صلاحية |
| API | ✅ موجود | RESTful API كامل — 100+ endpoint |
| إدارة المخزون | ✅ مُصلح | Inventory Module — حركة Sale مربوطة + حماية التزامن |

### الفجوات:

| # | الفجوة | الأهمية |
|---|--------|---------|
| 1 | **ربط Salla** - لا يوجد integration مع Salla | عالية (مذكور في القرارات التقنية) |
| 2 | **ربط Qoyod المحاسبي** - تصدير فقط، لا يوجد ربط مباشر API | عالية |
| 3 | **SOP (إجراءات تشغيل قياسية)** - لا يوجد module لإدارة SOPs | منخفضة |
| 4 | **نظام الفواتير** - لا يوجد module مستقل للفواتير | متوسطة (يعتمد على POS خارجي) |

---

## 4. المعايرة اليومية للفروع (الكالبريشن و الوصفات/مراحل المعايرة اليومية للفروع.txt)

### ما يصفه الملف (16 مرحلة تفصيلية):
1. تسجيل دخول الباريستا (PIN)
2. اختيار الفرع
3. اختيار الماكينة (Machine ID)
4. اختيار المطحنة (Grinder ID)
5. اختيار نوع التحضير (Espresso / Pour Over)
6. اختيار البن (Bean Name + S/N)
7. تحميل الوصفة الرسمية (Official Recipe)
8. إدخال بيانات المعايرة (Dose, Grind, Time, Yield, TDS, Ext%, Acidity, Finish, Balance)
9. مقارنة النتائج بالوصفة
10. تنبيهات المعايرة (Calibration Alert)
11. تعديل تلقائي للوصفة (Auto Recipe Adjustment)
12. نظام تشخيص الاستخلاص (Extraction Diagnostic)
13. **نظام AI للتعلم والأهداف التكيفية** (AI Learning & Adaptive Targets)
14. اعتماد المعايرة
15. سجل المعايرة
16. لوحة تحكم المعايرة

### ما هو موجود في Backend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| CalibrationSession Model | ✅ موجود | branch_id, machine, grinder, crop, recipe, barista, shots |
| CalibrationShot Model | ✅ موجود | dose, grind_setting, extraction_time, yield, tds, extraction_percent, acidity_score, finish_score, balance_score |
| CalibrationStatus Enum | ✅ موجود | Open, Completed, Approved |
| CalibrationService | ✅ موجود | start, addShot, finish, approve — مع auto waste recording |
| CalibrationCompleted Event | ✅ موجود | يُطلق عند إكمال المعايرة → يخصم من المخزون تلقائيًا |
| **AiCalibrationService** | ✅ موجود | تحليل AI عبر OpenRouter (Gemini) - يشمل grinder drift, bean aging, extraction analysis |
| AiCalibrationSuggestion Model | ✅ موجود | suggested_dose/grind/time/yield, confidence, alerts |
| checkRange() | ✅ موجود | في CalibrationShot - مقارنة بالـ target |
| API Routes | ✅ موجود | sessions CRUD, shots, finish, approve, ai-analyze, ai-suggestions |

### ما هو موجود في Frontend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| BaristaCalibrationPage | ✅ موجود | `stations/barista/BaristaCalibrationPage.tsx` - start session, add shots, visual range check |
| BaristaRecipesPage | ✅ موجود | `stations/barista/BaristaRecipesPage.tsx` |
| Calibration API | ✅ موجود | `frontend/src/api/calibration.ts` |

### الفجوات:

| # | الفجوة | الأهمية |
|---|--------|---------|
| 1 | **لوحة تحكم المعايرة في Admin** - لا توجد صفحة admin/calibration-dashboard | عالية |
| 2 | **تنبيهات المعايرة الآنية (Calibration Alert)** - النظام يحسب is_within_range لكن لا يعرض التنبيه بشكل بارز | متوسطة |
| 3 | **Extraction Diagnostic System** - التشخيص الكامل (Under/Over/Channeling) موجود في AI Service لكن ليس كواجهة مستقلة | متوسطة |
| 4 | **نشر Adaptive Targets للفروع** - AI يقترح لكن لا يوجد آلية publish to branch | منخفضة |
| 5 | **معايرة Pour Over** - النظام مبني للإسبريسو فقط حالياً | متوسطة |

---

## 5. وصفات القهوة (الكالبريشن و الوصفات/وصفات القهوة الإسبريسو والدريب.txt)

### ما يصفه الملف:
6 مراحل: إنشاء وصفة → معايرة إسبريسو → اعتماد إسبريسو → معايرة دريب → اعتماد دريب → نشر للفروع

### ما هو موجود في Backend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| Recipe Model | ✅ موجود | crop_id, recipe_code, recipe_type, version, status |
| EspressoRecipe Model | ✅ موجود | dose, grind_setting, extraction_time, yield, tds, extraction_percent |
| PourOverRecipe Model | ✅ موجود | dose, grind_setting, brew_type (hot/iced), bloom_time, bloom_water, pours, total_water, total_time |
| EspressoRecipeTrial Model | ✅ موجود | trial_number, dose, grind, time, yield, tds, acidity, finish, balance, is_best_shot |
| RecipeStatus Enum | ✅ موجود | draft, calibrating, pending_approval, approved, published |
| RecipeType Enum | ✅ موجود | espresso, pour_over |
| BrewType Enum | ✅ موجود | hot, iced |
| Recipe Versioning | ✅ موجود | parent_recipe_id, version, is_current |
| select-best-shot API | ✅ موجود | `POST /api/v1/recipes/{recipe}/select-best-shot` |
| approve/publish APIs | ✅ موجود | `POST /api/v1/recipes/{recipe}/approve` و `publish` |
| RecipePublished Event | ✅ مُصلح | `RecipePublished` event + `OnRecipePublished` listener مسجل الآن — يرسل إشعار للأدمن |

### ما هو موجود في Frontend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| RecipesPage | ✅ موجود | `pages/admin/recipes/RecipesPage.tsx` |
| RecipeDetailPage | ✅ موجود | `pages/admin/recipes/RecipeDetailPage.tsx` |
| Recipes API | ✅ موجود | `frontend/src/api/recipes.ts` |
| BaristaRecipesPage | ✅ موجود | `stations/barista/BaristaRecipesPage.tsx` |

### الفجوات:

| # | الفجوة | الأهمية |
|---|--------|---------|
| 1 | **حساب Extraction Yield التلقائي** - المعادلة (TDS × Beverage Weight) / Dose مذكورة في الملف لكن غير مطبقة تلقائياً في الباك اند | منخفضة |

**تقييم: هذا القسم مُنفذ بالكامل تقريباً (97%+)**

---

## 6. تنظيف معدات القهوة اليومية (النظافة/مرحلة تنظيف معدات القهوة اليومية.txt)

### ما يصفه الملف:
- إعداد جدول التنظيف (Admin Setup) مع Equipment Type, Cleaning Task, Frequency
- لوحة مهام التنظيف اليومية
- بدء/إنهاء التنظيف مع الصور
- خطوات التنظيف (SOP) لكل معدة
- مراجعة المشرف (Approve/Request Re-cleaning)
- تنبيهات التأخير
- Equipment Hygiene Score
- تقارير شهرية

### ما هو موجود في Backend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| CleaningSchedule Model | ✅ موجود | branch_id, equipment_id, task_name, frequency, time_of_day, steps, duration_minutes |
| CleaningTask Model | ✅ موجود | status, started_at, completed_at, before_photos, after_photos, notes, review_status |
| CleaningStatus Enum | ✅ موجود | Pending, InProgress, Completed, Reviewed, Overdue |
| CleaningService | ✅ موجود | schedules, todayTasks, start, complete, review, cleanlinessScore |
| Cleaning Score API | ✅ موجود | `GET /api/v1/cleaning/score` |
| API Routes | ✅ موجود | schedules CRUD, today tasks, start/complete/review |

### ما هو موجود في Frontend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| CleaningStationPage | ✅ موجود | `stations/cleaning/CleaningStationPage.tsx` - عرض المهام، بدء، إكمال، مراجعة |

### الفجوات:

| # | الفجوة | الأهمية |
|---|--------|---------|
| 1 | **صفحة إدارة جداول النظافة في Admin** - لا توجد صفحة admin لإدارة الجداول | عالية |
| 2 | **رفع صور قبل/بعد في Station** - النموذج في الـ model يدعمها لكن واجهة الرفع غير مطبقة | متوسطة |
| 3 | **عرض خطوات SOP التفصيلية** - الـ steps مخزنة كـ array لكن لا تُعرض كـ checklist | متوسطة |
| 4 | **تقرير النظافة الشهري** - غير موجود كـ endpoint | منخفضة |

---

## 7. متابعة جدول النظافة (النظافة/مرحلة متابعة جدول النظافة.txt)

### ما يصفه الملف:
- نظام مشابه لتنظيف المعدات لكن للمرافق العامة (حمامات، صالة، مطبخ)
- صور قبل/بعد التنظيف
- مراجعة المشرف
- Cleanliness Score لكل فرع
- نظام Quality Control عند انخفاض النتيجة عن 80%
- نظام إسناد المهام بالتناوب

### ما هو موجود:
نفس نظام التنظيف أعلاه يُستخدم (CleaningSchedule + CleaningTask) - النظام موحد ويغطي كلا النوعين (معدات + مرافق) عبر `task_name` و `area`.

### الفجوات:

| # | الفجوة | الأهمية |
|---|--------|---------|
| 1 | **حقل Area** - الملف يذكر (bathroom, hall, kitchen) لكن CleaningSchedule لا يحتوي حقل area مستقل | متوسطة |
| 2 | **Cleanliness Score Dashboard** - الـ API موجود لكن لا توجد صفحة dashboard | متوسطة |
| 3 | **نظام إسناد بالتناوب** - لا يوجد منطق rotation للموظفين | منخفضة |
| 4 | **Quality Control Alert عند < 80%** - غير مطبق | متوسطة |

---

## 8. تسجيل هدر اختبارات الجودة (الهدر/مرحلة تسجيل هدر اختبارات الجودة.txt)

### ما يصفه الملف:
- تسجيل كمية القهوة المستخدمة في اختبارات QC (عدد أكواب × الجرعة = الإجمالي)
- أنواع الاختبارات: Cupping, Espresso Test, Filter Test, Sample Roast Test
- تقييم الجودة: Aroma, Flavor, Acidity, Body, Aftertaste, Balance
- خصم تلقائي من المخزون (QC Testing Waste)
- تقرير الهدر مع أنواعه

### ما هو موجود في Backend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| WasteRecord Model | ✅ موجود | crop_id, waste_type, weight_grams, source (morphTo) — **تسجيل تلقائي 100%** |
| WasteType Enum | ✅ موجود | trial_roast_sample, cupping_waste, roast_loss, qc_sample, calibration_waste |
| MovementType: QcWaste | ✅ موجود | `qc_waste` في Inventory MovementType |
| OnQualityCheckDone Listener | ✅ موجود | `app/Modules/Inventory/Listeners/OnQualityCheckDone.php` |
| OnCuppingCompleted Listener | ✅ موجود | `app/Modules/Quality/Listeners/OnCuppingCompleted.php` |
| Waste Reports | ✅ موجود | `GET /api/v1/waste-records/summary` و `GET /api/v1/waste-records/crop/{cropId}` |
| CuppingSession Model | ✅ موجود | cups_count, dose_per_cup, total_coffee_used + تقييمات SCA كاملة |

### ما هو موجود في Frontend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| WasteRecords API | ✅ موجود | `frontend/src/api/wasteRecords.ts` |

### الفجوات:

| # | الفجوة | الأهمية |
|---|--------|---------|
| 1 | **صفحة تقارير الهدر في Frontend** - لا توجد صفحة مخصصة لعرض تقارير الهدر | عالية |
| 2 | **هدر Training Waste** - مذكور في الملف لكن غير موجود في WasteType Enum | منخفضة |
| 3 | **هدر Brewing Waste** - مذكور في الملف لكن غير موجود | منخفضة |

**ملاحظة:** تسجيل الهدر في الباك اند يتم **تلقائياً** عبر Events & Listeners (كما هو مطلوب في CLAUDE.md: "Waste is ALWAYS automatic")

---

## 9. تسجيل هدر المعايرة (الهدر/مرحلة تسجيل هدر المعايرة.txt)

### ما يصفه الملف (12 خطوة تفصيلية):
- بدء جلسة معايرة → تسجيل كل shot → إنهاء → حساب الهدر (shots × dose)
- خصم تلقائي من المخزون
- لوحة هدر المعايرة: حسب الفرع، حسب البن
- متوسط shots لكل باريستا
- KPI: Calibration Waste % = Waste / Total Usage
- تنبيه عدم كفاءة (> 5 shots)
- تنبيه Equipment Drift
- تقرير أسبوعي

### ما هو موجود في Backend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| CalibrationSession.recalculate() | ✅ موجود | total_shots, total_dose_grams, total_waste_grams |
| CalibrationCompleted Event | ✅ موجود | يُطلق عند إنهاء الجلسة |
| OnCalibrationCompleted Listener | ✅ موجود | `app/Modules/Inventory/Listeners/OnCalibrationCompleted.php` - خصم تلقائي |
| MovementType: CalibrationWaste | ✅ موجود | `calibration_waste` |
| WasteType: CalibrationWaste | ✅ موجود | في Quality module |
| AI Alerts (Equipment Drift, etc.) | ✅ موجود | في AiCalibrationService |

### الفجوات:

| # | الفجوة | الأهمية |
|---|--------|---------|
| 1 | **Calibration Waste Dashboard** - لا توجد لوحة مخصصة بهدر المعايرة | عالية |
| 2 | **متوسط shots لكل باريستا** - لا يوجد endpoint | متوسطة |
| 3 | **KPI: Calibration Waste %** - غير محسوب | متوسطة |
| 4 | **تنبيه عدم كفاءة (> 5 shots)** - غير مطبق | منخفضة |
| 5 | **تقرير أسبوعي** - غير موجود | منخفضة |

---

## 10. النظام الرقمي لإدارة جودة المحاصيل (تسجيل البن/النظام الرقمي لإدارة جودة المحاصيل.txt)

### ما يصفه الملف (10 مراحل):
1. Green Coffee Inspection
2. Roast Batch Creation
3. Roast Monitoring
4. Roasted Coffee QC (Visual + Aroma + Taste)
5. Packaging Approval
6. Inventory Release
7. Market Monitoring
8. Customer Complaint System
9. Quality Intelligence Dashboard
10. Coffee Quality History + Early Warning System

### ما هو موجود في Backend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| GreenCoffeeInspection | ✅ موجود | moisture, water_activity, density, screen_size, defects, decision |
| RoastBatch | ✅ موجود | `app/Modules/Production/Models/RoastBatch.php` |
| RoastQualityCheck | ✅ مُصلح | `app/Modules/Production/Models/RoastQualityCheck.php` — **conditional decision يعيد الباتش لـ cooling الآن** |
| PackagingLot | ✅ مُصلح | `PackagingPage.tsx` مع roast_batch dropdown |
| Complaint System | ✅ موجود | `app/Modules/Quality/Models/Complaint.php` - store, investigate, resolve |
| RoastBatchStatus | ✅ موجود | queued, roasting, cooling, pending_qc, approved, rejected |
| Events | ✅ موجود | RoastBatchStarted, RoastBatchCompleted, QualityCheckDone, PackagingCompleted |
| Inventory Listeners | ✅ موجود | OnRoastBatchStarted (green OUT), OnRoastBatchCompleted (roasted IN), OnPackagingCompleted (finished IN) |
| Crop Reports | ✅ موجود | `GET /api/v1/reports/crop/{id}` |
| Waste Reports | ✅ موجود | `GET /api/v1/reports/waste` |

### حالة سير الإنتاج بعد الإصلاح:
```
queued ✅ → roasting ✅ → cooling ✅ → pending_qc ✅ → approved ✅
                                                    → rejected ✅ (مع إشعار)
                                                    → conditional ✅ → cooling (مع إشعار)
```

### ما هو موجود في Frontend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| RoasterStationPage | ✅ موجود | queue, start, complete batches |
| QcInspectionPage | ✅ موجود | green coffee inspection |
| QcRoastBatchPage | ✅ موجود | roast batch quality check |
| PackagingPage | ✅ مُصلح | packaging lots — مع roast batch selector |
| ComplaintsPage | ✅ موجود | complaints management |
| CropJourneyPage | ✅ موجود | full traceability flow |

### الفجوات:

| # | الفجوة | الأهمية |
|---|--------|---------|
| 1 | **Market Monitoring** - ملاحظات العملاء والباريستا وتجار الجملة - غير موجود | متوسطة |
| 2 | **Quality Intelligence Dashboard** - Batch Pass Rate, Roast Consistency, Complaint Rate, Defect Rate كلوحة شاملة | عالية |
| 3 | **Early Warning System** - تنبيهات عند تكرار الرفض أو زيادة الشكاوى | متوسطة |
| 4 | **Corrective Action** - نظام الإجراءات التصحيحية (Re-roast, Adjust profile, Recall batch) | متوسطة |
| 5 | **Visual Inspection في QC** - Color Consistency, Quakers, Broken Beans - النموذج موجود لكن التفاصيل ناقصة | منخفضة |

---

## 11. دخول البن الأخضر وتسجيله (تسجيل البن/دخول البن الأخضر وتسجيلة.txt)

### ما يصفه الملف (8 مراحل):
1. الاستلام (GC Receiving + QR/Barcode + Inventory IN)
2. التحميص التجريبي (Trial Roast Profile + Cupping scheduling)
3. فحص الجودة والكوبنق (SCA Cupping + Decision)
4. التعبئة والتكويد (Packaging + QR traceability)
5. التسعير (Cost calculation + margins)
6. الإنتاج
7. التسويق والطباعة (Label PDF + Social media text)
8. الإغلاق

### ما هو موجود في Backend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| CropStatus Enum | ✅ موجود | 12 حالة تغطي كل المراحل: ordered → received → inspecting → trial_roasting → cupping → approved → pricing → marketing → production_ready → in_production → depleted → closed |
| GreenCoffeeLot + Receive | ✅ موجود | `POST /api/v1/green-coffee/receive` |
| GreenCoffeeInspection | ✅ موجود | moisture, water_activity, density, defects |
| TrialRoast | ✅ موجود | charge_temp, drying_time, maillard_time, first_crack, development, roast_curve_data |
| CuppingSession | ✅ مُصلح | SCA compliant + **Retest يستخدم advanceStatus() الآن** |
| CropPricing | ✅ موجود | landed_cost, green_cost, roasting_loss%, roasting_cost, packaging_cost, operation_cost, shipping_cost, total_cost, target_margin, retail/wholesale prices |
| CropMarketing | ✅ مُصلح | product_name, description, flavor_display + **اعتماد التسويق مُضاف** (`POST /crops/{id}/marketing/approve`) |
| Marketing Approval | ✅ مُضاف | `MarketingService::approve()` — يقدم المحصول تلقائيًا لـ `production_ready` |
| QR Code Generation | ✅ موجود | `GET /api/v1/crops/{crop}/qr-code` |
| Timeline/Traceability | ✅ موجود | `GET /api/v1/crops/{crop}/timeline` و `/traceability` |
| Label Generation | ✅ موجود | `POST /api/v1/crops/{crop}/marketing/generate-label` |
| Social Media Export | ✅ موجود | `GET /api/v1/crops/{crop}/marketing/export` |
| Inventory Auto Events | ✅ موجود | OnGreenCoffeeReceived → inventory_in |
| CropStatusChanged Event | ✅ مُصلح | يُطلق عند كل تغيير حالة بما في ذلك Retest |
| Weight Validation | ✅ مُضاف | لا يمكن خصم وزن أكثر من المتبقي |

### حالة دورة حياة المحصول بعد الإصلاح:
```
ordered ✅ → received ✅ → inspecting ✅ → trial_roasting ✅ → cupping ✅
→ approved ✅ → pricing ✅ → marketing ✅ → production_ready ✅ (تم فتح المسار)
→ in_production ✅ → depleted ✅ → closed ✅
```

### ما هو موجود في Frontend:

| العنصر | الحالة | التفاصيل |
|--------|--------|----------|
| CropsPage | ✅ موجود | قائمة المحاصيل |
| CropDetailPage | ✅ مُصلح | تفاصيل شاملة + **زر اعتماد التسويق** |
| CropStatusBoardPage | ✅ موجود | لوحة Kanban للحالات |
| CropJourneyPage | ✅ موجود | رحلة المحصول التفاعلية (ReactFlow) |
| WarehouseStationPage | ✅ موجود | استلام البن الأخضر |
| QcInspectionPage | ✅ موجود | فحص الجودة |
| CuppingForm Component | ✅ موجود | `components/CuppingForm/` |
| CoffeeFlavorWheel | ✅ موجود | `components/CoffeeFlavorWheel/` |
| Marketing Approval UI | ✅ مُضاف | `crops.ts` API + زر في CropDetailPage |

### الفجوات:

| # | الفجوة | الأهمية |
|---|--------|---------|
| 1 | **باركود GreenCoffeeLot** - الحقل موجود لكن لا يوجد endpoint لتوليده تلقائياً (QR موجود) | منخفضة |

**تقييم: هذا القسم مُنفذ بالكامل تقريباً (98%+)**

---

## ميزات موجودة في الكود وغير مذكورة في ملفات txt

| الميزة | الموقع | الملاحظة |
|--------|--------|----------|
| **نظام التحويلات بين الفروع (Inter-Location Transfers)** | `Inventory/Controllers/TransferController.php` + Frontend `TransfersPage.tsx` | نظام كامل: draft → approved → shipped → received → confirmed |
| **Activity Log** | `Reporting/Controllers/ActivityLogController.php` + Frontend `ActivityLogPage.tsx` | تتبع جميع التغييرات عبر Spatie Activity Log |
| **Notifications System** | `Core/Controllers/NotificationController.php` + Frontend `NotificationsPage.tsx` | إشعارات داخلية |
| **Dashboard** | `Reporting/Controllers/DashboardController.php` + Frontend `DashboardPage.tsx` | لوحة تحكم إدارية مع KPIs |
| **Settings** | `Core/Controllers/SettingController.php` + Frontend `SettingsPage.tsx` | إعدادات النظام |
| **Inventory Valuation** | `GET /api/v1/inventory/valuation` | تقييم مالي للمخزون (SAR) |
| **Cup Consumption Service** | `Inventory/Services/CupConsumptionService.php` | خدمة حساب استهلاك الأكواب |
| **Inventory Low Alert Event** | `Inventory/Events/InventoryLow.php` + Listener | تنبيه انخفاض المخزون تلقائي |
| **Recipe Versioning** | parent_recipe_id, create-version API | إصدارات متعددة للوصفة |
| **PurchaseOrder Workflow** | Procurement Module كامل | أوامر شراء: draft → approved → ordered → shipped → received |
| **Crop QR Code** | `GET /api/v1/crops/{crop}/qr-code` | QR لكل محصول |
| **OrderPolicy (جديد)** | `app/Modules/Orders/Policies/OrderPolicy.php` | صلاحيات مبنية على الدور لكل مرحلة |
| **RecipePublished Listener (جديد)** | `app/Modules/Recipes/Listeners/OnRecipePublished.php` | إشعار عند نشر وصفة |

---

## خريطة الأحداث (Events Map) — بعد الإصلاح

| Event | المصدر | المستمع | الحالة |
|-------|--------|---------|--------|
| PurchaseOrderApproved | Procurement | Crops::OnPurchaseOrderApproved | ✅ |
| GreenCoffeeReceived | Crops | Inventory::OnGreenCoffeeReceived | ✅ |
| TrialRoastCompleted | Crops | Crops::OnTrialRoastCompleted | ✅ |
| CuppingCompleted | Crops | Quality::OnCuppingCompleted | ✅ |
| CropStatusChanged | Crops | (audit trail فقط) | ✅ |
| RoastBatchStarted | Production | Inventory::OnRoastBatchStarted | ✅ |
| RoastBatchCompleted | Production | Inventory::OnRoastBatchCompleted | ✅ |
| QualityCheckDone | Production | Inventory::OnQualityCheckDone | ✅ |
| PackagingCompleted | Production | Inventory::OnPackagingCompleted | ✅ |
| CalibrationCompleted | Branch | Inventory::OnCalibrationCompleted | ✅ |
| InventoryLow | Inventory | Inventory::OnInventoryLow | ✅ |
| **RecipePublished** | Recipes | **Recipes::OnRecipePublished** | ✅ مُصلح |

**12/12 events مربوطة بشكل صحيح**

---

## ملخص الفجوات المتبقية حسب الأولوية

### فجوات عالية الأهمية (يجب تنفيذها):
1. صفحة الجرد (Audit) في Frontend
2. لوحة تحكم المعايرة في Admin
3. صفحة تقارير الهدر في Frontend
4. Quality Intelligence Dashboard
5. صفحة إدارة جداول النظافة في Admin
6. Calibration Waste Dashboard
7. ربط Salla (مذكور في القرارات التقنية)
8. ربط Qoyod المباشر

### فجوات متوسطة الأهمية:
9. طباعة كشف تجميع + بوليصة شحن للطلبات
10. تصدير ملف Qoyod بصيغة Excel/CSV
11. Inventory Accuracy Dashboard
12. إشعارات SMS و Email
13. Early Warning System للجودة
14. Corrective Action system
15. Market Monitoring
16. رفع صور التنظيف في Station
17. Cleanliness Score Dashboard
18. متوسط shots لكل باريستا + KPI
19. معايرة Pour Over في Station
20. حقل Area في CleaningSchedule

### فجوات منخفضة الأهمية:
21. SOP management module
22. Training Waste / Brewing Waste types
23. نظام إسناد بالتناوب للنظافة
24. باركود تلقائي لـ GreenCoffeeLot
25. تنبيه عدم كفاءة المعايرة

---

## إحصائيات الكود الحالي (دقيقة)

### Backend:
- **9 Modules** في `app/Modules/` + `app/Core/`
- **42 Models** (5 Core + 37 Modules)
- **42 Migration files**
- **33 Controllers** (7 Core + 26 Modules)
- **33 Services** (5 Core + 28 Modules)
- **37 Enums** (5 Core + 32 Modules)
- **12 Events + 11 Listeners** — جميعها مسجلة في EventServiceProvider
- **26 API Resources** (JsonResource)
- **39 Form Requests** (validation)
- **1 Policy** (OrderPolicy)
- **9 route files** مع 100+ API endpoint
- **6 Seeders** (14 دور + 55 صلاحية)
- **إجمالي ملفات PHP: ~282**

### Frontend:
- **~40 Pages** (admin + stations + auth)
- **18 API modules** في `src/api/`
- **1 Zustand store** (authStore)
- **~100+ TypeScript types** في `src/types/index.ts`
- **7 Station pages**: Roaster, QC (2), Barista (2), Cleaning, Warehouse
- **3 Layouts**: Admin, Station, Auth
- **مكونات خاصة**: CoffeeFlavorWheel, CuppingForm (6 ملفات), CropJourneyMap
- **ثنائي اللغة**: عربي (primary) + إنجليزي مع RTL
