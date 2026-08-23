import { createBrowserRouter } from 'react-router-dom';
import { AuthGuard, GuestGuard } from '@/components/AuthGuard';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { StationLayout } from '@/layouts/StationLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { PinLoginPage } from '@/pages/auth/PinLoginPage';
import { DashboardPage } from '@/pages/admin/dashboard/DashboardPage';
import { BranchesPage } from '@/pages/admin/branches/BranchesPage';
import { EquipmentPage } from '@/pages/admin/equipment/EquipmentPage';
import { UsersPage } from '@/pages/admin/users/UsersPage';
import { SettingsPage } from '@/pages/admin/settings/SettingsPage';
import { SuppliersPage } from '@/pages/admin/suppliers/SuppliersPage';
import { PurchaseOrdersPage } from '@/pages/admin/purchase-orders/PurchaseOrdersPage';
import { PurchaseOrderDetailPage } from '@/pages/admin/purchase-orders/PurchaseOrderDetailPage';
import { CropsPage } from '@/pages/admin/crops/CropsPage';
import { CropDetailPage } from '@/pages/admin/crops/CropDetailPage';
import { CropStatusBoardPage } from '@/pages/admin/crops/CropStatusBoardPage';
import { RecipesPage } from '@/pages/admin/recipes/RecipesPage';
import { RecipeDetailPage } from '@/pages/admin/recipes/RecipeDetailPage';
import { CropJourneyPage } from '@/pages/admin/crops/CropJourneyPage';
import { InventoryPage } from '@/pages/admin/inventory/InventoryPage';
import { InventoryMovementsPage } from '@/pages/admin/inventory/InventoryMovementsPage';
import { InventoryAlertsPage } from '@/pages/admin/inventory/InventoryAlertsPage';
import { InventoryDashboardPage } from '@/pages/admin/inventory/InventoryDashboardPage';
import { InventoryAuditsPage } from '@/pages/admin/inventory/InventoryAuditsPage';
import { InventoryAccuracyPage } from '@/pages/admin/inventory/InventoryAccuracyPage';
import { CustomersPage } from '@/pages/admin/customers/CustomersPage';
import { PackagingPage } from '@/pages/admin/packaging/PackagingPage';
import { OrdersPage } from '@/pages/admin/orders/OrdersPage';
import { OrderDetailPage } from '@/pages/admin/orders/OrderDetailPage';
import { TransfersPage } from '@/pages/admin/transfers/TransfersPage';
import { ComplaintsPage } from '@/pages/admin/complaints/ComplaintsPage';
import { ActivityLogPage } from '@/pages/admin/activity/ActivityLogPage';
import { NotificationsPage } from '@/pages/admin/notifications/NotificationsPage';
import { CalibrationDashboardPage } from '@/pages/admin/calibration/CalibrationDashboardPage';
import { WasteReportsPage } from '@/pages/admin/quality/WasteReportsPage';
import { QualityDashboardPage } from '@/pages/admin/quality/QualityDashboardPage';
import { MarketFeedbackPage } from '@/pages/admin/quality/MarketFeedbackPage';
import { CleaningSchedulesPage } from '@/pages/admin/cleaning/CleaningSchedulesPage';
import { QcInspectionPage } from '@/pages/stations/qc/QcInspectionPage';
import { BaristaRecipesPage } from '@/pages/stations/barista/BaristaRecipesPage';
import { RoasterStationPage } from '@/pages/stations/roaster/RoasterStationPage';
import { QcRoastBatchPage } from '@/pages/stations/qc/QcRoastBatchPage';
import { BaristaCalibrationPage } from '@/pages/stations/barista/BaristaCalibrationPage';
import { CleaningStationPage } from '@/pages/stations/cleaning/CleaningStationPage';
import { WarehouseStationPage } from '@/pages/stations/warehouse/WarehouseStationPage';
import { PriceListsPage } from '@/pages/admin/pricing/PriceListsPage';
import { PriceListDetailPage } from '@/pages/admin/pricing/PriceListDetailPage';
import { DiscountsPage } from '@/pages/admin/pricing/DiscountsPage';
import { ProfitSimulatorPage } from '@/pages/admin/pricing/ProfitSimulatorPage';
import { LeadsPage } from '@/pages/admin/sales/LeadsPage';
import { CommissionsPage } from '@/pages/admin/sales/CommissionsPage';
import { CommissionRulesPage } from '@/pages/admin/sales/CommissionRulesPage';
import { SalesDashboardPage } from '@/pages/admin/sales/SalesDashboardPage';
import { CustomerDetailPage } from '@/pages/admin/customers/CustomerDetailPage';
import { WhatsappPage } from '@/pages/admin/whatsapp/WhatsappPage';
import { RolesPage } from '@/pages/admin/roles/RolesPage';
import { RolePermissionsPage } from '@/pages/admin/roles/RolePermissionsPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { PermissionGuard } from '@/components/PermissionGuard';

export const router = createBrowserRouter([
  // Guest routes (login)
  {
    element: <GuestGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <PinLoginPage /> },
          { path: '/email-login', element: <LoginPage /> },
        ],
      },
    ],
  },

  // Protected routes (admin)
  {
    element: <AuthGuard />,
    children: [
      // Full-screen journey page (no sidebar)
      { path: '/crops/:id/journey', element: <CropJourneyPage /> },

      {
        element: <AdminLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/unauthorized', element: <UnauthorizedPage /> },
          { path: '/branches', element: <PermissionGuard permission="branches.view"><BranchesPage /></PermissionGuard> },
          { path: '/equipment', element: <PermissionGuard permission="equipment.view"><EquipmentPage /></PermissionGuard> },
          { path: '/users', element: <PermissionGuard permission="users.view"><UsersPage /></PermissionGuard> },
          { path: '/roles', element: <PermissionGuard permission="roles.view"><RolesPage /></PermissionGuard> },
          { path: '/roles/:id/permissions', element: <PermissionGuard permission="roles.view"><RolePermissionsPage /></PermissionGuard> },
          { path: '/whatsapp', element: <WhatsappPage /> },
          { path: '/settings', element: <PermissionGuard permission="settings.view"><SettingsPage /></PermissionGuard> },
          { path: '/suppliers', element: <PermissionGuard permission="suppliers.view"><SuppliersPage /></PermissionGuard> },
          { path: '/purchase-orders', element: <PermissionGuard permission="purchase_orders.view"><PurchaseOrdersPage /></PermissionGuard> },
          { path: '/purchase-orders/:id', element: <PermissionGuard permission="purchase_orders.view"><PurchaseOrderDetailPage /></PermissionGuard> },
          { path: '/crops', element: <PermissionGuard permission="crops.view"><CropsPage /></PermissionGuard> },
          { path: '/crops/board', element: <PermissionGuard permission="crops.view"><CropStatusBoardPage /></PermissionGuard> },
          { path: '/crops/:id', element: <PermissionGuard permission="crops.view"><CropDetailPage /></PermissionGuard> },
          { path: '/recipes', element: <PermissionGuard permission="recipes.view"><RecipesPage /></PermissionGuard> },
          { path: '/recipes/:id', element: <PermissionGuard permission="recipes.view"><RecipeDetailPage /></PermissionGuard> },
          { path: '/inventory', element: <PermissionGuard permission="inventory.view"><InventoryPage /></PermissionGuard> },
          { path: '/inventory/movements', element: <PermissionGuard permission="inventory.view"><InventoryMovementsPage /></PermissionGuard> },
          { path: '/inventory/alerts', element: <PermissionGuard permission="inventory.view"><InventoryAlertsPage /></PermissionGuard> },
          { path: '/inventory/dashboard', element: <PermissionGuard permission="inventory.view"><InventoryDashboardPage /></PermissionGuard> },
          { path: '/inventory/audits', element: <PermissionGuard permission="inventory.audit"><InventoryAuditsPage /></PermissionGuard> },
          { path: '/inventory/accuracy', element: <PermissionGuard permission="inventory.audit"><InventoryAccuracyPage /></PermissionGuard> },
          { path: '/customers', element: <PermissionGuard permission="orders.view"><CustomersPage /></PermissionGuard> },
          { path: '/customers/:id', element: <PermissionGuard permission="orders.view"><CustomerDetailPage /></PermissionGuard> },
          { path: '/packaging', element: <PermissionGuard permission="production.packaging"><PackagingPage /></PermissionGuard> },
          { path: '/orders', element: <PermissionGuard permission="orders.view"><OrdersPage /></PermissionGuard> },
          { path: '/orders/:id', element: <PermissionGuard permission="orders.view"><OrderDetailPage /></PermissionGuard> },
          // Sales
          { path: '/sales/dashboard', element: <PermissionGuard permission="sales.view"><SalesDashboardPage /></PermissionGuard> },
          { path: '/leads', element: <PermissionGuard permission="leads.view"><LeadsPage /></PermissionGuard> },
          { path: '/commissions', element: <PermissionGuard permission="commissions.view"><CommissionsPage /></PermissionGuard> },
          { path: '/commission-rules', element: <PermissionGuard permission="commissions.view"><CommissionRulesPage /></PermissionGuard> },
          // Pricing
          { path: '/price-lists', element: <PermissionGuard permission="pricing.view"><PriceListsPage /></PermissionGuard> },
          { path: '/price-lists/:id', element: <PermissionGuard permission="pricing.view"><PriceListDetailPage /></PermissionGuard> },
          { path: '/discounts', element: <PermissionGuard permission="pricing.view"><DiscountsPage /></PermissionGuard> },
          { path: '/pricing/simulator', element: <PermissionGuard permission="pricing.manage"><ProfitSimulatorPage /></PermissionGuard> },
          { path: '/transfers', element: <PermissionGuard permission="inventory.view"><TransfersPage /></PermissionGuard> },
          { path: '/complaints', element: <PermissionGuard permission="quality.complaints_view"><ComplaintsPage /></PermissionGuard> },
          { path: '/activity-log', element: <PermissionGuard permission="reports.view"><ActivityLogPage /></PermissionGuard> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/calibration', element: <PermissionGuard permission="calibration.view"><CalibrationDashboardPage /></PermissionGuard> },
          { path: '/cleaning', element: <PermissionGuard permission="cleaning.perform"><CleaningSchedulesPage /></PermissionGuard> },
          { path: '/waste-reports', element: <PermissionGuard permission="quality.waste_view"><WasteReportsPage /></PermissionGuard> },
          { path: '/quality', element: <PermissionGuard permission="reports.view"><QualityDashboardPage /></PermissionGuard> },
          { path: '/market-feedback', element: <PermissionGuard permission="quality.complaints_view"><MarketFeedbackPage /></PermissionGuard> },
        ],
      },

      // Station routes
      {
        element: <StationLayout />,
        children: [
          { path: '/stations/roaster', element: <RoasterStationPage /> },
          { path: '/stations/qc', element: <QcInspectionPage /> },
          { path: '/stations/qc/roast', element: <QcRoastBatchPage /> },
          { path: '/stations/barista/recipes', element: <BaristaRecipesPage /> },
          { path: '/stations/barista/calibration', element: <BaristaCalibrationPage /> },
          { path: '/stations/cleaning', element: <CleaningStationPage /> },
          { path: '/stations/warehouse', element: <WarehouseStationPage /> },
        ],
      },
    ],
  },
]);
