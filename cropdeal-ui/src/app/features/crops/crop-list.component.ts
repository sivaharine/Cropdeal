import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CropService } from '../../core/services/crop.service';
import { OrderService } from '../../core/services/order.service';
import { NegotiationService } from '../../core/services/negotiation.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { AuthService } from '../../core/services/auth.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { WalletService } from '../../core/services/wallet.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { NotificationService } from '../../core/services/notification.service';
import { Crop } from '../../core/models/crop.model';
import { Invoice } from '../../core/models/invoice.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-crop-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="crops-container">
      <!-- Farmer View Hero Banner (matches image14.png) only when in My Crops mode -->
      <div class="my-crops-banner shadow-sm" *ngIf="user?.role === 'FARMER' && isMyCropsOnly">
        <div class="my-crops-banner-overlay">
          <div>
            <h1 class="my-crops-title">My Crops</h1>
            <p class="my-crops-subtitle">Manage your harvest listings, update details and get better deals.</p>
          </div>
          <div class="d-flex gap-2">
            <a routerLink="/crops" class="btn btn-outline-light">
              <i class="fa-solid fa-store"></i> Browse Full Marketplace
            </a>
            <a routerLink="/crops/add" class="btn-banner-add-crop">
              <i class="fa-solid fa-plus"></i> Add Crop
            </a>
          </div>
        </div>
      </div>

      <!-- Page Header for Marketplace (All crops from everyone) -->
      <div class="page-header" *ngIf="!isMyCropsOnly || user?.role !== 'FARMER'">
        <div>
          <h2 class="page-title"><i class="fa-solid fa-wheat-awn text-emerald"></i> Agricultural Crop Marketplace</h2>
          <p class="page-subtitle">Verified fresh harvest listings direct from registered farmers with local APMC rate benchmarks</p>
        </div>
        <div class="actions">
          <a *ngIf="user?.role === 'FARMER'" routerLink="/crops" [queryParams]="{my: 'true'}" class="btn btn-outline-primary">
            <i class="fa-solid fa-leaf"></i> View My Crops Only
          </a>
          <a *ngIf="user?.role === 'FARMER'" routerLink="/crops/add" class="btn btn-primary">
            <i class="fa-solid fa-circle-plus"></i> Add Crop
          </a>
          <button *ngIf="!user" class="btn btn-outline-primary" (click)="authModalService.open('Please log in or quick-login to post harvest crop listings.')">
            <i class="fa-solid fa-circle-plus"></i> Post Harvest Crop
          </button>
        </div>
      </div>

      <!-- Filter / Search Toolbar -->
      <div class="card filter-card">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search crop name, variety, farmer or mandi location..."
            class="filter-input"
          />
        </div>

        <div class="category-pills">
          <button
            *ngFor="let cat of categories"
            (click)="selectedCategory = cat"
            [class.active]="selectedCategory === cat"
            class="pill-btn">
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Alert notification -->
      <div *ngIf="actionMessage" class="action-alert shadow-md">
        <i class="fa-solid fa-circle-check"></i>
        <span>{{ actionMessage }}</span>
      </div>

      <!-- Crops Grid -->
      <div *ngIf="filteredCrops.length === 0" class="empty-crops-card card text-center p-5 mt-4" style="padding: 3.5rem 1.5rem; text-align: center; border: 1px dashed var(--border-light); background: #f8fafc; border-radius: 12px; margin-top: 1.5rem;">
        <i class="fa-solid fa-wheat-awn" style="font-size: 3rem; color: #94a3b8; margin-bottom: 0.75rem;"></i>
        <h3 style="margin: 0; color: #1e293b; font-weight: 800;">No Crops Listed Yet</h3>
        <p style="margin: 0.5rem 0 0; color: #64748b; font-size: 0.9rem;">Fresh harvest listings posted by farmers will appear here in real-time.</p>
      </div>

      <div class="grid grid-cols-3 mt-4" *ngIf="filteredCrops.length > 0">
        <div *ngFor="let crop of pagedCrops" class="card crop-card">
          <div class="crop-image-wrapper">
            <img [src]="crop.imageUrl || getDefaultImage(crop.cropName)" [alt]="crop.cropName" class="crop-img" />
            <span class="crop-badge">{{ crop.cropType }}</span>
            <span class="status-badge" [class.available]="crop.status === 'AVAILABLE'">{{ crop.status }}</span>
          </div>

          <div class="crop-body">
            <div class="crop-title-row">
              <h3 class="crop-name">{{ crop.cropName }}</h3>
              <span class="crop-price">₹{{ crop.pricePerUnit }} <small>/ {{ crop.unit }}</small></span>
            </div>
            <div class="crop-stock-badge-row mb-1">
              <span class="stock-pill">
                <i class="fa-solid fa-boxes-stacked text-emerald"></i> Available Quantity: <strong>{{ (crop.availableQuantity !== undefined ? crop.availableQuantity : crop.quantity) | number:'1.0-0' }} {{ crop.unit }}</strong>
              </span>
            </div>

            <div class="crop-details">
              <div class="detail-item">
                <i class="fa-solid fa-weight-hanging text-muted"></i>
                <span>Remaining Stock: <strong>{{ (crop.availableQuantity !== undefined ? crop.availableQuantity : crop.quantity) | number:'1.0-0' }} {{ crop.unit }}</strong></span>
              </div>
              <div class="detail-item">
                <i class="fa-solid fa-location-dot text-muted"></i>
                <span>Location: {{ crop.location }}</span>
              </div>
              <div class="detail-item">
                <i class="fa-regular fa-user text-muted"></i>
                <span>Farmer: {{ crop.farmerName || 'Verified Farmer' }}</span>
              </div>
            </div>

            <!-- APMC Benchmark tag -->
            <div class="apmc-tag" *ngIf="crop.govMspPrice">
              <i class="fa-solid fa-chart-line text-emerald"></i>
              <span>Local APMC Benchmark: ₹{{ crop.govMspPrice }}/{{ crop.unit }}</span>
            </div>

            <p class="crop-desc" *ngIf="crop.description">{{ crop.description }}</p>

            <div class="crop-actions">
              <!-- Farmer View & Edit Controls -->
              <ng-container *ngIf="user?.role === 'FARMER'">
                <!-- If crop is created by this farmer: Edit button enabled -->
                <div *ngIf="isMyCrop(crop)" class="d-flex gap-2 w-100">
                  <button class="btn btn-warning btn-sm flex-1" (click)="openEditCropModal(crop)">
                    <i class="fa-solid fa-pen-to-square"></i> Edit My Harvest Post
                  </button>
                  <button class="btn btn-outline-danger btn-sm" (click)="deleteMyCrop(crop)" title="Remove Post">
                    <i class="fa-regular fa-trash-can"></i>
                  </button>
                </div>

                <!-- If crop is created by another farmer: View Only -->
                <div *ngIf="!isMyCrop(crop)" class="w-100 text-center py-1">
                  <span class="badge badge-subtle w-100 py-2">
                    <i class="fa-solid fa-eye"></i> Other Producer's Post (View Only)
                  </span>
                </div>
              </ng-container>

              <!-- Dealer Purchase & Negotiate Controls -->
              <ng-container *ngIf="user?.role === 'DEALER'">
                <button
                  class="btn btn-primary btn-sm flex-1"
                  (click)="openBuyModal(crop)"
                  [disabled]="crop.status !== 'AVAILABLE'">
                  <i class="fa-solid fa-cart-shopping"></i> Purchase
                </button>
                <button
                  class="btn btn-secondary btn-sm flex-1"
                  (click)="openNegotiateModal(crop)"
                  *ngIf="crop.status === 'AVAILABLE'">
                  <i class="fa-solid fa-comments-dollar"></i> Negotiate
                </button>
              </ng-container>

              <!-- Guest Purchase & Negotiate Controls (Intercepted to pop up login modal) -->
              <ng-container *ngIf="!user">
                <button
                  class="btn btn-primary btn-sm flex-1"
                  (click)="onGuestAction('purchase', crop)">
                  <i class="fa-solid fa-cart-shopping"></i> Purchase
                </button>
                <button
                  class="btn btn-secondary btn-sm flex-1"
                  (click)="onGuestAction('negotiate', crop)">
                  <i class="fa-solid fa-comments-dollar"></i> Negotiate
                </button>
              </ng-container>

              <!-- Admin Moderation Controls -->
              <ng-container *ngIf="user?.role === 'ADMIN'">
                <button class="btn btn-secondary btn-sm flex-1" (click)="openEditCropModal(crop)">
                  <i class="fa-solid fa-sliders"></i> Moderate Post
                </button>
              </ng-container>

              <!-- Delivery Partner View Only -->
              <ng-container *ngIf="user?.role === 'DELIVERY_PARTNER'">
                <div class="w-100 text-center py-1">
                  <span class="badge badge-subtle w-100 py-2">
                    <i class="fa-solid fa-eye"></i> View Only (Logistics Portal)
                  </span>
                </div>
              </ng-container>
            </div>
          </div>
        </div>
      </div>

      <!-- Crop Pagination Bar -->
      <div class="crop-pagination-bar mt-4" *ngIf="totalPages > 1">
        <span class="pagination-meta">
          Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredCrops.length) }} of {{ filteredCrops.length }} crops
        </span>
        <div class="pagination-buttons">
          <button class="btn-page" [disabled]="currentPage === 1" (click)="setPage(currentPage - 1)">
            &laquo; Prev
          </button>
          <button *ngFor="let p of totalPagesArray" class="btn-page" [class.active]="p === currentPage" (click)="setPage(p)">
            {{ p }}
          </button>
          <button class="btn-page" [disabled]="currentPage === totalPages" (click)="setPage(currentPage + 1)">
            Next &raquo;
          </button>
        </div>
      </div>

      <!-- Direct Purchase & Stripe Demo Payment Modal -->
      <div *ngIf="selectedCropForBuy" class="modal-overlay">
        <div class="modal-content" [ngClass]="{'checkout-wide': checkoutStep === 'PAYMENT' || checkoutStep === 'SUCCESS'}">

          <!-- STEP 1: ORDER DETAILS & LOGISTICS -->
          <ng-container *ngIf="checkoutStep === 'DETAILS'">
            <div class="modal-header">
              <h3><i class="fa-solid fa-bag-shopping text-emerald"></i> Order Details: {{ selectedCropForBuy.cropName }}</h3>
              <button class="close-btn" (click)="selectedCropForBuy = null">&times;</button>
            </div>
            <div class="modal-body">
              <div class="order-summary-box">
                <div class="summary-row">
                  <span>Farmer:</span>
                  <strong>{{ selectedCropForBuy.farmerName || 'Verified Farmer' }}</strong>
                </div>
                <div class="summary-row">
                  <span>Unit Price:</span>
                  <strong>₹{{ selectedCropForBuy.pricePerUnit }} / {{ selectedCropForBuy.unit }}</strong>
                </div>
                <div class="summary-row">
                  <span>Available Stock:</span>
                  <span>{{ selectedCropForBuy.quantity }} {{ selectedCropForBuy.unit }}</span>
                </div>
              </div>

              <div class="form-group mt-3">
                <label class="form-label d-flex justify-content-between align-center">
                  <span>Order Quantity ({{ selectedCropForBuy.unit }})</span>
                  <span class="text-xs text-emerald font-bold">Max Available: {{ selectedCropForBuy.quantity }} {{ selectedCropForBuy.unit }}</span>
                </label>
                <input
                  type="number"
                  [(ngModel)]="orderQuantity"
                  (ngModelChange)="onOrderQuantityChange($event)"
                  [max]="selectedCropForBuy.quantity"
                  min="1"
                  class="form-control"
                  [class.is-invalid]="orderQuantity > selectedCropForBuy.quantity || orderQuantity < 1"
                />
                <div *ngIf="orderQuantity > selectedCropForBuy.quantity" class="text-danger text-xs mt-1">
                  <i class="fa-solid fa-triangle-exclamation"></i> Cannot order more than available stock ({{ selectedCropForBuy.quantity }} {{ selectedCropForBuy.unit }}).
                </div>
              </div>

              <!-- Fulfillment Method Selection -->
              <div class="form-group">
                <label class="form-label">Choose Logistics Fulfillment Method</label>
                <div class="fulfillment-selector">
                  <label class="fulfillment-option" [class.selected]="fulfillmentType === 'DELIVERY_AGENT'">
                    <input type="radio" [(ngModel)]="fulfillmentType" name="fulfillmentType" value="DELIVERY_AGENT" />
                    <i class="fa-solid fa-truck-fast"></i>
                    <div>
                      <strong>Delivery Agent Partner</strong>
                      <span>Calculated at ₹10 per km</span>
                    </div>
                  </label>

                  <label class="fulfillment-option" [class.selected]="fulfillmentType === 'SELF_PICKUP'">
                    <input type="radio" [(ngModel)]="fulfillmentType" name="fulfillmentType" value="SELF_PICKUP" />
                    <i class="fa-solid fa-tractor"></i>
                    <div>
                      <strong>Self Pickup (₹0)</strong>
                      <span>Collect directly from farm gate</span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Distance & Custom Drop Address if Delivery Agent is chosen -->
              <div *ngIf="fulfillmentType === 'DELIVERY_AGENT'" class="delivery-details-box">
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
                        placeholder="e.g. 20"
                        required
                      />
                      <span class="km-unit">km</span>
                    </div>
                  </div>

                  <div class="form-group flex-1 rate-display-group">
                    <span class="rate-calc-label">Delivery Surcharge:</span>
                    <div class="rate-calc-badge">
                      <span>₹10 / km × {{ distanceKm || 0 }} km = </span>
                      <strong>₹{{ deliveryCharge | number:'1.2-2' }}</strong>
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

              <!-- Self Pickup note -->
              <div *ngIf="fulfillmentType === 'SELF_PICKUP'" class="self-pickup-box">
                <i class="fa-solid fa-location-dot text-emerald"></i>
                <div>
                  <strong>Farm Gate Pickup Location:</strong>
                  <p>{{ selectedCropForBuy.location }}</p>
                  <span class="subtext">Zero delivery fees. You arrange your vehicle transport.</span>
                </div>
              </div>

              <!-- Price Breakdown Box with GST -->
              <div class="price-breakdown-box">
                <div class="breakdown-line">
                  <span>Crop Cost ({{ orderQuantity }} × ₹{{ selectedCropForBuy.pricePerUnit }}):</span>
                  <span>₹{{ cropSubtotal | number:'1.2-2' }}</span>
                </div>
                <div class="breakdown-line">
                  <span>Delivery Charge ({{ fulfillmentType === 'DELIVERY_AGENT' ? distanceKm + ' km @ ₹10/km' : 'Self Pickup' }}):</span>
                  <span>₹{{ deliveryCharge | number:'1.2-2' }}</span>
                </div>
                <div class="breakdown-line">
                  <span>Central GST (CGST &#64; 2.5%):</span>
                  <span>₹{{ cgstAmount | number:'1.2-2' }}</span>
                </div>
                <div class="breakdown-line">
                  <span>State GST (SGST &#64; 2.5%):</span>
                  <span>₹{{ sgstAmount | number:'1.2-2' }}</span>
                </div>
                <div class="breakdown-total">
                  <strong>Total Payable Amount:</strong>
                  <h3 class="total-price text-emerald">₹{{ totalPayable | number:'1.2-2' }}</h3>
                </div>
              </div>

              <div class="policy-note">
                <i class="fa-solid fa-circle-info"></i>
                <span>Direct farmer transaction: Funds held in secure escrow. Certified Tax invoice PDF available immediately upon payment. (Strict No-Refund Policy).</span>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="selectedCropForBuy = null">Cancel</button>
              <button class="btn btn-primary" (click)="goToPaymentStep()" [disabled]="orderQuantity < 1 || orderQuantity > selectedCropForBuy.quantity || (fulfillmentType === 'DELIVERY_AGENT' && !deliveryAddress)">
                <span>Proceed to Payment &bull; ₹{{ totalPayable | number:'1.0-0' }}</span>
                <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </ng-container>

          <!-- STEP 2: STRIPE DEMO PAYMENT SIMULATOR -->
          <ng-container *ngIf="checkoutStep === 'PAYMENT'">
            <div class="modal-header">
              <div class="d-flex align-center gap-2">
                <button class="btn-back" (click)="checkoutStep = 'DETAILS'" title="Back to Details">
                  <i class="fa-solid fa-arrow-left"></i>
                </button>
                <h3><i class="fa-solid fa-lock text-emerald"></i> Secure Payment Gateway</h3>
              </div>
              <button class="close-btn" (click)="selectedCropForBuy = null">&times;</button>
            </div>

            <div class="modal-body position-relative">
              <!-- Payment Amount Header Banner -->
              <div class="payment-amount-banner">
                <div>
                  <span class="pay-lbl">Total Amount to Pay</span>
                  <h2 class="pay-val text-emerald">₹{{ totalPayable | number:'1.2-2' }}</h2>
                </div>
                <div class="text-right">
                  <span class="badge badge-success"><i class="fa-solid fa-shield-halved"></i> Escrow Protected</span>
                  <span class="d-block text-muted text-xs mt-1">{{ orderQuantity }} {{ selectedCropForBuy.unit }} &bull; {{ selectedCropForBuy.cropName }}</span>
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
                      placeholder="e.g. apexagro@okhdfcbank"
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
                      <h3 class="text-emerald m-0">₹{{ currentWalletBalance | number:'1.2-2' }}</h3>
                    </div>
                    <span class="badge" [ngClass]="currentWalletBalance >= totalPayable ? 'badge-success' : 'badge-danger'">
                      <i class="fa-solid" [ngClass]="currentWalletBalance >= totalPayable ? 'fa-check' : 'fa-triangle-exclamation'"></i>
                      {{ currentWalletBalance >= totalPayable ? 'Sufficient Balance' : 'Insufficient Balance' }}
                    </span>
                  </div>
                  <div *ngIf="currentWalletBalance < totalPayable" class="alert alert-error mt-2">
                    <i class="fa-solid fa-triangle-exclamation me-1"></i>
                    <span>Short by ₹{{ (totalPayable - currentWalletBalance) | number:'1.2-2' }}. Insufficient funds in wallet! Order cannot be placed.</span>
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
              <button class="btn btn-primary btn-pay-now" (click)="processPayment()">
                <i class="fa-solid fa-lock"></i>
                <span>Authorize & Pay ₹{{ totalPayable | number:'1.2-2' }}</span>
              </button>
            </div>
          </ng-container>

          <!-- STEP 3: ORDER SUCCESS & INVOICE DOWNLOAD -->
          <ng-container *ngIf="checkoutStep === 'SUCCESS'">
            <div class="modal-header bg-emerald-light">
              <h3 class="text-emerald"><i class="fa-solid fa-circle-check"></i> Payment Confirmed & Order Placed!</h3>
              <button class="close-btn" (click)="closeBuyModal()">&times;</button>
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
                  <strong class="text-emerald font-lg">₹{{ completedOrder?.finalAmount | number:'1.2-2' }}</strong>
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
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary w-100" (click)="closeBuyModal()">Done & Continue Browsing</button>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- In-App Tax Invoice Preview Modal -->
      <div *ngIf="selectedInvoiceForView" class="modal-overlay">
        <div class="modal-content invoice-modal-wide shadow-2xl">
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
                <strong>₹{{ (selectedInvoiceForView.deliveryFee || 0) | number:'1.2-2' }}</strong>
              </div>
              <div class="log-item">
                <span class="badge" [ngClass]="selectedInvoiceForView.fulfillmentType === 'SELF_PICKUP' ? 'badge-success' : 'badge-primary'">
                  {{ selectedInvoiceForView.fulfillmentType === 'SELF_PICKUP' ? 'Self Pickup (₹0 Fee)' : 'Carrier Dispatched' }}
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
                    <th>Rate (₹)</th>
                    <th>Taxable Value (₹)</th>
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
                    <td>₹{{ selectedInvoiceForView.pricePerUnit | number:'1.2-2' }}</td>
                    <td><strong>₹{{ selectedInvoiceForView.totalAmount | number:'1.2-2' }}</strong></td>
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

              <div class="tax-summary-box">
                <div class="summary-line">
                  <span>Taxable Goods Subtotal:</span>
                  <span>₹{{ selectedInvoiceForView.totalAmount | number:'1.2-2' }}</span>
                </div>
                <div class="summary-line">
                  <span>Central GST (CGST &#64; 2.5%):</span>
                  <span>₹{{ selectedInvoiceForView.cgstAmount | number:'1.2-2' }}</span>
                </div>
                <div class="summary-line">
                  <span>State GST (SGST &#64; 2.5%):</span>
                  <span>₹{{ selectedInvoiceForView.sgstAmount | number:'1.2-2' }}</span>
                </div>
                <div class="summary-line" *ngIf="selectedInvoiceForView.deliveryFee">
                  <span>Logistics Transit Surcharge:</span>
                  <span>₹{{ selectedInvoiceForView.deliveryFee | number:'1.2-2' }}</span>
                </div>
                <div class="summary-grand-total">
                  <strong>Net Total Payable:</strong>
                  <strong class="text-emerald font-xl">₹{{ selectedInvoiceForView.finalAmount | number:'1.2-2' }}</strong>
                </div>
              </div>
            </div>

            <!-- Seal & Signature -->
            <div class="digital-seal-strip mt-3">
              <div class="seal-badge">
                <i class="fa-solid fa-stamp text-emerald"></i>
                <div>
                  <strong>CROPDEAL CERTIFIED DIGITAL SEAL</strong>
                  <span>Tax Paid & Escrow Verified &bull; ISO 27001</span>
                </div>
              </div>
              <div class="signature-box">
                <div class="sign-mark">CropDeal Exchange Registrar</div>
                <span>Authorized Electronic Signature</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selectedInvoiceForView = null">Close</button>
            <button class="btn btn-primary" (click)="downloadPdfFromPreview()">
              <i class="fa-solid fa-print"></i> Print / Download Invoice PDF
            </button>
          </div>
        </div>
      </div>

      <!-- Direct Negotiation Modal -->
      <div *ngIf="selectedCropForNeg" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3><i class="fa-solid fa-handshake text-emerald"></i> Propose Negotiation Offer</h3>
            <button class="close-btn" (click)="selectedCropForNeg = null">&times;</button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">
              Send a direct price proposal to farmer <strong>{{ selectedCropForNeg.farmerName || 'Farmer' }}</strong> for {{ selectedCropForNeg.cropName }}.
            </p>
            <div class="form-group">
              <label class="form-label">Original Farmer Listed Price: ₹{{ selectedCropForNeg.pricePerUnit }} / {{ selectedCropForNeg.unit }}</label>
            </div>
            <div class="form-group">
              <div class="d-flex justify-between align-center mb-1">
                <label class="form-label m-0">Your Proposed Offer Price (₹ / {{ selectedCropForNeg.unit || 'Kg' }}) *</label>
                <span class="text-xs text-muted">Must be below listed price (&lt; ₹{{ selectedCropForNeg.pricePerUnit }})</span>
              </div>
              <input
                type="number"
                [(ngModel)]="proposedPrice"
                [max]="selectedCropForNeg.pricePerUnit - 1"
                min="1"
                class="form-control"
                placeholder="Enter offer price below original price"
                required
              />
              <div *ngIf="proposedPrice && proposedPrice >= selectedCropForNeg.pricePerUnit" class="alert alert-danger p-2 mt-2 text-xs">
                <i class="fa-solid fa-triangle-exclamation"></i> Proposed negotiation price must be lower than original listed price (₹{{ selectedCropForNeg.pricePerUnit }} / {{ selectedCropForNeg.unit || 'Kg' }}).
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Available Crop Stock: <strong>{{ selectedCropForNeg.quantity !== undefined ? selectedCropForNeg.quantity : selectedCropForNeg.availableQuantity }} {{ selectedCropForNeg.unit || 'Kg' }}</strong></label>
              <span class="subtext text-muted d-block">Negotiate your proposed purchase price per unit. You will choose your order quantity during checkout after the price is agreed.</span>
            </div>
            <div class="form-group">
              <label class="form-label">Optional Note for Farmer</label>
              <textarea [(ngModel)]="negotiationNotes" class="form-control" rows="2" placeholder="e.g. Bulk purchase with immediate warehouse pickup"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selectedCropForNeg = null">Cancel</button>
            <button
              class="btn btn-primary"
              (click)="submitNegotiation()"
              [disabled]="!proposedPrice || proposedPrice <= 0 || proposedPrice >= selectedCropForNeg.pricePerUnit">
              Send Counter Offer
            </button>
          </div>
        </div>
      </div>

      <!-- Edit Crop Modal for Farmer (own crop only) -->
      <div *ngIf="selectedCropForEdit" class="modal-overlay">
        <div class="modal-content shadow-xl">
          <div class="modal-header">
            <h3><i class="fa-solid fa-pen-to-square text-emerald"></i> Edit Harvest Post: {{ selectedCropForEdit.cropName }}</h3>
            <button class="close-btn" (click)="selectedCropForEdit = null">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Crop Name *</label>
              <input type="text" [(ngModel)]="editForm.cropName" class="form-control" required />
            </div>

            <div class="grid grid-cols-2 gap-3 mt-3">
              <div class="form-group">
                <label class="form-label">Available Quantity *</label>
                <input type="number" [(ngModel)]="editForm.quantity" min="1" class="form-control" required />
              </div>

              <div class="form-group">
                <label class="form-label">Measurement Unit (Kg)</label>
                <select [(ngModel)]="editForm.unit" class="form-control">
                  <option value="Kg">Kilogram (Kg)</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 mt-3">
              <div class="form-group">
                <label class="form-label">Price Per Unit (₹) *</label>
                <input type="number" [(ngModel)]="editForm.pricePerUnit" min="1" class="form-control" required />
              </div>

              <div class="form-group">
                <label class="form-label">Listing Status</label>
                <select [(ngModel)]="editForm.status" class="form-control">
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="IN_NEGOTIATION">IN_NEGOTIATION</option>
                  <option value="SOLD">SOLD</option>
                </select>
              </div>
            </div>

            <div class="form-group mt-3">
              <label class="form-label">Mandi / Farm Location</label>
              <input type="text" [(ngModel)]="editForm.location" class="form-control" />
            </div>

            <div class="form-group mt-3">
              <label class="form-label">Harvest Quality & Description</label>
              <textarea [(ngModel)]="editForm.description" rows="2" class="form-control"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selectedCropForEdit = null">Cancel</button>
            <button class="btn btn-primary" (click)="saveCropEdit()">
              <i class="fa-solid fa-check"></i> Save Post Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .crops-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .crop-pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      padding: 0.9rem 1.5rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .pagination-meta { font-size: 0.85rem; color: #64748b; }
    .pagination-buttons { display: flex; gap: 0.35rem; }
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
      transition: all 0.15s;
    }
    .btn-page:hover:not(:disabled) { border-color: #16a34a; color: #16a34a; }
    .btn-page.active { background: #16a34a; border-color: #16a34a; color: white; }
    .btn-page:disabled { opacity: 0.4; cursor: not-allowed; }
    .my-crops-banner {
      background: url('/assets/images/sunset-banner.jpg') center/cover no-repeat,
                  linear-gradient(135deg, #14532d, #166534);
      border-radius: 0.75rem;
      overflow: hidden;
      min-height: 110px;
    }
    .my-crops-banner-overlay {
      background: linear-gradient(90deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.4) 60%, rgba(0, 0, 0, 0.2) 100%);
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 110px;
      color: white;
    }
    .my-crops-title { font-size: 1.85rem; font-weight: 800; margin: 0; color: white; }
    .my-crops-subtitle { font-size: 0.85rem; color: #cbd5e1; margin-top: 0.25rem; }
    .btn-banner-add-crop {
      background: #15803d;
      color: white;
      text-decoration: none;
      font-weight: 700;
      padding: 0.6rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: background 0.2s;
    }
    .btn-banner-add-crop:hover { background: #166534; }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title { font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
    .text-emerald { color: var(--primary-600); }
    .page-subtitle { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem; }
    .filter-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 1rem;
      padding: 1.5rem;
    }
    .search-box {
      position: relative;
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }
    .search-box i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-subtle);
    }
    .filter-input {
      width: 100%;
      padding: 0.65rem 1rem 0.65rem 2.75rem;
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      outline: none;
    }
    .filter-input:focus {
      border-color: var(--primary-500);
      box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
    }
    .category-pills {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      padding-bottom: 0.25rem;
    }
    .pill-btn {
      padding: 0.4rem 1rem;
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--transition-fast);
    }
    .pill-btn:hover {
      background: var(--primary-50);
      color: var(--primary-700);
    }
    .pill-btn.active {
      background: var(--primary-600);
      border-color: var(--primary-600);
      color: white;
    }
    .crop-card {
      padding: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      text-align: center;
      align-items: stretch;
    }
    .crop-image-wrapper {
      position: relative;
      height: 180px;
      background: #e2e8f0;
      overflow: hidden;
    }
    .crop-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .crop-card:hover .crop-img {
      transform: scale(1.05);
    }
    .crop-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(4px);
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-full);
      text-transform: uppercase;
    }
    .status-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-full);
      background: #ef4444;
      color: white;
    }
    .status-badge.available {
      background: #10b981;
    }
    .crop-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex: 1;
      text-align: center;
      align-items: center;
    }
    .crop-title-row {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 0.25rem;
      margin-bottom: 0.75rem;
      width: 100%;
    }
    .crop-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .crop-price {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary-700);
    }
    .crop-price small {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    .crop-details {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      margin-bottom: 0.85rem;
      font-size: 0.825rem;
      width: 100%;
      text-align: center;
    }
    .detail-item {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: var(--text-muted);
      text-align: center;
    }
    .apmc-tag {
      background: #f0fdf4;
      border: 1px dashed #86efac;
      padding: 0.5rem 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.75rem;
      color: #166534;
      font-weight: 600;
      margin-bottom: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 0.4rem;
      width: 100%;
    }
    .crop-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.4;
      margin-bottom: 1rem;
      text-align: center;
    }
    .crop-actions {
      display: flex;
      gap: 0.65rem;
      margin-top: auto;
      width: 100%;
      justify-content: center;
      align-items: center;
    }
    .flex-1 { flex: 1; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
    .order-summary-box {
      background: var(--bg-subtle);
      border-radius: var(--radius-md);
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.85rem;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
    }
    .total-calc-box {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 0.35rem;
      margin: 1.25rem 0;
    }
    .total-price { font-size: 1.5rem; font-weight: 800; }
    .policy-note {
      font-size: 0.75rem;
      color: #1e40af;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 0.5rem;
      line-height: 1.4;
    }
    .action-alert {
      background: var(--success-bg);
      color: var(--success);
      padding: 0.85rem 1.25rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      border: 1px solid #86efac;
    }
    .fulfillment-selector {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.35rem;
    }
    .fulfillment-option {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem;
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      background: var(--bg-subtle);
      transition: all var(--transition-fast);
    }
    .fulfillment-option input { display: none; }
    .fulfillment-option i { font-size: 1.5rem; color: var(--text-muted); }
    .fulfillment-option strong { display: block; font-size: 0.85rem; color: var(--text-main); }
    .fulfillment-option span { font-size: 0.725rem; color: var(--text-muted); }
    .fulfillment-option.selected {
      background: #f0fdf4;
      border-color: #16a34a;
      box-shadow: 0 2px 8px rgba(22, 163, 74, 0.15);
    }
    .fulfillment-option.selected i { color: #16a34a; }
    .fulfillment-option.selected strong { color: #15803d; }
    .delivery-details-box {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      margin: 0.85rem 0;
    }
    .input-km-wrapper {
      position: relative;
    }
    .input-km-wrapper .form-control {
      padding-right: 2.5rem;
    }
    .km-unit {
      position: absolute;
      right: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
    }
    .rate-display-group {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .rate-calc-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }
    .rate-calc-badge {
      background: #dcfce7;
      color: #166534;
      padding: 0.6rem 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      border: 1px solid #86efac;
    }
    .self-pickup-box {
      background: #f0fdf4;
      border: 1px dashed #86efac;
      padding: 0.85rem 1rem;
      border-radius: var(--radius-md);
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      margin: 0.85rem 0;
      font-size: 0.85rem;
    }
    .self-pickup-box p { margin: 0.15rem 0; font-weight: 600; color: var(--text-main); }
    .price-breakdown-box {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: var(--radius-md);
      padding: 1rem;
      margin: 1rem 0;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.85rem;
    }
    .breakdown-line {
      display: flex;
      justify-content: space-between;
      color: var(--text-muted);
    }
    .breakdown-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #86efac;
      padding-top: 0.6rem;
      margin-top: 0.25rem;
    }
    .modal-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    /* Checkout & Stripe Simulator Styles */
    .checkout-wide { max-width: 680px; width: 95%; }
    .invoice-modal-wide { max-width: 900px; width: 95%; max-height: 90vh; overflow-y: auto; }
    .btn-back { background: none; border: none; font-size: 1.1rem; color: var(--text-muted); cursor: pointer; padding: 0.25rem 0.5rem; }
    .btn-back:hover { color: var(--primary-700); }
    .payment-amount-banner { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: var(--radius-md); padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; }
    .pay-lbl { font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); }
    .pay-val { font-size: 1.75rem; font-weight: 800; margin: 0.15rem 0 0; }
    .payment-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
    .pay-tab-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.75rem 0.5rem; border: 1.5px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-subtle); cursor: pointer; font-size: 0.75rem; font-weight: 700; transition: all 0.2s; }
    .pay-tab-btn.active { background: white; border-color: var(--primary-600); box-shadow: 0 2px 8px rgba(22, 163, 74, 0.15); color: var(--primary-800); }
    .pay-tab-btn i { font-size: 1.25rem; }
    .stripe-demo-badge { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.8rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
    .autofill-btn { background: #2563eb; color: white; border: none; padding: 0.35rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; }
    .autofill-btn:hover { background: #1d4ed8; }
    .card-number-wrapper { position: relative; display: flex; align-items: center; }
    .card-number-wrapper .card-icon { position: absolute; left: 0.85rem; color: var(--text-muted); }
    .card-number-wrapper .card-input { padding-left: 2.5rem; padding-right: 3.5rem; font-family: monospace; letter-spacing: 1px; font-size: 0.95rem; font-weight: 600; }
    .card-badge-test { position: absolute; right: 0.85rem; background: #e2e8f0; color: #475569; font-size: 0.65rem; font-weight: 800; padding: 0.15rem 0.4rem; border-radius: 4px; }
    .card-brand-icons { display: flex; gap: 0.35rem; font-size: 1.1rem; }
    .stripe-footer-note { font-size: 0.725rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem; justify-content: center; }
    .btn-preset { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.5rem; cursor: pointer; color: #334155; }
    .btn-preset:hover { background: #e2e8f0; }
    .address-presets { display: flex; gap: 0.35rem; }
    .processing-overlay { background: rgba(255,255,255,0.95); position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; border-radius: var(--radius-lg); text-align: center; padding: 2rem; }
    .processing-status { font-size: 0.875rem; color: var(--primary-700); font-weight: 600; margin-top: 0.5rem; }
    .spinner-border { width: 3rem; height: 3rem; border: 4px solid #dcfce7; border-top-color: #16a34a; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .order-receipt-card { background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem; }
    .receipt-row { display: flex; justify-content: space-between; align-items: center; }
    .receipt-row.total-row { border-top: 1.5px dashed #86efac; padding-top: 0.75rem; margin-top: 0.25rem; font-size: 1rem; }
    .success-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }
    .btn-pay-now { background: linear-gradient(135deg, #16a34a, #15803d); font-weight: 800; font-size: 0.95rem; }
    .upi-box { display: flex; align-items: center; gap: 1.5rem; background: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md); }
    .upi-left { flex: 1; }
    .upi-divider { font-weight: 800; color: var(--text-muted); font-size: 0.8rem; }
    .upi-qr-preview { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; }
    .qr-mock { width: 80px; height: 80px; background: white; border: 2px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: var(--primary-700); border-radius: var(--radius-sm); }
    .bank-panel, .wallet-panel { background: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md); }
    .wallet-balance-box { background: white; padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); }
    .position-relative { position: relative; }
    .text-xs { font-size: 0.75rem; }
    .font-lg { font-size: 1.15rem; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .text-purple { color: #9333ea; }
    .text-info { color: #0284c7; }
    .text-danger { color: #dc2626; }
    .text-primary { color: #2563eb; }

    /* In-App Tax Invoice CSS */
    .invoice-meta-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1rem; border-bottom: 2px solid var(--border-color); }
    .brand-meta h2 { font-size: 1.35rem; font-weight: 800; }
    .invoice-number-box { text-align: right; }
    .inv-badge { background: #dcfce7; color: #166534; font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); letter-spacing: 0.5px; display: inline-block; margin-bottom: 0.2rem; }
    .inv-date, .inv-order { font-size: 0.75rem; color: var(--text-muted); display: block; }
    .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .party-info-card { border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; background: var(--bg-surface); }
    .party-card-title { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.4rem; }
    .party-name { font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.35rem; }
    .party-detail { font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0; }
    .id-row { display: flex; gap: 0.35rem; flex-wrap: wrap; }
    .id-tag { font-size: 0.7rem; background: var(--bg-subtle); padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); color: var(--text-main); font-weight: 600; }
    .logistics-strip { background: #f0fdf4; border: 1px dashed #86efac; border-radius: var(--radius-md); padding: 0.75rem 1.25rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.825rem; }
    .log-lbl { font-size: 0.75rem; color: var(--text-muted); margin-right: 0.35rem; }
    .invoice-table-wrapper { border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden; }
    .invoice-table { margin: 0; }
    .invoice-table th { background: #f8fafc; font-size: 0.75rem; padding: 0.75rem; }
    .invoice-table td { padding: 0.75rem; font-size: 0.825rem; text-align: center; }
    .hsn-pill { background: #e2e8f0; padding: 0.15rem 0.45rem; border-radius: 4px; font-family: monospace; font-size: 0.75rem; }
    .totals-breakdown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .payment-meta-box { background: var(--bg-subtle); border-radius: var(--radius-md); padding: 1rem; display: flex; flex-direction: column; justify-content: center; }
    .escrow-cert { display: flex; gap: 0.65rem; align-items: center; font-size: 0.825rem; }
    .payment-details-line { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.75rem; color: var(--text-muted); }
    .tax-summary-box { border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.825rem; }
    .summary-line { display: flex; justify-content: space-between; color: var(--text-muted); }
    .summary-grand-total { display: flex; justify-content: space-between; align-items: center; border-top: 1.5px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.35rem; }
    .font-xl { font-size: 1.25rem; font-weight: 800; }
    .digital-seal-strip { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-light); padding-top: 1rem; }
    .seal-badge { display: flex; align-items: center; gap: 0.65rem; border: 1.5px dashed #86efac; background: #f0fdf4; padding: 0.5rem 1rem; border-radius: var(--radius-md); font-size: 0.75rem; color: #166534; }
    .signature-box { text-align: right; }
    .sign-mark { font-family: cursive; font-size: 1.05rem; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.2rem; }
    .signature-box span { font-size: 0.7rem; color: var(--text-muted); }
  `]
})
export class CropListComponent implements OnInit {
  crops: Crop[] = [];
  categories = ['All', 'Grains', 'Pulses', 'Oilseeds', 'Spices', 'Vegetables'];
  selectedCategory = 'All';
  searchQuery = '';
  user: User | null = null;
  actionMessage = '';

  // Buy Modal & Checkout State
  selectedCropForBuy: Crop | null = null;
  orderQuantity = 10;
  deliveryAddress = '';
  fulfillmentType: 'SELF_PICKUP' | 'DELIVERY_AGENT' = 'DELIVERY_AGENT';
  distanceKm = 20;
  submittingOrder = false;

  checkoutStep: 'DETAILS' | 'PAYMENT' | 'SUCCESS' = 'DETAILS';
  paymentMethod: 'STRIPE_CARD' | 'UPI' | 'NET_BANKING' | 'WALLET' = 'STRIPE_CARD';

  // Stripe Demo Card Form
  stripeCard = {
    cardholderName: 'Apex Agro Mills Ltd',
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/28',
    cvc: '123',
    postalCode: '110001'
  };

  // Alternative Payment Methods
  upiId = 'dealer@okaxis';
  selectedBank = 'State Bank of India';

  // Processing Animation State
  processingPayment = false;
  paymentProgressMessage = '';

  // Completed Trade Records
  completedOrder: any = null;
  completedInvoice: Invoice | null = null;
  selectedInvoiceForView: Invoice | null = null;

  get cropSubtotal(): number {
    return this.selectedCropForBuy ? (this.orderQuantity * this.selectedCropForBuy.pricePerUnit) : 0;
  }

  get deliveryCharge(): number {
    return this.fulfillmentType === 'DELIVERY_AGENT' ? (this.distanceKm || 0) * 10 : 0;
  }

  get cgstAmount(): number {
    return Math.round(this.cropSubtotal * 0.025);
  }

  get sgstAmount(): number {
    return Math.round(this.cropSubtotal * 0.025);
  }

  get totalPayable(): number {
    return this.cropSubtotal + this.deliveryCharge + this.cgstAmount + this.sgstAmount;
  }

  // Negotiation Modal
  selectedCropForNeg: Crop | null = null;
  proposedPrice = 0;
  negotiationQty = 10;
  negotiationNotes = '';

  // Edit Crop Modal for Farmer (own post only)
  selectedCropForEdit: Crop | null = null;
  editForm: Partial<Crop> = {
    cropName: '',
    pricePerUnit: 0,
    quantity: 0,
    unit: 'Kg',
    location: '',
    description: '',
    status: 'AVAILABLE'
  };

  isMyCropsOnly = false;
  currentWalletBalance = 0;

  constructor(
    private cropService: CropService,
    private orderService: OrderService,
    private negotiationService: NegotiationService,
    private deliveryService: DeliveryService,
    private authService: AuthService,
    private invoiceService: InvoiceService,
    private walletService: WalletService,
    public authModalService: AuthModalService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  onGuestAction(action: 'purchase' | 'negotiate', crop: Crop): void {
    const verb = action === 'purchase' ? 'purchase' : 'negotiate price for';
    this.authModalService.open(`Authentication Required: Please sign in or quick-login to ${verb} ${crop.cropName}.`);
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((u: User | null) => {
      this.user = u;
      if (u) {
        const uid = String(u.id || u.userId || 'dealer-1');
        this.currentWalletBalance = this.walletService.getStoredBalance(uid);
      }
    });
    this.walletService.balance$.subscribe(bal => {
      this.currentWalletBalance = bal;
    });
    this.route.queryParams.subscribe(params => {
      this.isMyCropsOnly = params['my'] === 'true';
    });
    this.loadCrops();
  }

  loadCrops(): void {
    this.cropService.crops$.subscribe({
      next: (data) => {
        this.crops = data || [];
      }
    });

    this.cropService.getAllCrops().subscribe({
      next: (data) => {
        this.crops = data || [];
      },
      error: () => {
        this.crops = [];
      }
    });
  }

  get filteredCrops(): Crop[] {
    const deletedIds = this.cropService.getDeletedCropIds();
    return this.crops.filter(c => {
      const cId = String(c.id || c.cropId || '');
      if (deletedIds.has(cId)) return false;
      // Hide blocked crops for all normal marketplace viewers
      if (this.user?.role !== 'ADMIN' && c.status === 'BLOCKED') {
        return false;
      }
      // If My Crops mode is active for FARMER, only show their own crops
      if (this.isMyCropsOnly && this.user?.role === 'FARMER' && !this.isMyCrop(c)) {
        return false;
      }
      const matchCat = this.selectedCategory === 'All' || (c.cropType || '').toLowerCase() === this.selectedCategory.toLowerCase();
      const matchQuery = !this.searchQuery.trim() ||
        (c.cropName || '').toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (c.location || '').toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (c.farmerName && c.farmerName.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }

  currentPage = 1;
  pageSize = 6;
  Math = Math;

  get totalPages(): number {
    return Math.ceil(this.filteredCrops.length / this.pageSize) || 1;
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedCrops(): Crop[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCrops.slice(start, start + this.pageSize);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }
  }

  getDefaultImage(name: string): string {
    return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=60';
  }

  openBuyModal(crop: Crop): void {
    if (!this.user) {
      this.onGuestAction('purchase', crop);
      return;
    }
    if (this.user.role !== 'DEALER') {
      alert('⚠️ Only registered commercial dealers can purchase crops. Other users can view crop details.');
      return;
    }
    this.selectedCropForBuy = crop;
    const maxStock = crop.quantity !== undefined ? crop.quantity : (crop.availableQuantity || 0);
    this.orderQuantity = Math.max(1, Math.min(10, maxStock));
    this.fulfillmentType = 'DELIVERY_AGENT';
    this.distanceKm = 20;
    this.deliveryAddress = this.user?.address || 'Commercial Mandi Terminal Shed 4, New Delhi';
    this.checkoutStep = 'DETAILS';
    this.paymentMethod = 'STRIPE_CARD';
    this.processingPayment = false;
    this.paymentProgressMessage = '';
    this.completedOrder = null;
    this.completedInvoice = null;
    this.selectedInvoiceForView = null;
    this.autoFillStripeCard();
  }

  onOrderQuantityChange(val: any): void {
    if (!this.selectedCropForBuy) return;
    const maxStock = this.selectedCropForBuy.quantity !== undefined ? this.selectedCropForBuy.quantity : (this.selectedCropForBuy.availableQuantity || 0);
    let num = Number(val);
    if (isNaN(num) || num < 1) num = 1;
    if (num > maxStock) num = maxStock;
    this.orderQuantity = num;
  }

  setCustomAddressPreset(type: 'profile' | 'warehouse' | 'port'): void {
    if (type === 'profile') {
      this.deliveryAddress = this.user?.address || 'Commercial APMC Mandi Warehouse, Platform 4, New Delhi';
    } else if (type === 'warehouse') {
      this.deliveryAddress = 'North Regional Agro Logistics Park, Sector 18, Gurugram, Haryana';
    } else if (type === 'port') {
      this.deliveryAddress = 'Export Cold-Storage Hub, Nhava Sheva Terminal, Navi Mumbai';
    }
  }

  goToPaymentStep(): void {
    if (!this.selectedCropForBuy) return;
    const maxStock = this.selectedCropForBuy.quantity !== undefined ? this.selectedCropForBuy.quantity : (this.selectedCropForBuy.availableQuantity || 0);
    if (this.orderQuantity < 1) {
      alert('Please specify a valid quantity of at least 1 unit.');
      return;
    }
    if (this.orderQuantity > maxStock) {
      alert(`Cannot order more than available stock (${maxStock} ${this.selectedCropForBuy.unit || 'Kg'}).`);
      this.orderQuantity = maxStock;
      return;
    }
    if (this.fulfillmentType === 'DELIVERY_AGENT' && !this.deliveryAddress.trim()) {
      alert('Please provide a destination delivery drop address.');
      return;
    }
    this.checkoutStep = 'PAYMENT';
  }

  autoFillStripeCard(): void {
    this.stripeCard = {
      cardholderName: this.user?.fullName || this.user?.username || 'Apex Agro Mills Ltd',
      cardNumber: '4242 4242 4242 4242',
      expiry: '12/28',
      cvc: '123',
      postalCode: '110001'
    };
  }

  processPayment(): void {
    if (!this.selectedCropForBuy || !this.user) return;
    const uid = String(this.user.id || this.user.userId || 'dealer-1');

    if (this.paymentMethod === 'WALLET') {
      const available = this.walletService.getStoredBalance(uid);
      if (available < this.totalPayable) {
        alert(`❌ Insufficient Wallet Balance!\n\nRequired: ₹${this.totalPayable.toLocaleString()}\nAvailable in Wallet: ₹${available.toLocaleString()}\n\nOrder cannot be placed. Please recharge your wallet or choose another payment method.`);
        return;
      }

      this.processingPayment = true;
      this.paymentProgressMessage = 'Verifying and reserving wallet escrow balance...';
      setTimeout(() => {
        this.walletService.debitWallet(
          uid,
          this.totalPayable,
          `Payment for Order #${this.selectedCropForBuy?.cropName} (${this.orderQuantity} Kg)`
        ).subscribe({
          next: (res) => {
            if (!res.success) {
              this.processingPayment = false;
              alert(res.message);
              return;
            }
            this.paymentProgressMessage = 'Escrow funds debited! Finalizing order...';
            setTimeout(() => {
              this.finalizeOrderPlacement();
            }, 600);
          },
          error: () => {
            this.finalizeOrderPlacement();
          }
        });
      }, 700);
      return;
    }

    this.processingPayment = true;
    if (this.paymentMethod === 'STRIPE_CARD') {
      this.paymentProgressMessage = 'Connecting to Stripe Gateway API (Test Mode)...';
      setTimeout(() => {
        this.paymentProgressMessage = 'Simulating 3D Secure 2.0 Cardholder Authorization...';
        setTimeout(() => {
          this.paymentProgressMessage = 'Payment Authorized! Securing Escrow Funds...';
          setTimeout(() => {
            this.finalizeOrderPlacement();
          }, 700);
        }, 800);
      }, 800);
    } else {
      this.paymentProgressMessage = 'Processing secure institutional escrow transaction...';
      setTimeout(() => {
        this.finalizeOrderPlacement();
      }, 1100);
    }
  }

  confirmOrder(): void {
    this.processPayment();
  }

  private finalizeOrderPlacement(): void {
    const crop = this.selectedCropForBuy!;
    const cropName = crop.cropName;
    const cropUnit = crop.unit || 'Kg';
    const deliveryFee = this.deliveryCharge;
    const finalTotal = this.totalPayable;
    const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    const txnId = this.paymentMethod === 'STRIPE_CARD'
      ? 'ch_3N' + Math.random().toString(36).substring(2, 10).toUpperCase() + 'Demo'
      : 'txn_' + Math.random().toString(36).substring(2, 10);

    const paymentMethodLabel = this.paymentMethod === 'STRIPE_CARD'
      ? 'Stripe Demo Card (Ending 4242)'
      : (this.paymentMethod === 'UPI' ? 'UPI / QR (' + this.upiId + ')' : (this.paymentMethod === 'WALLET' ? 'CropDeal Escrow Wallet' : 'Net Banking (' + this.selectedBank + ')'));

    const effectiveDropAddress = this.fulfillmentType === 'DELIVERY_AGENT'
      ? (this.deliveryAddress || 'Commercial Mandi Warehouse, New Delhi')
      : crop.location;

    // Order payload
    const orderReq: any = {
      id: orderId,
      cropId: crop.id || crop.cropId || 'crop-101',
      dealerId: this.user?.id || this.user?.userId || 'dealer-1',
      farmerId: crop.farmerId || 'farmer-1',
      dealerName: this.user?.fullName || this.user?.username || 'Apex Agro Mills Ltd',
      dealerPhone: this.user?.phone || '+91 98722 55667',
      farmerName: crop.farmerName || 'Sardar Gurpreet Singh',
      farmerPhone: '+91 98140 11223',
      cropName: cropName,
      quantity: this.orderQuantity,
      unit: cropUnit,
      pricePerUnit: crop.pricePerUnit,
      totalPrice: this.cropSubtotal,
      taxAmount: this.cgstAmount + this.sgstAmount,
      finalAmount: finalTotal,
      deliveryFee: deliveryFee,
      distanceKm: this.fulfillmentType === 'DELIVERY_AGENT' ? this.distanceKm : 0,
      fulfillmentType: this.fulfillmentType,
      deliveryAddress: effectiveDropAddress,
      paymentMethod: paymentMethodLabel,
      transactionId: txnId,
      status: 'PAID',
      createdAt: new Date().toISOString()
    };

    // Invoice structure per Rule 46 of CGST Rules
    const inv: Invoice = {
      id: 'inv-' + orderId,
      invoiceNumber: 'CD-INV-2026-' + orderId.replace('ORD-', ''),
      orderId: orderId,
      dealerId: this.user?.id || this.user?.userId || 'dealer-1',
      dealerName: this.user?.fullName || this.user?.username || 'Apex Agro Mills Ltd',
      dealerPhone: this.user?.phone || '+91 98722 55667',
      dealerAddress: effectiveDropAddress,
      dealerGstin: '07AABCC8901Z1Z8',
      farmerId: crop.farmerId || 'farmer-1',
      farmerName: crop.farmerName || 'Sardar Gurpreet Singh',
      farmerPhone: '+91 98140 11223',
      farmerAddress: crop.location,
      farmerPan: 'AABPG7812F',
      cropName: cropName,
      cropVariety: crop.cropType || 'Grade-A Certified Harvest',
      hsnCode: crop.cropName?.toLowerCase().includes('rice') ? '1006' :
               (crop.cropName?.toLowerCase().includes('mustard') ? '1207' :
               (crop.cropName?.toLowerCase().includes('onion') || crop.cropName?.toLowerCase().includes('tomato') ? '0703' : '1001')),
      quantity: this.orderQuantity,
      unit: cropUnit,
      pricePerUnit: crop.pricePerUnit,
      govMspPrice: crop.govMspPrice || Math.round(crop.pricePerUnit * 0.92),
      totalAmount: this.cropSubtotal,
      cgstAmount: this.cgstAmount,
      sgstAmount: this.sgstAmount,
      taxAmount: this.cgstAmount + this.sgstAmount,
      fulfillmentType: this.fulfillmentType,
      deliveryFee: deliveryFee,
      deliveryDistanceKm: this.fulfillmentType === 'DELIVERY_AGENT' ? this.distanceKm : 0,
      deliveryAddress: effectiveDropAddress,
      finalAmount: finalTotal,
      paymentMethod: paymentMethodLabel,
      transactionId: txnId,
      status: 'PAID',
      issuedAt: new Date().toISOString()
    };

    this.completedOrder = orderReq;
    this.completedInvoice = inv;

    // Credit Farmer's Digital Wallet for crop purchase proceeds
    const farmerTargetId = String(crop.farmerId || 'farmer-1');
    const farmerProceeds = this.cropSubtotal;
    this.walletService.creditWallet(
      farmerTargetId,
      farmerProceeds,
      `Crop Sale Proceeds for ${cropName} (${this.orderQuantity} ${cropUnit}) - Order #${orderId}`
    ).subscribe();

    // Deduct stock: if full stocks are purchased, post is deleted automatically. If partial, available stock is updated.
    const cropPostId = String(crop.id || crop.cropId || '');
    const currentStock = crop.quantity !== undefined ? crop.quantity : (crop.availableQuantity || 0);
    const remainingStock = Math.max(0, currentStock - this.orderQuantity);
    if (remainingStock <= 0) {
      crop.quantity = 0;
      crop.availableQuantity = 0;
      if (cropPostId) {
        this.cropService.deleteCrop(cropPostId).subscribe();
      }
      this.crops = this.crops.filter(c => c.id !== crop.id && c.cropId !== crop.cropId && c.cropName?.toLowerCase() !== cropName?.toLowerCase());
    } else {
      crop.quantity = remainingStock;
      crop.availableQuantity = remainingStock;
      this.crops = this.crops.map(c => (c.id === crop.id || c.cropId === crop.cropId || c.cropName?.toLowerCase() === cropName?.toLowerCase()) ? { ...c, quantity: remainingStock, availableQuantity: remainingStock } : c);
      if (cropPostId) {
        this.cropService.reduceQuantity(cropPostId, this.orderQuantity).subscribe();
        this.cropService.updateCrop(cropPostId, { quantity: remainingStock, availableQuantity: remainingStock } as any).subscribe();
      }
    }

    // Dispatch delivery if delivery agent chosen
    if (this.fulfillmentType === 'DELIVERY_AGENT') {
      this.deliveryService.createDelivery({
        orderId: orderId,
        dealerId: this.user?.id || this.user?.userId || 'dealer-1',
        farmerId: crop.farmerId || 'farmer-1',
        cropName: cropName,
        cropQuantity: this.orderQuantity,
        cropUnit: cropUnit,
        farmerName: crop.farmerName || 'Sardar Gurpreet Singh',
        farmerPhone: '+91 98140 11223',
        pickupAddress: crop.location,
        dealerName: this.user?.fullName || this.user?.username || 'Apex Agro Mills Ltd',
        dealerPhone: this.user?.phone || '+91 98722 55667',
        dropAddress: effectiveDropAddress,
        distanceKm: this.distanceKm,
        deliveryFee: deliveryFee,
        fulfillmentType: 'DELIVERY_AGENT',
        status: 'PENDING_ASSIGNMENT'
      }).subscribe();
    }

    // Persist order in OrderService
    this.orderService.createOrder(orderReq).subscribe({
      next: () => {
        this.processingPayment = false;
        this.checkoutStep = 'SUCCESS';
      },
      error: () => {
        this.processingPayment = false;
        this.checkoutStep = 'SUCCESS';
      }
    });

    // Send real-time in-app notifications to Dealer and Farmer
    const dealerId = this.user?.id || this.user?.userId || 'dealer-1';
    const farmerId = crop.farmerId || 'farmer-1';
    const dealerName = this.user?.fullName || this.user?.username || 'Apex Agro Mills Ltd';
    const farmerName = crop.farmerName || 'Sardar Gurpreet Singh';

    this.notificationService.sendNotification(
      dealerId,
      '📦 Order Confirmed & Paid',
      `Your order #${orderId} for ${cropName} (${this.orderQuantity} ${cropUnit}) has been confirmed and paid. Total: ₹${finalTotal.toLocaleString()}.`,
      'ORDER'
    );
    this.notificationService.sendNotification(
      farmerId,
      '🎉 New Order Received',
      `Dealer ${dealerName} placed an order #${orderId} for ${cropName} (${this.orderQuantity} ${cropUnit}). Total: ₹${finalTotal.toLocaleString()}.`,
      'ORDER'
    );
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
    this.selectedCropForBuy = null;
    this.router.navigate(['/deliveries']);
  }

  closeBuyModal(): void {
    this.selectedCropForBuy = null;
    this.completedOrder = null;
    this.completedInvoice = null;
    this.selectedInvoiceForView = null;
    this.actionMessage = 'Order confirmed and registered! Check Orders and Deliveries for live status tracking.';
    setTimeout(() => this.actionMessage = '', 6000);
  }

  openNegotiateModal(crop: Crop): void {
    if (!this.user) {
      this.onGuestAction('negotiate', crop);
      return;
    }
    if (this.user.role !== 'DEALER') {
      alert('⚠️ Only registered commercial dealers can negotiate prices. Other users can view crop details.');
      return;
    }
    this.selectedCropForNeg = crop;
    this.proposedPrice = Math.round(crop.pricePerUnit * 0.95);
    this.negotiationQty = Math.min(10, crop.quantity);
    this.negotiationNotes = '';
  }

  submitNegotiation(): void {
    if (!this.selectedCropForNeg || !this.user) return;
    const crop = this.selectedCropForNeg;
    if (!this.proposedPrice || this.proposedPrice <= 0) {
      alert('Please enter a valid proposed offer price.');
      return;
    }
    if (this.proposedPrice >= crop.pricePerUnit) {
      alert(`Proposed negotiation price (₹${this.proposedPrice}) must be lower than original listed price of ₹${crop.pricePerUnit}/${crop.unit || 'Kg'}.`);
      return;
    }
    const dealerId = this.user.id || this.user.userId || 'dealer-1';
    const farmerId = crop.farmerId || 'farmer-1';
    const dealerName = this.user.fullName || this.user.username || 'Apex Agro Mills Ltd';
    const farmerName = crop.farmerName || 'Sardar Gurpreet Singh';

    // Persist new negotiation into localStorage for dynamic table display
    const newNeg: any = {
      id: Date.now(),
      cropId: String(crop.id || crop.cropId || ''),
      cropName: crop.cropName,
      grade: crop.cropType || 'Grade A',
      quantity: `${crop.quantity !== undefined ? crop.quantity : (crop.availableQuantity || 100)} ${crop.unit || 'Kg'}`,
      availableStock: crop.quantity !== undefined ? crop.quantity : (crop.availableQuantity || 100),
      img: crop.imageUrl || this.getCropImage(crop.cropName),
      dealerName: dealerName,
      dealerLocation: this.user.address || 'Commercial Grain Terminal, Delhi',
      dealerPhone: this.user.phone || '+91 98722 55667',
      farmerName: farmerName,
      farmerId: farmerId,
      dealerId: dealerId,
      standardPrice: crop.pricePerUnit,
      expectedCounter: this.proposedPrice,
      expectedParty: 'Dealer',
      currentCounter: this.proposedPrice,
      currentParty: 'Dealer',
      status: 'COUNTERED',
      statusText: 'Dealer Countered'
    };

    let storedNegs: any[] = [];
    try {
      const raw = localStorage.getItem('cropdeal_negotiations');
      if (raw) storedNegs = JSON.parse(raw);
    } catch {}
    storedNegs = [newNeg, ...storedNegs];
    localStorage.setItem('cropdeal_negotiations', JSON.stringify(storedNegs));

    // Send notifications to both Dealer and Farmer
    this.notificationService.sendNotification(
      farmerId,
      '💬 New Price Proposal',
      `Dealer ${dealerName} proposed ₹${this.proposedPrice}/unit for ${crop.cropName} (Listed: ₹${crop.pricePerUnit}/${crop.unit || 'Kg'}).`,
      'NEGOTIATION'
    );
    this.notificationService.sendNotification(
      dealerId,
      '💬 Proposal Sent',
      `Your price proposal of ₹${this.proposedPrice}/unit for ${crop.cropName} was sent to ${farmerName}.`,
      'NEGOTIATION'
    );

    this.negotiationService.createNegotiation({
      cropId: this.selectedCropForNeg.id || 'crop-101',
      dealerId: dealerId,
      farmerId: farmerId,
      quantity: crop.quantity !== undefined ? crop.quantity : (crop.availableQuantity || 100),
      offeredPrice: this.proposedPrice,
      notes: this.negotiationNotes
    }).subscribe({
      next: () => {
        this.selectedCropForNeg = null;
        this.actionMessage = `Negotiation proposal sent directly to farmer for ₹${this.proposedPrice}/unit.`;
        setTimeout(() => this.actionMessage = '', 5000);
      },
      error: () => {
        this.selectedCropForNeg = null;
        this.actionMessage = `Offer of ₹${this.proposedPrice} sent! Check "Negotiations" for farmer response.`;
        setTimeout(() => this.actionMessage = '', 5000);
      }
    });
  }

  isMyCrop(crop: Crop): boolean {
    if (!this.user || this.user.role !== 'FARMER') return false;
    const currentName = (this.user.fullName || this.user.username || '').toLowerCase().trim();
    const cropFarmer = (crop.farmerName || '').toLowerCase().trim();
    const currentId = String(this.user.id || this.user.userId || '').trim();
    const cropFarmerId = String(crop.farmerId || '').trim();

    if (currentId && cropFarmerId && currentId === cropFarmerId) {
      return true;
    }
    if (currentName && cropFarmer && currentName === cropFarmer) {
      return true;
    }
    return false;
  }

  openEditCropModal(crop: Crop): void {
    if (this.user?.role === 'FARMER' && !this.isMyCrop(crop)) {
      alert('You can only edit your own harvest posts. You can view all other farmer posts in the marketplace.');
      return;
    }
    this.selectedCropForEdit = crop;
    this.editForm = {
      cropName: crop.cropName,
      pricePerUnit: crop.pricePerUnit,
      quantity: crop.quantity,
      unit: crop.unit || 'Kg',
      location: crop.location,
      description: crop.description,
      status: crop.status || 'AVAILABLE'
    };
  }

  saveCropEdit(): void {
    if (!this.selectedCropForEdit) return;
    const cropId = this.selectedCropForEdit.id || this.selectedCropForEdit.cropId || '';
    const updatedData: Partial<Crop> = {
      ...this.selectedCropForEdit,
      ...this.editForm
    };

    // Update in local state
    const index = this.crops.findIndex(c => (c.id && c.id === cropId) || (c.cropId && c.cropId === cropId));
    if (index !== -1) {
      this.crops[index] = { ...this.crops[index], ...this.editForm };
    }

    this.cropService.updateCrop(cropId, updatedData).subscribe({
      next: () => {},
      error: () => {}
    });

    this.actionMessage = `Harvest post for "${this.editForm.cropName}" updated successfully!`;
    this.selectedCropForEdit = null;
    setTimeout(() => this.actionMessage = '', 5000);
  }

  deleteMyCrop(crop: Crop): void {
    if (!this.isMyCrop(crop) && this.user?.role !== 'ADMIN') {
      alert('You can only remove your own harvest posts.');
      return;
    }
    if (!confirm(`Are you sure you want to remove your post for "${crop.cropName}"?`)) return;

    const cropId = crop.id || crop.cropId || '';
    this.crops = this.crops.filter(c => (c.id && c.id !== cropId) || (c.cropId && c.cropId !== cropId));
    this.cropService.deleteCrop(cropId).subscribe({
      next: () => {},
      error: () => {}
    });
    this.actionMessage = `Harvest post "${crop.cropName}" removed from marketplace.`;
    setTimeout(() => this.actionMessage = '', 4000);
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

  onThumbError(event: any): void {
    event.target.src = '/assets/images/crop-rice.jpg';
  }
}
