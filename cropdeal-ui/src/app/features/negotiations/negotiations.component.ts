import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NegotiationService } from '../../core/services/negotiation.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { OrderService } from '../../core/services/order.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { WalletService } from '../../core/services/wallet.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { PaymentService } from '../../core/services/payment.service';
import { CropService } from '../../core/services/crop.service';
import { Negotiation } from '../../core/models/negotiation.model';
import { User } from '../../core/models/user.model';
import { Invoice } from '../../core/models/invoice.model';

export interface UINegotiationItem {
  id: number | string;
  cropId?: string;
  cropName: string;
  grade?: string;
  quantity: string;
  numericQty?: number;
  unit?: string;
  img?: string;
  dealerName: string;
  dealerLocation?: string;
  dealerPhone?: string;
  farmerName: string;
  farmerLocation?: string;
  farmerPhone?: string;
  dealerId?: string;
  farmerId?: string;
  standardPrice: number;
  expectedCounter: number;
  expectedParty?: string;
  currentCounter: number | null;
  currentParty: string | null;
  status: 'WAITING' | 'COUNTERED' | 'NEGOTIATING' | 'ACCEPTED' | 'REJECTED' | 'ORDER_PLACED';
  statusText: string;
  rawNeg?: Negotiation;
  createdAt?: string;
  updatedAt?: string;
  isDealerTurn?: boolean;
  isFarmerTurn?: boolean;
  lastCounterBy?: string;
}

@Component({
  selector: 'app-negotiations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="negotiations-container">

      <!-- Top Hero Banner -->
      <div class="negotiations-hero-banner shadow-sm">
        <div class="banner-content">
          <div class="d-flex align-center gap-2">
            <h1 class="neg-title">Direct Price Negotiations</h1>
            <span class="role-pill">{{ isDealer ? 'Dealer View' : (isFarmer ? 'Farmer View' : 'Admin Oversight') }}</span>
          </div>
          <p class="neg-subtitle">
            {{ isDealer
                ? 'Review your active counter-proposals with verified farmers, agree on fair rates, and place orders directly at negotiated prices.'
                : 'Direct farm-gate price bargaining with certified commercial dealers. Accept, reject, or counter proposals in real time.' }}
          </p>
        </div>
      </div>

      <!-- Filter Pills Row -->
      <div class="filter-pills-row mt-3">
        <button
          type="button"
          class="pill-btn"
          [class.active]="selectedTab === 'ALL'"
          (click)="setTab('ALL')">
          All Negotiations <span class="pill-badge">{{ allCount }}</span>
        </button>
        <button
          type="button"
          class="pill-btn"
          [class.active]="selectedTab === 'PENDING'"
          (click)="setTab('PENDING')">
          Pending Action <span class="pill-badge">{{ pendingCount }}</span>
        </button>
        <button
          type="button"
          class="pill-btn"
          [class.active]="selectedTab === 'ACCEPTED'"
          (click)="setTab('ACCEPTED')">
          Agreed / Accepted <span class="pill-badge">{{ acceptedCount }}</span>
        </button>
        <button
          type="button"
          class="pill-btn"
          [class.active]="selectedTab === 'REJECTED'"
          (click)="setTab('REJECTED')">
          Closed / Rejected <span class="pill-badge">{{ rejectedCount }}</span>
        </button>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="card toolbar-card shadow-sm mt-3">
        <div class="search-input-wrap">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="currentPage = 1"
            placeholder="Search by crop, farmer, or dealer..."
            class="search-field"
          />
        </div>

        <div class="toolbar-dropdowns">
          <select [(ngModel)]="filterCrop" (change)="currentPage = 1" class="dropdown-select">
            <option value="ALL">All Crops</option>
            <option value="Basmati Rice (Paddy)">Basmati Rice (Paddy)</option>
            <option value="Sharbati Wheat">Sharbati Wheat</option>
            <option value="Organic Tomato">Organic Tomato</option>
            <option value="Nasik Red Onion">Nasik Red Onion</option>
            <option value="Mustard Seeds">Mustard Seeds</option>
            <option value="Yellow Maize">Yellow Maize</option>
          </select>

          <select [(ngModel)]="filterStatus" (change)="currentPage = 1" class="dropdown-select">
            <option value="ALL">All Statuses</option>
            <option value="WAITING">Waiting Response</option>
            <option value="COUNTERED">Counter Offered</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="ORDER_PLACED">Order Placed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <!-- Notification Toast -->
      <div *ngIf="actionNotice" class="alert alert-success shadow-sm mt-3">
        <i class="fa-solid fa-circle-check"></i>
        <span>{{ actionNotice }}</span>
      </div>

      <!-- Negotiations Table Card -->
      <div class="card table-card shadow-sm mt-3">
        <div class="table-container">
          <table class="table-neg">
            <thead>
              <tr>
                <th>#</th>
                <th>Crop Details</th>
                <th>{{ isFarmer ? 'Dealer Details' : 'Farmer Details' }}</th>
                <th>Listed Standard Price</th>
                <th>Initial Offer</th>
                <th>Latest Counter Price</th>
                <th>Negotiation Status</th>
                <th style="min-width: 200px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of pagedItems; let idx = index">
                <td><strong>{{ (currentPage - 1) * pageSize + idx + 1 }}</strong></td>
                <td>
                  <div class="crop-col">
                    <img [src]="item.img || getCropImage(item.cropName)" [alt]="item.cropName" class="crop-thumb-img" (error)="onThumbError($event, item.cropName)" />
                    <div>
                      <strong class="crop-heading">{{ item.cropName }}</strong>
                      <span class="subtext d-block">Grade: {{ item.grade }}</span>
                      <span class="subtext d-block"><strong>Available Stock:</strong> {{ getCropAvailableStock(item) }} Kg</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div *ngIf="isFarmer">
                    <strong class="dealer-name">{{ item.dealerName }}</strong>
                    <span class="subtext d-block"><i class="fa-solid fa-location-dot text-muted"></i> {{ item.dealerLocation }}</span>
                    <span class="subtext d-block"><i class="fa-solid fa-phone text-muted"></i> {{ item.dealerPhone }}</span>
                  </div>
                  <div *ngIf="!isFarmer">
                    <strong class="dealer-name">{{ item.farmerName }}</strong>
                    <span class="subtext d-block"><i class="fa-solid fa-location-dot text-muted"></i> {{ item.farmerLocation || 'Punjab Mandi' }}</span>
                    <span class="subtext d-block"><i class="fa-solid fa-phone text-muted"></i> {{ item.farmerPhone || '+91 98140 11223' }}</span>
                  </div>
                </td>
                <td>
                  <strong class="standard-rate">&#8377;{{ item.standardPrice }} / Kg</strong>
                </td>
                <td>
                  <strong class="rate-bold">&#8377;{{ item.expectedCounter }} / Kg</strong>
                  <span class="subtext d-block">({{ item.expectedParty }})</span>
                </td>
                <td>
                  <ng-container *ngIf="item.currentCounter">
                    <strong class="rate-counter text-emerald">&#8377;{{ item.currentCounter }} / Kg</strong>
                    <span class="subtext d-block">By: <strong>{{ item.currentParty }}</strong></span>
                  </ng-container>
                  <span *ngIf="!item.currentCounter" class="text-muted">-</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="getStatusBadgeClass(item.status)">
                    <i class="fa-solid" [ngClass]="getStatusIcon(item.status)"></i>
                    {{ item.statusText }}
                  </span>
                </td>
                <td>
                  <!-- Dynamic Negotiation Action Buttons -->
                  <div *ngIf="item.status !== 'ACCEPTED' && item.status !== 'REJECTED' && item.status !== 'ORDER_PLACED'" class="d-flex flex-column gap-1">
                    <!-- FARMER ACTIONS: Accept, Counter, Reject -->
                    <div *ngIf="isFarmer" class="d-flex gap-1 flex-wrap">
                      <button
                        *ngIf="item.currentParty !== 'Farmer'"
                        class="btn-action-accept"
                        (click)="accept(item)"
                        title="Accept Dealer's Price Proposal">
                        <i class="fa-solid fa-check"></i> Accept (&#8377;{{ item.currentCounter || item.expectedCounter }}/Kg)
                      </button>
                      <button
                        class="btn-action-counter"
                        (click)="openCounterModal(item)"
                        title="Submit Counter Proposal">
                        <i class="fa-solid fa-pen"></i> Counter
                      </button>
                      <button
                        class="btn-action-reject"
                        (click)="reject(item)"
                        title="Reject & Close Negotiation">
                        <i class="fa-solid fa-xmark"></i> Reject
                      </button>
                    </div>

                    <!-- DEALER ACTIONS -->
                    <div *ngIf="isDealer" class="d-flex flex-column gap-1">
                      <!-- If Farmer countered, Dealer can Accept Farmer's Counter -->
                      <div *ngIf="item.currentParty === 'Farmer'" class="d-flex gap-1 flex-wrap">
                        <button
                          class="btn-action-accept"
                          (click)="accept(item)"
                          title="Accept Farmer's Counter Proposal">
                          <i class="fa-solid fa-check"></i> Accept (&#8377;{{ item.currentCounter }}/Kg)
                        </button>
                        <button
                          class="btn-action-counter"
                          (click)="openCounterModal(item)"
                          title="Submit Counter Offer">
                          <i class="fa-solid fa-pen"></i> Counter
                        </button>
                        <button
                          class="btn-action-reject"
                          (click)="reject(item)"
                          title="Withdraw & Close">
                          <i class="fa-solid fa-xmark"></i> Cancel
                        </button>
                      </div>

                      <!-- If Dealer counter-offered or waiting for farmer response -->
                      <div *ngIf="item.currentParty === 'Dealer' || !item.currentParty || item.status === 'WAITING'" class="d-flex flex-column gap-1">
                        <span class="badge badge-waiting">
                          <i class="fa-solid fa-hourglass-half"></i> Awaiting Farmer's Response
                        </span>
                        <div class="d-flex gap-1 mt-1">
                          <button
                            class="btn-action-counter"
                            (click)="openCounterModal(item)"
                            title="Adjust Counter Offer">
                            <i class="fa-solid fa-pen"></i> Adjust Offer
                          </button>
                          <button
                            class="btn-action-reject"
                            (click)="reject(item)"
                            title="Withdraw negotiation">
                            <i class="fa-solid fa-xmark"></i> Withdraw
                          </button>
                        </div>
                      </div>

                      <!-- Dealer can ALSO choose to buy at old / standard price right now! -->
                      <button
                        class="btn-buy-standard-rate mt-1"
                        (click)="openNegotiatedOrderModal(item, true)"
                        title="Buy immediately at original price without waiting">
                        <i class="fa-solid fa-cart-shopping"></i> Buy at Standard Price (&#8377;{{ item.standardPrice }}/Kg)
                      </button>
                    </div>
                  </div>

                  <!-- When ACCEPTED: Dealer gets instant Purchase button! -->
                  <div *ngIf="item.status === 'ACCEPTED'" class="d-flex flex-column gap-1">
                    <span class="badge badge-success mb-1">
                      <i class="fa-solid fa-circle-check"></i> Deal Agreed: &#8377;{{ item.currentCounter || item.expectedCounter }}/Kg
                    </span>
                    <button
                      *ngIf="isDealer"
                      class="btn-place-order-deal"
                      (click)="openNegotiatedOrderModal(item, false)">
                      <i class="fa-solid fa-cart-shopping"></i> Buy at Agreed Price (&#8377;{{ item.currentCounter || item.expectedCounter }}/Kg)
                    </button>
                    <span *ngIf="isFarmer" class="text-muted subtext">
                      <i class="fa-solid fa-clock"></i> Agreed! Waiting for dealer checkout
                    </span>
                  </div>

                  <!-- When REJECTED: Negotiation ended -> Dealer can start fresh negotiation or buy at standard price -->
                  <div *ngIf="item.status === 'REJECTED'" class="d-flex flex-column gap-1">
                    <span class="badge badge-danger">
                      <i class="fa-solid fa-circle-xmark"></i> Closed / Rejected
                    </span>
                    <div *ngIf="isDealer" class="d-flex gap-1 flex-wrap mt-1">
                      <button
                        class="btn-action-counter"
                        (click)="openCounterModal(item)"
                        title="Start fresh price negotiation">
                        <i class="fa-solid fa-rotate-right"></i> Negotiate Again
                      </button>
                      <button
                        class="btn-buy-standard-rate"
                        (click)="openNegotiatedOrderModal(item, true)"
                        title="Buy at original standard price">
                        <i class="fa-solid fa-cart-shopping"></i> Buy at Standard (&#8377;{{ item.standardPrice }}/Kg)
                      </button>
                    </div>
                  </div>

                  <div *ngIf="item.status === 'ORDER_PLACED'">
                    <span class="badge badge-ordered">
                      <i class="fa-solid fa-box-archive"></i> Order Placed & Paid
                    </span>
                  </div>
                </td>
              </tr>
              <tr *ngIf="pagedItems.length === 0">
                <td colspan="8" class="text-center p-5">
                  <div class="empty-wrap" style="padding: 2.5rem; text-align: center;">
                    <i class="fa-solid fa-handshake-slash text-muted" style="font-size: 2.8rem; margin-bottom: 0.75rem;"></i>
                    <h3 class="m-0 text-muted">No Negotiations Found</h3>
                    <p class="text-muted mt-1">Direct price negotiations between farmers and dealers will appear here in real-time.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table Footer / Dynamic Pagination -->
        <div class="table-footer" *ngIf="totalPages > 1">
          <span class="footer-count">
            Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredItems.length) }} of {{ filteredItems.length }} negotiations
          </span>
          <div class="pagination-row">
            <button class="btn-page" [disabled]="currentPage === 1" (click)="setPage(currentPage - 1)">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <button
              *ngFor="let p of totalPagesArray"
              class="btn-page"
              [class.active]="p === currentPage"
              (click)="setPage(p)">
              {{ p }}
            </button>
            <button class="btn-page" [disabled]="currentPage === totalPages" (click)="setPage(currentPage + 1)">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Counter Offer Modal -->
      <div *ngIf="activeCounterItem" class="modal-overlay" (click)="activeCounterItem = null">
        <div class="modal-content shadow-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fa-solid fa-handshake text-emerald"></i> Submit Counter Proposal</h3>
            <button class="close-btn" (click)="activeCounterItem = null">&times;</button>
          </div>
          <div class="modal-body">
            <p>
              Propose your counter price for <strong>{{ activeCounterItem.cropName }}</strong> ({{ activeCounterItem.quantity }}).
            </p>
            <div class="bg-light-box p-2 rounded mb-2">
              <div class="d-flex justify-between">
                <span>Standard Market Price:</span>
                <strong>&#8377;{{ activeCounterItem.standardPrice }} / Kg</strong>
              </div>
              <div class="d-flex justify-between mt-1">
                <span>Last Counter Offer:</span>
                <strong class="text-emerald">&#8377;{{ activeCounterItem.currentCounter || activeCounterItem.expectedCounter }} / Kg</strong>
              </div>
            </div>
            <div class="form-group mt-2">
              <div class="d-flex justify-between align-center mb-1">
                <label class="form-label m-0">Your Counter Offer (&#8377; per Kg) *</label>
                <span class="text-xs text-muted">Must be strictly below starting price (&lt; &#8377;{{ activeCounterItem.standardPrice }})</span>
              </div>
              <input
                type="number"
                [(ngModel)]="counterPriceInput"
                class="form-control"
                [max]="activeCounterItem.standardPrice - 1"
                placeholder="e.g. 24"
                min="1"
              />
              <div *ngIf="counterPriceInput && counterPriceInput >= activeCounterItem.standardPrice" class="alert alert-danger p-2 mt-2 text-xs">
                <i class="fa-solid fa-triangle-exclamation"></i> Counter proposal (&#8377;{{ counterPriceInput }} / Kg) must be strictly below the original starting price of &#8377;{{ activeCounterItem.standardPrice }} / Kg.
              </div>
            </div>
            <div class="form-group mt-2">
              <label class="form-label">Optional Condition / Mandi Note</label>
              <textarea
                [(ngModel)]="counterNoteInput"
                class="form-control"
                rows="2"
                placeholder="e.g. Farm gate loading included, payment via escrow wallet..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="activeCounterItem = null">Cancel</button>
            <button
              class="btn btn-primary"
              (click)="submitCounterOffer()"
              [disabled]="!counterPriceInput || counterPriceInput <= 0 || counterPriceInput >= activeCounterItem.standardPrice">
              Submit Counter Proposal
            </button>
          </div>
        </div>
      </div>

      <!-- NEGOTIATED ORDER CHECKOUT MODAL (For Dealer) -->
      <div *ngIf="activeOrderModalItem" class="modal-overlay" (click)="activeOrderModalItem = null">
        <div class="modal-content shadow-lg modal-checkout" [ngClass]="{'checkout-wide': checkoutStep === 'PAYMENT' || checkoutStep === 'SUCCESS'}" (click)="$event.stopPropagation()">

          <!-- STEP 1: DETAILS & LOGISTICS -->
          <ng-container *ngIf="checkoutStep === 'DETAILS'">
            <div class="modal-header">
              <div>
                <h3 class="m-0">
                  <i class="fa-solid fa-cart-shopping text-emerald"></i>
                  {{ isBuyingAtStandardPrice ? 'Purchase at Standard Price' : 'Checkout at Agreed Negotiated Price' }}
                </h3>
                <p class="modal-sub m-0">Finalize purchase for {{ activeOrderModalItem.cropName }}</p>
              </div>
              <button class="close-btn" (click)="activeOrderModalItem = null">&times;</button>
            </div>

            <div class="modal-body">
              <!-- Pricing Overview -->
              <div class="order-summary-box">
                <div class="summary-line">
                  <span>Seller (Farmer):</span>
                  <strong>{{ activeOrderModalItem.farmerName }}</strong>
                </div>
                <div class="summary-line">
                  <span>{{ isBuyingAtStandardPrice ? 'Standard Market Price:' : 'Negotiated Agreed Rate:' }}</span>
                  <strong class="text-emerald">&#8377;{{ checkoutRate }} / Kg</strong>
                </div>
                <div class="summary-line" *ngIf="!isBuyingAtStandardPrice && activeOrderModalItem.standardPrice">
                  <span>Original Standard Price:</span>
                  <span class="text-muted"><del>&#8377;{{ activeOrderModalItem.standardPrice }} / Kg</del></span>
                </div>
                <div class="summary-line">
                  <span>Available Harvest Stock:</span>
                  <strong class="text-emerald">{{ availableStockForNegotiation }} Kg</strong>
                </div>
              </div>

              <!-- Order Quantity (Choose within available stock like normal orders) -->
              <div class="form-group mt-3">
                <div class="d-flex justify-between align-center mb-1">
                  <label class="form-label m-0">Order Quantity (Kg) *</label>
                  <span class="text-xs text-muted">
                    Max Available: <strong class="text-emerald">{{ availableStockForNegotiation }} Kg</strong>
                  </span>
                </div>
                <input
                  type="number"
                  [(ngModel)]="orderQuantity"
                  (ngModelChange)="onOrderQuantityChange()"
                  min="1"
                  [max]="availableStockForNegotiation"
                  class="form-control"
                  placeholder="Enter purchase quantity in Kg"
                  required
                />
                <div class="d-flex gap-2 flex-wrap mt-2">
                  <button type="button" class="btn-qty-pill" (click)="setQuickQuantity(10)" [disabled]="availableStockForNegotiation < 10">10 Kg</button>
                  <button type="button" class="btn-qty-pill" (click)="setQuickQuantity(50)" [disabled]="availableStockForNegotiation < 50">50 Kg</button>
                  <button type="button" class="btn-qty-pill" (click)="setQuickQuantity(100)" [disabled]="availableStockForNegotiation < 100">100 Kg</button>
                  <button type="button" class="btn-qty-pill btn-qty-max" (click)="setQuickQuantity(availableStockForNegotiation)">
                    <i class="fa-solid fa-basket-shopping"></i> Buy Full Stock ({{ availableStockForNegotiation }} Kg)
                  </button>
                </div>
                <div *ngIf="orderQuantity > availableStockForNegotiation" class="alert alert-danger p-2 mt-2 text-xs">
                  <i class="fa-solid fa-triangle-exclamation"></i> Cannot order more than available harvest stock ({{ availableStockForNegotiation }} Kg).
                </div>
              </div>

              <!-- Fulfillment Method Selector -->
              <div class="form-group mt-3">
                <label class="form-label">Choose Logistics Fulfillment Method *</label>
                <div class="fulfillment-selector">
                  <label class="fulfillment-option" [class.selected]="fulfillmentType === 'DELIVERY_AGENT'">
                    <input type="radio" [(ngModel)]="fulfillmentType" name="negotiationFulfillment" value="DELIVERY_AGENT" />
                    <i class="fa-solid fa-truck-fast"></i>
                    <div>
                      <strong>Delivery Agent Partner</strong>
                      <span>Calculated at &#8377;10 per km</span>
                    </div>
                  </label>

                  <label class="fulfillment-option" [class.selected]="fulfillmentType === 'SELF_PICKUP'">
                    <input type="radio" [(ngModel)]="fulfillmentType" name="negotiationFulfillment" value="SELF_PICKUP" />
                    <i class="fa-solid fa-tractor"></i>
                    <div>
                      <strong>Self Pickup (&#8377;0)</strong>
                      <span>Collect directly from farm gate</span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Delivery Distance & Drop Address (if Delivery Agent chosen) -->
              <div *ngIf="fulfillmentType === 'DELIVERY_AGENT'" class="delivery-details-box mt-3">
                <div class="form-row">
                  <div class="form-group flex-1">
                    <label class="form-label">Delivery Distance (in Kilometers)</label>
                    <div class="input-km-wrapper">
                      <input
                        type="number"
                        [(ngModel)]="distanceKm"
                        min="1"
                        max="1000"
                        class="form-control"
                        placeholder="e.g. 15"
                        required
                      />
                      <span class="km-unit">km</span>
                    </div>
                  </div>

                  <div class="form-group flex-1 rate-display-group">
                    <span class="rate-calc-label">Delivery Surcharge:</span>
                    <div class="rate-calc-badge">
                      <span>&#8377;10 / km &times; {{ distanceKm || 0 }} km = </span>
                      <strong>&#8377;{{ deliveryCharge | number:'1.2-2' }}</strong>
                    </div>
                  </div>
                </div>

                <div class="form-group mt-2">
                  <div class="d-flex justify-between align-center mb-1">
                    <label class="form-label m-0">Destination / Custom Delivery Drop Address</label>
                    <div class="address-presets">
                      <button type="button" class="btn-preset" (click)="setCustomAddressPreset('profile')">Profile</button>
                      <button type="button" class="btn-preset" (click)="setCustomAddressPreset('warehouse')">Mandi Hub</button>
                      <button type="button" class="btn-preset" (click)="setCustomAddressPreset('port')">Port Terminal</button>
                    </div>
                  </div>
                  <input
                    type="text"
                    [(ngModel)]="deliveryAddress"
                    placeholder="Enter custom delivery warehouse / mandi address"
                    class="form-control"
                    required
                  />
                  <span class="subtext text-muted mt-1 d-block"><i class="fa-solid fa-pen"></i> You can modify or enter any custom address for this shipment.</span>
                </div>
              </div>

              <!-- Self Pickup Box -->
              <div *ngIf="fulfillmentType === 'SELF_PICKUP'" class="self-pickup-box mt-3">
                <i class="fa-solid fa-location-dot text-emerald"></i>
                <div>
                  <strong>Farm Gate Pickup Location:</strong>
                  <p class="m-0">{{ activeOrderModalItem.farmerLocation || 'Registered Farm Premises' }}</p>
                  <span class="subtext">Zero delivery surcharge. Transport arranged by buyer.</span>
                </div>
              </div>

              <!-- Price Breakdown Box with GST -->
              <div class="price-breakdown-box mt-3">
                <div class="breakdown-line">
                  <span>Crop Cost ({{ orderQuantity }} Kg &times; &#8377;{{ checkoutRate }}):</span>
                  <span>&#8377;{{ cropSubtotal | number:'1.2-2' }}</span>
                </div>
                <div class="breakdown-line">
                  <span>Delivery Charge ({{ fulfillmentType === 'DELIVERY_AGENT' ? distanceKm + ' km @ &#8377;10/km' : 'Self Pickup' }}):</span>
                  <span>&#8377;{{ deliveryCharge | number:'1.2-2' }}</span>
                </div>
                <div class="breakdown-line">
                  <span>Central GST (CGST &#64; 2.5%):</span>
                  <span>&#8377;{{ cgstAmount | number:'1.2-2' }}</span>
                </div>
                <div class="breakdown-line">
                  <span>State GST (SGST &#64; 2.5%):</span>
                  <span>&#8377;{{ sgstAmount | number:'1.2-2' }}</span>
                </div>
                <div class="breakdown-total">
                  <strong>Total Payable Amount:</strong>
                  <h3 class="total-price text-emerald m-0">&#8377;{{ totalPayable | number:'1.2-2' }}</h3>
                </div>
              </div>

              <div class="policy-note mt-3">
                <i class="fa-solid fa-circle-info"></i>
                <span>Direct farmer transaction: Funds held in secure escrow. Certified Tax invoice PDF available immediately upon payment. (Strict No-Refund Policy).</span>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="activeOrderModalItem = null">Cancel</button>
              <button
                class="btn btn-primary"
                (click)="goToPaymentStep()"
                [disabled]="orderQuantity < 1 || orderQuantity > availableStockForNegotiation || availableStockForNegotiation <= 0 || (fulfillmentType === 'DELIVERY_AGENT' && !deliveryAddress)">
                <span>Proceed to Payment &bull; &#8377;{{ totalPayable | number:'1.0-0' }}</span>
                <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </ng-container>

          <!-- STEP 2: PAYMENT GATEWAY SIMULATOR -->
          <ng-container *ngIf="checkoutStep === 'PAYMENT'">
            <div class="modal-header">
              <div class="d-flex align-center gap-2">
                <button class="btn-back" (click)="checkoutStep = 'DETAILS'" title="Back to Details">
                  <i class="fa-solid fa-arrow-left"></i>
                </button>
                <h3 class="m-0"><i class="fa-solid fa-lock text-emerald"></i> Secure Payment Gateway</h3>
              </div>
              <button class="close-btn" (click)="activeOrderModalItem = null">&times;</button>
            </div>

            <div class="modal-body position-relative">
              <!-- Payment Amount Header Banner -->
              <div class="payment-amount-banner">
                <div>
                  <span class="pay-lbl">Total Amount to Pay</span>
                  <h2 class="pay-val text-emerald m-0">&#8377;{{ totalPayable | number:'1.2-2' }}</h2>
                </div>
                <div class="text-right">
                  <span class="badge badge-success"><i class="fa-solid fa-shield-halved"></i> Escrow Protected</span>
                  <span class="d-block text-muted text-xs mt-1">{{ orderQuantity }} Kg &bull; {{ activeOrderModalItem.cropName }}</span>
                </div>
              </div>

              <!-- Payment Method Selector Tabs -->
              <div class="payment-tabs mt-3">
                <button
                  type="button"
                  class="pay-tab-btn"
                  [class.active]="paymentMethod === 'STRIPE_CARD'"
                  (click)="paymentMethod = 'STRIPE_CARD'">
                  <i class="fa-brands fa-stripe text-info"></i>
                  <span>Stripe Card (Demo)</span>
                </button>
                <button
                  type="button"
                  class="pay-tab-btn"
                  [class.active]="paymentMethod === 'UPI'"
                  (click)="paymentMethod = 'UPI'">
                  <i class="fa-solid fa-qrcode text-emerald"></i>
                  <span>UPI / QR Code</span>
                </button>
                <button
                  type="button"
                  class="pay-tab-btn"
                  [class.active]="paymentMethod === 'NET_BANKING'"
                  (click)="paymentMethod = 'NET_BANKING'">
                  <i class="fa-solid fa-building-columns text-amber"></i>
                  <span>Net Banking</span>
                </button>
                <button
                  type="button"
                  class="pay-tab-btn"
                  [class.active]="paymentMethod === 'WALLET'"
                  (click)="paymentMethod = 'WALLET'">
                  <i class="fa-solid fa-wallet text-purple"></i>
                  <span>Escrow Wallet</span>
                </button>
              </div>

              <!-- TAB 1: STRIPE DEMO CARD -->
              <div *ngIf="paymentMethod === 'STRIPE_CARD'" class="stripe-card-panel mt-3">
                <div class="stripe-demo-badge">
                  <i class="fa-solid fa-flask"></i>
                  <span><strong>Stripe Sandbox Test Mode:</strong> Demo simulation model. No real credit card or cash required.</span>
                  <button type="button" class="autofill-btn" (click)="autoFillStripeCard()">
                    <i class="fa-solid fa-bolt"></i> Auto-Fill Test Card
                  </button>
                </div>

                <div class="stripe-card-form mt-3">
                  <div class="form-group">
                    <label class="form-label">Cardholder Name</label>
                    <input
                      type="text"
                      [(ngModel)]="stripeCard.cardholderName"
                      placeholder="Name on card"
                      class="form-control"
                      required
                    />
                  </div>

                  <div class="form-group mt-2">
                    <label class="form-label d-flex justify-between align-center">
                      <span>Card Number</span>
                      <span class="card-brand-icons">
                        <i class="fa-brands fa-cc-visa text-primary"></i>
                        <i class="fa-brands fa-cc-mastercard text-danger"></i>
                        <i class="fa-brands fa-cc-amex text-info"></i>
                      </span>
                    </label>
                    <div class="card-number-wrapper">
                      <i class="fa-regular fa-credit-card card-icon"></i>
                      <input
                        type="text"
                        [(ngModel)]="stripeCard.cardNumber"
                        placeholder="4242 4242 4242 4242"
                        class="form-control card-input"
                        maxlength="19"
                        required
                      />
                      <span class="card-badge-test">TEST</span>
                    </div>
                  </div>

                  <div class="form-row mt-2">
                    <div class="form-group flex-1">
                      <label class="form-label">Expiration Date</label>
                      <input
                        type="text"
                        [(ngModel)]="stripeCard.expiry"
                        placeholder="MM/YY"
                        maxlength="5"
                        class="form-control"
                        required
                      />
                    </div>
                    <div class="form-group flex-1">
                      <label class="form-label">CVC / CVV</label>
                      <input
                        type="password"
                        [(ngModel)]="stripeCard.cvc"
                        placeholder="123"
                        maxlength="4"
                        class="form-control"
                        required
                      />
                    </div>
                    <div class="form-group flex-1">
                      <label class="form-label">Postal Code</label>
                      <input
                        type="text"
                        [(ngModel)]="stripeCard.postalCode"
                        placeholder="110001"
                        maxlength="6"
                        class="form-control"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div class="stripe-footer-note mt-3">
                  <i class="fa-solid fa-lock text-muted"></i>
                  <span>Simulated via Stripe.js Elements. 256-bit SSL encrypted tokenization to CropDeal escrow.</span>
                </div>
              </div>

              <!-- TAB 2: UPI / QR -->
              <div *ngIf="paymentMethod === 'UPI'" class="upi-panel mt-3">
                <div class="upi-box">
                  <div class="upi-left">
                    <label class="form-label">Enter Virtual UPI ID (VPA)</label>
                    <input
                      type="text"
                      [(ngModel)]="upiId"
                      placeholder="e.g. dealer@okhdfcbank"
                      class="form-control"
                    />
                    <span class="subtext mt-1 d-block text-muted">Supported: Google Pay, PhonePe, Paytm, BHIM</span>
                  </div>
                  <div class="upi-divider">OR</div>
                  <div class="upi-qr-preview">
                    <div class="qr-mock">
                      <i class="fa-solid fa-qrcode"></i>
                    </div>
                    <span class="text-xs text-muted">Scan with any UPI App</span>
                  </div>
                </div>
              </div>

              <!-- TAB 3: NET BANKING -->
              <div *ngIf="paymentMethod === 'NET_BANKING'" class="bank-panel mt-3">
                <label class="form-label">Choose Commercial Clearing Bank</label>
                <select [(ngModel)]="selectedBank" class="form-control">
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="HDFC Bank">HDFC Bank Ltd</option>
                  <option value="ICICI Bank">ICICI Bank Ltd</option>
                  <option value="Punjab National Bank">Punjab National Bank (PNB)</option>
                  <option value="Axis Bank">Axis Bank Ltd</option>
                </select>
                <p class="text-xs text-muted mt-2">You will authenticate your institutional Mandi clearing mandate via demo mock gateway.</p>
              </div>

              <!-- TAB 4: WALLET -->
              <div *ngIf="paymentMethod === 'WALLET'" class="wallet-panel mt-3">
                <div class="wallet-balance-box">
                  <div class="d-flex justify-between align-center">
                    <div>
                      <span class="stat-lbl">CropDeal Escrow Balance</span>
                      <h3 class="text-emerald m-0">&#8377;{{ currentWalletBalance | number:'1.2-2' }}</h3>
                    </div>
                    <span class="badge" [ngClass]="currentWalletBalance >= totalPayable ? 'badge-success' : 'badge-danger'">
                      <i class="fa-solid" [ngClass]="currentWalletBalance >= totalPayable ? 'fa-check' : 'fa-triangle-exclamation'"></i>
                      {{ currentWalletBalance >= totalPayable ? 'Sufficient Balance' : 'Insufficient Balance' }}
                    </span>
                  </div>
                  <div *ngIf="currentWalletBalance < totalPayable" class="alert alert-error mt-2">
                    <i class="fa-solid fa-triangle-exclamation me-1"></i>
                    <span>Short by &#8377;{{ (totalPayable - currentWalletBalance) | number:'1.2-2' }}. Insufficient funds in wallet! Order cannot be placed.</span>
                  </div>
                  <p class="text-xs text-muted mt-2">Instant debited from your dealer escrow balance with zero payment processing fees.</p>
                </div>
              </div>

              <!-- Processing Simulation Screen -->
              <div *ngIf="processingPayment" class="processing-overlay">
                <div class="spinner-border text-emerald"></div>
                <h4 class="mt-3">Authorizing Payment...</h4>
                <p class="processing-status">{{ paymentProgressMessage }}</p>
              </div>
            </div>

            <div class="modal-footer" *ngIf="!processingPayment">
              <button class="btn btn-secondary" (click)="checkoutStep = 'DETAILS'">Back</button>
              <button
                class="btn btn-primary btn-pay-now"
                (click)="processPayment()"
                [disabled]="paymentMethod === 'WALLET' && currentWalletBalance < totalPayable">
                <i class="fa-solid fa-lock"></i>
                <span>Authorize & Pay &#8377;{{ totalPayable | number:'1.2-2' }}</span>
              </button>
            </div>
          </ng-container>

          <!-- STEP 3: ORDER SUCCESS & INVOICE -->
          <ng-container *ngIf="checkoutStep === 'SUCCESS'">
            <div class="modal-header bg-emerald-light">
              <h3 class="text-emerald m-0"><i class="fa-solid fa-circle-check"></i> Payment Confirmed & Order Placed!</h3>
              <button class="close-btn" (click)="closeOrderModal()">&times;</button>
            </div>
            <div class="modal-body text-center p-4">
              <div class="success-icon-wrap mb-3">
                <i class="fa-solid fa-receipt text-emerald" style="font-size: 3.5rem;"></i>
              </div>
              <h2 class="mb-1 text-emerald">Order Confirmed!</h2>
              <p class="text-muted">
                Transaction <strong>{{ completedOrder?.transactionId }}</strong> has been authorized via {{ completedOrder?.paymentMethod }}. Escrow funds are secured.
              </p>

              <!-- Order Receipt Summary Card -->
              <div class="order-receipt-card mt-3 text-left">
                <div class="receipt-row">
                  <span>Order Reference:</span>
                  <strong>#{{ completedOrder?.id }}</strong>
                </div>
                <div class="receipt-row">
                  <span>Commodity:</span>
                  <strong>{{ completedOrder?.cropName }} ({{ completedOrder?.quantity }} {{ completedOrder?.unit }})</strong>
                </div>
                <div class="receipt-row">
                  <span>Order Category:</span>
                  <span class="badge badge-success">Normal Order (Escrow Confirmed)</span>
                </div>
                <div class="receipt-row">
                  <span>Seller (Farmer):</span>
                  <span>{{ completedOrder?.farmerName }}</span>
                </div>
                <div class="receipt-row">
                  <span>Fulfillment Mode:</span>
                  <span class="badge" [ngClass]="completedOrder?.fulfillmentType === 'SELF_PICKUP' ? 'badge-success' : 'badge-primary'">
                    {{ completedOrder?.fulfillmentType === 'SELF_PICKUP' ? 'Self Pickup (Farm Gate)' : 'Delivery Partner Dispatched' }}
                  </span>
                </div>
                <div class="receipt-row" *ngIf="completedOrder?.fulfillmentType === 'DELIVERY_AGENT'">
                  <span>Delivery Drop Address:</span>
                  <strong class="text-emerald">{{ completedOrder?.deliveryAddress }}</strong>
                </div>
                <div class="receipt-row total-row">
                  <span>Amount Paid:</span>
                  <strong class="text-emerald font-lg">&#8377;{{ completedOrder?.finalAmount | number:'1.2-2' }}</strong>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="success-actions mt-4">
                <button class="btn btn-primary" (click)="downloadCompletedInvoicePdf()">
                  <i class="fa-solid fa-file-arrow-down"></i>
                  <span>Download Tax Invoice (PDF)</span>
                </button>
                <button class="btn btn-secondary" (click)="viewInvoice()">
                  <i class="fa-solid fa-eye"></i>
                  <span>View Official Invoice</span>
                </button>
                <button class="btn btn-success" *ngIf="completedOrder?.fulfillmentType === 'DELIVERY_AGENT'" (click)="goToDeliveries()">
                  <i class="fa-solid fa-truck-fast"></i>
                  <span>Track Logistics Delivery</span>
                </button>
                <button class="btn btn-outline-primary" (click)="goToMyOrders()">
                  <i class="fa-solid fa-bag-shopping"></i>
                  <span>Go to My Orders</span>
                </button>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary w-100" (click)="closeOrderModal()">Done & Continue</button>
            </div>
          </ng-container>

        </div>
      </div>

      <!-- In-App Tax Invoice Preview Modal -->
      <div *ngIf="selectedInvoiceForView" class="modal-overlay" (click)="selectedInvoiceForView = null">
        <div class="modal-content invoice-modal-wide shadow-2xl" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="d-flex align-center gap-2">
              <i class="fa-solid fa-stamp text-emerald" style="font-size: 1.5rem;"></i>
              <div>
                <h3 class="m-0">Official GST Tax Invoice</h3>
                <span class="text-xs text-muted">Rule 46 of Central Goods & Services Tax (CGST) Rules</span>
              </div>
            </div>
            <button class="close-btn" (click)="selectedInvoiceForView = null">&times;</button>
          </div>

          <div class="modal-body invoice-body">
            <!-- Header Metadata -->
            <div class="invoice-meta-header">
              <div class="brand-meta">
                <h2 class="text-emerald m-0"><i class="fa-solid fa-leaf"></i> CropDeal Digital Mandi</h2>
                <span class="subtext">National Agricultural Electronic Escrow Marketplace</span>
                <span class="subtext d-block">CIN: U01409DL2026PTC392810 &bull; GSTIN: 07AAACG9821R1Z5</span>
              </div>
              <div class="invoice-number-box">
                <span class="inv-badge">TAX INVOICE</span>
                <h4 class="m-0 text-emerald">{{ selectedInvoiceForView.invoiceNumber }}</h4>
                <span class="inv-date">Date: {{ selectedInvoiceForView.issuedAt | date:'mediumDate' }}</span>
                <span class="inv-order">Order Ref: #{{ selectedInvoiceForView.orderId }}</span>
              </div>
            </div>

            <!-- Parties Grid (Farmer & Dealer) -->
            <div class="parties-grid mt-3">
              <div class="party-info-card farmer-card">
                <div class="party-card-title">
                  <i class="fa-solid fa-tractor text-emerald"></i>
                  <span>Supplier / Producer (Farmer)</span>
                </div>
                <h4 class="party-name">{{ selectedInvoiceForView.farmerName }}</h4>
                <p class="party-detail"><i class="fa-solid fa-location-dot"></i> {{ selectedInvoiceForView.farmerAddress }}</p>
                <p class="party-detail"><i class="fa-solid fa-phone"></i> {{ selectedInvoiceForView.farmerPhone }}</p>
                <div class="id-row mt-2">
                  <span class="id-tag">PAN: {{ selectedInvoiceForView.farmerPan }}</span>
                  <span class="id-tag">Category: Direct Producer</span>
                </div>
              </div>

              <div class="party-info-card dealer-card">
                <div class="party-card-title">
                  <i class="fa-solid fa-building text-primary-700"></i>
                  <span>Buyer / Recipient (Dealer)</span>
                </div>
                <h4 class="party-name">{{ selectedInvoiceForView.dealerName }}</h4>
                <p class="party-detail"><i class="fa-solid fa-warehouse"></i> <strong>Delivery Drop:</strong> {{ selectedInvoiceForView.deliveryAddress }}</p>
                <p class="party-detail"><i class="fa-solid fa-phone"></i> {{ selectedInvoiceForView.dealerPhone }}</p>
                <div class="id-row mt-2">
                  <span class="id-tag">GSTIN: {{ selectedInvoiceForView.dealerGstin }}</span>
                  <span class="id-tag">Lic: DL-AGRO-2026</span>
                </div>
              </div>
            </div>

            <!-- Logistics Strip -->
            <div class="logistics-strip mt-3">
              <div class="log-item">
                <span class="log-lbl">Fulfillment Mode:</span>
                <strong>{{ selectedInvoiceForView.fulfillmentType === 'SELF_PICKUP' ? 'Self-Pickup (Farm-Gate Direct)' : 'Delivery Partner Transit' }}</strong>
              </div>
              <div class="log-item">
                <span class="log-lbl">Transit Distance:</span>
                <span>{{ selectedInvoiceForView.deliveryDistanceKm ? selectedInvoiceForView.deliveryDistanceKm + ' km' : 'Direct Pickup' }}</span>
              </div>
              <div class="log-item">
                <span class="log-lbl">Delivery Fee:</span>
                <strong>&#8377;{{ (selectedInvoiceForView.deliveryFee || 0) | number:'1.2-2' }}</strong>
              </div>
              <div class="log-item">
                <span class="badge" [ngClass]="selectedInvoiceForView.fulfillmentType === 'SELF_PICKUP' ? 'badge-success' : 'badge-primary'">
                  {{ selectedInvoiceForView.fulfillmentType === 'SELF_PICKUP' ? 'Self Pickup (&#8377;0 Fee)' : 'Carrier Dispatched' }}
                </span>
              </div>
            </div>

            <!-- Commodity Details Table -->
            <div class="invoice-table-wrapper mt-3">
              <table class="table invoice-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Agricultural Commodity</th>
                    <th>HSN</th>
                    <th>Quantity</th>
                    <th>Rate (&#8377;)</th>
                    <th>Taxable Value (&#8377;)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>
                      <strong>{{ selectedInvoiceForView.cropName }}</strong>
                      <span class="subtext d-block">{{ selectedInvoiceForView.cropVariety }}</span>
                    </td>
                    <td><span class="hsn-pill">{{ selectedInvoiceForView.hsnCode }}</span></td>
                    <td><strong>{{ selectedInvoiceForView.quantity }}</strong> {{ selectedInvoiceForView.unit }}</td>
                    <td>&#8377;{{ selectedInvoiceForView.pricePerUnit | number:'1.2-2' }}</td>
                    <td><strong>&#8377;{{ selectedInvoiceForView.totalAmount | number:'1.2-2' }}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Tax Summary -->
            <div class="totals-breakdown-grid mt-3">
              <div class="payment-meta-box">
                <div class="escrow-cert">
                  <i class="fa-solid fa-shield-halved text-emerald"></i>
                  <div>
                    <strong>100% Escrow Protected Settlement</strong>
                    <p class="m-0 text-muted" style="font-size: 0.75rem;">
                      Certified settlement. Strict No-Refund Policy enforced between dealer and farmer.
                    </p>
                  </div>
                </div>
                <div class="payment-details-line mt-2">
                  <span><strong>Payment Method:</strong> {{ selectedInvoiceForView.paymentMethod }}</span>
                  <span><strong>Txn ID:</strong> {{ selectedInvoiceForView.transactionId }}</span>
                </div>
              </div>

              <div class="totals-calculation-box">
                <div class="calc-row">
                  <span>Taxable Subtotal:</span>
                  <span>&#8377;{{ selectedInvoiceForView.totalAmount | number:'1.2-2' }}</span>
                </div>
                <div class="calc-row" *ngIf="selectedInvoiceForView.deliveryFee && selectedInvoiceForView.deliveryFee > 0">
                  <span>Logistics Surcharge:</span>
                  <span>&#8377;{{ selectedInvoiceForView.deliveryFee | number:'1.2-2' }}</span>
                </div>
                <div class="calc-row">
                  <span>CGST (2.5%):</span>
                  <span>&#8377;{{ selectedInvoiceForView.cgstAmount | number:'1.2-2' }}</span>
                </div>
                <div class="calc-row">
                  <span>SGST (2.5%):</span>
                  <span>&#8377;{{ selectedInvoiceForView.sgstAmount | number:'1.2-2' }}</span>
                </div>
                <div class="calc-row total-row-final">
                  <strong>Total Invoice Value (INR):</strong>
                  <h3 class="text-emerald m-0">&#8377;{{ selectedInvoiceForView.finalAmount | number:'1.2-2' }}</h3>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selectedInvoiceForView = null">Close Preview</button>
            <button class="btn btn-primary" (click)="downloadPdfFromPreview()">
              <i class="fa-solid fa-file-arrow-down"></i> Print / Save PDF
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .negotiations-container { display: flex; flex-direction: column; gap: 1rem; }

    /* Top Hero Banner */
    .negotiations-hero-banner {
      background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/assets/images/sunset-banner.jpg') center/cover no-repeat;
      border-radius: 14px;
      padding: 2.2rem 2.8rem;
      color: white;
      min-height: 120px;
      display: flex;
      align-items: center;
    }
    .neg-title { font-size: 2rem; font-weight: 800; margin: 0 0 0.3rem 0; color: #fff; }
    .neg-subtitle { font-size: 0.95rem; color: #f1f5f9; margin: 0; max-width: 800px; }
    .role-pill {
      background: rgba(22, 163, 74, 0.9);
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      text-transform: uppercase;
    }

    /* Filter Pills Row */
    .filter-pills-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .pill-btn {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      padding: 0.5rem 1.1rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      transition: all 0.15s ease;
    }
    .pill-btn.active {
      background: #16a34a;
      border-color: #16a34a;
      color: white;
    }
    .pill-badge {
      background: rgba(0,0,0,0.08);
      padding: 0.15rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .pill-btn.active .pill-badge {
      background: rgba(255,255,255,0.25);
      color: white;
    }

    /* Toolbar */
    .toolbar-card {
      border-radius: 12px;
      padding: 1rem 1.25rem;
      background: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      border: 1px solid #e2e8f0;
    }
    .search-input-wrap {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.55rem 0.85rem;
      flex: 1;
      max-width: 400px;
    }
    .search-field {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.88rem;
      width: 100%;
    }
    .toolbar-dropdowns { display: flex; gap: 0.75rem; }
    .dropdown-select {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.55rem 0.85rem;
      font-size: 0.85rem;
      color: #334155;
      background: #ffffff;
      outline: none;
    }

    /* Table */
    .table-card {
      border-radius: 14px;
      background: #ffffff;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .table-container { overflow-x: auto; }
    .table-neg { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .table-neg th {
      background: #f8fafc;
      color: #64748b;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.85rem 1.25rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    .table-neg td {
      padding: 0.95rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: middle;
    }

    .crop-col { display: flex; align-items: center; gap: 0.85rem; }
    .crop-thumb-img { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
    .crop-heading { font-size: 0.92rem; font-weight: 700; color: #0f172a; }
    .subtext { font-size: 0.78rem; color: #64748b; }
    .dealer-name { font-size: 0.9rem; font-weight: 700; color: #0f172a; }
    .standard-rate { font-size: 0.92rem; font-weight: 700; color: #64748b; }
    .rate-bold { font-size: 0.95rem; font-weight: 700; color: #0f172a; }
    .rate-counter { font-size: 1rem; font-weight: 800; }

    /* Badges */
    .badge-waiting { background: #dbeafe; color: #1e40af; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 12px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem; }
    .badge-countered { background: #fef3c7; color: #92400e; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 12px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem; }
    .badge-negotiating { background: #e0f2fe; color: #0369a1; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 12px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem; }
    .badge-success { background: #dcfce7; color: #166534; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 12px; font-size: 0.75rem; }
    .badge-ordered { background: #eff6ff; color: #1d4ed8; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 12px; font-size: 0.75rem; }
    .badge-danger { background: #fee2e2; color: #991b1b; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 12px; font-size: 0.75rem; }

    /* Action Buttons */
    .actions-group { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .btn-action-accept {
      background: #ffffff;
      border: 1px solid #16a34a;
      color: #16a34a;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      transition: all 0.15s ease;
    }
    .btn-action-accept:hover { background: #16a34a; color: white; }

    .btn-action-reject {
      background: #ffffff;
      border: 1px solid #dc2626;
      color: #dc2626;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      transition: all 0.15s ease;
    }
    .btn-action-reject:hover { background: #dc2626; color: white; }

    .btn-action-counter {
      background: #ffffff;
      border: 1px solid #2563eb;
      color: #2563eb;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      transition: all 0.15s ease;
    }
    .btn-action-counter:hover { background: #2563eb; color: white; }

    .btn-place-order-deal {
      background: #16a34a;
      color: white;
      border: none;
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: background 0.15s;
    }
    .btn-place-order-deal:hover { background: #15803d; }

    /* Pagination */
    .table-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-top: 1px solid #f1f5f9;
      background: #f8fafc;
    }
    .footer-count { font-size: 0.82rem; color: #64748b; }
    .pagination-row { display: flex; gap: 0.35rem; }
    .btn-page {
      min-width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-page.active { background: #16a34a; border-color: #16a34a; color: white; }
    .btn-page:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Modals & Checkout Scroll Fix */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 1rem;
      overflow-y: auto;
    }
    .modal-content {
      background: white;
      border-radius: 14px;
      width: 480px;
      max-width: 95%;
      max-height: calc(100vh - 2.5rem);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: modalSlide 0.2s ease-out;
    }
    .modal-checkout { width: 620px; }
    .checkout-wide { width: 720px; max-width: 95%; }
    .invoice-modal-wide { width: 880px; max-width: 96%; }
    @keyframes modalSlide {
      from { transform: translateY(15px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .modal-header {
      padding: 1.1rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
      flex-shrink: 0;
    }
    .modal-sub { font-size: 0.82rem; color: #64748b; }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
      max-height: calc(100vh - 12rem);
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      flex-shrink: 0;
    }

    .order-summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .summary-line { display: flex; justify-content: space-between; font-size: 0.88rem; color: #475569; }
    .total-highlight {
      border-top: 1px dashed #cbd5e1;
      padding-top: 0.5rem;
      margin-top: 0.25rem;
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
    }

    /* Fulfillment Selector */
    .fulfillment-selector {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-top: 0.4rem;
    }
    .fulfillment-option {
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      background: #fff;
      transition: all 0.2s ease;
    }
    .fulfillment-option input[type="radio"] { display: none; }
    .fulfillment-option i { font-size: 1.4rem; color: #64748b; }
    .fulfillment-option strong { display: block; font-size: 0.88rem; color: #1e293b; }
    .fulfillment-option span { font-size: 0.75rem; color: #64748b; }
    .fulfillment-option.selected {
      border-color: #16a34a;
      background: #f0fdf4;
    }
    .fulfillment-option.selected i { color: #16a34a; }

    /* Delivery Details Box */
    .delivery-details-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem;
    }
    .form-row { display: flex; gap: 0.75rem; align-items: flex-end; }
    .flex-1 { flex: 1; }
    .input-km-wrapper { position: relative; display: flex; align-items: center; }
    .input-km-wrapper input { padding-right: 2.2rem; }
    .km-unit { position: absolute; right: 0.75rem; color: #94a3b8; font-weight: 600; font-size: 0.82rem; }
    .rate-display-group {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .rate-calc-label { font-size: 0.72rem; color: #64748b; font-weight: 600; }
    .rate-calc-badge { font-size: 0.85rem; color: #1e293b; margin-top: 0.15rem; }
    .rate-calc-badge strong { color: #16a34a; }
    .address-presets { display: flex; gap: 0.35rem; }
    .btn-preset {
      background: #e2e8f0;
      border: none;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      color: #475569;
    }
    .btn-preset:hover { background: #cbd5e1; }
    .btn-qty-pill {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #334155;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-qty-pill:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    .btn-qty-pill:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-qty-max {
      background: #dcfce7;
      border-color: #86efac;
      color: #166534;
      font-weight: 700;
    }
    .btn-qty-max:hover:not(:disabled) {
      background: #bbf7d0;
      border-color: #4ade80;
    }

    .self-pickup-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 0.85rem 1rem;
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    /* Price Breakdown Box */
    .price-breakdown-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .breakdown-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #64748b;
    }
    .breakdown-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px dashed #cbd5e1;
      padding-top: 0.6rem;
      margin-top: 0.3rem;
    }
    .policy-note {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 0.65rem 0.85rem;
      font-size: 0.78rem;
      color: #1e40af;
    }

    /* Payment Tabs */
    .payment-amount-banner {
      background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pay-lbl { font-size: 0.78rem; color: #64748b; text-transform: uppercase; font-weight: 700; }
    .pay-val { font-size: 1.6rem; font-weight: 800; color: #16a34a; }
    .payment-tabs {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
    }
    .pay-tab-btn {
      padding: 0.65rem 0.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .pay-tab-btn i { font-size: 1.15rem; }
    .pay-tab-btn.active {
      border-color: #16a34a;
      background: #f0fdf4;
      color: #16a34a;
    }

    /* Stripe Card Panel */
    .stripe-demo-badge {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.6rem 0.85rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      font-size: 0.78rem;
      color: #475569;
    }
    .autofill-btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 0.3rem 0.65rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      white-space: nowrap;
    }
    .card-number-wrapper { position: relative; display: flex; align-items: center; }
    .card-icon { position: absolute; left: 0.85rem; color: #94a3b8; }
    .card-input { padding-left: 2.5rem; padding-right: 3.5rem; letter-spacing: 0.05em; }
    .card-badge-test {
      position: absolute;
      right: 0.75rem;
      background: #e2e8f0;
      color: #475569;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }
    .card-brand-icons { display: flex; gap: 0.35rem; font-size: 1rem; }
    .stripe-footer-note { font-size: 0.75rem; color: #94a3b8; display: flex; align-items: center; gap: 0.4rem; }

    /* UPI Panel */
    .upi-box {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .upi-left { flex: 1; }
    .upi-divider { font-weight: 700; color: #94a3b8; font-size: 0.85rem; }
    .upi-qr-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
    }
    .qr-mock {
      width: 80px;
      height: 80px;
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.2rem;
      color: #16a34a;
    }

    /* Wallet Panel */
    .wallet-balance-box {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 10px;
      padding: 1.25rem;
    }
    .stat-lbl { font-size: 0.75rem; color: #6b21a8; font-weight: 700; text-transform: uppercase; }
    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 0.6rem 0.85rem;
      font-size: 0.8rem;
      color: #b91c1c;
      display: flex;
      align-items: center;
    }

    /* Processing Simulation */
    .processing-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    .spinner-border {
      width: 2.5rem;
      height: 2.5rem;
      border: 3px solid #e2e8f0;
      border-top-color: #16a34a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .processing-status { font-size: 0.85rem; color: #64748b; margin-top: 0.35rem; }

    .btn-pay-now {
      font-size: 0.95rem;
      padding: 0.75rem 1.5rem;
    }
    .btn-back {
      background: none;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #475569;
    }

    /* Order Receipt Card */
    .order-receipt-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .receipt-row { display: flex; justify-content: space-between; font-size: 0.88rem; color: #475569; }
    .total-row { border-top: 1px dashed #cbd5e1; padding-top: 0.5rem; font-weight: 800; font-size: 1.1rem; }
    .success-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }

    /* Official Invoice Modal */
    .invoice-body { padding: 1.75rem; background: #fff; }
    .invoice-meta-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 1rem;
    }
    .invoice-number-box { text-align: right; }
    .inv-badge { background: #16a34a; color: white; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .inv-date, .inv-order { display: block; font-size: 0.78rem; color: #64748b; margin-top: 0.2rem; }
    .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .party-info-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem;
      background: #f8fafc;
    }
    .party-card-title { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; font-weight: 700; color: #64748b; margin-bottom: 0.4rem; }
    .party-name { font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0 0 0.35rem 0; }
    .party-detail { font-size: 0.8rem; color: #475569; margin: 0.2rem 0; }
    .id-row { display: flex; gap: 0.4rem; }
    .id-tag { background: #e2e8f0; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 4px; color: #334155; }
    .logistics-strip {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.82rem;
    }
    .invoice-table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
    .invoice-table th { background: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 0.65rem 0.85rem; font-size: 0.78rem; text-align: left; }
    .invoice-table td { padding: 0.75rem 0.85rem; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; }
    .hsn-pill { background: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; }
    .totals-breakdown-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem; }
    .escrow-cert { display: flex; gap: 0.6rem; align-items: center; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.75rem; }
    .totals-calculation-box { display: flex; flex-direction: column; gap: 0.35rem; }
    .calc-row { display: flex; justify-content: space-between; font-size: 0.85rem; color: #64748b; }
    .total-row-final { border-top: 2px solid #0f172a; padding-top: 0.5rem; font-weight: 800; color: #0f172a; }

    .btn-fulfill-option {
      flex: 1;
      padding: 0.65rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #ffffff;
      color: #334155;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      transition: all 0.15s;
    }
    .btn-fulfill-option.active {
      border-color: #16a34a;
      background: #f0fdf4;
      color: #16a34a;
    }

    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-label { font-size: 0.82rem; font-weight: 700; color: #334155; }
    .form-control {
      padding: 0.65rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.88rem;
      outline: none;
    }
    .form-control:focus { border-color: #16a34a; }

    .bg-light-box { background: #f8fafc; border: 1px solid #e2e8f0; }
    .btn {
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    .btn-primary { background: #16a34a; color: white; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-outline-primary {
      background: transparent;
      border: 1px solid #16a34a;
      color: #16a34a;
    }
    .btn-outline-primary:hover { background: #16a34a; color: white; }

    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.6rem; }
    .mt-3 { margin-top: 1rem; }
    .mt-4 { margin-top: 1.5rem; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 1rem; }
    .p-2 { padding: 0.65rem; }
    .p-4 { padding: 1.5rem; }
    .rounded { border-radius: 8px; }
    .text-emerald { color: #16a34a; }
    .text-muted { color: #94a3b8; }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .text-xs { font-size: 0.75rem; }
    .font-lg { font-size: 1.2rem; }
    .w-100 { width: 100%; }
    .d-flex { display: flex; }
    .d-block { display: block; }
    .flex-column { flex-direction: column; }
    .justify-between { justify-content: space-between; }
    .align-center { align-items: center; }
    .gap-1 { gap: 0.25rem; }
    .gap-2 { gap: 0.5rem; }

    @media (max-width: 900px) {
      .toolbar-card { flex-direction: column; align-items: stretch; }
      .toolbar-dropdowns { flex-wrap: wrap; }
      .parties-grid, .totals-breakdown-grid, .fulfillment-selector, .payment-tabs { grid-template-columns: 1fr; }
    }
  `]
})
export class NegotiationsComponent implements OnInit, OnDestroy {
  user: User | null = null;
  selectedTab: 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' = 'ALL';
  searchQuery = '';
  filterCrop = 'ALL';
  filterStatus = 'ALL';

  actionNotice = '';
  activeCounterItem: UINegotiationItem | null = null;
  counterPriceInput: number | null = null;
  counterNoteInput = '';

  // Order Placement Modal State
  activeOrderModalItem: UINegotiationItem | null = null;
  isBuyingAtStandardPrice = false;
  checkoutStep: 'DETAILS' | 'PAYMENT' | 'SUCCESS' = 'DETAILS';
  orderQuantity = 10;
  availableStockForNegotiation = 100;
  fulfillmentType: 'DELIVERY_AGENT' | 'SELF_PICKUP' = 'DELIVERY_AGENT';
  distanceKm = 15;
  deliveryAddress = '';
  paymentMethod: 'STRIPE_CARD' | 'UPI' | 'NET_BANKING' | 'WALLET' = 'STRIPE_CARD';
  walletBalance = 0;
  isPlacingOrder = false;

  stripeCard = {
    cardholderName: 'Apex Agro Mills Ltd',
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/28',
    cvc: '424',
    postalCode: '110001'
  };
  upiId = 'dealer@okhdfcbank';
  selectedBank = 'State Bank of India';

  processingPayment = false;
  paymentProgressMessage = '';
  completedOrder: any = null;
  completedInvoice: Invoice | null = null;
  selectedInvoiceForView: Invoice | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 5;
  Math = Math;

  items: UINegotiationItem[] = [];
  private readonly NEGOTIATIONS_KEY = 'cropdeal_negotiations';
  private sub: Subscription = new Subscription();

  constructor(
    private negotiationService: NegotiationService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private orderService: OrderService,
    private deliveryService: DeliveryService,
    private walletService: WalletService,
    private invoiceService: InvoiceService,
    private paymentService: PaymentService,
    private cropService: CropService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.authService.currentUser$.subscribe((u: User | null) => {
        this.user = u;
        this.loadNegotiations();
      })
    );

    this.sub.add(
      this.walletService.balance$.subscribe((b) => {
        this.walletBalance = b;
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get isDealer(): boolean {
    return this.user?.role === 'DEALER';
  }

  get isFarmer(): boolean {
    return this.user?.role === 'FARMER';
  }

  loadNegotiations(): void {
    this.items = this.loadStoredNegotiations();

    if (this.user?.id || this.user?.userId) {
      const uid = String(this.user.id || this.user.userId!);
      this.negotiationService.getNegotiationsByUser(uid).subscribe({
        next: (serverList) => {
          if (serverList && serverList.length > 0) {
            const mappedServerItems: UINegotiationItem[] = serverList.map(sn => ({
              id: sn.id,
              cropName: sn.cropName,
              grade: 'Grade A',
              quantity: String(sn.quantity) + ' Kg',
              numericQty: sn.quantity,
              unit: 'Kg',
              img: 'assets/images/crops/wheat.jpg',
              standardPrice: sn.originalPrice,
              expectedCounter: sn.offeredPrice,
              currentCounter: sn.counterPrice || sn.offeredPrice,
              currentParty: sn.lastActionBy === 'FARMER' ? 'Farmer' : 'Dealer',
              lastCounterBy: sn.lastActionBy === 'FARMER' ? 'Farmer' : 'Dealer',
              status: (sn.status === 'PENDING' ? 'WAITING' : (sn.status === 'ACCEPTED' ? 'ACCEPTED' : (sn.status === 'REJECTED' ? 'REJECTED' : 'COUNTERED'))) as any,
              statusText: sn.status,
              isDealerTurn: this.isDealer,
              isFarmerTurn: this.isFarmer,
              dealerId: sn.dealerId,
              dealerName: sn.dealerName || 'Dealer Partner',
              farmerId: sn.farmerId,
              farmerName: sn.farmerName || 'Farmer Partner',
              updatedAt: sn.updatedAt || new Date().toISOString()
            }));

            const merged = [...mappedServerItems];
            this.items.forEach(it => {
              if (!merged.some(m => String(m.id) === String(it.id))) {
                merged.push(it);
              }
            });
            this.items = merged;
            this.saveNegotiations();
          }
        },
        error: () => {}
      });
    }
  }

  private loadStoredNegotiations(): UINegotiationItem[] {
    const raw = localStorage.getItem(this.NEGOTIATIONS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    // Only return empty if truly nothing created, but provide seamless experience
    return [];
  }

  private saveNegotiations(): void {
    localStorage.setItem(this.NEGOTIATIONS_KEY, JSON.stringify(this.items));
  }

  setTab(tab: 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'): void {
    this.selectedTab = tab;
    this.currentPage = 1;
  }

  get userNegotiations(): UINegotiationItem[] {
    const uid = String(this.user?.id || this.user?.userId || '').trim();
    const uName = (this.user?.fullName || this.user?.username || '').toLowerCase().trim();

    return this.items.filter(i => {
      if (this.isFarmer) {
        const fid = String(i.farmerId || '').trim();
        const fname = (i.farmerName || '').toLowerCase().trim();
        return Boolean((uid && fid && uid === fid) || (uName && fname && uName === fname));
      } else if (this.isDealer) {
        const did = String(i.dealerId || '').trim();
        const dname = (i.dealerName || '').toLowerCase().trim();
        return Boolean((uid && did && uid === did) || (uName && dname && uName === dname));
      }
      return true; // Admin views all
    });
  }

  get allCount(): number {
    return this.userNegotiations.length;
  }

  get pendingCount(): number {
    return this.userNegotiations.filter(i => i.status === 'WAITING' || i.status === 'COUNTERED' || i.status === 'NEGOTIATING').length;
  }

  get acceptedCount(): number {
    return this.userNegotiations.filter(i => i.status === 'ACCEPTED' || i.status === 'ORDER_PLACED').length;
  }

  get rejectedCount(): number {
    return this.userNegotiations.filter(i => i.status === 'REJECTED').length;
  }

  get filteredItems(): UINegotiationItem[] {
    return this.userNegotiations.filter(i => {
      // Tab filter
      if (this.selectedTab === 'PENDING') {
        if (i.status !== 'WAITING' && i.status !== 'COUNTERED' && i.status !== 'NEGOTIATING') return false;
      } else if (this.selectedTab === 'ACCEPTED') {
        if (i.status !== 'ACCEPTED' && i.status !== 'ORDER_PLACED') return false;
      } else if (this.selectedTab === 'REJECTED') {
        if (i.status !== 'REJECTED') return false;
      }

      // Search filter
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const match = (i.cropName || '').toLowerCase().includes(q) ||
                      (i.dealerName || '').toLowerCase().includes(q) ||
                      (i.farmerName || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      // Crop filter
      if (this.filterCrop !== 'ALL' && i.cropName !== this.filterCrop) return false;

      // Status filter
      if (this.filterStatus !== 'ALL' && i.status !== this.filterStatus) return false;

      return true;
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.pageSize) || 1;
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedItems(): UINegotiationItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'WAITING': return 'badge-waiting';
      case 'COUNTERED': return 'badge-countered';
      case 'NEGOTIATING': return 'badge-negotiating';
      case 'ACCEPTED': return 'badge-success';
      case 'ORDER_PLACED': return 'badge-ordered';
      case 'REJECTED': return 'badge-danger';
      default: return 'badge-waiting';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'WAITING': return 'fa-clock';
      case 'COUNTERED': return 'fa-comment-dots';
      case 'NEGOTIATING': return 'fa-handshake';
      case 'ACCEPTED': return 'fa-check';
      case 'ORDER_PLACED': return 'fa-box-check';
      case 'REJECTED': return 'fa-xmark';
      default: return 'fa-clock';
    }
  }

  accept(item: UINegotiationItem): void {
    item.status = 'ACCEPTED';
    item.statusText = 'Accepted';
    this.saveNegotiations();
    this.negotiationService.acceptOffer(item.id).subscribe();

    const dealerId = item.dealerId || 'dealer-1';
    const farmerId = item.farmerId || 'farmer-1';
    const finalPrice = item.currentCounter || item.expectedCounter;

    this.notificationService.sendNotification(
      dealerId,
      '🤝 Proposal Accepted!',
      `Price proposal of ₹${finalPrice}/Kg for ${item.cropName} was accepted! You can now place your order at this agreed rate.`,
      'NEGOTIATION'
    );
    this.notificationService.sendNotification(
      farmerId,
      '🤝 Trade Confirmed',
      `You accepted the price negotiation for ${item.cropName} at ₹${finalPrice}/Kg with ${item.dealerName}.`,
      'NEGOTIATION'
    );

    this.actionNotice = `Agreed on ₹${finalPrice}/Kg for ${item.cropName}! Deal confirmed.`;
    setTimeout(() => this.actionNotice = '', 4500);
  }

  reject(item: UINegotiationItem): void {
    item.status = 'REJECTED';
    item.statusText = 'Rejected';
    this.saveNegotiations();
    this.negotiationService.rejectOffer(item.id).subscribe();

    const dealerId = item.dealerId || 'dealer-1';
    const farmerId = item.farmerId || 'farmer-1';

    this.notificationService.sendNotification(
      dealerId,
      '❌ Proposal Declined',
      `Negotiation for ${item.cropName} was closed/declined.`,
      'NEGOTIATION'
    );
    this.notificationService.sendNotification(
      farmerId,
      '❌ Proposal Closed',
      `Negotiation for ${item.cropName} has been closed.`,
      'NEGOTIATION'
    );

    this.actionNotice = `Negotiation offer for ${item.cropName} was rejected and closed.`;
    setTimeout(() => this.actionNotice = '', 4500);
  }

  openCounterModal(item: UINegotiationItem): void {
    this.activeCounterItem = item;
    const initial = item.currentCounter || item.expectedCounter || (item.standardPrice - 1);
    this.counterPriceInput = initial >= item.standardPrice ? Math.max(1, item.standardPrice - 1) : initial;
    this.counterNoteInput = '';
  }

  submitCounterOffer(): void {
    if (!this.activeCounterItem || !this.counterPriceInput) return;
    if (this.counterPriceInput >= this.activeCounterItem.standardPrice) {
      alert(`Counter proposal (₹${this.counterPriceInput}/Kg) must be strictly below the original starting price of ₹${this.activeCounterItem.standardPrice}/Kg.`);
      return;
    }
    const actor = this.isDealer ? 'Dealer' : 'Farmer';
    const actorId = this.user?.id ? Number(this.user.id) : (this.isDealer ? 2 : 1);
    this.activeCounterItem.currentCounter = this.counterPriceInput;
    this.activeCounterItem.currentParty = actor;
    this.activeCounterItem.status = 'COUNTERED';
    this.activeCounterItem.statusText = `${actor} Countered`;
    this.saveNegotiations();
    this.negotiationService.counterOffer(this.activeCounterItem.id, this.counterPriceInput, this.counterNoteInput, actorId).subscribe();

    const dealerId = this.activeCounterItem.dealerId || 'dealer-1';
    const farmerId = this.activeCounterItem.farmerId || 'farmer-1';

    if (this.isDealer) {
      this.notificationService.sendNotification(
        farmerId,
        '💬 Dealer Counter Proposal',
        `Dealer ${this.activeCounterItem.dealerName} proposed ₹${this.counterPriceInput}/Kg for ${this.activeCounterItem.cropName}.`,
        'NEGOTIATION'
      );
    } else {
      this.notificationService.sendNotification(
        dealerId,
        '💬 Farmer Counter Proposal',
        `Farmer ${this.activeCounterItem.farmerName} submitted a counter proposal of ₹${this.counterPriceInput}/Kg for ${this.activeCounterItem.cropName}.`,
        'NEGOTIATION'
      );
    }

    this.actionNotice = `Counter proposal of ₹${this.counterPriceInput}/Kg submitted for ${this.activeCounterItem.cropName}.`;
    this.activeCounterItem = null;
    setTimeout(() => this.actionNotice = '', 4500);
  }

  // --- DEALER NEGOTIATED ORDER CHECKOUT ---
  get checkoutRate(): number {
    if (!this.activeOrderModalItem) return 0;
    if (this.isBuyingAtStandardPrice) {
      return this.activeOrderModalItem.standardPrice;
    }
    return this.activeOrderModalItem.currentCounter || this.activeOrderModalItem.expectedCounter || this.activeOrderModalItem.standardPrice;
  }

  get cropSubtotal(): number {
    return Math.round((this.orderQuantity || 0) * this.checkoutRate * 100) / 100;
  }

  get deliveryCharge(): number {
    return this.fulfillmentType === 'DELIVERY_AGENT' ? (this.distanceKm || 0) * 10 : 0;
  }

  get cgstAmount(): number {
    return Math.round(this.cropSubtotal * 0.025 * 100) / 100;
  }

  get sgstAmount(): number {
    return Math.round(this.cropSubtotal * 0.025 * 100) / 100;
  }

  get taxAmount(): number {
    return this.cgstAmount + this.sgstAmount;
  }

  get totalPayable(): number {
    return Math.round((this.cropSubtotal + this.deliveryCharge + this.taxAmount) * 100) / 100;
  }

  get currentWalletBalance(): number {
    return this.walletBalance;
  }

  openNegotiatedOrderModal(item: UINegotiationItem, useStandardPrice: boolean = false): void {
    const freshCrops = this.cropService.refreshCrops();
    const matchedCrop = freshCrops.find(c => {
      const cId = String(c.id || c.cropId || '').trim().toLowerCase();
      const targetId = String(item.cropId || '').trim().toLowerCase();
      const cName = (c.cropName || '').trim().toLowerCase();
      const targetName = (item.cropName || '').trim().toLowerCase();
      return (targetId && (cId === targetId || targetId.includes(cId) || cId.includes(targetId))) ||
             (cName && targetName && (cName === targetName || cName.includes(targetName) || targetName.includes(cName)));
    });

    const maxAvailable = matchedCrop
      ? (matchedCrop.quantity !== undefined ? matchedCrop.quantity : (matchedCrop.availableQuantity || 0))
      : (parseInt((item.quantity || '100').replace(/[^\d]/g, ''), 10) || 100);

    if (maxAvailable <= 0) {
      alert('This crop has already been completely sold out and is no longer available in the mandi.');
      return;
    }

    this.availableStockForNegotiation = maxAvailable;
    this.activeOrderModalItem = item;
    this.isBuyingAtStandardPrice = useStandardPrice;
    this.checkoutStep = 'DETAILS';
    this.orderQuantity = Math.min(10, maxAvailable);
    this.fulfillmentType = 'DELIVERY_AGENT';
    this.distanceKm = 15;
    this.deliveryAddress = this.user?.address || 'Commercial Grain Terminal, Mandi Gate 2, New Delhi';
    this.paymentMethod = 'STRIPE_CARD';
    this.completedOrder = null;
    this.completedInvoice = null;
    this.selectedInvoiceForView = null;
    if (this.user) {
      this.walletBalance = this.walletService.getStoredBalance(this.user.id || this.user.userId || 'dealer-1');
    }
  }

  onOrderQuantityChange(): void {
    if (this.orderQuantity > this.availableStockForNegotiation) {
      this.orderQuantity = this.availableStockForNegotiation;
    }
    if (this.orderQuantity < 1) {
      this.orderQuantity = 1;
    }
  }

  setQuickQuantity(qty: number): void {
    this.orderQuantity = Math.min(qty, this.availableStockForNegotiation);
  }

  getCropAvailableStock(item: UINegotiationItem): number {
    const freshCrops = this.cropService.getLocalCrops();
    const matched = freshCrops.find(c => {
      const cId = String(c.id || c.cropId || '').trim().toLowerCase();
      const targetId = String(item.cropId || '').trim().toLowerCase();
      const cName = (c.cropName || '').trim().toLowerCase();
      const targetName = (item.cropName || '').trim().toLowerCase();
      return (targetId && (cId === targetId || targetId.includes(cId) || cId.includes(targetId))) ||
             (cName && targetName && (cName === targetName || cName.includes(targetName) || targetName.includes(cName)));
    });
    if (matched) {
      return matched.quantity !== undefined ? matched.quantity : (matched.availableQuantity || 0);
    }
    const parsed = parseInt((item.quantity || '100').replace(/[^\d]/g, ''), 10);
    return isNaN(parsed) ? 100 : parsed;
  }

  goToPaymentStep(): void {
    if (this.orderQuantity < 1) {
      alert('Please enter a valid order quantity of at least 1 Kg.');
      return;
    }
    if (this.orderQuantity > this.availableStockForNegotiation) {
      alert(`Cannot order more than available harvest stock of ${this.availableStockForNegotiation} Kg.`);
      return;
    }
    if (this.fulfillmentType === 'DELIVERY_AGENT' && !this.deliveryAddress?.trim()) {
      alert('Please specify a delivery destination drop address.');
      return;
    }
    this.checkoutStep = 'PAYMENT';
  }

  autoFillStripeCard(): void {
    this.stripeCard = {
      cardholderName: this.user?.fullName || this.user?.username || 'Apex Agro Mills Ltd',
      cardNumber: '4242 4242 4242 4242',
      expiry: '12/28',
      cvc: '424',
      postalCode: '110001'
    };
  }

  setCustomAddressPreset(type: string): void {
    if (type === 'profile') {
      this.deliveryAddress = this.user?.address || 'Grain Mandi Yard 4, Outer Ring Road, Delhi';
    } else if (type === 'warehouse') {
      this.deliveryAddress = 'North Regional Buffer Mandi Hub, Warehouse #12, Panipat';
    } else if (type === 'port') {
      this.deliveryAddress = 'Kandla Agri Export Container Freight Station, Gujarat';
    }
  }

  processPayment(): void {
    if (!this.activeOrderModalItem || !this.user) return;
    const item = this.activeOrderModalItem;
    const finalTotal = this.totalPayable;
    const uid = this.user.id || this.user.userId || 'dealer-1';

    // Verify wallet if wallet payment chosen
    if (this.paymentMethod === 'WALLET' && this.currentWalletBalance < finalTotal) {
      alert(`Insufficient wallet funds! Required: ₹${finalTotal.toLocaleString()}, Available: ₹${this.currentWalletBalance.toLocaleString()}. Please recharge your wallet or choose another payment option.`);
      return;
    }

    this.processingPayment = true;
    this.paymentProgressMessage = 'Initializing encrypted Mandi escrow session...';

    const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    const txnId = 'txn_' + Math.random().toString(36).substring(2, 10);
    const paymentLabel = this.paymentMethod === 'STRIPE_CARD' ? 'Stripe Elements (Escrow)' :
                         this.paymentMethod === 'UPI' ? `UPI / QR (${this.upiId || 'dealer@okhdfcbank'})` :
                         this.paymentMethod === 'NET_BANKING' ? `NetBanking (${this.selectedBank})` : 'CropDeal Digital Escrow Wallet';

    setTimeout(() => {
      this.paymentProgressMessage = 'Locking transaction funds into Central Escrow...';
    }, 400);

    setTimeout(() => {
      const effectiveDropAddress = this.fulfillmentType === 'DELIVERY_AGENT'
        ? this.deliveryAddress
        : (item.farmerLocation || 'Farm Gate Self Pickup, Direct Mandi');

      const orderReq: any = {
        id: orderId,
        cropId: item.cropId || 'crop-101',
        dealerId: uid,
        farmerId: item.farmerId || 'farmer-1',
        dealerName: this.user?.fullName || this.user?.username || 'Apex Agro Mills Ltd',
        dealerPhone: this.user?.phone || '+91 98722 55667',
        farmerName: item.farmerName,
        farmerPhone: item.farmerPhone || '+91 98140 11223',
        cropName: item.cropName,
        quantity: this.orderQuantity,
        unit: item.unit || 'Kg',
        pricePerUnit: this.checkoutRate,
        totalPrice: this.cropSubtotal,
        taxAmount: this.taxAmount,
        finalAmount: finalTotal,
        deliveryFee: this.deliveryCharge,
        distanceKm: this.fulfillmentType === 'DELIVERY_AGENT' ? this.distanceKm : 0,
        fulfillmentType: this.fulfillmentType,
        deliveryAddress: effectiveDropAddress,
        paymentMethod: paymentLabel,
        transactionId: txnId,
        status: 'PAID',
        orderType: 'NORMAL',
        isBidding: false,
        createdAt: new Date().toISOString()
      };

      const inv: Invoice = {
        id: 'inv-' + orderId,
        invoiceNumber: 'CD-INV-2026-' + orderId.replace('ORD-', ''),
        orderId: orderId,
        dealerId: uid,
        dealerName: this.user?.fullName || this.user?.username || 'Apex Agro Mills Ltd',
        dealerPhone: this.user?.phone || '+91 98722 55667',
        dealerAddress: effectiveDropAddress,
        dealerGstin: '07AABCC8901Z1Z8',
        farmerId: item.farmerId || 'farmer-1',
        farmerName: item.farmerName,
        farmerPhone: item.farmerPhone || '+91 98140 11223',
        farmerAddress: item.farmerLocation || 'Registered Farm Premises',
        farmerPan: 'AABPG7812F',
        cropName: item.cropName,
        cropVariety: item.grade || 'Standard Mandi Certified Harvest',
        hsnCode: item.cropName?.toLowerCase().includes('rice') ? '1006' :
                 (item.cropName?.toLowerCase().includes('mustard') ? '1207' :
                 (item.cropName?.toLowerCase().includes('onion') || item.cropName?.toLowerCase().includes('tomato') ? '0703' : '1001')),
        quantity: this.orderQuantity,
        unit: item.unit || 'Kg',
        pricePerUnit: this.checkoutRate,
        govMspPrice: Math.round(this.checkoutRate * 0.92),
        totalAmount: this.cropSubtotal,
        cgstAmount: this.cgstAmount,
        sgstAmount: this.sgstAmount,
        taxAmount: this.taxAmount,
        fulfillmentType: this.fulfillmentType,
        deliveryFee: this.deliveryCharge,
        deliveryDistanceKm: this.fulfillmentType === 'DELIVERY_AGENT' ? this.distanceKm : 0,
        deliveryAddress: effectiveDropAddress,
        finalAmount: finalTotal,
        paymentMethod: paymentLabel,
        transactionId: txnId,
        status: 'PAID',
        issuedAt: new Date().toISOString()
      };

      this.completedOrder = orderReq;
      this.completedInvoice = inv;

      // Dispatch delivery if delivery agent chosen
      if (this.fulfillmentType === 'DELIVERY_AGENT') {
        this.deliveryService.createDelivery({
          orderId: orderId,
          dealerId: uid,
          farmerId: item.farmerId || null as any,
          cropName: item.cropName,
          cropQuantity: this.orderQuantity,
          cropUnit: item.unit || 'Kg',
          farmerName: item.farmerName || null as any,
          farmerPhone: item.farmerPhone || null as any,
          pickupAddress: item.farmerLocation || null as any,
          dealerName: this.user?.fullName || this.user?.username || null as any,
          dealerPhone: this.user?.phone || null as any,
          dropAddress: effectiveDropAddress,
          distanceKm: this.distanceKm,
          deliveryFee: this.deliveryCharge,
          fulfillmentType: 'DELIVERY_AGENT',
          status: 'PENDING_ASSIGNMENT'
        }).subscribe();
      } else {
        this.deliveryService.createDelivery({
          orderId: orderId,
          fulfillmentType: 'SELF_PICKUP',
          dealerId: uid,
          farmerId: item.farmerId || null as any,
          cropName: item.cropName,
          cropQuantity: this.orderQuantity,
          cropUnit: item.unit || 'Kg',
          farmerName: item.farmerName || null as any,
          farmerPhone: item.farmerPhone || null as any,
          pickupAddress: item.farmerLocation || null as any,
          dealerName: this.user?.fullName || this.user?.username || null as any,
          dealerPhone: this.user?.phone || null as any,
          dropAddress: 'Self Pickup by Dealer',
          status: 'DELIVERED'
        }).subscribe();
      }

      const numOrderId = parseInt(String(orderId).replace(/\D/g, ''), 10) || 1001;
      const numDealerId = parseInt(String(uid).replace(/\D/g, ''), 10) || 2;
      const numFarmerId = parseInt(String(item.farmerId || '1').replace(/\D/g, ''), 10) || 1;

      // Persist Payment in PaymentService
      this.paymentService.makePayment({
        orderId: numOrderId,
        dealerId: numDealerId,
        farmerId: numFarmerId,
        amount: finalTotal,
        paymentMethod: this.paymentMethod
      }).subscribe();

      // Persist Invoice in InvoiceService
      this.invoiceService.createInvoice(inv).subscribe();

      // Persist order in OrderService
      this.orderService.createOrder(orderReq).subscribe({
        next: () => {
          this.finishOrderPlacement(orderId, txnId, item, finalTotal, uid);
        },
        error: () => {
          this.finishOrderPlacement(orderId, txnId, item, finalTotal, uid);
        }
      });

      if (this.paymentMethod === 'WALLET') {
        this.walletService.debitWallet(
          uid,
          finalTotal,
          `Negotiated Purchase: ${item.cropName} (${this.orderQuantity} Kg @ ₹${this.checkoutRate}/Kg)`
        ).subscribe();
      }
    }, 1200);
  }

  private finishOrderPlacement(orderId: string, txnId: string, item: UINegotiationItem, finalTotal: number, uid: string): void {
    // Credit Farmer's Digital Wallet for agreed negotiated crop price
    const agreedCropTotal = this.cropSubtotal;
    const farmerTargetId = String(item.farmerId || 'farmer-1');
    this.walletService.creditWallet(
      farmerTargetId,
      agreedCropTotal,
      `Negotiated Crop Sale Proceeds for ${item.cropName} (${this.orderQuantity} Kg @ ₹${this.checkoutRate}/Kg) - Order #${orderId}`
    ).subscribe();

    // Deduct crop stock atomically: if remaining stock > 0, post is updated with remaining stock.
    // If remaining stock reaches 0, the post is automatically deleted.
    const cropIdentifier = String(item.cropId || item.cropName || '');
    this.cropService.deductCropStock(cropIdentifier, this.orderQuantity);

    // Mark negotiation as ORDER_PLACED
    item.status = 'ORDER_PLACED';
    item.statusText = 'Order Placed';
    this.saveNegotiations();

    // In-app notifications
    this.notificationService.sendNotification(
      uid,
      '📦 Order Confirmed & Paid',
      `Your order #${orderId} for ${item.cropName} (${this.orderQuantity} Kg at ₹${this.checkoutRate}/Kg) has been confirmed and paid. Total: ₹${finalTotal.toLocaleString()}.`,
      'ORDER'
    );
    this.notificationService.sendNotification(
      item.farmerId || 'farmer-1',
      '🎉 Deal Finalized & Paid',
      `Dealer ${this.user?.fullName || 'Buyer'} placed order #${orderId} for ${item.cropName} (${this.orderQuantity} Kg) at ₹${this.checkoutRate}/Kg.`,
      'ORDER',
      'farmer'
    );

    this.processingPayment = false;
    this.checkoutStep = 'SUCCESS';
    this.actionNotice = `Order #${orderId} placed successfully for ${this.orderQuantity} Kg at ₹${this.checkoutRate}/Kg! Check "My Orders".`;
  }

  downloadCompletedInvoicePdf(): void {
    if (this.completedInvoice) {
      this.invoiceService.printOrSaveInvoice(this.completedInvoice);
    }
  }

  viewInvoice(): void {
    if (this.completedInvoice) {
      this.selectedInvoiceForView = this.completedInvoice;
    }
  }

  downloadPdfFromPreview(): void {
    if (this.selectedInvoiceForView) {
      this.invoiceService.printOrSaveInvoice(this.selectedInvoiceForView);
    }
  }

  goToDeliveries(): void {
    this.closeOrderModal();
    this.router.navigate(['/deliveries']);
  }

  goToMyOrders(): void {
    this.closeOrderModal();
    this.router.navigate(['/orders']);
  }

  closeOrderModal(): void {
    this.activeOrderModalItem = null;
    this.checkoutStep = 'DETAILS';
    this.completedOrder = null;
    this.completedInvoice = null;
    this.selectedInvoiceForView = null;
  }

  getCropImage(cropName: string): string {
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
}
