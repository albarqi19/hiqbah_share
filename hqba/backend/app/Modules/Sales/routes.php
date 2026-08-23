<?php

use App\Modules\Sales\Controllers\CommissionController;
use App\Modules\Sales\Controllers\CommissionRuleController;
use App\Modules\Sales\Controllers\LeadController;
use App\Modules\Sales\Controllers\SalesDashboardController;
use App\Modules\Sales\Controllers\SalesRepController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('api/v1')->group(function () {

    // Leads
    Route::get('leads', [LeadController::class, 'index'])->middleware('permission:leads.view');
    Route::get('leads/{lead}', [LeadController::class, 'show'])->middleware('permission:leads.view');
    Route::post('leads', [LeadController::class, 'store'])->middleware('permission:leads.manage');
    Route::put('leads/{lead}', [LeadController::class, 'update'])->middleware('permission:leads.manage');
    Route::patch('leads/{lead}', [LeadController::class, 'update'])->middleware('permission:leads.manage');
    Route::delete('leads/{lead}', [LeadController::class, 'destroy'])->middleware('permission:leads.manage');
    Route::put('leads/{lead}/transition', [LeadController::class, 'transition'])->middleware('permission:leads.manage');
    Route::post('leads/{lead}/convert', [LeadController::class, 'convert'])->middleware('permission:leads.manage');
    Route::put('leads/{lead}/mark-lost', [LeadController::class, 'markLost'])->middleware('permission:leads.manage');
    Route::get('leads-funnel', [LeadController::class, 'funnel'])->middleware('permission:leads.view');

    // Customer Assignment
    Route::put('customers/{customer}/assign-rep', [SalesRepController::class, 'assignCustomer'])->middleware('permission:sales.manage');
    Route::post('customers/bulk-assign-rep', [SalesRepController::class, 'bulkAssignCustomers'])->middleware('permission:sales.manage');
    Route::get('sales-reps/{user}/customers', [SalesRepController::class, 'repCustomers'])->middleware('permission:sales.view');

    // Commissions
    Route::get('commissions', [CommissionController::class, 'index'])->middleware('permission:commissions.view');
    Route::get('commissions/{commission}', [CommissionController::class, 'show'])->middleware('permission:commissions.view');
    Route::put('commissions/{commission}/approve', [CommissionController::class, 'approve'])->middleware('permission:commissions.approve');
    Route::put('commissions/{commission}/reject', [CommissionController::class, 'reject'])->middleware('permission:commissions.approve');
    Route::put('commissions/{commission}/mark-paid', [CommissionController::class, 'markPaid'])->middleware('permission:commissions.manage');
    Route::post('commissions/bulk-approve', [CommissionController::class, 'bulkApprove'])->middleware('permission:commissions.approve');
    Route::post('commissions/bulk-mark-paid', [CommissionController::class, 'bulkMarkPaid'])->middleware('permission:commissions.manage');

    // Commission Rules
    Route::get('commission-rules', [CommissionRuleController::class, 'index'])->middleware('permission:commissions.view');
    Route::post('commission-rules', [CommissionRuleController::class, 'store'])->middleware('permission:commissions.manage');
    Route::put('commission-rules/{rule}', [CommissionRuleController::class, 'update'])->middleware('permission:commissions.manage');

    // Sales Dashboards
    Route::get('sales/my-dashboard', [SalesDashboardController::class, 'repDashboard'])->middleware('permission:sales.view');
    Route::get('sales/manager-dashboard', [SalesDashboardController::class, 'managerDashboard'])->middleware('permission:sales.manage');
    Route::get('sales/rep-performance/{user}', [SalesDashboardController::class, 'repPerformance'])->middleware('permission:sales.manage');
});
