import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { AuthService } from '../../core/services/auth.service';
import { ReviewService, FarmerReview } from '../../core/services/review.service';
import { Order } from '../../core/models/order.model';
import { Invoice } from '../../core/models/invoice.model';
import { User } from '../../core/models/user.model';

interface UIOrderItem {
  id: number | string;
  orderNumber: string;
  cropName: string;
  grade: string;
  quantityKg: number;
  ratePerKg: number;
  totalAmount: number;
  orderDate: string;
  orderTime: string;
  img: string;
  buyerName: string;
  buyerPhone: string;
  buyerGstin: string;
  deliveryAddress: string;
  farmerName: string;
  farmerPhone: string;
  farmerLocation: string;
  fulfillmentType: 'DELIVERY_AGENT' | 'SELF_PICKUP';
  deliveryFee: number;
  distanceKm: number;
  status: 'DELIVERED' | 'IN_TRANSIT' | 'CONFIRMED' | 'PICKED_UP' | 'ASSIGNED' | 'PAID';
  paymentMethod: string;
  farmerId?: string;
  dealerId?: string;
  isBidding?: boolean;
  deliveryInfo?: any;
}

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="orders-container">

      <!-- Top Hero Banner (Matches image15.png for Farmer and Dealer) -->
      <div class="orders-hero-banner shadow-sm" *ngIf="user?.role !== 'ADMIN'">
        <div class="banner-content">
          <h1 class="orders-title">Orders</h1>
          <p class="orders-subtitle">View your confirmed orders and download payment receipts.</p>
        </div>
      </div>

      <!-- Admin Page Header (Orderly alignment with Admin Biddings & Admin Crops) -->
      <div class="page-header" *ngIf="user?.role === 'ADMIN'">
        <div>
          <h2 class="page-title">
            <i class="fa-solid fa-file-invoice-dollar text-emerald"></i> Completed Orders & Platform Audit
          </h2>
          <p class="page-subtitle">
            Comprehensive audit of all executed transactions between farmers and dealers with certified GST invoice receipts.
          </p>
        </div>
        <div class="stats-pills">
          <span class="badge badge-primary">{{ totalCount }} Total Orders</span>
          <span class="badge badge-success">{{ completedCount }} Completed</span>
          <span class="badge badge-info">{{ inTransitCount }} In-Transit</span>
        </div>
      </div>

      <!-- Dealer 2-Section Category Switcher (Normal Order vs Order Completed by Bidding) -->
      <div class="dealer-section-switch-card shadow-sm mt-3" *ngIf="user?.role === 'DEALER'">
        <div class="section-switch-header">
          <div class="section-switch-title-wrap">
            <span class="section-switch-tag">
              <i class="fa-solid fa-layer-group"></i> My Orders Classification
            </span>
            <h3 class="section-switch-heading">Choose Order Category</h3>
            <p class="section-switch-sub">
              Separated into 2 distinct sections: Direct Marketplace purchases and Live Bidding auction floor lots.
            </p>
          </div>

          <div class="section-nav-pills">
            <button
              type="button"
              class="section-nav-btn"
              [class.active]="orderCategory === 'NORMAL'"
              (click)="setOrderCategory('NORMAL')">
              <i class="fa-solid fa-basket-shopping"></i>
              <span class="btn-text">Normal Orders (Direct Purchases)</span>
              <span class="badge-count">{{ normalOrdersCount }}</span>
            </button>
            <button
              type="button"
              class="section-nav-btn btn-bidding-tab"
              [class.active]="orderCategory === 'BIDDING'"
              (click)="setOrderCategory('BIDDING')">
              <i class="fa-solid fa-gavel"></i>
              <span class="btn-text">Orders Completed by Bidding</span>
              <span class="badge-count badge-bidding-count">{{ biddingOrdersCount }}</span>
            </button>
          </div>
        </div>

        <!-- Descriptive banner explaining active section rules -->
        <div class="active-section-notice" [ngClass]="orderCategory === 'NORMAL' ? 'notice-normal' : 'notice-bidding'">
          <div class="d-flex align-center gap-2">
            <i class="fa-solid" [ngClass]="orderCategory === 'NORMAL' ? 'fa-cart-flatbed text-emerald' : 'fa-gavel text-amber'"></i>
            <span *ngIf="orderCategory === 'NORMAL'">
              <strong>Normal Orders:</strong> Direct crops purchased from farmers via Marketplace and Home harvest. Includes live delivery status tracking & certified GST invoices.
            </span>
            <span *ngIf="orderCategory === 'BIDDING'">
              <strong>Orders Completed by Bidding:</strong> Successful lots won on the Live Bidding floor. Direct farm yard settlements & certified GST invoices (delivery status tracking is omitted).
            </span>
          </div>
        </div>
      </div>

      <!-- Fulfillment Mode Separation Tabs (Requested by user) -->
      <div class="fulfillment-tabs-row mt-3">
        <button
          type="button"
          class="tab-btn"
          [class.active]="filterFulfillment === 'ALL'"
          (click)="filterFulfillment = 'ALL'">
          <i class="fa-solid fa-list-check"></i>
          <span>All Orders ({{ totalCount }})</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="filterFulfillment === 'DELIVERY_AGENT'"
          (click)="filterFulfillment = 'DELIVERY_AGENT'">
          <i class="fa-solid fa-truck-fast text-emerald"></i>
          <span>Delivery Partner Orders ({{ deliveryPartnerCount }})</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="filterFulfillment === 'SELF_PICKUP'"
          (click)="filterFulfillment = 'SELF_PICKUP'">
          <i class="fa-solid fa-person-walking-arrow-right text-primary"></i>
          <span>Self Pickup Orders ({{ selfPickupCount }})</span>
        </button>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="card toolbar-card shadow-sm mt-3">
        <div class="search-input-wrap">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search by buyer name, farmer or crop..."
            class="search-field"
          />
        </div>

        <div class="toolbar-dropdowns">
          <select [(ngModel)]="filterStatus" class="dropdown-select">
            <option value="ALL">All Order Statuses</option>
            <option value="COMPLETED">Completed / Delivered (with Receipt)</option>
            <option value="IN_TRANSIT">In-Transit / Dispatched</option>
            <option value="CONFIRMED">Confirmed / Processing</option>
          </select>

          <select [(ngModel)]="filterCrop" class="dropdown-select">
            <option value="ALL">All Crops</option>
            <option value="Paddy (Rice)">Paddy (Rice)</option>
            <option value="Tomato">Tomato</option>
            <option value="Onion">Onion</option>
            <option value="Green Chilli">Green Chilli</option>
            <option value="Wheat">Wheat</option>
            <option value="Maize">Maize</option>
          </select>
        </div>
      </div>

      <!-- Notification Toast -->
      <div *ngIf="downloadMessage" class="alert alert-success shadow-sm mt-3">
        <i class="fa-solid fa-circle-check"></i>
        <span>{{ downloadMessage }}</span>
      </div>

      <!-- Orders Table Card (Matches image15.png) -->
      <div class="card table-card shadow-sm mt-3">
        <div class="table-container">
          <table class="table-orders">
            <thead>
              <tr>
                <th>Crop & Order ID</th>
                <th>Quantity & Total</th>
                <th>Order Date</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of pagedOrders">
                <td>
                  <div class="crop-col">
                    <img [src]="order.img || getCropImage(order.cropName)" [alt]="order.cropName" class="crop-thumb-img" (error)="onThumbError($event, order.cropName)" />
                    <div>
                      <div class="d-flex align-center gap-1">
                        <strong class="crop-name-text">{{ order.cropName }}</strong>
                        <span class="badge-grade">{{ order.grade }}</span>
                        <span class="badge-type-tag" [ngClass]="order.isBidding ? 'badge-bidding-tag' : 'badge-normal-tag'">
                          <i class="fa-solid" [ngClass]="order.isBidding ? 'fa-gavel' : 'fa-basket-shopping'"></i>
                          {{ order.isBidding ? 'Bidding Win' : 'Direct' }}
                        </span>
                      </div>
                      <span class="subtext d-block">#{{ order.orderNumber || ('ORD-' + order.id) }} &bull; {{ user?.role === 'FARMER' ? 'Buyer: ' + order.buyerName : (user?.role === 'DEALER' ? 'Seller: ' + order.farmerName : order.buyerName + ' / ' + order.farmerName) }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="qty-amt-cell">
                    <span class="qty-text"><strong>{{ order.quantityKg | number }} kg</strong></span>
                    <strong class="total-amt-text d-block text-emerald">&#8377;{{ order.totalAmount | number:'1.0-0' }}</strong>
                    <span class="subtext d-block">(&#8377;{{ order.ratePerKg }}/kg)</span>
                  </div>
                </td>
                <td>
                  <div class="date-col">
                    <i class="fa-regular fa-calendar text-muted"></i>
                    <div>
                      <strong>{{ order.orderDate }}</strong>
                      <span class="subtext d-block">{{ order.orderTime }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="order-status-badge" (click)="viewDeliveryStatus(order)" style="cursor: pointer;" title="Click to view live delivery status tracking & milestones" [ngClass]="{
                    'status-delivered': getEffectiveStatus(order) === 'DELIVERED',
                    'status-transit': getEffectiveStatus(order) === 'IN_TRANSIT',
                    'status-picked': getEffectiveStatus(order) === 'PICKED_UP',
                    'status-assigned': getEffectiveStatus(order) === 'ASSIGNED',
                    'status-confirmed': getEffectiveStatus(order) === 'CONFIRMED' || getEffectiveStatus(order) === 'PAID'
                  }">
                    <span class="status-dot"></span>
                    {{ getStatusBadgeText(order) }}
                  </span>
                </td>
                <td class="text-right">
                  <div class="d-inline-flex align-center gap-1 action-cell-wrap">
                    <button
                      class="btn-act btn-receipt"
                      (click)="downloadReceipt(order)"
                      [disabled]="downloadingId === order.id"
                      title="Download Certified GST Invoice PDF">
                      <i class="fa-solid fa-download" *ngIf="downloadingId !== order.id"></i>
                      <i class="fa-solid fa-circle-notch fa-spin" *ngIf="downloadingId === order.id"></i>
                      <span>Receipt</span>
                    </button>
                    <button
                      class="btn-act btn-view"
                      (click)="viewInvoiceModal(order)"
                      title="View Official Tax Invoice in App">
                      <i class="fa-regular fa-eye"></i> <span>View</span>
                    </button>
                    <!-- Delivery Tracking: ONLY for Dealer on NORMAL orders with delivery partner (NO delivery tracking for bidding orders) -->
                    <button
                      *ngIf="user?.role === 'DEALER' && !order.isBidding && orderCategory !== 'BIDDING' && order.fulfillmentType === 'DELIVERY_AGENT'"
                      class="btn-act btn-track"
                      (click)="viewDeliveryStatus(order)"
                      title="View My Delivery Status & Stepper Milestones">
                      <i class="fa-solid fa-truck-fast"></i> <span>Status</span>
                    </button>
                    <button
                      *ngIf="user?.role === 'DEALER'"
                      class="btn-act btn-review"
                      (click)="openReviewModal(order)"
                      title="Write or Edit Review for Farmer">
                      <i class="fa-solid fa-star text-amber"></i> <span>Review</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="displayedOrders.length === 0">
                <td colspan="5" class="empty-orders-cell text-center p-5">
                  <div class="empty-wrap">
                    <i class="fa-solid" [ngClass]="orderCategory === 'BIDDING' ? 'fa-gavel text-amber' : 'fa-box-open text-muted'" style="font-size: 2.8rem; margin-bottom: 0.75rem;"></i>
                    <h3 class="m-0 text-muted">
                      {{ orderCategory === 'BIDDING' ? 'No Bidding Orders Found' : 'No Normal Orders Found' }}
                    </h3>
                    <p class="text-subtle text-xs mt-1">
                      {{ orderCategory === 'BIDDING' 
                          ? 'You have not won any auction lots on the Live Bidding floor yet. Join live bidding to bid on farm lots!'
                          : (user?.role === 'DEALER' ? 'You have not placed any direct marketplace orders yet. Visit the Marketplace to buy crops!' : (user?.role === 'FARMER' ? 'No crop sales orders received yet.' : 'No platform orders recorded yet.')) }}
                    </p>
                    <a *ngIf="user?.role === 'DEALER' && orderCategory === 'BIDDING'" routerLink="/bidding" class="btn btn-warning btn-sm mt-3">
                      <i class="fa-solid fa-gavel"></i> Explore Live Bidding Floor
                    </a>
                    <a *ngIf="user?.role === 'DEALER' && orderCategory === 'NORMAL'" routerLink="/" class="btn btn-primary btn-sm mt-3">
                      <i class="fa-solid fa-store"></i> Browse Direct Crops
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table Footer / Dynamic Pagination -->
        <div class="table-footer">
          <span class="footer-count">Showing {{ startIndex }} to {{ endIndex }} of {{ displayedOrders.length }} orders</span>
          <div class="pagination-row">
            <button class="btn-page" [disabled]="currentPage === 1" (click)="setPage(currentPage - 1)">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <button
              *ngFor="let p of totalPagesArray"
              class="btn-page"
              [class.active]="currentPage === p"
              (click)="setPage(p)">
              {{ p }}
            </button>
            <button class="btn-page" [disabled]="currentPage === totalPages" (click)="setPage(currentPage + 1)">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Farmer Review Modal (for Dealer) -->
      <div *ngIf="reviewModalOpen && selectedReviewOrder" class="modal-overlay">
        <div class="modal-content review-modal shadow-lg">
          <div class="modal-header">
            <div class="d-flex align-center gap-2">
              <i class="fa-solid fa-star text-amber" style="font-size: 1.4rem;"></i>
              <div>
                <h3 class="m-0">{{ hasReviewed(selectedReviewOrder) ? 'Edit Review for' : 'Review Farmer:' }} {{ selectedReviewOrder.farmerName }}</h3>
                <span class="subtext">Crop: {{ selectedReviewOrder.cropName }} &bull; Order #{{ selectedReviewOrder.orderNumber }}</span>
              </div>
            </div>
            <button class="close-btn" (click)="reviewModalOpen = false">&times;</button>
          </div>

          <div class="modal-body p-4">
            <div class="form-group mb-3 text-center">
              <label class="d-block font-semibold mb-2">Rating</label>
              <div class="star-rating-selector">
                <button
                  type="button"
                  *ngFor="let s of [1, 2, 3, 4, 5]"
                  class="star-btn"
                  (click)="reviewRating = s">
                  <i class="fa-star" [ngClass]="s <= reviewRating ? 'fa-solid text-amber' : 'fa-regular text-muted'"></i>
                </button>
              </div>
              <span class="rating-text-label mt-1 d-block">{{ reviewRating }} Star{{ reviewRating > 1 ? 's' : '' }}</span>
            </div>

            <div class="form-group">
              <label class="d-block font-semibold mb-1">Feedback Comments</label>
              <textarea
                class="form-control"
                rows="4"
                [(ngModel)]="reviewComment"
                placeholder="Share your experience regarding crop quality, moisture content, packaging, and fulfillment promptness..."></textarea>
            </div>
          </div>

          <div class="modal-footer p-3 border-t d-flex justify-content-end gap-2">
            <button class="btn btn-outline-secondary btn-sm" (click)="reviewModalOpen = false">Cancel</button>
            <button class="btn btn-primary btn-sm" (click)="saveFarmerReview()" [disabled]="savingReview">
              <i class="fa-solid fa-check"></i> {{ hasReviewed(selectedReviewOrder) ? 'Update Review' : 'Submit Review' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Professional In-App Tax Invoice Modal -->
      <div *ngIf="selectedInvoiceOrder" class="modal-overlay" (click)="selectedInvoiceOrder = null">
        <div class="modal-content invoice-modal shadow-lg" (click)="$event.stopPropagation()">
          <div class="modal-header invoice-header-bar">
            <div class="d-flex align-center gap-2">
              <i class="fa-solid fa-seedling text-emerald" style="font-size: 1.6rem;"></i>
              <div>
                <h3 class="m-0">CropDeal Agricultural Direct Exchange</h3>
                <span class="subtext">Official GST Tax Invoice &bull; Rule 46 of CGST Rules, 2017</span>
              </div>
            </div>
            <button class="close-btn" (click)="selectedInvoiceOrder = null">&times;</button>
          </div>

          <div class="modal-body invoice-body-wrap">
            <!-- Meta Bar -->
            <div class="invoice-meta-banner">
              <div>
                <span class="meta-label">INVOICE NUMBER</span>
                <strong class="meta-val text-emerald">CD-INV-2026-{{ selectedInvoiceOrder.orderNumber.replace('ORD-', '') }}</strong>
              </div>
              <div>
                <span class="meta-label">DATE OF ISSUE</span>
                <strong>{{ selectedInvoiceOrder.orderDate }}</strong>
              </div>
              <div>
                <span class="meta-label">ORDER ID</span>
                <strong>#{{ selectedInvoiceOrder.orderNumber }}</strong>
              </div>
              <div>
                <span class="meta-label">PAYMENT STATUS</span>
                <span class="badge badge-success"><i class="fa-solid fa-lock"></i> PAID (Escrow Secured)</span>
              </div>
            </div>

            <!-- Two-Column Parties: Farmer & Dealer -->
            <div class="parties-grid mt-3">
              <!-- Farmer (Seller) Box -->
              <div class="party-info-card farmer-card">
                <div class="party-card-title">
                  <i class="fa-solid fa-wheat-awn text-emerald"></i>
                  <span>Seller / Supplier (Farmer)</span>
                </div>
                <h4 class="party-name">{{ selectedInvoiceOrder.farmerName }}</h4>
                <p class="party-detail"><i class="fa-solid fa-location-dot"></i> {{ selectedInvoiceOrder.farmerLocation }}</p>
                <p class="party-detail"><i class="fa-solid fa-phone"></i> {{ selectedInvoiceOrder.farmerPhone }}</p>
                <div class="id-row mt-2">
                  <span class="id-tag">Kisan ID: TN-KISAN-98124</span>
                  <span class="id-tag">PAN: AABPG7812F</span>
                </div>
              </div>

              <!-- Dealer (Buyer) Box -->
              <div class="party-info-card dealer-card">
                <div class="party-card-title">
                  <i class="fa-solid fa-building text-primary"></i>
                  <span>Buyer / Recipient (Dealer)</span>
                </div>
                <h4 class="party-name">{{ selectedInvoiceOrder.buyerName }}</h4>
                <p class="party-detail"><i class="fa-solid fa-warehouse"></i> <strong>Delivery Address:</strong> {{ selectedInvoiceOrder.deliveryAddress }}</p>
                <p class="party-detail"><i class="fa-solid fa-phone"></i> {{ selectedInvoiceOrder.buyerPhone }}</p>
                <div class="id-row mt-2">
                  <span class="id-tag">GSTIN: {{ selectedInvoiceOrder.buyerGstin }}</span>
                  <span class="id-tag">Lic: TN-AGRO-2026</span>
                </div>
              </div>
            </div>

            <!-- Fulfillment & Logistics Row -->
            <div class="logistics-strip mt-3">
              <div class="log-item">
                <span class="log-lbl">Fulfillment Mode:</span>
                <strong>{{ selectedInvoiceOrder.fulfillmentType === 'SELF_PICKUP' ? 'Self-Pickup (Farm-Gate Direct)' : 'Delivery Partner Transit' }}</strong>
              </div>
              <div class="log-item">
                <span class="log-lbl">Delivery Address:</span>
                <span>{{ selectedInvoiceOrder.deliveryAddress }}</span>
              </div>
              <div class="log-item">
                <span class="log-lbl">Delivery Fee:</span>
                <strong>&#8377;{{ selectedInvoiceOrder.deliveryFee }}</strong>
              </div>
              <div class="log-item">
                <span class="badge" [ngClass]="selectedInvoiceOrder.fulfillmentType === 'SELF_PICKUP' ? 'badge-success' : 'badge-primary'">
                  {{ selectedInvoiceOrder.fulfillmentType === 'SELF_PICKUP' ? 'Self Pickup (&#8377;0 Fee)' : 'Carrier Dispatched' }}
                </span>
              </div>
            </div>

            <!-- Line Items Table -->
            <div class="invoice-table-wrapper mt-3">
              <table class="table invoice-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Agricultural Commodity</th>
                    <th>Grade</th>
                    <th>HSN</th>
                    <th>Quantity</th>
                    <th>Rate (&#8377;/kg)</th>
                    <th>Total (&#8377;)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td><strong>{{ selectedInvoiceOrder.cropName }}</strong></td>
                    <td>{{ selectedInvoiceOrder.grade }}</td>
                    <td><span class="hsn-pill">1001</span></td>
                    <td><strong>{{ selectedInvoiceOrder.quantityKg }} kg</strong></td>
                    <td>&#8377;{{ selectedInvoiceOrder.ratePerKg }}</td>
                    <td><strong>&#8377;{{ selectedInvoiceOrder.totalAmount | number:'1.0-0' }}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totals & Tax Calculation Breakdown -->
            <div class="totals-breakdown-grid mt-3">
              <div class="payment-meta-box">
                <div class="escrow-cert">
                  <i class="fa-solid fa-shield-halved text-emerald"></i>
                  <div>
                    <strong>100% Escrow Protected Settlement</strong>
                    <p class="m-0 text-muted text-xs">
                      Funds held safely until transit verification. Non-refundable per direct producer trade policy.
                    </p>
                  </div>
                </div>
                <div class="payment-details-line mt-2">
                  <span><strong>Method:</strong> {{ selectedInvoiceOrder.paymentMethod }}</span>
                </div>
              </div>

              <div class="tax-summary-box">
                <div class="summary-line">
                  <span>Taxable Goods Subtotal:</span>
                  <span>&#8377;{{ selectedInvoiceOrder.totalAmount | number:'1.2-2' }}</span>
                </div>
                <div class="summary-line">
                  <span>Central GST (CGST &#64; 2.5%):</span>
                  <span>&#8377;{{ (selectedInvoiceOrder.totalAmount * 0.025) | number:'1.2-2' }}</span>
                </div>
                <div class="summary-line">
                  <span>State GST (SGST &#64; 2.5%):</span>
                  <span>&#8377;{{ (selectedInvoiceOrder.totalAmount * 0.025) | number:'1.2-2' }}</span>
                </div>
                <div class="summary-line" *ngIf="selectedInvoiceOrder.fulfillmentType === 'DELIVERY_AGENT'">
                  <span>Delivery Surcharge ({{ selectedInvoiceOrder.distanceKm }} km):</span>
                  <span>&#8377;{{ selectedInvoiceOrder.deliveryFee | number:'1.2-2' }}</span>
                </div>
                <div class="summary-total-line">
                  <strong>Total Invoice Value:</strong>
                  <strong class="total-grand text-emerald">&#8377;{{ (selectedInvoiceOrder.totalAmount * 1.05 + (selectedInvoiceOrder.fulfillmentType === 'DELIVERY_AGENT' ? selectedInvoiceOrder.deliveryFee : 0)) | number:'1.2-2' }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer invoice-footer-bar">
            <button class="btn btn-secondary" (click)="selectedInvoiceOrder = null">Close</button>
            <button class="btn btn-primary" (click)="downloadReceipt(selectedInvoiceOrder)">
              <i class="fa-solid fa-download"></i> Download PDF Receipt
            </button>
          </div>
        </div>
      </div>

      <!-- Dealer Delivery Status Modal -->
      <div *ngIf="deliveryStatusOrder" class="modal-overlay" (click)="deliveryStatusOrder = null">
        <div class="modal-content delivery-modal shadow-2xl" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="delivery-modal-header">
            <div class="d-flex align-center gap-3">
              <div class="tracking-icon-pill">
                <i class="fa-solid fa-truck-ramp-box"></i>
              </div>
              <div>
                <h3 class="tracking-title m-0">Live Delivery Tracking</h3>
                <span class="tracking-subtitle">Waybill: <strong>{{ getTrackingNumber(deliveryStatusOrder) }}</strong></span>
              </div>
            </div>
            <div class="d-flex align-center gap-2">
              <button class="btn-refresh-track" (click)="refreshTrackingModal()" [disabled]="isRefreshingStatus" title="Refresh live status">
                <i class="fa-solid fa-arrows-rotate" [class.fa-spin]="isRefreshingStatus"></i>
                <span class="d-none-mobile">{{ isRefreshingStatus ? 'Refreshing...' : 'Refresh' }}</span>
              </button>
              <button class="close-track-btn" (click)="deliveryStatusOrder = null" title="Close dialog">&times;</button>
            </div>
          </div>

          <div class="delivery-modal-body">
            <!-- Hero Status Card -->
            <div class="tracking-hero-card">
              <div class="hero-top-row">
                <div class="order-identity">
                  <span class="order-num-tag">#{{ deliveryStatusOrder.orderNumber }}</span>
                  <h4 class="crop-heading">{{ deliveryStatusOrder.cropName }}</h4>
                  <span class="crop-meta">{{ deliveryStatusOrder.quantityKg | number }} kg • &#8377;{{ deliveryStatusOrder.totalAmount | number:'1.0-0' }} Total</span>
                </div>
                <div class="status-badge-wrap">
                  <span class="order-status-badge badge-large" [ngClass]="{
                    'status-delivered': getEffectiveStatus(deliveryStatusOrder) === 'DELIVERED',
                    'status-transit': getEffectiveStatus(deliveryStatusOrder) === 'IN_TRANSIT',
                    'status-picked': getEffectiveStatus(deliveryStatusOrder) === 'PICKED_UP',
                    'status-assigned': getEffectiveStatus(deliveryStatusOrder) === 'ASSIGNED',
                    'status-confirmed': getEffectiveStatus(deliveryStatusOrder) === 'CONFIRMED' || getEffectiveStatus(deliveryStatusOrder) === 'PAID'
                  }">
                    <span class="status-dot"></span>
                    {{ getStatusBadgeText(deliveryStatusOrder) }}
                  </span>
                </div>
              </div>

              <!-- Live ETA Strip -->
              <div class="eta-strip mt-3">
                <i class="fa-solid fa-circle-notch fa-spin text-emerald" *ngIf="getEffectiveStatus(deliveryStatusOrder) === 'IN_TRANSIT'"></i>
                <i class="fa-solid fa-circle-check text-emerald" *ngIf="getEffectiveStatus(deliveryStatusOrder) === 'DELIVERED'"></i>
                <i class="fa-solid fa-clock text-amber" *ngIf="getEffectiveStatus(deliveryStatusOrder) !== 'DELIVERED' && getEffectiveStatus(deliveryStatusOrder) !== 'IN_TRANSIT'"></i>
                <span>{{ getEstimatedEta(deliveryStatusOrder) }}</span>
              </div>
            </div>

            <!-- Milestone Tracker (5 Steps: Confirmed -> Assigned -> Picked Up -> In Transit -> Delivered) -->
            <div class="stepper-box mt-3">
              <div class="stepper-title-row">
                <span class="stepper-section-title"><i class="fa-solid fa-route text-emerald"></i> Transit Progress</span>
                <span class="stepper-current-label">Stage {{ isMilestoneCompleted(deliveryStatusOrder, 5) ? '5 of 5' : (isMilestoneCompleted(deliveryStatusOrder, 4) ? '4 of 5' : (isMilestoneCompleted(deliveryStatusOrder, 3) ? '3 of 5' : (isMilestoneCompleted(deliveryStatusOrder, 2) ? '2 of 5' : '1 of 5'))) }}</span>
              </div>

              <div class="transit-stepper-v2 mt-2">
                <!-- Step 1: Placed -->
                <div class="step-point completed">
                  <div class="bullet"><i class="fa-solid fa-check"></i></div>
                  <span class="step-name">Placed</span>
                  <span class="step-sub">Confirmed</span>
                </div>
                <div class="step-line" [class.active]="isMilestoneActive(deliveryStatusOrder, 1)"></div>

                <!-- Step 2: Assigned -->
                <div class="step-point" [class.completed]="isMilestoneCompleted(deliveryStatusOrder, 2)" [class.current]="getEffectiveStatus(deliveryStatusOrder) === 'ASSIGNED'">
                  <div class="bullet">
                    <i class="fa-solid" [ngClass]="isMilestoneCompleted(deliveryStatusOrder, 2) ? 'fa-check' : 'fa-id-badge'"></i>
                  </div>
                  <span class="step-name">Assigned</span>
                  <span class="step-sub">Fleet Agent</span>
                </div>
                <div class="step-line" [class.active]="isMilestoneActive(deliveryStatusOrder, 2)"></div>

                <!-- Step 3: Picked Up -->
                <div class="step-point" [class.completed]="isMilestoneCompleted(deliveryStatusOrder, 3)" [class.current]="getEffectiveStatus(deliveryStatusOrder) === 'PICKED_UP'">
                  <div class="bullet">
                    <i class="fa-solid" [ngClass]="isMilestoneCompleted(deliveryStatusOrder, 3) ? 'fa-check' : 'fa-box-open'"></i>
                  </div>
                  <span class="step-name">Picked Up</span>
                  <span class="step-sub">Farm Gate</span>
                </div>
                <div class="step-line" [class.active]="isMilestoneActive(deliveryStatusOrder, 3)"></div>

                <!-- Step 4: In Transit -->
                <div class="step-point" [class.completed]="isMilestoneCompleted(deliveryStatusOrder, 4)" [class.current]="getEffectiveStatus(deliveryStatusOrder) === 'IN_TRANSIT'">
                  <div class="bullet">
                    <i class="fa-solid" [ngClass]="isMilestoneCompleted(deliveryStatusOrder, 4) ? 'fa-check' : 'fa-truck-fast'"></i>
                  </div>
                  <span class="step-name">In Transit</span>
                  <span class="step-sub">On The Way</span>
                </div>
                <div class="step-line" [class.active]="isMilestoneActive(deliveryStatusOrder, 4)"></div>

                <!-- Step 5: Delivered -->
                <div class="step-point" [class.completed]="isMilestoneCompleted(deliveryStatusOrder, 5)" [class.current]="getEffectiveStatus(deliveryStatusOrder) === 'DELIVERED'">
                  <div class="bullet">
                    <i class="fa-solid" [ngClass]="isMilestoneCompleted(deliveryStatusOrder, 5) ? 'fa-check' : 'fa-house-circle-check'"></i>
                  </div>
                  <span class="step-name">Delivered</span>
                  <span class="step-sub">Warehouse</span>
                </div>
              </div>
            </div>

            <!-- Details Grid: Carrier + Locations -->
            <div class="tracking-grid mt-3">
              <!-- Carrier Card -->
              <div class="track-info-card">
                <div class="track-card-head">
                  <i class="fa-solid fa-truck-moving text-emerald"></i>
                  <span>Logistics Carrier & Fleet</span>
                </div>
                <div class="track-card-content">
                  <div class="info-row">
                    <span class="info-lbl">Carrier Partner:</span>
                    <strong>{{ getCarrierName(deliveryStatusOrder) }}</strong>
                  </div>
                  <div class="info-row mt-1">
                    <span class="info-lbl">Tracking Waybill:</span>
                    <div class="d-flex align-center gap-1">
                      <code class="waybill-code">{{ getTrackingNumber(deliveryStatusOrder) }}</code>
                      <button type="button" class="btn-copy-waybill" (click)="copyTracking(getTrackingNumber(deliveryStatusOrder))" title="Copy tracking number">
                        <i class="fa-regular" [ngClass]="copiedTracking ? 'fa-check text-emerald' : 'fa-copy'"></i>
                      </button>
                      <span *ngIf="copiedTracking" class="text-xs text-emerald font-bold">Copied!</span>
                    </div>
                  </div>
                  <div class="info-row mt-1">
                    <span class="info-lbl">Carrier Helpline:</span>
                    <a [href]="'tel:' + getCarrierPhone(deliveryStatusOrder)" class="carrier-phone-link">
                      <i class="fa-solid fa-phone"></i> {{ getCarrierPhone(deliveryStatusOrder) }}
                    </a>
                  </div>
                  <div class="info-row mt-1">
                    <span class="info-lbl">Transport Fleet:</span>
                    <span class="text-xs font-semibold text-slate-700">{{ getVehicleInfo(deliveryStatusOrder) }}</span>
                  </div>
                </div>
              </div>

              <!-- Route Card -->
              <div class="track-info-card">
                <div class="track-card-head">
                  <i class="fa-solid fa-location-crosshairs text-primary"></i>
                  <span>Fulfillment & Consignment Route</span>
                </div>
                <div class="track-card-content">
                  <div class="route-item">
                    <div class="route-marker origin-marker">
                      <i class="fa-solid fa-wheat-awn"></i>
                    </div>
                    <div class="route-text">
                      <span class="route-lbl">Origin / Farmer Pickup</span>
                      <strong>{{ deliveryStatusOrder.farmerLocation || 'Farmer Farm Gate / Mandi' }}</strong>
                      <span class="subtext d-block">{{ deliveryStatusOrder.farmerName ? 'Farmer: ' + deliveryStatusOrder.farmerName : '' }}</span>
                    </div>
                  </div>

                  <div class="route-item mt-2">
                    <div class="route-marker dest-marker">
                      <i class="fa-solid fa-warehouse"></i>
                    </div>
                    <div class="route-text">
                      <span class="route-lbl">Destination / Warehouse Drop</span>
                      <strong>{{ deliveryStatusOrder.deliveryAddress || 'Dealer Commercial Hub' }}</strong>
                      <span class="subtext d-block">{{ deliveryStatusOrder.buyerName ? 'Consignee: ' + deliveryStatusOrder.buyerName : '' }}</span>
                    </div>
                  </div>

                  <div class="fulfillment-badge-strip mt-2">
                    <span class="mode-tag"><i class="fa-solid fa-cubes"></i> Mode:</span>
                    <strong>{{ deliveryStatusOrder.fulfillmentType === 'SELF_PICKUP' ? 'Self Pickup at Farm Gate (Zero Logistics Fee)' : 'Express Agro Logistics (' + (deliveryStatusOrder.distanceKm || 15) + ' km • &#8377;' + deliveryStatusOrder.deliveryFee + ')' }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="delivery-modal-footer">
            <div class="footer-help-text">
              <i class="fa-solid fa-circle-question text-muted"></i>
              <span>Need help? Kisan Agro Logistics Helpline: <strong>1800-419-2026</strong></span>
            </div>
            <div class="d-flex align-center gap-2">
              <button class="btn btn-sm btn-outline-primary" (click)="viewInvoiceModal(deliveryStatusOrder)" title="View Invoice">
                <i class="fa-regular fa-file-lines"></i> View Invoice
              </button>
              <button class="btn btn-sm btn-secondary" (click)="deliveryStatusOrder = null">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .orders-container { display: flex; flex-direction: column; gap: 1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.65rem; font-weight: 800; color: #0f172a; margin: 0; }
    .page-subtitle { color: #64748b; font-size: 0.9rem; margin-top: 0.25rem; }
    .stats-pills { display: flex; gap: 0.5rem; }
    .badge-primary { background: #eff6ff; color: #2563eb; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-info { background: #e0f2fe; color: #0369a1; }

    /* Top Hero Banner (Matching image15.png) */
    .orders-hero-banner {
      background: linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('/assets/images/sunset-banner.jpg') center/cover no-repeat;
      border-radius: 14px;
      padding: 2.2rem 2.8rem;
      color: white;
      min-height: 120px;
      display: flex;
      align-items: center;
    }
    .orders-title { font-size: 2.2rem; font-weight: 800; margin: 0 0 0.3rem 0; color: #fff; }
    .orders-subtitle { font-size: 0.95rem; color: #f1f5f9; margin: 0; }

    /* Dealer 2-Section Switch Card */
    .dealer-section-switch-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .section-switch-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .section-switch-tag {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #15803d;
      background: #dcfce7;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin-bottom: 0.25rem;
    }
    .section-switch-heading {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .section-switch-sub {
      font-size: 0.82rem;
      color: #64748b;
      margin: 0.15rem 0 0;
    }
    .section-nav-pills {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .section-nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      border: 1.5px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .section-nav-btn:hover {
      border-color: #86efac;
      background: #f0fdf4;
      color: #15803d;
    }
    .section-nav-btn.active {
      background: #15803d;
      border-color: #15803d;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(21, 128, 61, 0.25);
    }
    .section-nav-btn.btn-bidding-tab:hover {
      border-color: #fde68a;
      background: #fffbeb;
      color: #b45309;
    }
    .section-nav-btn.btn-bidding-tab.active {
      background: #d97706;
      border-color: #d97706;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25);
    }
    .badge-count {
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 800;
      background: #e2e8f0;
      color: #334155;
    }
    .section-nav-btn.active .badge-count {
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
    }
    .active-section-notice {
      padding: 0.65rem 1rem;
      border-radius: 8px;
      font-size: 0.82rem;
      display: flex;
      align-items: center;
    }
    .notice-normal {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }
    .notice-bidding {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      color: #92400e;
    }
    .badge-type-tag {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 0.12rem 0.45rem;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .badge-normal-tag {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .badge-bidding-tag {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    /* Fulfillment Mode Tabs */
    .fulfillment-tabs-row {
      display: flex;
      gap: 0.65rem;
      flex-wrap: wrap;
    }
    .fulfillment-tabs-row .tab-btn {
      padding: 0.65rem 1.25rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.15s ease;
    }
    .fulfillment-tabs-row .tab-btn:hover {
      background: #f0fdf4;
      color: #15803d;
      border-color: #86efac;
    }
    .fulfillment-tabs-row .tab-btn.active {
      background: #16a34a;
      color: white;
      border-color: #16a34a;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
    }
    .empty-orders-cell {
      padding: 3.5rem 1rem !important;
    }

    /* Toolbar */
    .toolbar-card {
      padding: 0.85rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border-radius: 12px;
      background: #ffffff;
    }
    .search-input-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.5rem 0.85rem;
      color: #64748b;
    }
    .search-field {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 0.85rem;
      color: #0f172a;
    }
    .toolbar-dropdowns { display: flex; align-items: center; gap: 0.75rem; }
    .dropdown-select {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.5rem 0.8rem;
      font-size: 0.82rem;
      color: #334155;
      background: #fff;
      outline: none;
    }
    .date-picker-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.5rem 0.85rem;
      font-size: 0.82rem;
      color: #64748b;
      cursor: pointer;
    }

    /* Table Card (Matches image15.png) */
    .table-card { border-radius: 14px; overflow: hidden; background: #ffffff; }
    .table-container { width: 100%; overflow-x: hidden; }
    .table-orders { width: 100%; border-collapse: collapse; font-size: 0.825rem; }
    .table-orders th {
      background: #f8fafc;
      color: #64748b;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.6rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    .table-orders th.text-right, .table-orders td.text-right { text-align: right; }
    .table-orders td {
      padding: 0.6rem 0.75rem;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: middle;
    }

    .crop-col { display: flex; align-items: center; gap: 0.6rem; }
    .crop-thumb-img {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .crop-name-text { font-size: 0.88rem; font-weight: 700; color: #0f172a; }
    .badge-grade {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .qty-amt-cell { font-size: 0.82rem; }
    .qty-text { font-size: 0.82rem; color: #0f172a; }
    .total-amt-text { font-size: 0.9rem; font-weight: 800; }
    .date-col { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; white-space: nowrap; }
    .subtext { font-size: 0.73rem; color: #64748b; }
    .d-block { display: block; }

    /* Order Status Badges */
    .order-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }
    .status-delivered { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .status-delivered .status-dot { background: #16a34a; }
    .status-transit { background: #eff6ff; color: #1d4ed8; border: 1px solid #93c5fd; }
    .status-transit .status-dot { background: #2563eb; }
    .status-confirmed { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .status-confirmed .status-dot { background: #d97706; }
    .status-picked { background: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; }
    .status-picked .status-dot { background: #ea580c; }
    .status-assigned { background: #f3e8ff; color: #7e22ce; border: 1px solid #d8b4fe; }
    .status-assigned .status-dot { background: #9333ea; }
    .carrier-info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem 1rem; }
    .carrier-phone { text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; }
    .carrier-phone:hover { text-decoration: underline; }

    /* Action Buttons (Compact, professional, no overflow) */
    .action-cell-wrap { flex-wrap: wrap; justify-content: flex-end; }
    .btn-act {
      border: none;
      background: transparent;
      padding: 0.35rem 0.55rem;
      border-radius: 6px;
      font-size: 0.74rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .btn-act.btn-receipt {
      background: #ffffff;
      border: 1px solid #16a34a;
      color: #16a34a;
    }
    .btn-act.btn-receipt:hover { background: #16a34a; color: white; }
    .btn-act.btn-view {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #334155;
    }
    .btn-act.btn-view:hover { background: #e2e8f0; }
    .btn-act.btn-track {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #2563eb;
    }
    .btn-act.btn-track:hover { background: #dbeafe; }
    .btn-act.btn-review {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #b45309;
    }
    .btn-act.btn-review:hover { background: #fef3c7; }
    .btn-review-farmer:hover {
      background: #fef3c7;
      border-color: #f59e0b;
      color: #92400e;
    }
    .text-amber { color: #f59e0b; }
    .review-modal {
      width: 500px;
      max-width: 95%;
      max-height: calc(100vh - 70px - 3.5rem);
      overflow-y: auto;
      border-radius: 12px;
      background: white;
      margin: 0 auto;
    }
    .star-rating-selector {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      font-size: 1.75rem;
    }
    .star-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.75rem;
      padding: 0.2rem;
      transition: transform 0.15s ease;
    }
    .star-btn:hover {
      transform: scale(1.15);
    }
    .rating-text-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #b45309;
    }

    /* Table Footer & Pagination */
    .table-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-top: 1px solid #f1f5f9;
    }
    .footer-count { font-size: 0.8rem; color: #64748b; }
    .pagination-row { display: flex; gap: 0.35rem; }
    .btn-page {
      width: 30px;
      height: 30px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-page.active {
      background: #16a34a;
      border-color: #16a34a;
      color: white;
    }

    /* In-App Tax Invoice Modal & Modal Overlay */
    .modal-overlay {
      position: fixed;
      top: 70px;
      left: 0;
      right: 0;
      bottom: 0;
      height: calc(100vh - 70px);
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      z-index: 100000;
      padding: 1.5rem 1rem 2.5rem 1rem;
      overflow-y: auto;
    }
    .invoice-modal {
      width: 850px;
      max-width: 95%;
      max-height: calc(100vh - 70px - 3.5rem);
      overflow-y: auto;
      border-radius: 14px;
      background: white;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      margin: 0 auto;
    }
    .invoice-header-bar { padding: 1.1rem 1.6rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .invoice-body-wrap { padding: 1.5rem; }
    .invoice-meta-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.85rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .meta-label { font-size: 0.72rem; font-weight: 700; color: #64748b; display: block; }
    .meta-val { font-size: 1.05rem; }
    .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .party-info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; }
    .party-card-title { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 0.4rem; }
    .party-name { font-size: 1rem; font-weight: 800; color: #0f172a; margin: 0 0 0.25rem 0; }
    .party-detail { font-size: 0.8rem; color: #334155; margin: 0.2rem 0; }
    .id-row { display: flex; gap: 0.5rem; }
    .id-tag { background: #e2e8f0; font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; color: #334155; }

    .logistics-strip {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.82rem;
    }
    .log-lbl { color: #166534; font-weight: 600; margin-right: 0.4rem; }

    .invoice-table-wrapper { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .invoice-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .invoice-table th { background: #f1f5f9; padding: 0.6rem 0.8rem; text-align: left; }
    .invoice-table td { padding: 0.65rem 0.8rem; border-bottom: 1px solid #f1f5f9; }
    .hsn-pill { background: #e2e8f0; font-size: 0.72rem; padding: 0.1rem 0.35rem; border-radius: 4px; }

    .totals-breakdown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .payment-meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; }
    .escrow-cert { display: flex; gap: 0.6rem; }
    .escrow-cert i { font-size: 1.5rem; }
    .tax-summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; }
    .summary-line { display: flex; justify-content: space-between; font-size: 0.82rem; padding: 0.25rem 0; color: #475569; }
    .summary-total-line { display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 0.5rem; margin-top: 0.3rem; }
    .total-grand { font-size: 1.25rem; }
    .invoice-footer-bar { padding: 1rem 1.6rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.6rem; }

    /* Refined Delivery Tracking Modal Styles */
    .delivery-modal {
      width: 700px;
      max-width: 95%;
      max-height: calc(100vh - 70px - 2rem);
      overflow-y: auto;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.4);
      margin: 0 auto;
      border: 1px solid rgba(226, 232, 240, 0.8);
      display: flex;
      flex-direction: column;
      animation: modalSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalSlideUp {
      from { opacity: 0; transform: translateY(14px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .delivery-modal-header {
      padding: 1.15rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      background: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 20;
    }
    .tracking-icon-pill {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
    }
    .tracking-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.01em;
    }
    .tracking-subtitle {
      font-size: 0.78rem;
      color: #64748b;
      display: block;
      margin-top: 0.15rem;
    }
    .btn-refresh-track {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.15s ease;
    }
    .btn-refresh-track:hover:not(:disabled) {
      background: #dcfce7;
      border-color: #86efac;
    }
    .btn-refresh-track:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
    .close-track-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: #f1f5f9;
      color: #475569;
      font-size: 1.3rem;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .close-track-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .delivery-modal-body {
      padding: 1.35rem 1.5rem;
      background: #f8fafc;
      overflow-y: auto;
    }

    /* Hero Card */
    .tracking-hero-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem 1.4rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
    }
    .hero-top-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }
    .order-num-tag {
      font-family: monospace;
      font-size: 0.75rem;
      font-weight: 700;
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      display: inline-block;
      margin-bottom: 0.35rem;
    }
    .crop-heading {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .crop-meta {
      font-size: 0.82rem;
      color: #475569;
      font-weight: 600;
      display: block;
      margin-top: 0.2rem;
    }
    .badge-large {
      padding: 0.45rem 0.95rem;
      font-size: 0.8rem;
      font-weight: 800;
      letter-spacing: 0.02em;
      border-radius: 9999px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.06);
    }
    .eta-strip {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 0.55rem 0.85rem;
      font-size: 0.82rem;
      font-weight: 700;
      color: #166534;
      display: flex;
      align-items: center;
      gap: 0.55rem;
    }

    /* Stepper V2 */
    .stepper-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.1rem 1.25rem 1.25rem 1.25rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
    }
    .stepper-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .stepper-section-title {
      font-size: 0.82rem;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .stepper-current-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #059669;
      background: #ecfdf5;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
    }
    .transit-stepper-v2 {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      position: relative;
    }
    .transit-stepper-v2 .step-point {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 60px;
      text-align: center;
      z-index: 2;
    }
    .transit-stepper-v2 .step-point .bullet {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #f8fafc;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.82rem;
      border: 2px solid #cbd5e1;
      transition: all 0.25s ease;
      margin-bottom: 0.35rem;
    }
    .transit-stepper-v2 .step-point.completed .bullet {
      background: #10b981 !important;
      color: #ffffff !important;
      border-color: #10b981 !important;
      box-shadow: 0 3px 8px rgba(16, 185, 129, 0.4);
    }
    .transit-stepper-v2 .step-point.current .bullet {
      background: #fef3c7 !important;
      color: #d97706 !important;
      border-color: #f59e0b !important;
      box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.25);
      animation: pulseStep 1.6s infinite;
    }
    @keyframes pulseStep {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }
    .transit-stepper-v2 .step-name {
      font-size: 0.76rem;
      font-weight: 800;
      color: #334155;
    }
    .transit-stepper-v2 .step-sub {
      font-size: 0.68rem;
      color: #64748b;
      margin-top: 0.1rem;
    }
    .transit-stepper-v2 .step-point.completed .step-name {
      color: #059669;
    }
    .transit-stepper-v2 .step-point.current .step-name {
      color: #d97706;
    }
    .transit-stepper-v2 .step-line {
      flex: 1;
      height: 4px;
      background: #e2e8f0;
      margin: 14px 0.35rem 0 0.35rem;
      border-radius: 2px;
      transition: all 0.35s ease;
    }
    .transit-stepper-v2 .step-line.active {
      background: #10b981 !important;
      box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
    }

    /* Grid Details */
    .tracking-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .track-info-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem 1.15rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
    }
    .track-card-head {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.78rem;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.5rem;
      margin-bottom: 0.65rem;
    }
    .info-row {
      display: flex;
      flex-direction: column;
      font-size: 0.8rem;
    }
    .info-lbl {
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 0.1rem;
    }
    .waybill-code {
      font-family: monospace;
      font-size: 0.78rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #0f172a;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
    }
    .btn-copy-waybill {
      background: none;
      border: none;
      cursor: pointer;
      color: #64748b;
      padding: 0.2rem;
      font-size: 0.85rem;
      transition: color 0.15s ease;
    }
    .btn-copy-waybill:hover {
      color: #10b981;
    }
    .carrier-phone-link {
      color: #059669;
      font-weight: 800;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
    }
    .carrier-phone-link:hover {
      text-decoration: underline;
    }

    /* Route Elements */
    .route-item {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
    }
    .route-marker {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.78rem;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }
    .origin-marker {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .dest-marker {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
    }
    .route-text {
      flex: 1;
      font-size: 0.82rem;
    }
    .route-lbl {
      display: block;
      font-size: 0.7rem;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .fulfillment-badge-strip {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .mode-tag {
      font-weight: 700;
      color: #475569;
    }

    /* Modal Footer */
    .delivery-modal-footer {
      padding: 0.9rem 1.5rem;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .footer-help-text {
      font-size: 0.75rem;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    @media (max-width: 680px) {
      .delivery-modal { width: 95%; }
      .delivery-modal-header { padding: 1rem; }
      .delivery-modal-body { padding: 1rem; }
      .tracking-grid { grid-template-columns: 1fr; }
      .transit-stepper-v2 .step-sub { display: none; }
      .transit-stepper-v2 .step-point { min-width: 48px; }
      .d-none-mobile { display: none; }
      .delivery-modal-footer { flex-direction: column; align-items: stretch; text-align: center; }
      .footer-help-text { justify-content: center; }
    }

    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.85rem; }
    .mt-4 { margin-top: 1.25rem; }
    .text-emerald { color: #16a34a; }
    .text-primary { color: #2563eb; }
    .text-muted { color: #94a3b8; }
    .text-xs { font-size: 0.72rem; }
    .d-flex { display: flex; }
    .align-center { align-items: center; }
    .gap-2 { gap: 0.5rem; }

    @media (max-width: 900px) {
      .toolbar-card { flex-direction: column; align-items: stretch; }
      .parties-grid, .totals-breakdown-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class OrderListComponent implements OnInit, OnDestroy {
  user: User | null = null;
  searchQuery = '';
  filterCrop = 'ALL';
  filterStatus = 'ALL';
  filterFulfillment: 'ALL' | 'DELIVERY_AGENT' | 'SELF_PICKUP' = 'ALL';
  orderCategory: 'NORMAL' | 'BIDDING' = 'NORMAL';
  downloadingId: number | string | null = null;
  downloadMessage = '';
  selectedInvoiceOrder: UIOrderItem | null = null;
  deliveryStatusOrder: UIOrderItem | null = null;
  isRefreshingStatus = false;
  copiedTracking = false;

  // Farmer Review Modal State (Dealer)
  reviewModalOpen = false;
  selectedReviewOrder: UIOrderItem | null = null;
  reviewRating = 5;
  reviewComment = '';
  savingReview = false;

  // Dynamic Pagination State
  currentPage = 1;
  pageSize = 5;

  orders: UIOrderItem[] = [];
  deliveries: any[] = [];
  rawOrderModels: Order[] = [];
  private statusPollTimer: any = null;

  constructor(
    private orderService: OrderService,
    private invoiceService: InvoiceService,
    private deliveryService: DeliveryService,
    private authService: AuthService,
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((u: User | null) => {
      this.user = u;
      this.loadOrders();
    });

    this.deliveryService.deliveries$.subscribe((dList) => {
      this.deliveries = dList || [];
      if (this.rawOrderModels.length > 0) {
        this.orders = this.rawOrderModels.map((o, idx) => this.mapOrderToUI(o, idx + 1));
      }
      this.syncActiveTrackingModal();
    });

    this.orderService.orders$.subscribe((orderModels) => {
      this.rawOrderModels = orderModels || [];
      this.orders = this.rawOrderModels.map((o, idx) => this.mapOrderToUI(o, idx + 1));
      this.syncActiveTrackingModal();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === 'cropdeal_active_deliveries' || e.key === 'cropdeal_orders_cache') {
          this.syncActiveTrackingModal();
        }
      });
    }

    // Safe background poll every 8 seconds without recursive subject emissions
    this.statusPollTimer = setInterval(() => {
      if (this.deliveryStatusOrder) {
        this.deliveryService.getAllDeliveries().subscribe();
      }
    }, 8000);
  }

  ngOnDestroy(): void {
    if (this.statusPollTimer) {
      clearInterval(this.statusPollTimer);
      this.statusPollTimer = null;
    }
  }

  getEffectiveStatus(order: UIOrderItem | null): string {
    if (!order) return 'CONFIRMED';
    const delStatus = order.deliveryInfo?.status;
    if (delStatus && delStatus !== 'PENDING_ASSIGNMENT') {
      return delStatus;
    }
    if (order.status && order.status !== 'PAID') {
      return order.status;
    }
    return 'CONFIRMED';
  }

  getStatusBadgeText(order: UIOrderItem | null): string {
    const st = this.getEffectiveStatus(order);
    switch (st) {
      case 'ASSIGNED': return 'PARTNER ASSIGNED';
      case 'PICKED_UP': return 'PICKED UP';
      case 'IN_TRANSIT': return 'IN TRANSIT';
      case 'DELIVERED': return 'DELIVERED';
      default: return st;
    }
  }

  isMilestoneCompleted(order: UIOrderItem | null, step: number): boolean {
    const st = this.getEffectiveStatus(order);
    if (step === 1) return true;
    if (step === 2) return ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(st);
    if (step === 3) return ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(st);
    if (step === 4) return ['IN_TRANSIT', 'DELIVERED'].includes(st);
    if (step === 5) return st === 'DELIVERED';
    return false;
  }

  isMilestoneActive(order: UIOrderItem | null, line: number): boolean {
    const st = this.getEffectiveStatus(order);
    if (line === 1) return ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(st);
    if (line === 2) return ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(st);
    if (line === 3) return ['IN_TRANSIT', 'DELIVERED'].includes(st);
    if (line === 4) return st === 'DELIVERED';
    return false;
  }

  refreshTrackingModal(): void {
    if (!this.deliveryStatusOrder) return;
    this.isRefreshingStatus = true;
    this.deliveryService.getAllDeliveries().subscribe({
      next: (dels) => {
        this.deliveries = dels || [];
        this.syncActiveTrackingModal();
        setTimeout(() => { this.isRefreshingStatus = false; }, 350);
      },
      error: () => {
        this.isRefreshingStatus = false;
      }
    });
  }

  private syncActiveTrackingModal(): void {
    if (this.deliveryStatusOrder) {
      const allDels = this.deliveries || [];
      const targetId = String(this.deliveryStatusOrder.id || '').trim();
      const targetNum = String(this.deliveryStatusOrder.orderNumber || '').trim();
      const cleanTargetId = targetId.replace(/^ord-?/i, '');
      const cleanTargetNum = targetNum.replace(/^ord-?/i, '');

      let del = allDels.find(d => {
        const dOrder = String(d.orderId || '').trim();
        const dClean = dOrder.replace(/^ord-?/i, '');
        return dOrder === targetId ||
               dOrder === targetNum ||
               dClean === cleanTargetId ||
               dClean === cleanTargetNum ||
               ('ORD-' + dClean) === targetNum ||
               ('ORD-' + dClean) === targetId;
      });

      if (!del && this.deliveryStatusOrder.cropName) {
        const targetCrop = this.deliveryStatusOrder.cropName.trim().toLowerCase();
        del = allDels.find(d => {
          const dCrop = (d.cropName || '').trim().toLowerCase();
          return dCrop === targetCrop || dCrop.includes(targetCrop) || targetCrop.includes(dCrop);
        });
      }

      if (del) {
        const updated = { ...this.deliveryStatusOrder, deliveryInfo: del };
        const effective = this.getEffectiveStatus(updated);
        updated.status = effective as any;
        this.deliveryStatusOrder = updated;
      }
    }
  }

  setOrderCategory(cat: 'NORMAL' | 'BIDDING'): void {
    this.orderCategory = cat;
    this.currentPage = 1;
  }

  loadOrders(): void {
    this.orderService.getAllOrders().subscribe({
      next: () => {},
      error: () => {}
    });
    this.orderService.orders$.subscribe(orderModels => {
      this.rawOrderModels = orderModels || [];
      this.orders = this.rawOrderModels.map((o, idx) => this.mapOrderToUI(o, idx + 1));
      this.syncActiveTrackingModal();
    });
  }

  private mapOrderToUI(o: Order, idx: number): UIOrderItem {
    const createdDate = o.createdAt ? new Date(o.createdAt) : new Date();
    const dateStr = createdDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const cleanId = String(o.id || '').trim();
    const orderNum = o.id ? (String(o.id).startsWith('ORD-') ? String(o.id) : 'ORD-' + o.id) : ('ORD-' + (10000 + idx));

    const cleanNum = cleanId.replace(/^ord-?/i, '');
    const cleanOrderNum = orderNum.replace(/^ord-?/i, '');

    let matchedDelivery = this.deliveries.find(d => {
      const dOrder = String(d.orderId || '').trim();
      const dClean = dOrder.replace(/^ord-?/i, '');
      return dOrder === cleanId ||
             dOrder === orderNum ||
             dClean === cleanNum ||
             dClean === cleanOrderNum ||
             ('ORD-' + dClean) === cleanOrderNum ||
             ('ORD-' + dClean) === cleanId;
    });

    if (!matchedDelivery && o.cropName) {
      const targetCrop = o.cropName.trim().toLowerCase();
      matchedDelivery = this.deliveries.find(d => {
        const dCrop = (d.cropName || '').trim().toLowerCase();
        return dCrop === targetCrop || dCrop.includes(targetCrop) || targetCrop.includes(dCrop);
      });
    }

    let uiStatus: 'DELIVERED' | 'IN_TRANSIT' | 'CONFIRMED' | 'PICKED_UP' | 'ASSIGNED' | 'PAID' = 'CONFIRMED';
    if (matchedDelivery) {
      if (matchedDelivery.status === 'DELIVERED') {
        uiStatus = 'DELIVERED';
      } else if (matchedDelivery.status === 'IN_TRANSIT') {
        uiStatus = 'IN_TRANSIT';
      } else if (matchedDelivery.status === 'PICKED_UP') {
        uiStatus = 'PICKED_UP';
      } else if (matchedDelivery.status === 'ASSIGNED') {
        uiStatus = 'ASSIGNED';
      } else {
        uiStatus = 'CONFIRMED';
      }
    } else if (o.status === 'DELIVERED' || o.fulfillmentType === 'SELF_PICKUP') {
      uiStatus = 'DELIVERED';
    } else if (o.status === 'IN_TRANSIT' || o.status === 'DISPATCHED') {
      uiStatus = 'IN_TRANSIT';
    } else if (o.status === 'PICKED_UP') {
      uiStatus = 'PICKED_UP';
    } else if (o.status === 'ASSIGNED') {
      uiStatus = 'ASSIGNED';
    } else {
      uiStatus = 'CONFIRMED';
    }

    const isBid = Boolean(
      o.isBidding ||
      (o.id && (String(o.id).toUpperCase().includes('BID') || String(o.id).toUpperCase().includes('AUCT'))) ||
      (o.cropName && (o.cropName.toLowerCase().includes('auction') || o.cropName.toLowerCase().includes('lot') || o.cropName.toLowerCase().includes('bidding')))
    );

    return {
      id: o.id || idx,
      orderNumber: o.id ? (o.id.startsWith('ORD-') ? o.id : 'ORD-' + o.id) : ('ORD-' + (10000 + idx)),
      cropName: o.cropName || 'Harvest Crop',
      grade: 'A Grade',
      quantityKg: o.quantity || 100,
      ratePerKg: o.pricePerUnit || Math.round((o.totalPrice || 1000) / (o.quantity || 100)),
      totalAmount: o.finalAmount || o.totalPrice || 1000,
      orderDate: dateStr,
      orderTime: timeStr,
      img: this.getCropImage(o.cropName),
      buyerName: o.dealerName || 'Apex Agro Mills Ltd',
      buyerPhone: o.dealerPhone || '+91 98722 55667',
      buyerGstin: '07AABCC8901Z1Z8',
      deliveryAddress: o.deliveryAddress || 'Commercial Mandi Warehouse, Delhi',
      farmerName: o.farmerName || 'Sardar Gurpreet Singh',
      farmerPhone: o.farmerPhone || '+91 98140 11223',
      farmerLocation: o.farmerLocation || 'Khanna Mandi Yard, Ludhiana, Punjab',
      fulfillmentType: (o.fulfillmentType as any) || 'DELIVERY_AGENT',
      deliveryFee: o.deliveryFee || 0,
      distanceKm: o.distanceKm || 0,
      status: uiStatus,
      paymentMethod: o.paymentMethod || 'Stripe Demo (Card **** 4242)',
      farmerId: o.farmerId,
      dealerId: o.dealerId,
      isBidding: isBid,
      deliveryInfo: matchedDelivery
    };
  }

  get dealerAllOrders(): UIOrderItem[] {
    const uid = String(this.user?.id || this.user?.userId || '').trim();
    const currentName = (this.user?.fullName || this.user?.username || '').trim().toLowerCase();
    return this.orders.filter(o => {
      const buyerName = (o.buyerName || '').trim().toLowerCase();
      const dId = String(o.dealerId || '').trim();
      const isMyDealerId = Boolean(uid && dId && dId === uid);
      const isMyDealerName = Boolean(currentName && buyerName && currentName === buyerName);
      return Boolean(isMyDealerId || isMyDealerName);
    });
  }

  get normalOrdersCount(): number {
    return this.dealerAllOrders.filter(o => !o.isBidding).length;
  }

  get biddingOrdersCount(): number {
    return this.dealerAllOrders.filter(o => !!o.isBidding).length;
  }

  get roleFilteredOrders(): UIOrderItem[] {
    const role = this.user?.role;
    const uid = String(this.user?.id || this.user?.userId || '');
    const currentName = (this.user?.fullName || this.user?.username || '').trim().toLowerCase();

    return this.orders.filter(o => {
      if (role === 'FARMER') {
        const farmerName = (o.farmerName || '').trim().toLowerCase();
        const fId = String(o.farmerId || '').trim();
        return Boolean((uid && fId && fId === uid) || (currentName && farmerName && currentName === farmerName));
      } else if (role === 'DEALER') {
        const buyerName = (o.buyerName || '').trim().toLowerCase();
        const dId = String(o.dealerId || '').trim();
        const isMyDealer = Boolean((uid && dId && dId === uid) || (currentName && buyerName && currentName === buyerName));
        if (!isMyDealer) return false;

        // Separate 2 sections for Dealer: Normal Orders vs Orders Completed by Bidding
        if (this.orderCategory === 'NORMAL' && o.isBidding) return false;
        if (this.orderCategory === 'BIDDING' && !o.isBidding) return false;
        return true;
      }
      return true; // Admin and auditors view ALL platform orders
    });
  }

  get totalCount(): number {
    return this.roleFilteredOrders.length;
  }

  get deliveryPartnerCount(): number {
    return this.roleFilteredOrders.filter(o => o.fulfillmentType === 'DELIVERY_AGENT').length;
  }

  get selfPickupCount(): number {
    return this.roleFilteredOrders.filter(o => o.fulfillmentType === 'SELF_PICKUP').length;
  }

  get completedCount(): number {
    return this.roleFilteredOrders.filter(o => o.status === 'DELIVERED' || o.status === 'PAID' || o.status === 'CONFIRMED').length;
  }

  get inTransitCount(): number {
    return this.roleFilteredOrders.filter(o => o.status === 'IN_TRANSIT' || o.status === 'PICKED_UP').length;
  }

  get displayedOrders(): UIOrderItem[] {
    return this.roleFilteredOrders.filter(o => {
      if (this.filterFulfillment !== 'ALL' && o.fulfillmentType !== this.filterFulfillment) {
        return false;
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const match = o.cropName.toLowerCase().includes(q) ||
                      o.buyerName.toLowerCase().includes(q) ||
                      o.farmerName.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (this.filterCrop !== 'ALL' && o.cropName !== this.filterCrop) return false;
      if (this.filterStatus === 'COMPLETED' && o.status !== 'DELIVERED') return false;
      if (this.filterStatus === 'IN_TRANSIT' && o.status !== 'IN_TRANSIT' && o.status !== 'PICKED_UP') return false;
      if (this.filterStatus === 'CONFIRMED' && o.status !== 'CONFIRMED' && o.status !== 'PAID') return false;
      return true;
    });
  }

  getCropImage(cropName?: string): string {
    const name = (cropName || '').toLowerCase();
    if (name.includes('rice') || name.includes('paddy')) return '/assets/images/crop-rice.jpg';
    if (name.includes('wheat')) return '/assets/images/crop-wheat.jpg';
    if (name.includes('tomato')) return '/assets/images/crop-tomato.jpg';
    if (name.includes('onion')) return '/assets/images/crop-onion.jpg';
    if (name.includes('potato')) return '/assets/images/crop-potato.jpg';
    if (name.includes('chilli') || name.includes('chili')) return '/assets/images/crop-chili.jpg';
    if (name.includes('maize') || name.includes('corn')) return '/assets/images/crop-maize.jpg';
    if (name.includes('cotton')) return '/assets/images/crop-cotton.jpg';
    if (name.includes('groundnut') || name.includes('peanut')) return '/assets/images/crop-groundnut.jpg';
    if (name.includes('banana')) return '/assets/images/crop-banana.jpg';
    if (name.includes('sugarcane')) return '/assets/images/crop-sugarcane.jpg';
    if (name.includes('turmeric')) return '/assets/images/crop-turmeric.jpg';
    return '/assets/images/crop-rice.jpg';
  }

  onThumbError(event: any, cropName?: string): void {
    event.target.src = '/assets/images/crop-rice.jpg';
  }

  downloadReceipt(order: UIOrderItem): void {
    this.downloadingId = order.id;
    const inv: Invoice = {
      id: order.id.toString(),
      orderId: order.id.toString(),
      invoiceNumber: `CD-INV-2026-${order.orderNumber.replace('ORD-', '')}`,
      farmerName: order.farmerName,
      farmerPhone: order.farmerPhone,
      farmerAddress: order.farmerLocation,
      dealerName: order.buyerName,
      dealerPhone: order.buyerPhone,
      dealerAddress: order.deliveryAddress,
      dealerGstin: order.buyerGstin,
      deliveryAddress: order.deliveryAddress,
      fulfillmentType: order.fulfillmentType,
      deliveryDistanceKm: order.distanceKm,
      deliveryFee: order.deliveryFee,
      cropName: order.cropName,
      cropVariety: order.grade,
      quantity: order.quantityKg,
      unit: 'kg',
      pricePerUnit: order.ratePerKg,
      totalAmount: order.totalAmount,
      cgstAmount: order.totalAmount * 0.025,
      sgstAmount: order.totalAmount * 0.025,
      finalAmount: order.totalAmount * 1.05 + order.deliveryFee,
      status: 'PAID',
      paymentMethod: order.paymentMethod,
      transactionId: `TXN-${order.id}-98201`,
      issuedAt: new Date().toISOString()
    };

    setTimeout(() => {
      this.invoiceService.printOrSaveInvoice(inv);
      this.downloadingId = null;
      this.downloadMessage = `Tax Invoice Receipt for #${order.cropName} downloaded successfully!`;
      setTimeout(() => this.downloadMessage = '', 4000);
    }, 500);
  }

  viewInvoiceModal(order: UIOrderItem): void {
    this.selectedInvoiceOrder = order;
  }

  viewDeliveryStatus(order: UIOrderItem): void {
    if (!order) return;
    const allDels = this.deliveries || [];
    const cleanId = String(order.id || '').trim();
    const orderNum = String(order.orderNumber || '').trim();
    const cleanNum = cleanId.replace(/^ord-?/i, '');
    const cleanOrderNum = orderNum.replace(/^ord-?/i, '');

    let del = allDels.find(d => {
      const dOrder = String(d.orderId || '').trim();
      const dClean = dOrder.replace(/^ord-?/i, '');
      return dOrder === cleanId ||
             dOrder === orderNum ||
             dClean === cleanNum ||
             dClean === cleanOrderNum ||
             ('ORD-' + dClean) === orderNum ||
             ('ORD-' + dClean) === cleanId;
    });

    if (!del && order.cropName) {
      const targetCrop = order.cropName.trim().toLowerCase();
      del = allDels.find(d => {
        const dCrop = (d.cropName || '').trim().toLowerCase();
        return dCrop === targetCrop || dCrop.includes(targetCrop) || targetCrop.includes(dCrop);
      });
    }

    const orderCopy = { ...order };
    if (del) {
      orderCopy.deliveryInfo = del;
      const effective = this.getEffectiveStatus(orderCopy);
      orderCopy.status = effective as any;
    }
    this.deliveryStatusOrder = orderCopy;
  }

  copyTracking(num: string): void {
    if (!num) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(num).then(() => {
          this.copiedTracking = true;
          setTimeout(() => { this.copiedTracking = false; }, 2000);
        });
      }
    } catch {}
  }

  getTrackingNumber(order: UIOrderItem | null): string {
    if (!order) return 'TRK-IN-10001';
    if (order.deliveryInfo?.trackingNumber) return String(order.deliveryInfo.trackingNumber);
    const idStr = String(order.orderNumber || order.id || '10001');
    const clean = idStr.replace(/^ord-?/i, '');
    return 'TRK-IN-' + clean;
  }

  getCarrierName(order: UIOrderItem | null): string {
    return order?.deliveryInfo?.partnerName || 'Kisan Express Agro Logistics';
  }

  getCarrierPhone(order: UIOrderItem | null): string {
    return order?.deliveryInfo?.partnerPhone || '+91 98888 22110';
  }

  getVehicleInfo(order: UIOrderItem | null): string {
    return order?.deliveryInfo?.vehicleNumber ? `Vehicle: ${order.deliveryInfo.vehicleNumber}` : 'GPS Mini-Truck (Tata Ace)';
  }

  getEstimatedEta(order: UIOrderItem | null): string {
    if (!order) return 'Estimated Delivery: In Progress';
    const st = this.getEffectiveStatus(order);
    if (st === 'DELIVERED') return 'Consignment delivered successfully at destination';
    if (st === 'IN_TRANSIT') return 'On the road • Estimated delivery today within 2-4 hours';
    if (st === 'PICKED_UP') return 'Cargo collected • In transit towards warehouse';
    if (st === 'ASSIGNED') return 'Logistics driver dispatched to farmer pickup point';
    return 'Order confirmed • Awaiting logistics partner assignment';
  }

  // Dynamic Pagination
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.displayedOrders.length / this.pageSize));
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedOrders(): UIOrderItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.displayedOrders.slice(start, start + this.pageSize);
  }

  get startIndex(): number {
    if (this.displayedOrders.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.displayedOrders.length);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Farmer Review Actions (Dealer)
  openReviewModal(order: UIOrderItem): void {
    this.selectedReviewOrder = order;
    const existing = this.reviewService.getReviewByOrder(String(order.orderNumber || order.id));
    if (existing) {
      this.reviewRating = existing.rating;
      this.reviewComment = existing.comment;
    } else {
      this.reviewRating = 5;
      this.reviewComment = '';
    }
    this.reviewModalOpen = true;
  }

  hasReviewed(order: UIOrderItem): boolean {
    return !!this.reviewService.getReviewByOrder(String(order.orderNumber || order.id));
  }

  getReviewLabel(order: UIOrderItem): string {
    return this.hasReviewed(order) ? 'Edit Review' : 'Review Farmer';
  }

  saveFarmerReview(): void {
    if (!this.selectedReviewOrder) return;
    this.savingReview = true;
    this.reviewService.submitOrUpdateReview({
      orderId: String(this.selectedReviewOrder.orderNumber || this.selectedReviewOrder.id),
      orderNumber: this.selectedReviewOrder.orderNumber,
      cropName: this.selectedReviewOrder.cropName,
      dealerId: String(this.user?.id || this.user?.userId || 'dealer-1'),
      dealerName: this.user?.fullName || this.user?.username || 'Dealer',
      farmerId: this.selectedReviewOrder.farmerId || 'farmer-1',
      farmerName: this.selectedReviewOrder.farmerName,
      rating: this.reviewRating,
      comment: this.reviewComment.trim() || 'Great harvest quality, moisture maintained accurately, and prompt dispatch!'
    });
    this.savingReview = false;
    this.reviewModalOpen = false;
    this.downloadMessage = `Review for Farmer ${this.selectedReviewOrder.farmerName} saved successfully!`;
    setTimeout(() => this.downloadMessage = '', 4000);
  }
}
