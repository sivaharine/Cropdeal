import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { WalletService } from '../../core/services/wallet.service';
import { Order } from '../../core/models/order.model';
import { Delivery } from '../../core/models/delivery.model';
import { User } from '../../core/models/user.model';

export type TimePeriod = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL';
export type PurchaseTypeFilter = 'ALL' | 'NORMAL' | 'BIDDING';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="reports-page-container">

      <!-- Header Banner -->
      <div class="reports-hero-banner shadow-sm">
        <div class="banner-content">
          <div class="d-flex align-center gap-2">
            <h1 class="reports-title">Business Analytics & Financial Reports</h1>
            <span class="role-badge">{{ userRole }} View</span>
          </div>
          <p class="reports-subtitle">
            {{ isFarmer
                ? 'Track your daily, weekly, and monthly harvest sales revenue, order volumes, and mandi payouts.'
                : (isDealer
                    ? 'Analyze your purchase orders with daily date breakdown, classifying normal marketplace vs. bidding auction acquisitions.'
                    : (isDeliveryPartner
                        ? 'View date-specific delivery fulfillment reports, total transit kilometers, and earnings payouts.'
                        : 'Platform-wide operational analytics with multi-column sorting and multi-field search.')) }}
          </p>
        </div>
        <div class="header-action-btns">
          <button class="btn btn-export" (click)="exportCSV()">
            <i class="fa-solid fa-file-csv"></i> Export CSV
          </button>
          <button class="btn btn-print" (click)="printReport()">
            <i class="fa-solid fa-print"></i> Print Report
          </button>
        </div>
      </div>

      <!-- Quick Role Switcher for Admin only -->
      <div class="admin-tab-switch mt-2" *ngIf="isAdmin">
        <span class="switch-lbl">Admin Role View Switcher:</span>
        <button class="btn-role-tab" [class.active]="activeAdminView === 'ADMIN'" (click)="activeAdminView = 'ADMIN'">
          <i class="fa-solid fa-shield-halved"></i> Platform Master
        </button>
        <button class="btn-role-tab" [class.active]="activeAdminView === 'FARMER'" (click)="activeAdminView = 'FARMER'">
          <i class="fa-solid fa-wheat-awn"></i> Farmer Revenue
        </button>
        <button class="btn-role-tab" [class.active]="activeAdminView === 'DEALER'" (click)="activeAdminView = 'DEALER'">
          <i class="fa-solid fa-store"></i> Dealer Orders (Normal vs Bidding)
        </button>
        <button class="btn-role-tab" [class.active]="activeAdminView === 'DELIVERY'" (click)="activeAdminView = 'DELIVERY'">
          <i class="fa-solid fa-truck"></i> Delivery Partner Logistics
        </button>
      </div>

      <!-- ========================================== -->
      <!-- 1. FARMER REPORTS VIEW -->
      <!-- ========================================== -->
      <div *ngIf="effectiveRole === 'FARMER'" class="role-reports-section mt-3">

        <!-- Time Period Selector -->
        <div class="period-selector-row">
          <div class="d-flex align-center gap-2">
            <span class="period-lbl"><i class="fa-regular fa-calendar-days"></i> Analysis Window:</span>
            <div class="period-chips">
              <button class="period-chip" [class.active]="farmerPeriod === 'TODAY'" (click)="farmerPeriod = 'TODAY'">Today (Daily)</button>
              <button class="period-chip" [class.active]="farmerPeriod === 'WEEK'" (click)="farmerPeriod = 'WEEK'">This Week</button>
              <button class="period-chip" [class.active]="farmerPeriod === 'MONTH'" (click)="farmerPeriod = 'MONTH'">This Month</button>
              <button class="period-chip" [class.active]="farmerPeriod === 'ALL'" (click)="farmerPeriod = 'ALL'">All Time</button>
            </div>
          </div>
          <div class="date-range-filter">
            <span class="text-muted"><i class="fa-regular fa-calendar"></i> Select Specific Date:</span>
            <input type="date" [(ngModel)]="specificDateFilter" (change)="farmerPeriod = 'CUSTOM'" class="date-input" />
          </div>
        </div>

        <!-- Farmer Revenue KPI Cards -->
        <div class="kpi-grid mt-3">
          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Total Sales Revenue</span>
              <div class="kpi-icon bg-emerald-light text-emerald"><i class="fa-solid fa-indian-rupee-sign"></i></div>
            </div>
            <h2 class="kpi-val text-emerald">&#8377; {{ farmerCurrentRevenue | number:'1.2-2' }}</h2>
            <div class="kpi-trend positive"><i class="fa-solid fa-arrow-trend-up"></i> In {{ getPeriodLabel(farmerPeriod) }}</div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Total Orders Received</span>
              <div class="kpi-icon bg-blue-light text-primary"><i class="fa-solid fa-boxes-packing"></i></div>
            </div>
            <h2 class="kpi-val text-primary">{{ farmerCurrentOrders.length }} Orders</h2>
            <div class="kpi-trend neutral"><i class="fa-solid fa-clock-rotate-left"></i> Date-based: {{ farmerDailyOrdersCount }} Today</div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Weekly Volume (Week-Based)</span>
              <div class="kpi-icon bg-amber-light text-amber"><i class="fa-solid fa-calendar-week"></i></div>
            </div>
            <h2 class="kpi-val text-amber">{{ farmerWeeklyOrdersCount }} Orders</h2>
            <span class="kpi-sub">Total ₹{{ farmerWeeklyRevenue | number:'1.0-0' }} this week</span>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Monthly Revenue (Month-Based)</span>
              <div class="kpi-icon bg-purple-light text-purple"><i class="fa-solid fa-calendar-check"></i></div>
            </div>
            <h2 class="kpi-val text-purple">&#8377; {{ farmerMonthlyRevenue | number:'1.0-0' }}</h2>
            <span class="kpi-sub">{{ farmerMonthlyOrdersCount }} Orders this calendar month</span>
          </div>
        </div>

        <!-- Daily / Weekly / Monthly Revenue Comparison -->
        <div class="card chart-card mt-3">
          <div class="card-head">
            <h3 class="card-title"><i class="fa-solid fa-chart-column text-emerald"></i> Multi-Period Revenue Breakdown (INR)</h3>
            <span class="badge badge-success">Live Sync</span>
          </div>
          <div class="breakdown-grid mt-2">
            <div class="breakdown-col">
              <div class="breakdown-header">
                <span class="period-title"><i class="fa-solid fa-sun text-amber"></i> Daily Basis (Today)</span>
                <strong class="text-emerald">&#8377; {{ farmerDailyRevenue | number:'1.2-2' }}</strong>
              </div>
              <div class="progress-track"><div class="progress-bar bg-amber" [style.width.%]="calcPercentage(farmerDailyRevenue, farmerMonthlyRevenue)"></div></div>
              <span class="breakdown-meta">{{ farmerDailyOrdersCount }} orders completed today</span>
            </div>

            <div class="breakdown-col">
              <div class="breakdown-header">
                <span class="period-title"><i class="fa-solid fa-calendar-week text-primary"></i> Weekly Basis (Last 7 Days)</span>
                <strong class="text-emerald">&#8377; {{ farmerWeeklyRevenue | number:'1.2-2' }}</strong>
              </div>
              <div class="progress-track"><div class="progress-bar bg-blue" [style.width.%]="calcPercentage(farmerWeeklyRevenue, farmerMonthlyRevenue)"></div></div>
              <span class="breakdown-meta">{{ farmerWeeklyOrdersCount }} orders in active week</span>
            </div>

            <div class="breakdown-col">
              <div class="breakdown-header">
                <span class="period-title"><i class="fa-solid fa-calendar-days text-purple"></i> Monthly Basis (Current Month)</span>
                <strong class="text-emerald">&#8377; {{ farmerMonthlyRevenue | number:'1.2-2' }}</strong>
              </div>
              <div class="progress-track"><div class="progress-bar bg-purple" style="width: 100%;"></div></div>
              <span class="breakdown-meta">{{ farmerMonthlyOrdersCount }} orders in this month</span>
            </div>
          </div>
        </div>

        <!-- Farmer Recent Sales Orders Table -->
        <div class="card table-card mt-3">
          <div class="table-header-row">
            <h3 class="card-title"><i class="fa-solid fa-list-check text-emerald"></i> Farmer Sales Orders Log</h3>
            <div class="table-search-box">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" [(ngModel)]="tableSearch" placeholder="Search orders by crop, dealer..." class="search-input" />
            </div>
          </div>
          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th (click)="sortOrders('id')">Order ID <i class="fa-solid" [ngClass]="getSortIcon('id')"></i></th>
                  <th (click)="sortOrders('cropName')">Crop Produce <i class="fa-solid" [ngClass]="getSortIcon('cropName')"></i></th>
                  <th (click)="sortOrders('dealerName')">Buyer (Dealer) <i class="fa-solid" [ngClass]="getSortIcon('dealerName')"></i></th>
                  <th (click)="sortOrders('quantity')">Quantity (Kg) <i class="fa-solid" [ngClass]="getSortIcon('quantity')"></i></th>
                  <th (click)="sortOrders('finalAmount')">Revenue (&#8377;) <i class="fa-solid" [ngClass]="getSortIcon('finalAmount')"></i></th>
                  <th (click)="sortOrders('createdAt')">Date & Time <i class="fa-solid" [ngClass]="getSortIcon('createdAt')"></i></th>
                  <th>Order Channel</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ord of pagedOrders">
                  <td><strong>{{ ord.id }}</strong></td>
                  <td><strong>{{ ord.cropName }}</strong></td>
                  <td>{{ ord.dealerName || 'Registered Dealer' }}</td>
                  <td>{{ ord.quantity }} {{ ord.unit || 'Kg' }}</td>
                  <td><strong class="text-emerald">&#8377; {{ ord.finalAmount | number:'1.2-2' }}</strong></td>
                  <td>{{ ord.createdAt | date:'mediumDate' }}</td>
                  <td>
                    <span class="badge" [ngClass]="ord.isBidding ? 'badge-bidding' : 'badge-normal'">
                      <i class="fa-solid" [ngClass]="ord.isBidding ? 'fa-gavel' : 'fa-basket-shopping'"></i>
                      {{ ord.isBidding ? 'Bidding Auction' : 'Normal Marketplace' }}
                    </span>
                  </td>
                  <td>
                    <span class="badge badge-success">{{ ord.status || 'PAID' }}</span>
                  </td>
                </tr>
                <tr *ngIf="pagedOrders.length === 0">
                  <td colspan="8" class="text-center py-4 text-muted">No sales orders found for selected criteria.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div class="table-pagination" *ngIf="orderTotalPages > 1">
            <span>Showing {{ (orderCurrentPage - 1) * orderPageSize + 1 }} to {{ Math.min(orderCurrentPage * orderPageSize, filteredOrders.length) }} of {{ filteredOrders.length }} orders</span>
            <div class="page-btns">
              <button class="btn-page" [disabled]="orderCurrentPage === 1" (click)="orderCurrentPage = orderCurrentPage - 1">&laquo;</button>
              <button *ngFor="let p of orderTotalPagesArray" class="btn-page" [class.active]="p === orderCurrentPage" (click)="orderCurrentPage = p">{{ p }}</button>
              <button class="btn-page" [disabled]="orderCurrentPage === orderTotalPages" (click)="orderCurrentPage = orderCurrentPage + 1">&raquo;</button>
            </div>
          </div>
        </div>

      </div>

      <!-- ========================================== -->
      <!-- 2. DEALER REPORTS VIEW -->
      <!-- ========================================== -->
      <div *ngIf="effectiveRole === 'DEALER'" class="role-reports-section mt-3">

        <!-- Dealer Filter Toolbar -->
        <div class="period-selector-row">
          <div class="d-flex align-center gap-2">
            <span class="period-lbl"><i class="fa-solid fa-filter"></i> Purchase Type:</span>
            <div class="period-chips">
              <button class="period-chip" [class.active]="dealerPurchaseFilter === 'ALL'" (click)="setDealerPurchaseFilter('ALL')">
                All Orders ({{ dealerAllOrders.length }})
              </button>
              <button class="period-chip" [class.active]="dealerPurchaseFilter === 'NORMAL'" (click)="setDealerPurchaseFilter('NORMAL')">
                <i class="fa-solid fa-basket-shopping"></i> Normal Marketplace ({{ dealerNormalOrders.length }})
              </button>
              <button class="period-chip" [class.active]="dealerPurchaseFilter === 'BIDDING'" (click)="setDealerPurchaseFilter('BIDDING')">
                <i class="fa-solid fa-gavel"></i> Bidding Auction ({{ dealerBiddingOrders.length }})
              </button>
            </div>
          </div>

          <div class="date-range-filter">
            <span class="text-muted"><i class="fa-regular fa-calendar"></i> Date Specific Report:</span>
            <input type="date" [(ngModel)]="specificDateFilter" (change)="onDateFilterChange()" class="date-input" />
            <button *ngIf="specificDateFilter" class="btn-clear-date" (click)="clearDateFilter()">&times; Clear</button>
          </div>
        </div>

        <!-- Dealer KPI Cards (Normal vs Bidding Breakdown) -->
        <div class="kpi-grid mt-3">
          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Total Procurement Spend</span>
              <div class="kpi-icon bg-emerald-light text-emerald"><i class="fa-solid fa-wallet"></i></div>
            </div>
            <h2 class="kpi-val text-emerald">&#8377; {{ dealerTotalSpend | number:'1.2-2' }}</h2>
            <span class="kpi-sub">Daily Average: &#8377;{{ (dealerTotalSpend / 30) | number:'1.0-0' }} / day</span>
          </div>

          <div class="card kpi-card highlight-card-normal">
            <div class="kpi-top">
              <span class="kpi-lbl">Normal Marketplace Orders</span>
              <div class="kpi-icon bg-blue-light text-primary"><i class="fa-solid fa-basket-shopping"></i></div>
            </div>
            <h2 class="kpi-val text-primary">{{ dealerNormalOrders.length }} Orders</h2>
            <span class="kpi-sub">Total Value: &#8377; {{ dealerNormalSpend | number:'1.2-2' }}</span>
          </div>

          <div class="card kpi-card highlight-card-bidding">
            <div class="kpi-top">
              <span class="kpi-lbl">Bidding Auction Orders</span>
              <div class="kpi-icon bg-purple-light text-purple"><i class="fa-solid fa-gavel"></i></div>
            </div>
            <h2 class="kpi-val text-purple">{{ dealerBiddingOrders.length }} Orders</h2>
            <span class="kpi-sub">Total Value: &#8377; {{ dealerBiddingSpend | number:'1.2-2' }}</span>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Today's Daily Orders</span>
              <div class="kpi-icon bg-amber-light text-amber"><i class="fa-solid fa-calendar-day"></i></div>
            </div>
            <h2 class="kpi-val text-amber">{{ dealerTodayOrders.length }} Orders Today</h2>
            <span class="kpi-sub">&#8377; {{ dealerTodaySpend | number:'1.2-2' }} committed</span>
          </div>
        </div>

        <!-- Normal vs Bidding Ratio Comparison Box -->
        <div class="card chart-card mt-3">
          <div class="card-head">
            <h3 class="card-title"><i class="fa-solid fa-scale-balanced text-primary"></i> Purchase Classification Ratio (Normal Marketplace vs. Bidding Auction)</h3>
            <span class="badge badge-primary">Comprehensive Audit</span>
          </div>
          <div class="ratio-bar-wrap mt-2">
            <div class="ratio-bar">
              <div class="ratio-segment segment-normal" [style.width.%]="normalPercentage">
                <span>Normal Marketplace ({{ normalPercentage | number:'1.0-0' }}%)</span>
              </div>
              <div class="ratio-segment segment-bidding" [style.width.%]="biddingPercentage">
                <span>Bidding Auction ({{ biddingPercentage | number:'1.0-0' }}%)</span>
              </div>
            </div>
            <div class="ratio-legend mt-2">
              <div class="legend-item">
                <span class="legend-color bg-blue"></span>
                <span><strong>Normal Orders:</strong> {{ dealerNormalOrders.length }} orders (&#8377;{{ dealerNormalSpend | number:'1.0-0' }})</span>
              </div>
              <div class="legend-item">
                <span class="legend-color bg-purple"></span>
                <span><strong>Bidding Orders:</strong> {{ dealerBiddingOrders.length }} orders (&#8377;{{ dealerBiddingSpend | number:'1.0-0' }})</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Dealer Orders Table with Date-specific filters -->
        <div class="card table-card mt-3">
          <div class="table-header-row">
            <div class="d-flex align-center gap-2">
              <h3 class="card-title"><i class="fa-solid fa-receipt text-primary"></i> Dealer Procurement Audit Log</h3>
              <span class="badge badge-light-blue" *ngIf="specificDateFilter">Date: {{ specificDateFilter }}</span>
            </div>
            <div class="table-search-box">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" [(ngModel)]="tableSearch" placeholder="Search by crop, farmer, ID..." class="search-input" />
            </div>
          </div>
          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th (click)="sortOrders('id')">Order ID <i class="fa-solid" [ngClass]="getSortIcon('id')"></i></th>
                  <th (click)="sortOrders('cropName')">Crop Item <i class="fa-solid" [ngClass]="getSortIcon('cropName')"></i></th>
                  <th (click)="sortOrders('farmerName')">Farmer Producer <i class="fa-solid" [ngClass]="getSortIcon('farmerName')"></i></th>
                  <th (click)="sortOrders('isBidding')">Classification <i class="fa-solid" [ngClass]="getSortIcon('isBidding')"></i></th>
                  <th (click)="sortOrders('quantity')">Quantity (Kg) <i class="fa-solid" [ngClass]="getSortIcon('quantity')"></i></th>
                  <th (click)="sortOrders('finalAmount')">Total Cost (&#8377;) <i class="fa-solid" [ngClass]="getSortIcon('finalAmount')"></i></th>
                  <th (click)="sortOrders('createdAt')">Order Date <i class="fa-solid" [ngClass]="getSortIcon('createdAt')"></i></th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ord of pagedOrders">
                  <td><strong>{{ ord.id }}</strong></td>
                  <td><strong>{{ ord.cropName }}</strong></td>
                  <td>{{ ord.farmerName || 'Registered Farmer' }}</td>
                  <td>
                    <span class="badge" [ngClass]="ord.isBidding ? 'badge-bidding' : 'badge-normal'">
                      <i class="fa-solid" [ngClass]="ord.isBidding ? 'fa-gavel' : 'fa-basket-shopping'"></i>
                      {{ ord.isBidding ? 'Bidding Auction' : 'Normal Marketplace' }}
                    </span>
                  </td>
                  <td>{{ ord.quantity }} {{ ord.unit || 'Kg' }}</td>
                  <td><strong class="text-emerald">&#8377; {{ ord.finalAmount | number:'1.2-2' }}</strong></td>
                  <td>{{ ord.createdAt | date:'mediumDate' }}</td>
                  <td><span class="badge badge-success">{{ ord.status || 'PAID' }}</span></td>
                </tr>
                <tr *ngIf="pagedOrders.length === 0">
                  <td colspan="8" class="text-center py-4 text-muted">No procurement orders found for selected date and classification filter.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div class="table-pagination" *ngIf="orderTotalPages > 1">
            <span>Showing {{ (orderCurrentPage - 1) * orderPageSize + 1 }} to {{ Math.min(orderCurrentPage * orderPageSize, filteredOrders.length) }} of {{ filteredOrders.length }} orders</span>
            <div class="page-btns">
              <button class="btn-page" [disabled]="orderCurrentPage === 1" (click)="orderCurrentPage = orderCurrentPage - 1">&laquo;</button>
              <button *ngFor="let p of orderTotalPagesArray" class="btn-page" [class.active]="p === orderCurrentPage" (click)="orderCurrentPage = p">{{ p }}</button>
              <button class="btn-page" [disabled]="orderCurrentPage === orderTotalPages" (click)="orderCurrentPage = orderCurrentPage + 1">&raquo;</button>
            </div>
          </div>
        </div>

      </div>

      <!-- ========================================== -->
      <!-- 3. DELIVERY PARTNER REPORTS VIEW -->
      <!-- ========================================== -->
      <div *ngIf="effectiveRole === 'DELIVERY_PARTNER'" class="role-reports-section mt-3">

        <!-- Date Specific Selector -->
        <div class="period-selector-row">
          <div class="d-flex align-center gap-2">
            <span class="period-lbl"><i class="fa-solid fa-truck-ramp-box"></i> Date-Specific Logistics Activity:</span>
            <input type="date" [(ngModel)]="specificDateFilter" (change)="onDeliveryDateFilterChange()" class="date-input" />
            <button *ngIf="specificDateFilter" class="btn-clear-date" (click)="clearDeliveryDateFilter()">&times; Show All Dates</button>
          </div>
          <div class="payout-rate-notice">
            <i class="fa-solid fa-circle-info text-primary"></i> Verified Payout Rate: <strong>₹10.00 / km</strong> credited to digital wallet.
          </div>
        </div>

        <!-- Delivery Partner KPI Cards -->
        <div class="kpi-grid mt-3">
          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Total Completed Deliveries</span>
              <div class="kpi-icon bg-emerald-light text-emerald"><i class="fa-solid fa-circle-check"></i></div>
            </div>
            <h2 class="kpi-val text-emerald">{{ partnerCompletedDeliveries.length }} Trips</h2>
            <span class="kpi-sub">{{ specificDateFilter ? 'On ' + specificDateFilter : 'All time fulfilled' }}</span>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Logistics Transit Distance</span>
              <div class="kpi-icon bg-blue-light text-primary"><i class="fa-solid fa-route"></i></div>
            </div>
            <h2 class="kpi-val text-primary">{{ partnerTotalDistance }} KM</h2>
            <span class="kpi-sub">Total verified farm-to-warehouse run</span>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Wallet Delivery Earnings</span>
              <div class="kpi-icon bg-amber-light text-amber"><i class="fa-solid fa-wallet"></i></div>
            </div>
            <h2 class="kpi-val text-amber">&#8377; {{ partnerTotalEarnings | number:'1.2-2' }}</h2>
            <span class="kpi-sub">Directly withdrawable via NEFT</span>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Active In-Transit Trips</span>
              <div class="kpi-icon bg-purple-light text-purple"><i class="fa-solid fa-truck-moving"></i></div>
            </div>
            <h2 class="kpi-val text-purple">{{ partnerActiveTrips.length }} Trips</h2>
            <span class="kpi-sub">Under dispatch / pickup</span>
          </div>
        </div>

        <!-- Deliveries Log Table -->
        <div class="card table-card mt-3">
          <div class="table-header-row">
            <h3 class="card-title"><i class="fa-solid fa-clipboard-list text-primary"></i> Date-Specific Deliveries & Payouts Log</h3>
            <div class="table-search-box">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" [(ngModel)]="deliverySearch" placeholder="Search by crop, order ID, farmer..." class="search-input" />
            </div>
          </div>
          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th (click)="sortDeliveries('orderId')">Trip / Order ID <i class="fa-solid" [ngClass]="getDeliverySortIcon('orderId')"></i></th>
                  <th (click)="sortDeliveries('cropName')">Produce Item <i class="fa-solid" [ngClass]="getDeliverySortIcon('cropName')"></i></th>
                  <th (click)="sortDeliveries('pickupAddress')">Pickup Farm Location <i class="fa-solid" [ngClass]="getDeliverySortIcon('pickupAddress')"></i></th>
                  <th (click)="sortDeliveries('dropAddress')">Destination Mandi / Warehouse <i class="fa-solid" [ngClass]="getDeliverySortIcon('dropAddress')"></i></th>
                  <th (click)="sortDeliveries('distanceKm')">Distance (KM) <i class="fa-solid" [ngClass]="getDeliverySortIcon('distanceKm')"></i></th>
                  <th (click)="sortDeliveries('deliveryFee')">Trip Payout (&#8377;) <i class="fa-solid" [ngClass]="getDeliverySortIcon('deliveryFee')"></i></th>
                  <th (click)="sortDeliveries('status')">Fulfillment Status <i class="fa-solid" [ngClass]="getDeliverySortIcon('status')"></i></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let del of pagedDeliveries">
                  <td><strong>#{{ del.orderId }}</strong></td>
                  <td><strong>{{ del.cropName }}</strong> ({{ del.cropQuantity }} {{ del.cropUnit || 'Kg' }})</td>
                  <td><i class="fa-solid fa-location-dot text-danger"></i> {{ del.pickupAddress || 'Punjab Farm Gate' }}</td>
                  <td><i class="fa-solid fa-warehouse text-primary"></i> {{ del.dropAddress || 'Delhi Mandi Terminal' }}</td>
                  <td><strong>{{ del.distanceKm || 15 }} km</strong></td>
                  <td><strong class="text-emerald">&#8377; {{ del.deliveryFee || 150 | number:'1.2-2' }}</strong></td>
                  <td>
                    <span class="badge" [ngClass]="del.status === 'DELIVERED' ? 'badge-success' : 'badge-waiting'">
                      <i class="fa-solid" [ngClass]="del.status === 'DELIVERED' ? 'fa-check' : 'fa-truck-fast'"></i>
                      {{ del.status === 'DELIVERED' ? 'Delivered & Paid' : (del.status || 'ASSIGNED') }}
                    </span>
                  </td>
                </tr>
                <tr *ngIf="pagedDeliveries.length === 0">
                  <td colspan="7" class="text-center py-4 text-muted">No logistics delivery records found for this date.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div class="table-pagination" *ngIf="deliveryTotalPages > 1">
            <span>Showing {{ (deliveryCurrentPage - 1) * deliveryPageSize + 1 }} to {{ Math.min(deliveryCurrentPage * deliveryPageSize, filteredDeliveries.length) }} of {{ filteredDeliveries.length }} deliveries</span>
            <div class="page-btns">
              <button class="btn-page" [disabled]="deliveryCurrentPage === 1" (click)="deliveryCurrentPage = deliveryCurrentPage - 1">&laquo;</button>
              <button *ngFor="let p of deliveryTotalPagesArray" class="btn-page" [class.active]="p === deliveryCurrentPage" (click)="deliveryCurrentPage = p">{{ p }}</button>
              <button class="btn-page" [disabled]="deliveryCurrentPage === deliveryTotalPages" (click)="deliveryCurrentPage = deliveryCurrentPage + 1">&raquo;</button>
            </div>
          </div>
        </div>

      </div>

      <!-- ========================================== -->
      <!-- 4. ADMIN MASTER AUDIT REPORTS VIEW -->
      <!-- ========================================== -->
      <div *ngIf="effectiveRole === 'ADMIN'" class="role-reports-section mt-3">

        <!-- Executive KPI Overview -->
        <div class="kpi-grid">
          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Total Platform Volume</span>
              <div class="kpi-icon bg-emerald-light text-emerald"><i class="fa-solid fa-indian-rupee-sign"></i></div>
            </div>
            <h2 class="kpi-val text-emerald">&#8377; {{ adminTotalGmv | number:'1.2-2' }}</h2>
            <div class="kpi-trend positive"><i class="fa-solid fa-arrow-trend-up"></i> 100% Tax Compliant</div>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Total Executed Orders</span>
              <div class="kpi-icon bg-blue-light text-primary"><i class="fa-solid fa-file-invoice"></i></div>
            </div>
            <h2 class="kpi-val text-primary">{{ allOrders.length }} Orders</h2>
            <span class="kpi-sub">Across all mandi jurisdictions</span>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Marketplace vs Bidding</span>
              <div class="kpi-icon bg-purple-light text-purple"><i class="fa-solid fa-arrows-split-up-and-left"></i></div>
            </div>
            <h2 class="kpi-val text-purple">{{ dealerNormalOrders.length }} / {{ dealerBiddingOrders.length }}</h2>
            <span class="kpi-sub">Normal: &#8377;{{ dealerNormalSpend | number:'1.0-0' }} | Bid: &#8377;{{ dealerBiddingSpend | number:'1.0-0' }}</span>
          </div>

          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-lbl">Active Logistics Trips</span>
              <div class="kpi-icon bg-amber-light text-amber"><i class="fa-solid fa-truck-fast"></i></div>
            </div>
            <h2 class="kpi-val text-amber">{{ allDeliveries.length }} Trips</h2>
            <span class="kpi-sub">&#8377; {{ partnerTotalEarnings | number:'1.0-0' }} Logistics settled</span>
          </div>
        </div>

        <!-- Admin Executive Aggregates & Volume Overview (No Order Searching/Listing Table) -->
        <div class="card admin-aggregates-panel mt-3 shadow-sm">
          <div class="aggregates-header">
            <div>
              <h3 class="card-title"><i class="fa-solid fa-chart-pie text-emerald"></i> Financial & Operations Aggregates</h3>
              <p class="table-subtitle">Summary metrics, total payment volume, transaction channels, and settlement distribution</p>
            </div>
            <span class="badge badge-success"><i class="fa-solid fa-shield-check"></i> 100% Tax Invoices Generated</span>
          </div>

          <!-- 4 Summary Metric Tiles -->
          <div class="aggregates-grid mt-3">
            <div class="agg-card card-settled">
              <div class="agg-top">
                <span class="agg-label">Completed & Settled Orders</span>
                <i class="fa-solid fa-circle-check text-emerald"></i>
              </div>
              <h3 class="agg-val">{{ allOrders.length }} Orders</h3>
              <span class="agg-desc">Total Gross: ₹{{ adminTotalGmv | number:'1.2-2' }}</span>
            </div>

            <div class="agg-card card-payments">
              <div class="agg-top">
                <span class="agg-label">Total Payment Volume (GMV)</span>
                <i class="fa-solid fa-money-bill-wave text-primary"></i>
              </div>
              <h3 class="agg-val text-primary">₹{{ adminTotalGmv | number:'1.2-2' }}</h3>
              <span class="agg-desc">100% Cleared Settlement</span>
            </div>

            <div class="agg-card card-farmer-payout">
              <div class="agg-top">
                <span class="agg-label">Net Farmer Disbursals</span>
                <i class="fa-solid fa-tractor text-amber"></i>
              </div>
              <h3 class="agg-val text-amber">₹{{ (adminTotalGmv * 0.94) | number:'1.2-2' }}</h3>
              <span class="agg-desc">Direct Mandi Bank Credits</span>
            </div>

            <div class="agg-card card-logistics-fee">
              <div class="agg-top">
                <span class="agg-label">Logistics Payouts</span>
                <i class="fa-solid fa-truck text-purple"></i>
              </div>
              <h3 class="agg-val text-purple">₹{{ (partnerTotalEarnings || 18500) | number:'1.2-2' }}</h3>
              <span class="agg-desc">{{ allDeliveries.length }} Verified Trips</span>
            </div>
          </div>

          <!-- Channel & Volume Distribution Breakdown -->
          <div class="breakdown-cards-row mt-3">
            <!-- Card 1: Channel Distribution -->
            <div class="channel-card">
              <div class="channel-card-head">
                <h4 class="sub-head"><i class="fa-solid fa-arrows-split-up-and-left text-primary"></i> Order Procurement Breakdown</h4>
                <span class="badge badge-light-blue">{{ allOrders.length }} Total</span>
              </div>

              <div class="channel-item mt-3">
                <div class="channel-info-row">
                  <span><i class="fa-solid fa-store text-primary me-1"></i> Normal Marketplace</span>
                  <strong>{{ dealerNormalOrders.length }} Orders (₹{{ dealerNormalSpend | number:'1.0-0' }})</strong>
                </div>
                <div class="progress-track mt-1">
                  <div class="progress-bar bg-blue" [style.width.%]="normalPercentage"></div>
                </div>
              </div>

              <div class="channel-item mt-3">
                <div class="channel-info-row">
                  <span><i class="fa-solid fa-gavel text-purple me-1"></i> Live Bidding Auctions</span>
                  <strong>{{ dealerBiddingOrders.length }} Orders (₹{{ dealerBiddingSpend | number:'1.0-0' }})</strong>
                </div>
                <div class="progress-track mt-1">
                  <div class="progress-bar bg-purple" [style.width.%]="biddingPercentage"></div>
                </div>
              </div>
            </div>

            <!-- Card 2: Platform Compliance & Fulfillment -->
            <div class="channel-card">
              <div class="channel-card-head">
                <h4 class="sub-head"><i class="fa-solid fa-truck-ramp-box text-emerald"></i> Fulfillment & Logistics Summary</h4>
                <span class="badge badge-success">{{ allDeliveries.length }} Trips</span>
              </div>

              <div class="summary-stats-list mt-3">
                <div class="stat-line">
                  <span class="text-muted"><i class="fa-solid fa-route text-emerald me-1"></i> Total Freight Distance:</span>
                  <strong>{{ partnerTotalDistance || 640 }} Kilometers</strong>
                </div>
                <div class="stat-line mt-2">
                  <span class="text-muted"><i class="fa-solid fa-circle-check text-emerald me-1"></i> Completed Transits:</span>
                  <strong>{{ partnerCompletedDeliveries.length || 8 }} Deliveries (100% On-Time)</strong>
                </div>
                <div class="stat-line mt-2">
                  <span class="text-muted"><i class="fa-solid fa-file-invoice text-emerald me-1"></i> Average Order Size:</span>
                  <strong>₹{{ (allOrders.length > 0 ? (adminTotalGmv / allOrders.length) : 0) | number:'1.0-0' }} / Order</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .reports-page-container { display: flex; flex-direction: column; gap: 1rem; }

    /* Hero Banner */
    .reports-hero-banner {
      background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/assets/images/sunset-banner.jpg') center/cover no-repeat;
      border-radius: 14px;
      padding: 2.2rem 2.8rem;
      color: white;
      min-height: 120px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
    }
    .reports-title { font-size: 2rem; font-weight: 800; margin: 0 0 0.3rem 0; color: #fff; }
    .reports-subtitle { font-size: 0.95rem; color: #f1f5f9; margin: 0; max-width: 800px; }
    .role-badge {
      background: rgba(22, 163, 74, 0.9);
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      text-transform: uppercase;
    }

    .header-action-btns { display: flex; gap: 0.6rem; }
    .btn {
      padding: 0.6rem 1.1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border: none;
      transition: all 0.15s;
    }
    .btn-export { background: #ffffff; color: #166534; }
    .btn-export:hover { background: #f0fdf4; }
    .btn-print { background: rgba(255,255,255,0.2); color: #ffffff; border: 1px solid rgba(255,255,255,0.4); }
    .btn-print:hover { background: rgba(255,255,255,0.3); }

    /* Admin Tab Switcher */
    .admin-tab-switch {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: #ffffff;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      flex-wrap: wrap;
    }
    .switch-lbl { font-size: 0.82rem; font-weight: 700; color: #64748b; }
    .btn-role-tab {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.15s;
    }
    .btn-role-tab.active { background: #16a34a; color: white; border-color: #16a34a; }

    /* Period Selector */
    .period-selector-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      padding: 0.85rem 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .period-lbl { font-size: 0.85rem; font-weight: 700; color: #334155; }
    .period-chips { display: flex; gap: 0.4rem; }
    .period-chip {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 0.4rem 0.85rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s;
    }
    .period-chip.active { background: #16a34a; color: white; border-color: #16a34a; }
    .date-range-filter { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; }
    .date-input {
      padding: 0.4rem 0.65rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.82rem;
      outline: none;
    }
    .btn-clear-date { background: #fee2e2; color: #991b1b; border: none; padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
    .payout-rate-notice { font-size: 0.82rem; color: #475569; }

    /* KPI Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .kpi-card {
      background: #ffffff;
      border-radius: 14px;
      padding: 1.3rem 1.5rem;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .kpi-top { display: flex; justify-content: space-between; align-items: center; }
    .kpi-lbl { font-size: 0.8rem; font-weight: 700; color: #64748b; }
    .kpi-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
    .kpi-val { font-size: 1.65rem; font-weight: 800; color: #0f172a; margin: 0.2rem 0; line-height: 1.1; }
    .kpi-trend { font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.3rem; }
    .kpi-trend.positive { color: #16a34a; }
    .kpi-trend.neutral { color: #0284c7; }
    .kpi-sub { font-size: 0.78rem; color: #64748b; }

    /* Highlight Cards */
    .highlight-card-normal { border-left: 4px solid #0284c7; }
    .highlight-card-bidding { border-left: 4px solid #9333ea; }

    /* Chart / Breakdown Card */
    .chart-card {
      background: #ffffff;
      border-radius: 14px;
      padding: 1.3rem 1.5rem;
      border: 1px solid #e2e8f0;
    }
    .card-head { display: flex; justify-content: space-between; align-items: center; }
    .card-title { font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0; }
    .breakdown-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
    .breakdown-col { background: #f8fafc; padding: 1rem; border-radius: 10px; border: 1px solid #e2e8f0; }
    .breakdown-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; }
    .period-title { font-size: 0.85rem; font-weight: 700; color: #334155; }
    .progress-track { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 0.45rem; }
    .progress-bar { height: 100%; border-radius: 4px; }
    .breakdown-meta { font-size: 0.75rem; color: #64748b; }

    /* Ratio Bar */
    .ratio-bar-wrap { display: flex; flex-direction: column; gap: 0.5rem; }
    .ratio-bar { height: 26px; width: 100%; border-radius: 8px; overflow: hidden; display: flex; }
    .ratio-segment { display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: white; transition: width 0.3s; }
    .segment-normal { background: #0284c7; }
    .segment-bidding { background: #9333ea; }
    .ratio-legend { display: flex; gap: 1.5rem; font-size: 0.82rem; }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; }
    .legend-color { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }

    /* Table Card */
    .table-card {
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .table-header-row {
      padding: 1.1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .table-subtitle { margin: 0.15rem 0 0 0; font-size: 0.8rem; color: #64748b; }
    .table-search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.45rem 0.75rem;
    }
    .admin-search-box { width: 420px; max-width: 100%; }
    .search-input { border: none; background: transparent; outline: none; font-size: 0.85rem; width: 100%; }

    .table-container { overflow-x: auto; }
    .report-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .report-table th {
      background: #f8fafc;
      color: #64748b;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.85rem 1.25rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      user-select: none;
    }
    .sortable-th { cursor: pointer; }
    .sortable-th:hover { color: #16a34a; background: #f0fdf4; }
    .report-table td {
      padding: 0.9rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: middle;
    }

    .badge-normal { background: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 6px; }
    .badge-bidding { background: #f3e8ff; color: #7e22ce; font-weight: 700; font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 6px; }
    .badge-success { background: #dcfce7; color: #166534; font-weight: 700; font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 6px; }
    .badge-waiting { background: #fef3c7; color: #92400e; font-weight: 700; font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 6px; }
    .badge-light-blue { background: #eff6ff; color: #1d4ed8; font-weight: 700; font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 6px; }

    /* Table Pagination */
    .table-pagination {
      padding: 0.85rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 0.82rem;
      color: #64748b;
    }
    .page-btns { display: flex; gap: 0.35rem; }
    .btn-page {
      min-width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-page.active { background: #16a34a; border-color: #16a34a; color: white; }
    .btn-page:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Colors */
    .text-emerald { color: #16a34a; }
    .text-primary { color: #0284c7; }
    .text-amber { color: #d97706; }
    .text-purple { color: #9333ea; }
    .text-danger { color: #dc2626; }
    .text-muted { color: #64748b; }
    .text-center { text-align: center; }

    .bg-emerald { background: #16a34a; }
    .bg-blue { background: #0284c7; }
    .bg-amber { background: #d97706; }
    .bg-purple { background: #9333ea; }

    .bg-emerald-light { background: #dcfce7; }
    .bg-blue-light { background: #e0f2fe; }
    .bg-amber-light { background: #fef3c7; }
    .bg-purple-light { background: #f3e8ff; }

    /* Admin Aggregates Panel */
    .admin-aggregates-panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.5rem;
    }
    .aggregates-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .aggregates-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }
    .agg-card {
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      border: 1px solid #e2e8f0;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .agg-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.05);
    }
    .card-settled { background: #f0fdf4; border-color: #bbf7d0; }
    .card-payments { background: #f0f9ff; border-color: #bae6fd; }
    .card-farmer-payout { background: #fefce8; border-color: #fef08a; }
    .card-logistics-fee { background: #faf5ff; border-color: #e9d5ff; }
    .agg-top { display: flex; justify-content: space-between; align-items: center; }
    .agg-label { font-size: 0.78rem; font-weight: 700; color: #475569; }
    .agg-val { font-size: 1.6rem; font-weight: 800; color: #0f172a; margin: 0.2rem 0; line-height: 1.1; }
    .agg-desc { font-size: 0.75rem; color: #64748b; font-weight: 600; }

    .breakdown-cards-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }
    .channel-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
    }
    .channel-card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .sub-head { font-size: 0.95rem; font-weight: 800; color: #0f172a; margin: 0; }
    .channel-info-row { display: flex; justify-content: space-between; font-size: 0.85rem; color: #334155; }
    .summary-stats-list .stat-line { display: flex; justify-content: space-between; font-size: 0.85rem; }

    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 1rem; }
    .py-4 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
    .d-flex { display: flex; }
    .align-center { align-items: center; }
    .gap-2 { gap: 0.5rem; }

    @media (max-width: 1024px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .breakdown-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .reports-hero-banner { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class ReportsComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  userRole: string = 'FARMER';
  activeAdminView: 'ADMIN' | 'FARMER' | 'DEALER' | 'DELIVERY' = 'ADMIN';

  // Filters
  farmerPeriod: TimePeriod | 'CUSTOM' = 'MONTH';
  dealerPurchaseFilter: PurchaseTypeFilter = 'ALL';
  specificDateFilter: string = '';
  tableSearch: string = '';
  deliverySearch: string = '';

  // Multi-column sorting
  sortField: string = 'createdAt';
  sortAscending: boolean = false;
  deliverySortField: string = 'orderId';
  deliverySortAscending: boolean = false;

  // Pagination
  orderCurrentPage = 1;
  orderPageSize = 5;
  deliveryCurrentPage = 1;
  deliveryPageSize = 5;
  Math = Math;

  allOrders: Order[] = [];
  allDeliveries: Delivery[] = [];
  private sub: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private deliveryService: DeliveryService,
    private walletService: WalletService
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.authService.currentUser$.subscribe((u: User | null) => {
        this.currentUser = u;
        if (u && u.role) {
          this.userRole = u.role;
        }
        this.loadReportsData();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get isFarmer(): boolean {
    return this.effectiveRole === 'FARMER';
  }

  get isDealer(): boolean {
    return this.effectiveRole === 'DEALER';
  }

  get isDeliveryPartner(): boolean {
    return this.effectiveRole === 'DELIVERY_PARTNER';
  }

  get isAdmin(): boolean {
    return this.userRole === 'ADMIN';
  }

  get effectiveRole(): string {
    if (this.isAdmin) {
      if (this.activeAdminView === 'FARMER') return 'FARMER';
      if (this.activeAdminView === 'DEALER') return 'DEALER';
      if (this.activeAdminView === 'DELIVERY') return 'DELIVERY_PARTNER';
      return 'ADMIN';
    }
    return this.userRole;
  }

  loadReportsData(): void {
    const uid = String(this.currentUser?.id || this.currentUser?.userId || '').trim();

    if (this.userRole === 'FARMER' && uid) {
      this.orderService.getOrdersByFarmer(uid).subscribe({
        next: (orders) => {
          this.orderService.getAllOrders().subscribe({
            next: (all) => {
              const merged = [...(orders || []), ...(all || [])];
              this.allOrders = Array.from(new Map(merged.map(o => [String(o.id), o])).values());
            },
            error: () => {
              this.allOrders = orders || [];
            }
          });
        },
        error: () => {
          this.orderService.getAllOrders().subscribe({
            next: (orders) => this.allOrders = orders || [],
            error: () => this.allOrders = []
          });
        }
      });
    } else if (this.userRole === 'DEALER' && uid) {
      this.orderService.getOrdersByDealer(uid).subscribe({
        next: (orders) => {
          this.orderService.getAllOrders().subscribe({
            next: (all) => {
              const merged = [...(orders || []), ...(all || [])];
              this.allOrders = Array.from(new Map(merged.map(o => [String(o.id), o])).values());
            },
            error: () => {
              this.allOrders = orders || [];
            }
          });
        },
        error: () => {
          this.orderService.getAllOrders().subscribe({
            next: (orders) => this.allOrders = orders || [],
            error: () => this.allOrders = []
          });
        }
      });
    } else {
      this.orderService.getAllOrders().subscribe({
        next: (orders: Order[]) => {
          this.allOrders = orders || [];
        },
        error: () => {
          this.allOrders = [];
        }
      });
    }

    this.deliveryService.getAllDeliveries().subscribe({
      next: (deliveries: Delivery[]) => {
        this.allDeliveries = deliveries || [];
      },
      error: () => {
        this.allDeliveries = [];
      }
    });
  }

  // --- FARMER CALCULATIONS ---
  get farmerAllOrders(): Order[] {
    const uid = String(this.currentUser?.id || this.currentUser?.userId || '').trim();
    const fullName = (this.currentUser?.fullName || '').trim().toLowerCase();
    const username = (this.currentUser?.username || '').trim().toLowerCase();
    const email = (this.currentUser?.email || '').trim().toLowerCase();

    // If Admin is inspecting the aggregate Farmer view via admin tab switcher
    if (this.isAdmin && this.activeAdminView === 'FARMER') {
      return this.allOrders;
    }

    // For an actual farmer, ONLY return orders belonging to this specific farmer
    return this.allOrders.filter(o => {
      const fId = String(o.farmerId || '').trim();
      const fName = (o.farmerName || '').trim().toLowerCase();
      return (uid && fId === uid) ||
             (fullName && fName === fullName) ||
             (username && fName === username) ||
             (email && fName === email);
    });
  }

  get farmerDailyOrders(): Order[] {
    const today = new Date().toISOString().split('T')[0];
    return this.farmerAllOrders.filter(o => (o.createdAt || '').startsWith(today));
  }

  get farmerDailyOrdersCount(): number {
    return this.farmerDailyOrders.length;
  }

  get farmerDailyRevenue(): number {
    return this.farmerDailyOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
  }

  get farmerWeeklyOrders(): Order[] {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    return this.farmerAllOrders.filter(o => new Date(o.createdAt || '') >= weekAgo);
  }

  get farmerWeeklyOrdersCount(): number {
    return this.farmerWeeklyOrders.length;
  }

  get farmerWeeklyRevenue(): number {
    return this.farmerWeeklyOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
  }

  get farmerMonthlyOrders(): Order[] {
    const monthAgo = new Date(Date.now() - 30 * 86400000);
    return this.farmerAllOrders.filter(o => new Date(o.createdAt || '') >= monthAgo);
  }

  get farmerMonthlyOrdersCount(): number {
    return this.farmerMonthlyOrders.length;
  }

  get farmerMonthlyRevenue(): number {
    return this.farmerMonthlyOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
  }

  get farmerCurrentRevenue(): number {
    return this.farmerCurrentOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
  }

  get farmerCurrentOrders(): Order[] {
    if (this.specificDateFilter) {
      return this.farmerAllOrders.filter(o => (o.createdAt || '').startsWith(this.specificDateFilter));
    }
    if (this.farmerPeriod === 'TODAY') return this.farmerDailyOrders;
    if (this.farmerPeriod === 'WEEK') return this.farmerWeeklyOrders;
    if (this.farmerPeriod === 'MONTH') return this.farmerMonthlyOrders;
    return this.farmerAllOrders;
  }

  // --- DEALER CALCULATIONS ---
  get dealerAllOrders(): Order[] {
    const uid = String(this.currentUser?.id || this.currentUser?.userId || '').trim();
    const fullName = (this.currentUser?.fullName || '').trim().toLowerCase();
    const username = (this.currentUser?.username || '').trim().toLowerCase();
    const email = (this.currentUser?.email || '').trim().toLowerCase();

    // If Admin is inspecting the aggregate Dealer view via admin tab switcher
    if (this.isAdmin && this.activeAdminView === 'DEALER') {
      return this.allOrders;
    }

    // For an actual dealer, ONLY return orders belonging to this specific dealer
    return this.allOrders.filter(o => {
      const dId = String(o.dealerId || '').trim();
      const dName = (o.dealerName || '').trim().toLowerCase();
      return (uid && dId === uid) ||
             (fullName && dName === fullName) ||
             (username && dName === username) ||
             (email && dName === email);
    });
  }

  get dealerNormalOrders(): Order[] {
    return this.dealerAllOrders.filter(o => !o.isBidding);
  }

  get dealerBiddingOrders(): Order[] {
    return this.dealerAllOrders.filter(o => !!o.isBidding);
  }

  get dealerTotalSpend(): number {
    return this.dealerAllOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
  }

  get dealerNormalSpend(): number {
    return this.dealerNormalOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
  }

  get dealerBiddingSpend(): number {
    return this.dealerBiddingOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
  }

  get dealerTodayOrders(): Order[] {
    const today = new Date().toISOString().split('T')[0];
    return this.dealerAllOrders.filter(o => (o.createdAt || '').startsWith(today));
  }

  get dealerTodaySpend(): number {
    return this.dealerTodayOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
  }

  get normalPercentage(): number {
    const total = this.dealerNormalSpend + this.dealerBiddingSpend;
    if (total === 0) return 50;
    return (this.dealerNormalSpend / total) * 100;
  }

  get biddingPercentage(): number {
    const total = this.dealerNormalSpend + this.dealerBiddingSpend;
    if (total === 0) return 50;
    return (this.dealerBiddingSpend / total) * 100;
  }

  setDealerPurchaseFilter(filter: PurchaseTypeFilter): void {
    this.dealerPurchaseFilter = filter;
    this.orderCurrentPage = 1;
  }

  onDateFilterChange(): void {
    this.orderCurrentPage = 1;
  }

  clearDateFilter(): void {
    this.specificDateFilter = '';
    this.orderCurrentPage = 1;
  }

  // --- DELIVERY PARTNER CALCULATIONS ---
  get partnerDeliveries(): Delivery[] {
    const uid = String(this.currentUser?.id || this.currentUser?.userId || '').trim();
    const fullName = (this.currentUser?.fullName || '').trim().toLowerCase();
    const username = (this.currentUser?.username || '').trim().toLowerCase();

    let list = this.allDeliveries;
    if (!(this.isAdmin && this.activeAdminView === 'DELIVERY')) {
      // For an actual delivery partner, ONLY show their own deliveries
      list = list.filter(d => {
        const pId = String(d.partnerId || '').trim();
        const pName = (d.partnerName || '').trim().toLowerCase();
        return (uid && pId === uid) ||
               (fullName && pName === fullName) ||
               (username && pName === username);
      });
    }

    if (this.specificDateFilter) {
      return list.filter(d => (d.createdAt || '').startsWith(this.specificDateFilter));
    }
    return list;
  }

  get partnerCompletedDeliveries(): Delivery[] {
    return this.partnerDeliveries.filter(d => d.status === 'DELIVERED');
  }

  get partnerActiveTrips(): Delivery[] {
    return this.partnerDeliveries.filter(d => d.status !== 'DELIVERED');
  }

  get partnerTotalDistance(): number {
    return this.partnerCompletedDeliveries.reduce((sum, d) => sum + (d.distanceKm || 15), 0);
  }

  get partnerTotalEarnings(): number {
    return this.partnerCompletedDeliveries.reduce((sum, d) => sum + (d.deliveryFee || 150), 0);
  }

  onDeliveryDateFilterChange(): void {
    this.deliveryCurrentPage = 1;
  }

  clearDeliveryDateFilter(): void {
    this.specificDateFilter = '';
    this.deliveryCurrentPage = 1;
  }

  // --- ADMIN CALCULATIONS ---
  get adminTotalGmv(): number {
    return this.allOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
  }

  // --- MULTI-COLUMN SORTING & MULTI-FIELD SEARCH ---
  get filteredOrders(): Order[] {
    let list = this.effectiveRole === 'FARMER'
      ? this.farmerCurrentOrders
      : (this.effectiveRole === 'DEALER'
          ? (this.dealerPurchaseFilter === 'NORMAL'
              ? this.dealerNormalOrders
              : (this.dealerPurchaseFilter === 'BIDDING' ? this.dealerBiddingOrders : this.dealerAllOrders))
          : this.allOrders);

    if (this.specificDateFilter && this.effectiveRole !== 'FARMER') {
      list = list.filter(o => (o.createdAt || '').startsWith(this.specificDateFilter));
    }

    if (this.tableSearch) {
      const q = this.tableSearch.toLowerCase();
      list = list.filter(o =>
        (o.id || '').toLowerCase().includes(q) ||
        (o.cropName || '').toLowerCase().includes(q) ||
        (o.farmerName || '').toLowerCase().includes(q) ||
        (o.dealerName || '').toLowerCase().includes(q) ||
        (o.status || '').toLowerCase().includes(q) ||
        (o.finalAmount?.toString() || '').includes(q)
      );
    }

    // Sort
    return list.sort((a: any, b: any) => {
      let valA = a[this.sortField];
      let valB = b[this.sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return this.sortAscending ? -1 : 1;
      if (valA > valB) return this.sortAscending ? 1 : -1;
      return 0;
    });
  }

  sortOrders(field: string): void {
    if (this.sortField === field) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortField = field;
      this.sortAscending = true;
    }
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'fa-sort text-muted';
    return this.sortAscending ? 'fa-sort-up text-emerald' : 'fa-sort-down text-emerald';
  }

  get orderTotalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.orderPageSize) || 1;
  }

  get orderTotalPagesArray(): number[] {
    return Array.from({ length: this.orderTotalPages }, (_, i) => i + 1);
  }

  get pagedOrders(): Order[] {
    const start = (this.orderCurrentPage - 1) * this.orderPageSize;
    return this.filteredOrders.slice(start, start + this.orderPageSize);
  }

  // Deliveries sorting & search
  get filteredDeliveries(): Delivery[] {
    let list = this.partnerDeliveries;
    if (this.deliverySearch) {
      const q = this.deliverySearch.toLowerCase();
      list = list.filter(d =>
        (d.orderId || '').toLowerCase().includes(q) ||
        (d.cropName || '').toLowerCase().includes(q) ||
        (d.pickupAddress || '').toLowerCase().includes(q) ||
        (d.dropAddress || '').toLowerCase().includes(q) ||
        (d.status || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a: any, b: any) => {
      let valA = a[this.deliverySortField];
      let valB = b[this.deliverySortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return this.deliverySortAscending ? -1 : 1;
      if (valA > valB) return this.deliverySortAscending ? 1 : -1;
      return 0;
    });
  }

  sortDeliveries(field: string): void {
    if (this.deliverySortField === field) {
      this.deliverySortAscending = !this.deliverySortAscending;
    } else {
      this.deliverySortField = field;
      this.deliverySortAscending = true;
    }
  }

  getDeliverySortIcon(field: string): string {
    if (this.deliverySortField !== field) return 'fa-sort text-muted';
    return this.deliverySortAscending ? 'fa-sort-up text-emerald' : 'fa-sort-down text-emerald';
  }

  get deliveryTotalPages(): number {
    return Math.ceil(this.filteredDeliveries.length / this.deliveryPageSize) || 1;
  }

  get deliveryTotalPagesArray(): number[] {
    return Array.from({ length: this.deliveryTotalPages }, (_, i) => i + 1);
  }

  get pagedDeliveries(): Delivery[] {
    const start = (this.deliveryCurrentPage - 1) * this.deliveryPageSize;
    return this.filteredDeliveries.slice(start, start + this.deliveryPageSize);
  }

  calcPercentage(part: number, whole: number): number {
    if (!whole || whole === 0) return 0;
    return Math.min(100, Math.round((part / whole) * 100));
  }

  getPeriodLabel(period: string): string {
    switch (period) {
      case 'TODAY': return 'Today\'s Daily Cycle';
      case 'WEEK': return 'Active 7-Day Week';
      case 'MONTH': return 'Current Calendar Month';
      case 'CUSTOM': return 'Chosen Specific Date';
      default: return 'All-Time Record';
    }
  }

  exportCSV(): void {
    let csv = 'Order ID,Crop Name,Farmer,Dealer,Type,Quantity (Kg),Final Amount (INR),Date,Status\n';
    this.filteredOrders.forEach(o => {
      csv += `"${o.id}","${o.cropName}","${o.farmerName || ''}","${o.dealerName || ''}","${o.isBidding ? 'Bidding' : 'Normal'}","${o.quantity}","${o.finalAmount}","${o.createdAt}","${o.status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `CropDeal_${this.effectiveRole}_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  printReport(): void {
    window.print();
  }
}
