// ── Enums ──
export type BranchType = 'roastery' | 'branch';
export type EquipmentType = 'espresso_machine' | 'grinder' | 'brewer' | 'roaster';
export type EquipmentStatus = 'active' | 'maintenance' | 'inactive';
export type Language = 'ar' | 'en';
export type SettingType = 'string' | 'integer' | 'boolean' | 'json';

// ── Models ──
export interface User {
  id: number;
  name: string;
  name_ar: string;
  email: string;
  phone: string | null;
  branch_id: number | null;
  branch?: Branch;
  is_active: boolean;
  language: Language;
  avatar: string | null;
  last_login_at: string | null;
  roles?: string[];
  permissions?: string[];
  direct_permissions?: string[];
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  is_system: boolean;
  permissions?: string[];
  permissions_count?: number;
  users_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PermissionItem {
  id: number;
  name: string;
  action: string | null;
}

export interface PermissionGroup {
  resource: string;
  permissions: PermissionItem[];
}

export interface UserPermissionsPayload {
  user_id: number;
  roles: string[];
  role_permissions: string[];
  direct_permissions: string[];
  all_permissions: string[];
}

export interface Branch {
  id: number;
  name: string;
  name_ar: string;
  type: BranchType;
  city: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  settings: Record<string, unknown> | null;
  users_count?: number;
  equipment_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: number;
  branch_id: number;
  branch?: Branch;
  type: EquipmentType;
  code: string;
  name: string;
  brand: string | null;
  model: string | null;
  status: EquipmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: number;
  group: string;
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  type: SettingType;
}

// ── API Response ──
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
  success: boolean;
  message: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// ── Form Types ──
export interface LoginFormData {
  email: string;
  password: string;
}

export interface PinLoginFormData {
  pin: string;
}

export interface BranchFormData {
  name: string;
  name_ar: string;
  type: BranchType;
  city?: string;
  address?: string;
  phone?: string;
  is_active?: boolean;
}

export interface EquipmentFormData {
  branch_id: number;
  type: EquipmentType;
  code: string;
  name: string;
  brand?: string;
  model?: string;
  status?: EquipmentStatus;
  notes?: string;
}

export interface UserFormData {
  name: string;
  name_ar: string;
  email: string;
  phone?: string;
  password?: string;
  pin?: string;
  branch_id?: number | null;
  is_active?: boolean;
  language?: Language;
  roles: string[];
}

// ══════════════════════════════════════════
// WhatsApp Module
// ══════════════════════════════════════════

export type WhatsappInstanceStatus =
  | 'connecting'
  | 'open'
  | 'close'
  | 'disconnected'
  | 'missing'
  | 'unknown';

export interface WhatsappInstance {
  id: number;
  name: string;
  display_name: string | null;
  phone_number: string | null;
  status: WhatsappInstanceStatus;
  is_default: boolean;
  qr_code: string | null;
  connected_at: string | null;
  last_qr_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsappMessage {
  id: number;
  instance_id: number | null;
  instance_name?: string | null;
  to_number: string;
  direction: 'outbound' | 'inbound';
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  event_type: string | null;
  error: string | null;
  sent_at: string | null;
  created_at: string;
}

// ── Phase 2 Enums ──
export type PurchaseOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'shipped' | 'in_customs' | 'received' | 'cancelled';
export type CropStatus = 'ordered' | 'received' | 'inspecting' | 'trial_roasting' | 'cupping' | 'approved' | 'pricing' | 'marketing' | 'production_ready' | 'in_production' | 'depleted' | 'closed';
export type GreenCoffeeLotStatus = 'received' | 'inspecting' | 'approved' | 'rejected' | 'conditional';
export type InspectionDecision = 'approved' | 'rejected' | 'conditional';
export type TrialRoastStatus = 'in_progress' | 'completed' | 'selected';
export type RoastLevel = 'light' | 'medium_light' | 'medium' | 'medium_dark' | 'dark';
export type UsageType = 'espresso' | 'filter' | 'both';
export type CuppingDecision = 'approved' | 'rejected' | 'retest';
export type CuppingStatus = 'scheduled' | 'in_progress' | 'completed';
export type RecipeType = 'espresso' | 'pour_over';
export type RecipeStatus = 'draft' | 'calibrating' | 'pending_approval' | 'approved' | 'published';
export type WasteType = 'trial_roast_sample' | 'cupping_waste' | 'roast_loss' | 'qc_sample' | 'calibration_waste';
export type CuppingClassification = 'outstanding' | 'excellent' | 'very_good' | 'below_specialty';

// ── Phase 3: Production ──
export type RoastBatchStatus = 'queued' | 'roasting' | 'cooling' | 'pending_qc' | 'approved' | 'rejected';

export interface RoastBatchTarget {
  charge_temp: number | null;
  first_crack_time: string | null;
  first_crack_temp: number | null;
  development_time: string | null;
  drop_temp: number | null;
  total_time: string | null;
  roast_level: RoastLevel | null;
}

export interface RoastBatch {
  id: number;
  batch_number: string;
  crop_id: number;
  recipe_id: number | null;
  roaster_id: number;
  status: RoastBatchStatus;
  status_label: string;
  status_label_en: string;
  queue_position: number;
  is_priority: boolean;
  green_weight_kg: number;
  roasted_weight_kg: number | null;
  roast_loss_kg: number | null;
  roast_loss_percent: number | null;
  target: RoastBatchTarget;
  actual: RoastBatchTarget & { development_percent: number | null };
  roast_curve_data: Record<string, unknown> | null;
  crop?: { id: number; serial_number: string; name: string; name_ar: string; origin_country: string };
  recipe?: { id: number; recipe_code: string; recipe_type: string };
  roaster?: { id: number; name: string; name_ar: string };
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Phase 3: Customers, Orders, Packaging, Transfers ──
export type OrderStatus = 'draft' | 'sales_review' | 'inventory_check' | 'accounting' | 'sales_confirm' | 'pending_payment' | 'allocated' | 'in_production' | 'packing' | 'partially_shipped' | 'shipped' | 'delivered' | 'closed' | 'cancelled';
export type PackagingStatus = 'pending' | 'packed' | 'completed';
export type TransferStatus = 'draft' | 'approved' | 'shipped' | 'received' | 'confirmed' | 'cancelled';

export interface Customer {
  id: number;
  name: string;
  name_ar: string;
  type: 'internal' | 'external';
  branch_id: number | null;
  sales_rep_id: number | null;
  sales_rep?: { id: number; name: string; name_ar: string };
  price_list_id: number | null;
  price_list?: PriceList;
  payment_terms: PaymentTerms | null;
  credit_limit: number | null;
  customer_tier: CustomerTier;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  tax_number: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  crop_id: number;
  item_type: string;
  product_name: string;
  quantity: number;
  quantity_allocated: number;
  quantity_shipped: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  final_price: number | null;
  crop?: { id: number; serial_number: string; name: string; name_ar: string };
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  sales_rep_id: number | null;
  price_list_id: number | null;
  status: OrderStatus;
  status_label: string;
  status_label_en: string;
  subtotal: number;
  vat_percent: number;
  vat_amount: number;
  discount: number;
  discount_id: number | null;
  discount_code: string | null;
  total: number;
  payment_method: string | null;
  payment_status: string;
  payment_terms: string | null;
  payment_due_date: string | null;
  is_payment_overdue: boolean;
  paid_at: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  delivery_notes: string | null;
  quote_number: string | null;
  quote_generated_at: string | null;
  notes: string | null;
  customer?: Customer;
  creator?: { id: number; name: string; name_ar: string };
  sales_rep?: { id: number; name: string; name_ar: string };
  items?: OrderItem[];
  shipments?: Shipment[];
  allocations_count?: number;
  shipments_count?: number;
  status_history?: Array<{ from: string | null; to: string; changed_by: string; notes: string | null; created_at: string }>;
  created_at: string;
  updated_at: string;
}

export interface PackagingLot {
  id: number;
  lot_number: string;
  crop_id: number;
  roast_batch_id: number | null;
  status: PackagingStatus;
  status_label: string;
  status_label_en: string;
  package_size: string;
  bags_count: number;
  roasted_weight_used_kg: number;
  total_net_weight_kg: number;
  qr_data: Record<string, string> | null;
  crop?: { id: number; serial_number: string; name: string; name_ar: string };
  roast_batch?: { id: number; batch_number: string };
  packer?: { id: number; name: string; name_ar: string };
  packed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface TransferOrder {
  id: number;
  transfer_number: string;
  status: TransferStatus;
  status_label: string;
  status_label_en: string;
  from_branch?: { id: number; name: string; name_ar: string };
  to_branch?: { id: number; name: string; name_ar: string };
  creator?: { id: number; name: string; name_ar: string };
  items?: Array<{ id: number; crop_id: number; item_type: string; quantity_sent: number; quantity_received: number | null; quantity_variance: number | null; crop?: { id: number; serial_number: string; name: string; name_ar: string } }>;
  approved_at: string | null;
  shipped_at: string | null;
  received_at: string | null;
  notes: string | null;
  created_at: string;
}

// ── Phase 2 Models ──
export interface Supplier {
  id: number;
  name: string;
  country: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier?: Supplier;
  origin_country: string;
  region: string;
  farm: string | null;
  process: string;
  variety: string | null;
  altitude: string | null;
  quantity_kg: number;
  price_per_kg: number;
  shipping_cost: number;
  customs_cost: number;
  total_cost: number;
  currency: string;
  expected_date: string;
  status: PurchaseOrderStatus;
  created_by: number;
  approved_by: number | null;
  approved_at: string | null;
  notes: string | null;
  crops_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Crop {
  id: number;
  serial_number: string;
  purchase_order_id: number;
  supplier_id: number;
  supplier?: Supplier;
  purchase_order?: PurchaseOrder;
  name: string;
  name_ar: string;
  origin_country: string;
  region: string;
  farm: string | null;
  process: string;
  variety: string | null;
  altitude: string | null;
  lot_number: string;
  status: CropStatus;
  total_green_weight: number;
  remaining_green_weight: number;
  usage_type: UsageType | null;
  flavor_notes: string[] | null;
  description: string | null;
  description_ar: string | null;
  brew_recommendations: string | null;
  pricing?: CropPricing;
  marketing?: CropMarketing;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GreenCoffeeLot {
  id: number;
  crop_id: number;
  crop?: Crop;
  purchase_order_id: number;
  batch_id: string;
  bags_count: number;
  expected_weight: number;
  actual_weight: number;
  weight_variance: number;
  arrival_date: string;
  barcode: string | null;
  qr_code: string | null;
  shipping_document: string | null;
  received_by: number;
  status: GreenCoffeeLotStatus;
  notes: string | null;
  inspections?: GreenCoffeeInspection[];
  created_at: string;
  updated_at: string;
}

export interface GreenCoffeeInspection {
  id: number;
  green_coffee_lot_id: number;
  inspector_id: number;
  moisture_percent: number | null;
  water_activity: number | null;
  density: number | null;
  screen_size: string | null;
  defect_count: number | null;
  defect_notes: string | null;
  visual_notes: string | null;
  decision: InspectionDecision;
  rejection_reason: string | null;
  condition_notes: string | null;
  photos: string[] | null;
  inspected_at: string;
  created_at: string;
  updated_at: string;
}

export interface TrialRoast {
  id: number;
  crop_id: number;
  green_coffee_lot_id: number;
  roaster_id: number;
  trial_number: number;
  sample_weight_grams: number;
  roasted_weight_grams: number | null;
  roast_loss_grams: number | null;
  roast_loss_percent: number | null;
  charge_temp: number | null;
  drying_time: string | null;
  maillard_time: string | null;
  first_crack_time: string | null;
  first_crack_temp: number | null;
  development_time: string | null;
  development_percent: number | null;
  drop_temp: number | null;
  total_roast_time: string | null;
  roast_curve_data: Record<string, unknown> | null;
  roast_level: RoastLevel | null;
  usage_type: UsageType | null;
  notes: string | null;
  status: TrialRoastStatus;
  roasted_at: string;
  created_at: string;
  updated_at: string;
}

export interface CuppingSession {
  id: number;
  crop_id: number;
  trial_roast_id: number;
  grader_id: number;
  scheduled_date: string;
  cups_count: number;
  dose_per_cup: number;
  total_coffee_used: number;
  fragrance: number | null;
  aroma: number | null;
  flavor: number | null;
  acidity: number | null;
  body: number | null;
  aftertaste: number | null;
  balance: number | null;
  sweetness: number | null;
  overall_score: number | null;
  uniformity: number | null;
  clean_cup: number | null;
  defects: number;
  defect_type: string | null;
  defect_intensity: number;
  total_score_before_defects: number | null;
  final_score: number | null;
  classification: CuppingClassification | null;
  sample_number: number;
  is_blind_cupping: boolean;
  flavor_notes: string[] | null;
  description: string | null;
  brew_recommendations: string | null;
  decision: CuppingDecision | null;
  rejection_reason: string | null;
  notes: string | null;
  photos: string[] | null;
  status: CuppingStatus;
  created_at: string;
  updated_at: string;
}

export interface CropPricing {
  id: number;
  crop_id: number;
  landed_cost_per_kg: number;
  green_cost_per_kg: number;
  roasting_loss_percent: number;
  roasting_cost_per_kg: number;
  packaging_cost_per_unit: number;
  operation_cost_per_kg: number;
  shipping_cost_per_kg: number;
  total_cost_per_kg_roasted: number;
  target_margin_percent: number;
  retail_price_250g: number | null;
  retail_price_500g: number | null;
  retail_price_1kg: number | null;
  wholesale_price_kg: number | null;
  status: string;
  set_by: number;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CropMarketing {
  id: number;
  crop_id: number;
  product_name: string;
  product_name_ar: string;
  marketing_description: string | null;
  marketing_description_ar: string | null;
  flavor_display: string | null;
  label_template: string | null;
  label_pdf_url: string | null;
  social_media_text: string | null;
  social_media_text_ar: string | null;
  photos: string[] | null;
  status: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: number;
  crop_id: number;
  crop?: { id: number; serial_number: string; name: string; name_ar: string };
  recipe_code: string;
  recipe_type: RecipeType;
  version: number;
  parent_recipe_id: number | null;
  is_current: boolean;
  created_by: number;
  status: RecipeStatus;
  approved_by: number | null;
  approved_at: string | null;
  published_at: string | null;
  espresso_trials?: EspressoRecipeTrial[];
  espresso_recipe?: EspressoRecipeData;
  pour_over_recipe?: PourOverRecipeData;
  created_at: string;
  updated_at: string;
}

export interface EspressoRecipeTrial {
  id: number;
  recipe_id: number;
  trial_number: number;
  dose: number;
  grind_setting: string;
  extraction_time: number;
  yield: number;
  tds: number | null;
  extraction_percent: number | null;
  acidity: number | null;
  finish: number | null;
  balance: number | null;
  is_best_shot: boolean;
  notes: string | null;
  created_at: string;
}

export interface EspressoRecipeData {
  id: number;
  recipe_id: number;
  dose: number;
  grind_setting: string;
  extraction_time: number;
  yield: number;
  tds: number;
  extraction_percent: number;
}

export interface PourOverRecipeData {
  id: number;
  recipe_id: number;
  dose: number;
  grind_setting: string;
  brew_type: 'hot' | 'iced';
  bloom_time: number;
  bloom_water: number;
  pours: Array<{ pour: number; water: number; time?: number }>;
  total_water: number;
  total_time: number;
}

export interface WasteRecord {
  id: number;
  crop_id: number;
  source_type: string;
  source_id: number;
  waste_type: WasteType;
  weight_grams: number;
  reason: string | null;
  created_by: number;
  created_at: string;
}

export interface TimelineEvent {
  stage: string;
  status: string;
  date: string;
  data: Record<string, unknown>;
}

// ── Phase 3: Inventory ──
export type ItemType = 'green' | 'roasted' | 'finished_250' | 'finished_500' | 'finished_1kg' | 'bar';
export type MovementType = 'receiving' | 'roasting_in' | 'roasting_out' | 'roast_loss' | 'packaging_in' | 'packaging_out' | 'sale' | 'transfer_out' | 'transfer_in' | 'calibration_waste' | 'qc_waste' | 'trial_waste' | 'cupping_waste' | 'adjustment_in' | 'adjustment_out' | 'reconciliation';
export type MovementDirection = 'in' | 'out';

export interface InventoryItem {
  id: number;
  branch_id: number;
  crop_id: number;
  item_type: ItemType;
  sku: string | null;
  quantity: number;
  unit: string;
  min_threshold: number | null;
  is_low: boolean;
  last_movement_at: string | null;
  item_type_label: string;
  item_type_label_en: string;
  branch?: { id: number; name: string; name_ar: string; type: string };
  crop?: { id: number; serial_number: string; name: string; name_ar: string };
  latest_movement?: InventoryMovement;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: number;
  inventory_item_id: number;
  branch_id: number;
  crop_id: number;
  movement_type: MovementType;
  movement_type_label: string;
  movement_type_label_en: string;
  direction: MovementDirection;
  quantity: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: number | null;
  cost_per_unit: number | null;
  total_cost: number | null;
  staff?: { id: number; name: string; name_ar: string };
  branch?: { id: number; name: string; name_ar: string };
  crop?: { id: number; serial_number: string; name: string; name_ar: string };
  notes: string | null;
  created_at: string;
}

export interface InventorySummary {
  total_green_kg: number;
  total_roasted_kg: number;
  total_finished_bags: number;
  low_stock_count: number;
  movements_today: number;
  by_branch: Array<{ branch_id: number; branch_name: string; branch_name_ar: string; items_count: number; low_count: number }>;
  by_crop: Array<{ crop_id: number; serial_number: string; name: string; name_ar: string; green_kg: number; roasted_kg: number; finished_bags: number }>;
}

export interface InventoryValuation {
  total_value: number;
  currency: string;
  items: Array<{ id: number; branch: string; crop_serial: string; item_type: string; quantity: number; unit: string; cost_per_unit: number; total_value: number }>;
}

// ── Phase 2 Form Types ──
export interface SupplierFormData {
  name: string;
  country: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  notes?: string;
  is_active?: boolean;
}

export interface PurchaseOrderFormData {
  supplier_id: number;
  origin_country: string;
  region: string;
  farm?: string;
  process: string;
  variety?: string;
  altitude?: string;
  quantity_kg: number;
  price_per_kg: number;
  shipping_cost?: number;
  customs_cost?: number;
  expected_date: string;
  notes?: string;
}

// ══════════════════════════════════════════
// Phase 4: Pricing Module
// ══════════════════════════════════════════

export type PriceListStatus = 'draft' | 'pending_approval' | 'active' | 'archived';
export type PriceListType = 'wholesale' | 'retail' | 'vip' | 'custom';
export type RoundingRule = 'nearest_halala' | 'nearest_riyal' | 'nearest_5' | 'none';
export type DiscountType = 'volume' | 'seasonal' | 'customer_specific' | 'coupon';
export type DiscountCalculation = 'percentage' | 'fixed_amount';

export interface PriceList {
  id: number;
  name: string;
  name_ar: string;
  code: string;
  type: PriceListType;
  type_label: string;
  type_label_en: string;
  currency: string;
  is_default: boolean;
  is_active: boolean;
  description: string | null;
  description_ar: string | null;
  rounding_rule: RoundingRule;
  rounding_rule_label: string;
  rounding_rule_label_en: string;
  status: PriceListStatus;
  status_label: string;
  status_label_en: string;
  items_count?: number;
  created_by: number;
  creator?: { id: number; name: string; name_ar: string };
  approved_by: number | null;
  approver?: { id: number; name: string; name_ar: string };
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceListItem {
  id: number;
  price_list_id: number;
  crop_id: number;
  crop?: { id: number; serial_number: string; name: string; name_ar: string };
  item_type: ItemType;
  item_type_label: string;
  item_type_label_en: string;
  unit_price: number;
  min_quantity: number;
  effective_from: string | null;
  effective_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceChangeLog {
  id: number;
  entity_type: string;
  entity_id: number;
  changes: Array<{ field: string; old_value: number | null; new_value: number }>;
  change_reason: string | null;
  changed_by: { id: number; name: string; name_ar: string };
  created_at: string;
}

export interface Discount {
  id: number;
  name: string;
  name_ar: string;
  code: string | null;
  type: DiscountType;
  type_label: string;
  type_label_en: string;
  calculation: DiscountCalculation;
  calculation_label: string;
  calculation_label_en: string;
  value: number;
  min_order_amount: number | null;
  min_quantity: number | null;
  max_uses: number | null;
  times_used: number;
  remaining_uses: number | null;
  customer_id: number | null;
  customer?: { id: number; name: string; name_ar: string };
  price_list_id: number | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_by: number;
  creator?: { id: number; name: string; name_ar: string };
  created_at: string;
  updated_at: string;
}

export interface MarginSimulation {
  crop_id: number;
  item_type: string;
  cost_per_unit: number;
  current_price: number;
  new_price: number;
  current_margin_percent: number;
  new_margin_percent: number;
  margin_change: number;
  profit_per_unit_current: number;
  profit_per_unit_new: number;
  is_profitable: boolean;
}

// ══════════════════════════════════════════
// Phase 4: Sales Module
// ══════════════════════════════════════════

export type LeadStage = 'new_lead' | 'contacted' | 'quoted' | 'converted' | 'lost';
export type LeadSource = 'referral' | 'website' | 'exhibition' | 'cold_call' | 'social_media';
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'reversed' | 'cancelled';
export type CommissionType = 'percentage' | 'fixed_per_order' | 'fixed_per_kg';
export type PaymentTerms = 'prepaid' | 'net_15' | 'net_30' | 'net_60';
export type CustomerTier = 'standard' | 'silver' | 'gold' | 'vip';

export interface Lead {
  id: number;
  company_name: string;
  company_name_ar: string | null;
  contact_name: string;
  contact_name_ar: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  stage: LeadStage;
  stage_label: string;
  stage_label_en: string;
  source: LeadSource | null;
  notes: string | null;
  estimated_monthly_kg: number | null;
  sales_rep_id: number;
  sales_rep?: { id: number; name: string; name_ar: string };
  converted_customer_id: number | null;
  converted_customer?: { id: number; name: string; name_ar: string };
  contacted_at: string | null;
  quoted_at: string | null;
  converted_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommissionRule {
  id: number;
  name: string;
  name_ar: string;
  type: CommissionType;
  type_label: string;
  type_label_en: string;
  value: number;
  sales_rep_id: number | null;
  sales_rep?: { id: number; name: string; name_ar: string };
  customer_tier: CustomerTier | null;
  min_order_total: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Commission {
  id: number;
  order_id: number;
  order?: { id: number; order_number: string; total: number };
  sales_rep_id: number;
  sales_rep?: { id: number; name: string; name_ar: string };
  commission_rule_id: number | null;
  order_total: number;
  commission_amount: number;
  calculation_method: string;
  calculation_value: number;
  status: CommissionStatus;
  status_label: string;
  status_label_en: string;
  approved_at: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  reversed_by_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesRepDashboard {
  my_customers_count: number;
  my_orders_count: number;
  my_orders_total: number;
  commissions: { total_earned: number; total_pending: number; total_approved: number; total_paid: number };
  leads_by_stage: Record<string, number>;
  recent_orders: Order[];
  conversion_rate: number;
}

export interface SalesManagerDashboard {
  total_sales_this_month: number;
  pending_approvals_count: number;
  commission_payable_total: number;
  reps_performance: Array<{
    rep: { id: number; name: string; name_ar: string };
    orders_count: number;
    orders_total: number;
    commission_earned: number;
    customers_count: number;
  }>;
}

// ══════════════════════════════════════════
// Phase 4: Order Workflow Enhancement
// ══════════════════════════════════════════

export type ShipmentStatus = 'pending' | 'picked' | 'packed' | 'shipped' | 'delivered';
export type AllocationStatus = 'reserved' | 'picked' | 'released';

export interface StockAllocation {
  id: number;
  order_id: number;
  order_item_id: number;
  inventory_item_id: number;
  quantity_allocated: number;
  status: AllocationStatus;
  allocated_by: number;
  released_at: string | null;
  created_at: string;
}

export interface ShipmentItem {
  id: number;
  order_item_id: number;
  quantity_shipped: number;
  order_item?: { id: number; product_name: string; item_type: string; quantity: number };
}

export interface Shipment {
  id: number;
  shipment_number: string;
  order_id: number;
  status: ShipmentStatus;
  status_label: string;
  status_label_en: string;
  shipping_address: string | null;
  shipping_city: string | null;
  carrier: string | null;
  tracking_number: string | null;
  notes: string | null;
  creator?: { id: number; name: string; name_ar: string };
  items?: ShipmentItem[];
  shipped_at: string | null;
  delivered_at: string | null;
  delivery_confirmation: string | null;
  created_at: string;
  updated_at: string;
}
