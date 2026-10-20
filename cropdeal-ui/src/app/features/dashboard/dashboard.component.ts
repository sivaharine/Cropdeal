import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CropService } from '../../core/services/crop.service';
import { WalletService } from '../../core/services/wallet.service';
import { OrderService } from '../../core/services/order.service';
import { UserService } from '../../core/services/user.service';
import { BiddingService } from '../../core/services/bidding.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-wrap">

      <!-- ========================================== -->
      <!-- 1. FARMER DASHBOARD: TOTAL COUNTS & METRICS -->
      <!-- ========================================== -->
      <div *ngIf="user?.role === 'FARMER' || (!user?.role)" class="farmer-dashboard">
        <!-- Top Hero Banner -->
        <div class="hero-banner shadow-sm">
          <div class="banner-content">
            <span class="banner-greeting">Welcome Back,</span>
            <h1 class="banner-user-name">{{ user?.fullName || user?.username || 'Ramesh Kumar' }}</h1>
            <p class="banner-subtext">
              <strong>Your Agricultural Production Overview.</strong><br/>
              Track your harvest listings, orders, and total market earnings in one place.
            </p>
          </div>
          <div class="banner-badge-card shadow-md">
            <div class="verified-icon">
              <i class="fa-solid fa-shield-check"></i>
            </div>
            <div class="verified-text">
              <strong class="title">Verified Farmer</strong>
              <span class="sub">Active Producer</span>
            </div>
          </div>
        </div>

        <!-- Total Counts Summary Cards (2x2 Grid) -->
        <div class="stats-grid-2x2 mt-3">
          <!-- Card 1: Total Crops -->
          <div class="kpi-card card-mint">
            <div class="kpi-left">
              <div class="icon-circle circle-green">
                <i class="fa-solid fa-seedling"></i>
              </div>
              <div class="kpi-text">
                <span class="kpi-title">Total Crops</span>
                <h2 class="kpi-value">{{ totalCropsCount }}</h2>
                <span class="kpi-sub">Crops listed by you</span>
              </div>
            </div>
            <div class="kpi-art text-green">
              <i class="fa-solid fa-wheat-awn"></i>
            </div>
          </div>

          <!-- Card 2: Total Revenue -->
          <div class="kpi-card card-blue">
            <div class="kpi-left">
              <div class="icon-circle circle-blue">
                <i class="fa-solid fa-indian-rupee-sign"></i>
              </div>
              <div class="kpi-text">
                <span class="kpi-title">Total Revenue</span>
                <h2 class="kpi-value">&#8377;{{ totalRevenue | number:'1.0-0' }}</h2>
                <span class="kpi-sub">From completed sales</span>
              </div>
            </div>
            <div class="kpi-art text-blue">
              <i class="fa-solid fa-sack-dollar"></i>
            </div>
          </div>

          <!-- Card 3: Live Bidding Revenue -->
          <div class="kpi-card card-amber">
            <div class="kpi-left">
              <div class="icon-circle circle-amber">
                <i class="fa-solid fa-gavel"></i>
              </div>
              <div class="kpi-text">
                <span class="kpi-title">Live Bidding Revenue</span>
                <h2 class="kpi-value">&#8377;{{ biddingRevenue | number:'1.0-0' }}</h2>
                <span class="kpi-sub">From live auction deals</span>
              </div>
            </div>
            <div class="kpi-art text-amber">
              <i class="fa-solid fa-arrow-trend-up"></i>
            </div>
          </div>

          <!-- Card 4: Total Orders -->
          <div class="kpi-card card-purple">
            <div class="kpi-left">
              <div class="icon-circle circle-purple">
                <i class="fa-solid fa-cart-shopping"></i>
              </div>
              <div class="kpi-text">
                <span class="kpi-title">Total Orders</span>
                <h2 class="kpi-value">{{ totalOrdersCount }}</h2>
                <span class="kpi-sub">Total farmer orders completed</span>
              </div>
            </div>
            <div class="kpi-art text-purple">
              <i class="fa-solid fa-box-open"></i>
            </div>
          </div>
        </div>

        <!-- Quick Navigation Action Row -->
        <div class="quick-nav-grid mt-4">
          <a routerLink="/crops/add" class="nav-shortcut-card shadow-sm">
            <div class="shortcut-icon bg-emerald-light">
              <i class="fa-solid fa-circle-plus text-emerald"></i>
            </div>
            <div>
              <strong>Post New Crop</strong>
              <span>List harvest with APMC price check</span>
            </div>
          </a>
          <a routerLink="/crops" [queryParams]="{my: 'true'}" class="nav-shortcut-card shadow-sm">
            <div class="shortcut-icon bg-green-light">
              <i class="fa-solid fa-leaf text-emerald"></i>
            </div>
            <div>
              <strong>My Crops ({{ totalCropsCount }})</strong>
              <span>Manage your published crop listings</span>
            </div>
          </a>
          <a routerLink="/bidding" [queryParams]="{mode: 'my'}" class="nav-shortcut-card shadow-sm">
            <div class="shortcut-icon bg-amber-light">
              <i class="fa-solid fa-gavel text-amber"></i>
            </div>
            <div>
              <strong>Live Biddings</strong>
              <span>Review your active auction lots</span>
            </div>
          </a>
          <a routerLink="/orders" class="nav-shortcut-card shadow-sm">
            <div class="shortcut-icon bg-purple-light">
              <i class="fa-solid fa-receipt text-purple"></i>
            </div>
            <div>
              <strong>Orders & Invoices ({{ totalOrdersCount }})</strong>
              <span>View full orders and download GST bills</span>
            </div>
          </a>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- 2. DEALER DASHBOARD: TOTAL COUNTS & METRICS    -->
      <!-- ============================================== -->
      <div *ngIf="user?.role === 'DEALER'" class="dealer-dashboard">
        <!-- Top Hero Banner -->
        <div class="hero-banner shadow-sm">
          <div class="banner-content">
            <h1 class="banner-user-name">Welcome back, {{ user?.fullName || user?.username || 'Mohan Raj' }}!</h1>
            <p class="banner-subtext">Commercial Dealer Dashboard & Wholesale Metrics Overview.</p>
          </div>
          <div class="banner-badge-card shadow-md">
            <div class="verified-icon text-blue">
              <i class="fa-solid fa-building-wheat"></i>
            </div>
            <div class="verified-text">
              <strong class="title">Verified Dealer</strong>
              <span class="sub">CropDeal Commercial Member</span>
            </div>
          </div>
        </div>

        <!-- 6 Total Counts Stat Cards Row -->
        <div class="dealer-kpi-row mt-3">
          <div class="kpi-stat-card card">
            <div class="icon-circle circle-green">
              <i class="fa-solid fa-cart-shopping"></i>
            </div>
            <div class="kpi-stat-body">
              <span class="kpi-stat-lbl">Total Orders</span>
              <h3 class="kpi-stat-val">{{ dealerTotalOrders }}</h3>
              <span class="kpi-stat-growth text-success"><i class="fa-solid fa-arrow-up"></i> 20% vs last month</span>
            </div>
          </div>

          <div class="kpi-stat-card card">
            <div class="icon-circle circle-purple">
              <i class="fa-solid fa-gavel"></i>
            </div>
            <div class="kpi-stat-body">
              <span class="kpi-stat-lbl">My Biddings</span>
              <h3 class="kpi-stat-val">{{ dealerMyBiddings }}</h3>
              <span class="kpi-stat-growth text-success"><i class="fa-solid fa-arrow-up"></i> 25% vs last month</span>
            </div>
          </div>

          <div class="kpi-stat-card card">
            <div class="icon-circle circle-amber">
              <i class="fa-regular fa-clock"></i>
            </div>
            <div class="kpi-stat-body">
              <span class="kpi-stat-lbl">Current Active Bids</span>
              <h3 class="kpi-stat-val">{{ dealerActiveBids }}</h3>
              <span class="kpi-stat-growth text-success"><i class="fa-solid fa-arrow-up"></i> 40% vs last month</span>
            </div>
          </div>

          <div class="kpi-stat-card card">
            <div class="icon-circle circle-pink">
              <i class="fa-solid fa-comments"></i>
            </div>
            <div class="kpi-stat-body">
              <span class="kpi-stat-lbl">Active Negotiations</span>
              <h3 class="kpi-stat-val">{{ dealerActiveNegotiations }}</h3>
              <span class="kpi-stat-growth text-success"><i class="fa-solid fa-arrow-up"></i> 30% vs last month</span>
            </div>
          </div>

          <div class="kpi-stat-card card">
            <div class="icon-circle circle-blue">
              <i class="fa-solid fa-wallet"></i>
            </div>
            <div class="kpi-stat-body">
              <span class="kpi-stat-lbl">Wallet Balance</span>
              <h3 class="kpi-stat-val">&#8377; {{ walletBalance | number:'1.0-0' }}</h3>
              <span class="kpi-stat-sub-text text-emerald">Available for Instant Orders</span>
            </div>
          </div>

          <div class="kpi-stat-card card">
            <div class="icon-circle circle-mint">
              <i class="fa-regular fa-bell"></i>
            </div>
            <div class="kpi-stat-body">
              <span class="kpi-stat-lbl">Active Subscriptions</span>
              <h3 class="kpi-stat-val">{{ dealerActiveSubscriptions }}</h3>
              <span class="kpi-stat-growth text-success"><i class="fa-solid fa-arrow-up"></i> 50% vs last month</span>
            </div>
          </div>
        </div>

        <!-- Quick Navigation Action Cards -->
        <div class="quick-nav-grid mt-4">
          <a routerLink="/orders" class="nav-shortcut-card shadow-sm">
            <div class="shortcut-icon bg-green-light">
              <i class="fa-solid fa-box-open text-emerald"></i>
            </div>
            <div>
              <strong>My Orders ({{ dealerTotalOrders }})</strong>
              <span>Review order progress and farmer reviews</span>
            </div>
          </a>
          <a routerLink="/bidding" class="nav-shortcut-card shadow-sm">
            <div class="shortcut-icon bg-purple-light">
              <i class="fa-solid fa-gavel text-purple"></i>
            </div>
            <div>
              <strong>Live Auctions & Bids ({{ dealerActiveBids }})</strong>
              <span>Participate in real-time crop auctions</span>
            </div>
          </a>
          <a routerLink="/negotiations" class="nav-shortcut-card shadow-sm">
            <div class="shortcut-icon bg-amber-light">
              <i class="fa-solid fa-comments-dollar text-amber"></i>
            </div>
            <div>
              <strong>Negotiations ({{ dealerActiveNegotiations }})</strong>
              <span>Manage price counter-offers with farmers</span>
            </div>
          </a>
          <a routerLink="/wallet" class="nav-shortcut-card shadow-sm">
            <div class="shortcut-icon bg-teal-light">
              <i class="fa-solid fa-wallet text-teal"></i>
            </div>
            <div>
              <strong>Dealer Wallet (&#8377;{{ walletBalance | number:'1.0-0' }})</strong>
              <span>Recharge balance or view transaction logs</span>
            </div>
          </a>
        </div>
      </div>

      <!-- ========================================================== -->
      <!-- 3. DELIVERY PARTNER DASHBOARD: TOTAL COUNTS & METRICS      -->
      <!-- ========================================================== -->
      <div *ngIf="user?.role === 'DELIVERY_PARTNER'" class="delivery-dashboard">
        <!-- Banner -->
        <div class="hero-banner shadow-sm">
          <div class="banner-content">
            <h1 class="banner-user-name">Welcome back, {{ user?.fullName || user?.username || 'Mohan Raj' }}!</h1>
            <p class="banner-subtext">Delivering fresh crops, connecting verified farmers and wholesale buyers.</p>
          </div>
          <div class="banner-badge-card shadow-md">
            <div class="verified-icon text-emerald">
              <i class="fa-solid fa-truck-fast"></i>
            </div>
            <div class="verified-text">
              <strong class="title">Delivery Partner</strong>
              <span class="sub">Verified Logistics Agent</span>
            </div>
          </div>
        </div>

        <!-- 5 Total Counts Stat Cards Row -->
        <div class="delivery-kpi-row mt-3">
          <div class="kpi-stat-card card">
            <div class="icon-circle circle-green">
              <i class="fa-solid fa-box-open"></i>
            </div>
            <div class="kpi-stat-body">
              <span class="kpi-stat-lbl">Available Pickups</span>
              <h3 class="kpi-stat-val">{{ availablePickupsCount }}</h3>
              <span class="kpi-stat-growth text-success"><i class="fa-solid fa-arrow-up"></i> 25% this week</span>
            </div>
          </div>

          <div class="kpi-stat-card card">
            <div class="icon-circle circle-blue">
              <i class="fa-solid fa-truck"></i>
            </div>
            <div class="kpi-stat-body">
              <span class="kpi-stat-lbl">My Deliveries</span>
              <h3 class="kpi-stat-val">{{ myDeliveriesCount }}</h3>
              <span class="kpi-stat-growth text-success"><i class="fa-solid fa-arrow-up"></i> 40% this week</span>
            </div>
          </div>

          <div class="kpi-stat-card card">
            <div class="icon-circle circle-amber">
              <i class="fa-solid fa-circle-check"></i>
            </div>
            <div class="kpi-stat-body">
              <span class="kpi-stat-lbl">Completed Deliveries</span>
              <h3 class="kpi-stat-val">{{ completedDeliveriesCount }}</h3>
              <span class="kpi-stat-growth text-success"><i class="fa-solid fa-arrow-up"></i> 50% this week</span>
            </div>
          </div>

          <div class="kpi-stat-card card">
            <div class="icon-circle circle-pink">
              <i class="fa-solid fa-wallet"></i>
            </div>
            <div class="kpi-stat-body">
              <span class="kpi-stat-lbl">Total Earnings</span>
              <h3 class="kpi-stat-val">&#8377; {{ totalEarnings | number:'1.0-0' }}</h3>
              <span class="kpi-stat-growth text-success"><i class="fa-solid fa-arrow-up"></i> 28% this week</span>
            </div>
          </div>

          <div class="kpi-stat-card card">
            <div class="icon-circle circle-purple">
              <i class="fa-regular fa-clock"></i>
            </div>
            <div class="kpi-stat-body">
              <span class="kpi-stat-lbl">Ongoing Deliveries</span>
              <h3 class="kpi-stat-val">{{ ongoingDeliveriesCount }}</h3>
              <span class="kpi-stat-sub-text text-purple">Currently en route</span>
            </div>
          </div>
        </div>

        <!-- Quick Navigation Action Cards -->
        <div class="quick-nav-grid mt-4">
          <a routerLink="/deliveries" class="nav-shortcut-card shadow-sm">
            <div class="shortcut-icon bg-green-light">
              <i class="fa-solid fa-map-location-dot text-emerald"></i>
            </div>
            <div>
              <strong>Available Deliveries ({{ availablePickupsCount }})</strong>
              <span>Accept nearby crop pickup requests</span>
            </div>
          </a>
          <a routerLink="/deliveries" class="nav-shortcut-card shadow-sm">
            <div class="shortcut-icon bg-blue-light">
              <i class="fa-solid fa-truck-ramp-box text-blue"></i>
            </div>
            <div>
              <strong>My Routes ({{ myDeliveriesCount }})</strong>
              <span>Track route progress & update delivery status</span>
            </div>
          </a>
          <a routerLink="/wallet" class="nav-shortcut-card shadow-sm">
            <div class="shortcut-icon bg-pink-light">
              <i class="fa-solid fa-money-bill-transfer text-pink"></i>
            </div>
            <div>
              <strong>Earnings & Bank Payouts</strong>
              <span>Withdraw earnings directly to bank account</span>
            </div>
          </a>
        </div>
      </div>

      <!-- ================================================= -->
      <!-- 4. ADMIN DASHBOARD: TOTAL COUNTS & METRICS        -->
      <!-- ================================================= -->
      <div *ngIf="user?.role === 'ADMIN'" class="admin-dashboard">
        <!-- Top Hero Banner with Date Range -->
        <div class="hero-banner shadow-sm">
          <div class="banner-content">
            <h1 class="banner-user-name">CropDeal Administrator Dashboard</h1>
            <p class="banner-subtext">System-wide platform health, registered accounts, and total volume metrics.</p>
          </div>
          <div class="banner-badge-card shadow-md">
            <div class="date-range-pill">
              <i class="fa-regular fa-calendar-check"></i>
              <span>Active System Period</span>
            </div>
          </div>
        </div>

        <!-- 4 Stats Row (Total Counts) -->
        <div class="stats-grid-2x2 mt-3">
          <div class="kpi-card card-mint">
            <div class="kpi-left">
              <div class="icon-circle circle-green">
                <i class="fa-solid fa-users"></i>
              </div>
              <div class="kpi-text">
                <span class="kpi-title">Total Users</span>
                <h2 class="kpi-value">{{ adminTotalUsers }}</h2>
                <span class="kpi-sub">Registered platform users</span>
              </div>
            </div>
            <div class="kpi-art text-green">
              <i class="fa-solid fa-users-gear"></i>
            </div>
          </div>

          <div class="kpi-card card-amber">
            <div class="kpi-left">
              <div class="icon-circle circle-amber">
                <i class="fa-solid fa-wheat-awn"></i>
              </div>
              <div class="kpi-text">
                <span class="kpi-title">Total Crops Listed</span>
                <h2 class="kpi-value">{{ adminTotalCrops }}</h2>
                <span class="kpi-sub">Total farmer harvests catalogued</span>
              </div>
            </div>
            <div class="kpi-art text-amber">
              <i class="fa-solid fa-plant-wilt"></i>
            </div>
          </div>

          <div class="kpi-card card-blue">
            <div class="kpi-left">
              <div class="icon-circle circle-blue">
                <i class="fa-solid fa-cart-shopping"></i>
              </div>
              <div class="kpi-text">
                <span class="kpi-title">Total Orders</span>
                <h2 class="kpi-value">{{ adminTotalOrders }}</h2>
                <span class="kpi-sub">Total completed trades</span>
              </div>
            </div>
            <div class="kpi-art text-blue">
              <i class="fa-solid fa-boxes-stacked"></i>
            </div>
          </div>

          <div class="kpi-card card-purple">
            <div class="kpi-left">
              <div class="icon-circle circle-purple">
                <i class="fa-solid fa-chart-line"></i>
              </div>
              <div class="kpi-text">
                <span class="kpi-title">Total Platform Volume</span>
                <h2 class="kpi-value">&#8377; {{ adminTotalRevenue | number:'1.0-0' }}</h2>
                <span class="kpi-sub">Gross marketplace volume</span>
              </div>
            </div>
            <div class="kpi-art text-purple">
              <i class="fa-solid fa-coins"></i>
            </div>
          </div>
        </div>

        <!-- Quick Navigation Action Cards for Admin -->
        <div class="quick-nav-grid mt-4">
          <a routerLink="/admin/users" class="nav-shortcut-card shadow-sm">
            <div class="shortcut-icon bg-green-light">
              <i class="fa-solid fa-users-gear text-emerald"></i>
            </div>
            <div>
              <strong>User Management ({{ adminTotalUsers }})</strong>
              <span>Verify and manage user credentials</span>
            </div>
          </a>
          <a routerLink="/admin/crops" class="nav-shortcut-card shadow-sm">
            <div class="shortcut-icon bg-amber-light">
              <i class="fa-solid fa-wheat-awn text-amber"></i>
            </div>
            <div>
              <strong>Crop Catalog Management ({{ adminTotalCrops }})</strong>
              <span>Inspect active harvest listings</span>
            </div>
          </a>
          <a routerLink="/admin/reports" class="nav-shortcut-card shadow-sm">
            <div class="shortcut-icon bg-blue-light">
              <i class="fa-solid fa-chart-pie text-blue"></i>
            </div>
            <div>
              <strong>System Analytics & Reports</strong>
              <span>Generate customized volume reports</span>
            </div>
          </a>
          <a routerLink="/admin/biddings" class="nav-shortcut-card shadow-sm">
            <div class="shortcut-icon bg-purple-light">
              <i class="fa-solid fa-gavel text-purple"></i>
            </div>
            <div>
              <strong>Bidding Audit</strong>
              <span>Inspect auction compliance and bids</span>
            </div>
          </a>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .dashboard-wrap { display: flex; flex-direction: column; gap: 1.25rem; }

    /* Top Hero Banner */
    .hero-banner {
      background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/assets/images/sunset-banner.jpg') center/cover no-repeat;
      border-radius: 14px;
      padding: 2.2rem 2.8rem;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 180px;
    }
    .dealer-dashboard .hero-banner {
      background: linear-gradient(rgba(15, 23, 42, 0.40), rgba(15, 23, 42, 0.60)), url('/assets/images/dealer-banner.jpg') center/cover no-repeat;
    }
    .admin-dashboard .hero-banner {
      background: linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.65)), url('/assets/images/admin-banner.jpg') center/cover no-repeat;
    }
    .delivery-dashboard .hero-banner {
      background: linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.55)), url('/assets/images/delivery-banner.jpg') center/cover no-repeat;
    }
    .banner-content { max-width: 650px; }
    .banner-greeting {
      font-size: 1.1rem;
      font-weight: 500;
      color: #f1f5f9;
      display: block;
      margin-bottom: 0.2rem;
    }
    .banner-user-name {
      font-size: 2.2rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 0.5rem 0;
      line-height: 1.15;
    }
    .banner-subtext {
      font-size: 0.92rem;
      color: #e2e8f0;
      line-height: 1.5;
      margin: 0;
    }
    .banner-badge-card {
      background: #ffffff;
      color: #0f172a;
      border-radius: 12px;
      padding: 1.1rem 1.6rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-shrink: 0;
    }
    .banner-badge-card .verified-icon {
      font-size: 2.2rem;
      color: #16a34a;
    }
    .banner-badge-card .verified-text .title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      display: block;
    }
    .banner-badge-card .verified-text .sub {
      font-size: 0.78rem;
      color: #64748b;
    }
    .date-range-pill {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.88rem;
      font-weight: 700;
      color: #16a34a;
    }

    /* 2x2 Large KPI Grid (Farmer & Admin) */
    .stats-grid-2x2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }
    .kpi-card {
      border-radius: 14px;
      padding: 1.8rem 2.2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 140px;
      position: relative;
      overflow: hidden;
      border: 1px solid transparent;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.06);
    }
    .card-mint { background: #eafaf1; border-color: #d1fae5; }
    .card-blue { background: #edf6fd; border-color: #dbeafe; }
    .card-amber { background: #fef8eb; border-color: #fef3c7; }
    .card-purple { background: #f7f1fc; border-color: #f3e8ff; }

    .kpi-left { display: flex; align-items: center; gap: 1.4rem; }
    .icon-circle {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: white;
      flex-shrink: 0;
    }
    .circle-green { background: #22c55e; }
    .circle-blue { background: #3b82f6; }
    .circle-amber { background: #f59e0b; }
    .circle-purple { background: #a855f7; }
    .circle-pink { background: #ec4899; }
    .circle-mint { background: #10b981; }

    .kpi-text .kpi-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #334155;
      display: block;
    }
    .kpi-text .kpi-value {
      font-size: 2.1rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0.15rem 0 0.1rem 0;
      line-height: 1.1;
    }
    .kpi-text .kpi-sub {
      font-size: 0.82rem;
      color: #64748b;
    }
    .kpi-art {
      font-size: 3.8rem;
      opacity: 0.85;
      padding-right: 0.5rem;
    }
    .text-green { color: #16a34a; }
    .text-blue { color: #2563eb; }
    .text-amber { color: #f59e0b; }
    .text-purple { color: #9333ea; }
    .text-pink { color: #ec4899; }
    .text-teal { color: #0d9488; }
    .text-emerald { color: #16a34a; }
    .text-success { color: #16a34a; }

    /* Dealer KPI Grid (6 Columns) */
    .dealer-kpi-row {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 0.9rem;
    }
    .delivery-kpi-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.9rem;
    }
    .kpi-stat-card {
      background: white;
      border: 1px solid #e2e8f0;
      padding: 1.25rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.65rem;
      border-radius: 12px;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .kpi-stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0,0,0,0.06);
    }
    .kpi-stat-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
    }
    .kpi-stat-lbl {
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
      white-space: nowrap;
    }
    .kpi-stat-val {
      font-size: 1.65rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.1;
    }
    .kpi-stat-growth {
      font-size: 0.72rem;
      font-weight: 700;
    }
    .kpi-stat-sub-text {
      font-size: 0.7rem;
      font-weight: 600;
    }

    /* Quick Navigation Shortcut Cards */
    .quick-nav-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    .nav-shortcut-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 1.1rem 1.3rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      text-decoration: none;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      transition: all 0.15s ease;
    }
    .nav-shortcut-card:hover {
      border-color: #16a34a;
      background: #f0fdf4;
      transform: translateY(-2px);
    }
    .shortcut-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      flex-shrink: 0;
    }
    .bg-emerald-light { background: #dcfce7; }
    .bg-green-light { background: #f0fdf4; }
    .bg-blue-light { background: #eff6ff; }
    .bg-amber-light { background: #fef3c7; }
    .bg-purple-light { background: #f3e8ff; }
    .bg-pink-light { background: #fdf2f8; }
    .bg-teal-light { background: #ccfbf1; }

    .nav-shortcut-card strong { display: block; font-size: 0.92rem; color: #0f172a; }
    .nav-shortcut-card span { font-size: 0.78rem; color: #64748b; }

    .mt-3 { margin-top: 0.85rem; }
    .mt-4 { margin-top: 1.25rem; }

    @media (max-width: 1200px) {
      .dealer-kpi-row { grid-template-columns: repeat(3, 1fr); }
      .delivery-kpi-row { grid-template-columns: repeat(3, 1fr); }
      .quick-nav-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .stats-grid-2x2 { grid-template-columns: 1fr; }
      .dealer-kpi-row { grid-template-columns: repeat(2, 1fr); }
      .delivery-kpi-row { grid-template-columns: repeat(2, 1fr); }
      .quick-nav-grid { grid-template-columns: 1fr; }
      .hero-banner { flex-direction: column; align-items: flex-start; gap: 1rem; padding: 1.5rem; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  walletBalance = 0;

  // Farmer Counts
  totalCropsCount = 0;
  totalRevenue = 0;
  biddingRevenue = 0;
  totalOrdersCount = 0;

  // Dealer Counts
  dealerTotalOrders = 0;
  dealerMyBiddings = 0;
  dealerActiveBids = 0;
  dealerActiveNegotiations = 0;
  dealerActiveSubscriptions = 0;

  // Delivery Partner Counts
  availablePickupsCount = 0;
  myDeliveriesCount = 0;
  completedDeliveriesCount = 0;
  totalEarnings = 0;
  ongoingDeliveriesCount = 0;

  // Admin Counts
  adminTotalUsers = 0;
  adminTotalCrops = 0;
  adminTotalOrders = 0;
  adminTotalRevenue = 0;

  constructor(
    private authService: AuthService,
    private cropService: CropService,
    private walletService: WalletService,
    private orderService: OrderService,
    private userService: UserService,
    private biddingService: BiddingService,
    private deliveryService: DeliveryService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((u: User | null) => {
      this.user = u;
      if (u && (u.id || u.userId)) {
        const uid = String(u.id || u.userId!);
        this.walletService.getWallet(uid).subscribe({
          next: (w) => {
            if (w && typeof w.balance === 'number') {
              this.walletBalance = w.balance;
            }
          },
          error: () => {}
        });

        // 1. Farmer Dynamic Metrics
        if (u.role === 'FARMER') {
          const uid = String(u.id || u.userId || '').trim();
          const uName = (u.fullName || u.username || '').toLowerCase().trim();
          this.cropService.crops$.subscribe((crops: any[]) => {
            const myCrops = (crops || []).filter((c: any) => {
              const cFid = String(c.farmerId || '').trim();
              const cFname = (c.farmerName || '').toLowerCase().trim();
              return (uid && cFid && cFid === uid) || (uName && cFname && uName === cFname);
            });
            this.totalCropsCount = myCrops.length;
          });
          this.orderService.orders$.subscribe((orders: any[]) => {
            const myOrders = (orders || []).filter((o: any) => {
              const oFid = String(o.farmerId || '').trim();
              const oFname = (o.farmerName || '').toLowerCase().trim();
              return (uid && oFid && oFid === uid) || (uName && oFname && uName === oFname);
            });
            this.totalOrdersCount = myOrders.length;
            this.totalRevenue = myOrders.reduce((sum: number, o: any) => sum + (o.finalAmount || o.totalPrice || 0), 0);
            this.biddingRevenue = myOrders.filter((o: any) => o.isBidding).reduce((sum: number, o: any) => sum + (o.finalAmount || o.totalPrice || 0), 0);
          });
        }

        // 2. Dealer Dynamic Metrics
        if (u.role === 'DEALER') {
          const uid = String(u.id || u.userId || '').trim();
          const uName = (u.fullName || u.username || '').toLowerCase().trim();
          this.orderService.orders$.subscribe((orders: any[]) => {
            const myOrders = (orders || []).filter((o: any) => {
              const oDid = String(o.dealerId || '').trim();
              const oDname = (o.buyerName || o.dealerName || '').toLowerCase().trim();
              return (uid && oDid && oDid === uid) || (uName && oDname && uName === oDname);
            });
            this.dealerTotalOrders = myOrders.length;
          });
          this.biddingService.getActiveAuctions().subscribe((auctions: any[]) => {
            const myBids = (auctions || []).filter((a: any) => String(a.highestBidderId) === uid);
            this.dealerMyBiddings = myBids.length;
            this.dealerActiveBids = myBids.filter((a: any) => a.status === 'OPEN').length;
          });
        }

        // 3. Delivery Partner Dynamic Metrics
        if (u.role === 'DELIVERY_PARTNER') {
          this.deliveryService.deliveries$.subscribe((deliveries: any[]) => {
            const pool = (deliveries || []).filter((d: any) => d.status === 'PENDING_ASSIGNMENT' && d.fulfillmentType !== 'SELF_PICKUP');
            const myAssigned = (deliveries || []).filter((d: any) => d.partnerId === uid);
            this.availablePickupsCount = pool.length;
            this.myDeliveriesCount = myAssigned.length;
            this.ongoingDeliveriesCount = myAssigned.filter((d: any) => d.status === 'IN_TRANSIT' || d.status === 'PICKED_UP' || d.status === 'ASSIGNED').length;
            this.completedDeliveriesCount = myAssigned.filter((d: any) => d.status === 'DELIVERED').length;
            this.totalEarnings = myAssigned.filter((d: any) => d.status === 'DELIVERED').reduce((sum: number, d: any) => sum + (d.deliveryFee || 0), 0);
          });
        }

        // 4. Admin Dynamic Metrics
        if (u.role === 'ADMIN') {
          this.adminTotalUsers = this.userService.getMasterUsers().length;
          this.cropService.crops$.subscribe((crops: any[]) => {
            this.adminTotalCrops = (crops || []).length;
          });
          this.orderService.orders$.subscribe((orders: any[]) => {
            this.adminTotalOrders = (orders || []).length;
            this.adminTotalRevenue = (orders || []).reduce((sum: number, o: any) => sum + (o.finalAmount || o.totalPrice || 0), 0);
          });
        }
      }
    });

    // Also trigger initial data fetches from backend/cache
    this.cropService.getAllCrops().subscribe({ next: () => {}, error: () => {} });
    this.orderService.getAllOrders().subscribe({ next: () => {}, error: () => {} });
  }
}
