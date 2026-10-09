import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { ReviewService, FarmerReview } from '../../core/services/review.service';
import { OrderService } from '../../core/services/order.service';
import { WalletService } from '../../core/services/wallet.service';
import { NotificationService } from '../../core/services/notification.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { NegotiationService } from '../../core/services/negotiation.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { PaymentService } from '../../core/services/payment.service';
import { CropService } from '../../core/services/crop.service';
import { Crop } from '../../core/models/crop.model';
import { Invoice } from '../../core/models/invoice.model';
import { User } from '../../core/models/user.model';
import { AuthModalComponent } from '../../shared/components/auth-modal.component';
import { INDIAN_STATES, getDistrictsForState, matchesPlace } from '../../core/utils/india-locations.util';

export interface CropCard {
  id: string;
  name: string;
  category: string;
  grade: 'Grade A' | 'Grade B';
  image: string;
  pricePerKg: number;
  govMspPrice?: number;
  state: string;
  district?: string;
  rawLocation?: string;
  availableQuantity: number;
  unit: string;
  farmerName?: string;
  farmerId?: string;
  farmerPhone?: string;
  description?: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AuthModalComponent],
  template: `
    <div class="landing-page">
      <!-- Panoramic Hero Section -->
      <section class="hero-section">
        <div class="hero-bg-overlay">
          <div class="hero-content">
            <h1 class="hero-title">
              Connecting Farmers<br>
              <span class="hero-title-accent">with Better Opportunities</span>
            </h1>
            <p class="hero-subtitle">
              CropDeal is an agricultural electronic marketplace that connects verified farmers and commercial dealers with guaranteed escrow security and transparent APMC mandi benchmarks.
            </p>
          </div>
        </div>
      </section>

      <!-- Action Toast Notification Banner -->
      <div *ngIf="actionMessage" class="action-alert shadow-md mt-3">
        <i class="fa-solid fa-circle-check"></i>
        <span>{{ actionMessage }}</span>
      </div>

      <!-- State & District Harvest Search Bar Section -->
      <section class="location-search-container">
        <div class="search-bar-card shadow-sm">
          <div class="search-bar-title-wrap">
            <div class="search-title-main">
              <i class="fa-solid fa-location-crosshairs text-emerald"></i>
              <span>Find Crops by State & District</span>
            </div>
            <span class="search-title-sub">Explore fresh harvest listings across Indian states & APMC mandi hubs</span>
          </div>

          <div class="search-bar-grid">
            <!-- 1. State Selector -->
            <div class="search-field">
              <label class="search-field-label">
                <i class="fa-solid fa-map-location-dot text-emerald"></i> State
              </label>
              <select
                [(ngModel)]="selectedSearchState"
                (change)="onSearchStateChange()"
                class="search-select">
                <option value="All States">All States of India</option>
                <option *ngFor="let st of allIndianStates" [value]="st">{{ st }}</option>
              </select>
            </div>

            <!-- 2. District Selector (Cascading strictly for selected state) -->
            <div class="search-field">
              <label class="search-field-label">
                <i class="fa-solid fa-city text-emerald"></i> District
              </label>
              <select
                [(ngModel)]="selectedSearchDistrict"
                (change)="onLocationSearch()"
                class="search-select"
                [disabled]="selectedSearchState === 'All States'">
                <option value="All Districts">{{ selectedSearchState === 'All States' ? 'Select State first' : 'All Districts in ' + selectedSearchState }}</option>
                <option *ngFor="let dist of availableSearchDistricts" [value]="dist">{{ dist }}</option>
              </select>
            </div>

            <!-- 3. Commodity / Crop Input -->
            <div class="search-field">
              <label class="search-field-label">
                <i class="fa-solid fa-wheat-awn text-emerald"></i> Crop / Commodity
              </label>
              <input
                type="text"
                [(ngModel)]="searchCommodity"
                (keyup.enter)="onLocationSearch()"
                placeholder="e.g. Rice, Sugarcane, Wheat..."
                class="search-input"
              />
            </div>

            <!-- 4. Action Buttons -->
            <div class="search-buttons-group">
              <button class="btn btn-primary btn-search-go" (click)="onLocationSearch()">
                <i class="fa-solid fa-magnifying-glass"></i> Search
              </button>
              <button class="btn btn-secondary btn-search-reset" (click)="resetLocationSearch()" title="Reset search filters">
                <i class="fa-solid fa-rotate-left"></i> Reset
              </button>
            </div>
          </div>

          <!-- Active Filter Pill Strip -->
          <div *ngIf="selectedSearchState !== 'All States' || selectedSearchDistrict !== 'All Districts' || searchCommodity" class="active-filter-strip">
            <span class="active-filter-badge">
              <i class="fa-solid fa-filter text-emerald"></i>
              Filtered:
              <strong *ngIf="selectedSearchState !== 'All States'">{{ selectedSearchState }}</strong>
              <strong *ngIf="selectedSearchDistrict !== 'All Districts'"> &bull; {{ selectedSearchDistrict }}</strong>
              <strong *ngIf="searchCommodity"> &bull; "{{ searchCommodity }}"</strong>
              <span class="count-tag ms-1">({{ filteredCrops.length }} crops found)</span>
            </span>
            <button class="btn-clear-strip" (click)="resetLocationSearch()">
              <i class="fa-solid fa-xmark"></i> Clear Filters
            </button>
          </div>
        </div>
      </section>

      <!-- Available Crops Section -->
      <section class="crops-section">
        <div class="section-heading-row">
          <div class="heading-accent-bar"></div>
          <div>
            <h2 class="section-title">Available Harvest Crops</h2>
            <p class="section-desc">Explore verified agricultural harvest listings direct from registered farmers with APMC benchmark comparisons.</p>
          </div>
        </div>

        <!-- Empty State when no crops are listed at all -->
        <div *ngIf="crops.length === 0" class="empty-crops-card shadow-sm">
          <div class="empty-icon-circle">
            <i class="fa-solid fa-wheat-awn-circle-exclamation text-emerald" style="font-size: 2.2rem;"></i>
          </div>
          <h3 class="font-bold text-dark mb-1" style="font-size: 1.3rem;">No Active Harvest Crops Available Yet</h3>
          <p class="text-muted mx-auto mb-3" style="max-width: 520px; font-size: 0.95rem; line-height: 1.5;">
            Farmers can list fresh harvests using the "Add Crop" portal. Fresh crops posted by registered farmers will appear here in real time for dealers to inspect, negotiate, and purchase.
          </p>
          <div class="d-flex justify-content-center gap-2">
            <a *ngIf="currentUser?.role === 'FARMER'" routerLink="/crops/add" class="btn btn-primary">
              <i class="fa-solid fa-circle-plus"></i> Post Your Fresh Harvest
            </a>
            <button *ngIf="!currentUser" (click)="authModalService.open('Please log in as a farmer to post crop listings.')" class="btn btn-primary">
              <i class="fa-solid fa-arrow-right-to-bracket"></i> Login to Post Harvest
            </button>
          </div>
        </div>

        <!-- Empty State when filters yield no matches -->
        <div *ngIf="crops.length > 0 && filteredCrops.length === 0" class="empty-crops-card shadow-sm">
          <div class="empty-icon-circle">
            <i class="fa-solid fa-map-location-dot text-emerald" style="font-size: 2.2rem;"></i>
          </div>
          <h3 class="font-bold text-dark mb-1" style="font-size: 1.3rem;">No Harvest Crops Found in this Location</h3>
          <p class="text-muted mx-auto mb-3" style="max-width: 520px; font-size: 0.95rem; line-height: 1.5;">
            There are currently no active harvest crops listed matching your filters (<strong *ngIf="selectedSearchState !== 'All States'">{{ selectedSearchState }}</strong><strong *ngIf="selectedSearchDistrict !== 'All Districts'"> &bull; {{ selectedSearchDistrict }}</strong><strong *ngIf="searchCommodity"> &bull; "{{ searchCommodity }}"</strong>).
          </p>
          <button (click)="resetLocationSearch()" class="btn btn-primary">
            <i class="fa-solid fa-rotate-left"></i> View All Harvest Crops
          </button>
        </div>

        <!-- 12-Card Responsive Grid with Marketplace-styled Cards (No Wishlist Heart) -->
        <div class="crops-grid" *ngIf="filteredCrops.length > 0">
          <div *ngFor="let crop of paginatedCrops" class="card crop-card shadow-sm">
            <!-- Crop Image Wrapper (matches marketplace crop-card) -->
            <div class="crop-image-wrapper" (click)="openCropDetails(crop)" title="Click to view full inspection details & farmer reviews" style="cursor: pointer;">
              <img [src]="crop.image" [alt]="crop.name" class="crop-img" (error)="onImgError($event)" />
              <span class="crop-badge">{{ crop.category }}</span>
              <span class="status-badge available">AVAILABLE</span>
              <span class="grade-badge" [ngClass]="crop.grade === 'Grade A' ? 'grade-a' : 'grade-b'">
                {{ crop.grade }}
              </span>
            </div>

            <!-- Card Body -->
            <div class="crop-body">
              <div class="crop-title-row" (click)="openCropDetails(crop)" style="cursor: pointer;">
                <h3 class="crop-name">{{ crop.name }}</h3>
                <div class="crop-stock-badge-row">
                  <span class="stock-pill">
                    <i class="fa-solid fa-boxes-stacked text-emerald"></i> Available Quantity: <strong>{{ crop.availableQuantity | number:'1.0-0' }} {{ crop.unit }}</strong>
                  </span>
                </div>
                <span class="crop-price">₹{{ crop.pricePerKg | number:'1.0-0' }} <small>/ {{ crop.unit }}</small></span>
              </div>

              <div class="crop-details">
                <div class="detail-item">
                  <i class="fa-solid fa-weight-hanging text-muted"></i>
                  <span>Quantity: <strong>{{ crop.availableQuantity }} {{ crop.unit }}</strong></span>
                </div>
                <div class="detail-item">
                  <i class="fa-solid fa-location-dot text-muted"></i>
                  <span>Location: {{ crop.district ? (crop.district + ', ') : '' }}{{ crop.state }}</span>
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

              <!-- Rating & Reviews Preview -->
              <div class="crop-reviews-badge" (click)="openCropDetails(crop)" style="cursor: pointer;">
                <div class="stars">
                  <i class="fa-solid fa-star text-amber"></i>
                  <span class="rating-num ms-1">{{ getCropRating(crop).avg }}</span>
                </div>
                <span class="reviews-link">({{ getCropReviews(crop).length }} Reviews)</span>
              </div>

              <!-- Marketplace-styled Action Buttons: Purchase & Negotiate -->
              <div class="crop-actions" *ngIf="!currentUser || currentUser.role === 'DEALER'">
                <button
                  class="btn btn-primary btn-sm flex-1"
                  (click)="onPurchaseClick(crop)">
                  <i class="fa-solid fa-cart-shopping"></i> Purchase
                </button>
                <button
                  class="btn btn-secondary btn-sm flex-1"
                  (click)="onNegotiateClick(crop)">
                  <i class="fa-solid fa-comments-dollar"></i> Negotiate
                </button>
              </div>
              <div class="crop-actions" *ngIf="currentUser && currentUser.role !== 'DEALER'">
                <button
                  class="btn btn-secondary btn-sm flex-1"
                  (click)="openCropDetails(crop)">
                  <i class="fa-solid fa-eye"></i> View Crop Details
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Dynamic Interactive Pagination Bar -->
        <div class="pagination-row" *ngIf="filteredCrops.length > pageSize">
          <button class="page-arrow" [disabled]="currentPage === 1" (click)="setPage(currentPage - 1)">
            <i class="fa-solid fa-angle-left"></i>
          </button>
          <button
            *ngFor="let page of totalPagesArray"
            class="page-num"
            [class.active]="currentPage === page"
            (click)="setPage(page)">
            {{ page }}
          </button>
          <button class="page-arrow" [disabled]="currentPage === totalPages" (click)="setPage(currentPage + 1)">
            <i class="fa-solid fa-angle-right"></i>
          </button>
        </div>
      </section>

      <!-- ======================================================================= -->
      <!-- MODAL 1: EXPANDED CROP DETAILS & REVIEWS ONLY (NO EMBEDDED CHECKOUT)     -->
      <!-- ======================================================================= -->
      <div *ngIf="selectedCrop" class="modal-overlay" (click)="closeCropDetails()">
        <div class="modal-content crop-details-only-modal shadow-2xl" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="d-flex align-center gap-2">
              <span class="crop-icon-pill">🌾</span>
              <div>
                <h3 class="m-0">{{ selectedCrop.name }} &mdash; Harvest Inspection & Details</h3>
                <span class="subtext">{{ selectedCrop.category }} &bull; {{ selectedCrop.grade }} &bull; {{ selectedCrop.state }}, India</span>
              </div>
            </div>
            <button class="close-btn" (click)="closeCropDetails()">&times;</button>
          </div>

          <div class="modal-body p-4">
            <div class="crop-inspection-card">
              <!-- Top Media & Quick Overview -->
              <div class="inspection-hero">
                <div class="inspection-img-wrap">
                  <img [src]="selectedCrop.image" [alt]="selectedCrop.name" class="inspection-img" (error)="onImgError($event)" />
                  <span class="grade-badge" [ngClass]="selectedCrop.grade === 'Grade A' ? 'grade-a' : 'grade-b'">
                    {{ selectedCrop.grade }}
                  </span>
                  <span class="crop-badge">{{ selectedCrop.category }}</span>
                  <span class="status-badge available">AVAILABLE</span>
                </div>

                <div class="inspection-hero-meta">
                  <div class="d-flex justify-content-between align-center">
                    <h2 class="crop-name-large">{{ selectedCrop.name }}</h2>
                    <div class="price-box-highlight">
                      <span class="price-val-large">₹{{ selectedCrop.pricePerKg | number:'1.0-0' }}</span>
                      <span class="price-unit-large">/ {{ selectedCrop.unit }}</span>
                    </div>
                  </div>

                  <!-- APMC Benchmark tag -->
                  <div class="apmc-tag-large mt-2" *ngIf="selectedCrop.govMspPrice">
                    <i class="fa-solid fa-chart-line text-emerald"></i>
                    <span>Govt APMC Mandi Benchmark: <strong>₹{{ selectedCrop.govMspPrice }}/{{ selectedCrop.unit }}</strong></span>
                  </div>

                  <!-- Key Harvest Specifications Grid -->
                  <div class="specs-grid mt-3">
                    <div class="spec-card">
                      <i class="fa-solid fa-boxes-stacked text-emerald"></i>
                      <div>
                        <span class="spec-label">Available Stock</span>
                        <strong class="spec-value">{{ selectedCrop.availableQuantity }} {{ selectedCrop.unit }}</strong>
                      </div>
                    </div>
                    <div class="spec-card">
                      <i class="fa-solid fa-award text-amber"></i>
                      <div>
                        <span class="spec-label">Quality Grade</span>
                        <strong class="spec-value">{{ selectedCrop.grade }} Verified</strong>
                      </div>
                    </div>
                    <div class="spec-card">
                      <i class="fa-solid fa-location-dot text-emerald"></i>
                      <div>
                        <span class="spec-label">Origin Mandi / State</span>
                        <strong class="spec-value">{{ selectedCrop.state }}, India</strong>
                      </div>
                    </div>
                    <div class="spec-card">
                      <i class="fa-solid fa-shield-halved text-primary"></i>
                      <div>
                        <span class="spec-label">Escrow Settlement</span>
                        <strong class="spec-value">100% Protected</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Farmer Profile Card -->
              <div class="farmer-profile-card mt-4">
                <div class="farmer-avatar">👨‍🌾</div>
                <div class="farmer-meta">
                  <div class="d-flex align-center gap-2">
                    <strong class="farmer-name">{{ selectedCrop.farmerName || 'Verified Farmer' }}</strong>
                    <span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Verified Direct Producer</span>
                  </div>
                  <span class="farmer-location"><i class="fa-solid fa-location-dot text-emerald"></i> Farm Gate: {{ selectedCrop.state }}, India</span>
                  <div class="farmer-stars mt-1">
                    <i *ngFor="let s of [1,2,3,4,5]" class="fa-solid fa-star text-amber"></i>
                    <span class="rating-text ms-1">{{ getCropRating(selectedCrop).avg }} / 5.0 ({{ getCropReviews(selectedCrop).length }} Reviews)</span>
                  </div>
                </div>
              </div>

              <!-- Farmer Reviews Section (All reviews placed for that farmer, 0 reviews if no reviews) -->
              <div class="farmer-reviews-section mt-4">
                <div class="reviews-section-header">
                  <div class="d-flex align-center gap-2">
                    <i class="fa-solid fa-star-half-stroke text-amber"></i>
                    <h4 class="m-0">Dealer Reviews for {{ selectedCrop.farmerName || 'Farmer' }}</h4>
                  </div>
                  <span class="reviews-count-badge" [class.badge-zero]="farmerReviewsForBuy.length === 0">
                    {{ farmerReviewsForBuy.length }} {{ farmerReviewsForBuy.length === 1 ? 'Review' : 'Reviews' }}
                  </span>
                </div>

                <!-- When 0 reviews, explicitly display "0 Reviews placed for this farmer yet" -->
                <div *ngIf="farmerReviewsForBuy.length === 0" class="zero-reviews-box mt-3">
                  <i class="fa-regular fa-comment-dots text-muted"></i>
                  <div>
                    <strong>0 Reviews placed for this farmer yet</strong>
                    <p class="m-0 text-muted text-xs">No reviews submitted yet for this farmer. Purchase harvest and be the first to share dealer feedback!</p>
                  </div>
                </div>

                <!-- Reviews list when available -->
                <div *ngIf="farmerReviewsForBuy.length > 0" class="reviews-scroll-list mt-3">
                  <div *ngFor="let rev of farmerReviewsForBuy" class="review-item-card">
                    <div class="d-flex justify-content-between align-center">
                      <span class="review-dealer-name"><i class="fa-regular fa-user text-emerald"></i> {{ rev.dealerName }}</span>
                      <div class="review-stars">
                        <i *ngFor="let s of [1,2,3,4,5]" class="fa-star" [ngClass]="s <= rev.rating ? 'fa-solid text-amber' : 'fa-regular text-muted'"></i>
                      </div>
                    </div>
                    <p class="review-comment mt-1">"{{ rev.comment }}"</p>
                    <span class="review-date text-xs text-muted">{{ rev.createdAt | date:'mediumDate' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeCropDetails()">Close</button>
            <ng-container *ngIf="!currentUser || currentUser.role === 'DEALER'">
              <button class="btn btn-secondary" (click)="openNegotiateModalFromDetails(selectedCrop)">
                <i class="fa-solid fa-comments-dollar"></i> Negotiate
              </button>
              <button class="btn btn-primary" (click)="openBuyModalFromDetails(selectedCrop)">
                <i class="fa-solid fa-cart-shopping"></i> Purchase
              </button>
            </ng-container>
            <span *ngIf="currentUser && currentUser.role !== 'DEALER'" class="badge badge-info" style="font-size: 0.8rem; padding: 0.5rem 0.75rem;">
              <i class="fa-solid fa-lock"></i> Commercial Dealer Purchase Only
            </span>
          </div>
        </div>
      </div>

      <!-- ======================================================================= -->
      <!-- MODAL 2: 3-STEP DIRECT PURCHASE & PAYMENT SIMULATOR MODAL               -->
      <!-- ======================================================================= -->
      <div *ngIf="selectedCropForBuy" class="modal-overlay">
        <div class="modal-content" [ngClass]="{'checkout-wide': checkoutStep === 'PAYMENT' || checkoutStep === 'SUCCESS'}">

          <!-- STEP 1: ORDER DETAILS & LOGISTICS -->
          <ng-container *ngIf="checkoutStep === 'DETAILS'">
            <div class="modal-header">
              <h3><i class="fa-solid fa-bag-shopping text-emerald"></i> Order Details: {{ selectedCropForBuy.name }}</h3>
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
                  <strong>₹{{ selectedCropForBuy.pricePerKg }} / {{ selectedCropForBuy.unit }}</strong>
                </div>
                <div class="summary-row">
                  <span>Available Stock:</span>
                  <span>{{ selectedCropForBuy.availableQuantity }} {{ selectedCropForBuy.unit }}</span>
                </div>
              </div>

              <div class="form-group mt-3">
                <label class="form-label d-flex justify-content-between align-center">
                  <span>Order Quantity ({{ selectedCropForBuy.unit }})</span>
                  <span class="text-xs text-emerald font-bold">Max Available: {{ selectedCropForBuy.availableQuantity }} {{ selectedCropForBuy.unit }}</span>
                </label>
                <input
                  type="number"
                  [(ngModel)]="orderQuantity"
                  (ngModelChange)="onOrderQuantityChange($event)"
                  [max]="selectedCropForBuy.availableQuantity"
                  min="1"
                  class="form-control"
                  [class.is-invalid]="orderQuantity > selectedCropForBuy.availableQuantity || orderQuantity < 1"
                />
                <div *ngIf="orderQuantity > selectedCropForBuy.availableQuantity" class="text-danger text-xs mt-1">
                  <i class="fa-solid fa-triangle-exclamation"></i> Cannot order more than available stock ({{ selectedCropForBuy.availableQuantity }} {{ selectedCropForBuy.unit }}).
                </div>
              </div>

              <!-- Fulfillment Method Selection -->
              <div class="form-group mt-3">
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
              <div *ngIf="fulfillmentType === 'SELF_PICKUP'" class="self-pickup-box mt-3">
                <i class="fa-solid fa-location-dot text-emerald"></i>
                <div>
                  <strong>Farm Gate Pickup Location:</strong>
                  <p>{{ selectedCropForBuy.state }}, India</p>
                  <span class="subtext">Zero delivery fees. You arrange your vehicle transport.</span>
                </div>
              </div>

              <!-- Price Breakdown Box with GST -->
              <div class="price-breakdown-box mt-3">
                <div class="breakdown-line">
                  <span>Crop Cost ({{ orderQuantity }} × ₹{{ selectedCropForBuy.pricePerKg }}):</span>
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

              <div class="policy-note mt-3">
                <i class="fa-solid fa-circle-info"></i>
                <span>Direct farmer transaction: Funds held in secure escrow. Certified Tax invoice PDF available immediately upon payment. (Strict No-Refund Policy).</span>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="selectedCropForBuy = null">Cancel</button>
              <button class="btn btn-primary" (click)="goToPaymentStep()" [disabled]="orderQuantity < 1 || orderQuantity > selectedCropForBuy.availableQuantity || (fulfillmentType === 'DELIVERY_AGENT' && !deliveryAddress)">
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
                  <span class="d-block text-muted text-xs mt-1">{{ orderQuantity }} {{ selectedCropForBuy.unit }} &bull; {{ selectedCropForBuy.name }}</span>
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

      <!-- ======================================================================= -->
      <!-- MODAL 3: IN-APP OFFICIAL GST TAX INVOICE PREVIEW MODAL                  -->
      <!-- ======================================================================= -->
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
                  <i class="fa-solid fa-building text-primary"></i>
                  <span>Recipient / Buyer (Dealer)</span>
                </div>
                <h4 class="party-name">{{ selectedInvoiceForView.dealerName }}</h4>
                <p class="party-detail"><i class="fa-solid fa-warehouse"></i> <strong>Drop Address:</strong> {{ selectedInvoiceForView.dealerAddress }}</p>
                <p class="party-detail"><i class="fa-solid fa-phone"></i> {{ selectedInvoiceForView.dealerPhone }}</p>
                <div class="id-row mt-2">
                  <span class="id-tag">GSTIN: {{ selectedInvoiceForView.dealerGstin }}</span>
                  <span class="id-tag">Lic: DL-COMM-AGRO-2026</span>
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
                <span class="log-lbl">Delivery Surcharge:</span>
                <strong>₹{{ selectedInvoiceForView.deliveryFee || 0 }}</strong>
              </div>
              <div class="log-item">
                <span class="badge" [ngClass]="selectedInvoiceForView.fulfillmentType === 'SELF_PICKUP' ? 'badge-success' : 'badge-primary'">
                  {{ selectedInvoiceForView.fulfillmentType === 'SELF_PICKUP' ? 'Self Pickup (₹0 Fee)' : 'Carrier Dispatched' }}
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

      <!-- ======================================================================= -->
      <!-- MODAL 4: DIRECT NEGOTIATION PROPOSAL MODAL                              -->
      <!-- ======================================================================= -->
      <div *ngIf="selectedCropForNeg" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3><i class="fa-solid fa-handshake text-emerald"></i> Propose Negotiation Offer</h3>
            <button class="close-btn" (click)="selectedCropForNeg = null">&times;</button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">
              Send a direct price proposal to farmer <strong>{{ selectedCropForNeg.farmerName || 'Farmer' }}</strong> for {{ selectedCropForNeg.name }}.
            </p>
            <div class="form-group">
              <label class="form-label">Original Listed Price: ₹{{ selectedCropForNeg.pricePerKg }} / {{ selectedCropForNeg.unit }}</label>
            </div>
            <div class="form-group">
              <div class="d-flex justify-between align-center mb-1">
                <label class="form-label m-0">Your Proposed Offer Price (₹ / {{ selectedCropForNeg.unit || 'Kg' }}) *</label>
                <span class="text-xs text-muted">Must be below listed price (&lt; ₹{{ selectedCropForNeg.pricePerKg }})</span>
              </div>
              <input
                type="number"
                [(ngModel)]="proposedPrice"
                [max]="selectedCropForNeg.pricePerKg - 1"
                min="1"
                class="form-control"
                placeholder="Enter offer price below original price"
                required
              />
              <div *ngIf="proposedPrice && proposedPrice >= selectedCropForNeg.pricePerKg" class="alert alert-danger p-2 mt-2 text-xs">
                <i class="fa-solid fa-triangle-exclamation"></i> Proposed negotiation price must be lower than original listed price (₹{{ selectedCropForNeg.pricePerKg }} / {{ selectedCropForNeg.unit || 'Kg' }}).
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Available Crop Stock: <strong>{{ selectedCropForNeg.availableQuantity }} {{ selectedCropForNeg.unit }}</strong></label>
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
              [disabled]="!proposedPrice || proposedPrice <= 0 || proposedPrice >= selectedCropForNeg.pricePerKg">
              Send Counter Offer
            </button>
          </div>
        </div>
      </div>

      <!-- Dark Green Footer -->
      <footer class="landing-footer">
        <div class="footer-container">
          <div class="footer-col brand-col">
            <div class="footer-logo">
              <span class="logo-leaf">🌱</span>
              <span class="logo-text">Crop<span class="logo-accent">Deal</span></span>
            </div>
            <p class="footer-mission">
              Connecting farmers, dealers and delivery partners for a transparent and empowered agricultural trading ecosystem.
            </p>
            <div class="footer-socials">
              <a href="javascript:void(0)" class="social-icon"><i class="fa-brands fa-facebook-f"></i></a>
              <a href="javascript:void(0)" class="social-icon"><i class="fa-brands fa-twitter"></i></a>
              <a href="javascript:void(0)" class="social-icon"><i class="fa-brands fa-instagram"></i></a>
              <a href="javascript:void(0)" class="social-icon"><i class="fa-brands fa-youtube"></i></a>
            </div>
            <p class="footer-copy">&#169; 2026 CropDeal. All rights reserved.</p>
          </div>

          <div class="footer-col">
            <h4 class="footer-title">Quick Links</h4>
            <ul class="footer-links">
              <li><a routerLink="/">Home</a></li>
              <li><a routerLink="/price-alerts">Mandhi Price</a></li>
              <li><a routerLink="/bidding">Live Bidding</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4 class="footer-title">Contact</h4>
            <ul class="footer-contact">
              <li><i class="fa-solid fa-location-dot"></i> Coimbatore, Tamil Nadu, India</li>
              <li><i class="fa-solid fa-phone"></i> +91 98765 43210</li>
              <li><i class="fa-regular fa-envelope"></i> support&#64;cropdeal.com</li>
            </ul>
          </div>
        </div>
      </footer>

      <app-auth-modal></app-auth-modal>
    </div>
  `,
  styles: [`
    .landing-page {
      background: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: inherit;
    }

    /* Panoramic Hero */
    .hero-section {
      position: relative;
      background: url('/assets/images/landing-hero.jpg') center/cover no-repeat,
                  linear-gradient(135deg, #14532d, #166534);
      min-height: 280px;
      display: flex;
      align-items: center;
    }
    .hero-bg-overlay {
      width: 100%;
      height: 100%;
      min-height: 280px;
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 45%, rgba(255, 255, 255, 0.2) 100%);
      display: flex;
      align-items: center;
    }
    .hero-content {
      max-width: 1360px;
      width: 100%;
      margin: 0 auto;
      padding: 2.5rem 1.5rem;
    }
    .hero-title {
      font-size: 2.5rem;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.15;
      margin: 0 0 0.75rem;
    }
    .hero-title-accent { color: #166534; }
    .hero-subtitle {
      font-size: 1rem;
      color: #334155;
      max-width: 600px;
      line-height: 1.55;
      margin: 0;
    }

    /* Geographic Harvest Search Toolbar */
    .location-search-container {
      max-width: 1360px;
      width: 100%;
      margin: 1.5rem auto 0;
      padding: 0 1.5rem;
    }
    .search-bar-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.85rem;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .search-bar-title-wrap {
      margin-bottom: 1rem;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.5rem;
    }
    .search-title-main {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .search-title-sub {
      font-size: 0.8rem;
      color: #64748b;
    }
    .search-bar-grid {
      display: grid;
      grid-template-columns: 1.2fr 1.2fr 1.4fr auto;
      gap: 1rem;
      align-items: flex-end;
    }
    .search-field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .search-field-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin: 0;
    }
    .search-select, .search-input {
      width: 100%;
      height: 42px;
      padding: 0.45rem 0.75rem;
      border: 1.5px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      color: #1e293b;
      background-color: #f8fafc;
      transition: all 0.2s ease-in-out;
      outline: none;
      box-sizing: border-box;
    }
    .search-select:focus, .search-input:focus {
      border-color: #16a34a;
      background-color: #ffffff;
      box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
    }
    .search-select:disabled {
      background-color: #f1f5f9;
      color: #94a3b8;
      cursor: not-allowed;
      border-color: #e2e8f0;
    }
    .search-buttons-group {
      display: flex;
      gap: 0.5rem;
      height: 42px;
    }
    .btn-search-go {
      background: #15803d;
      color: #ffffff;
      font-weight: 700;
      border: none;
      border-radius: 0.5rem;
      padding: 0 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-search-go:hover {
      background: #166534;
    }
    .btn-search-reset {
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      border: 1.5px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 0 0.95rem;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-search-reset:hover {
      background: #e2e8f0;
      color: #1e293b;
    }
    .active-filter-strip {
      margin-top: 0.85rem;
      padding-top: 0.75rem;
      border-top: 1px dashed #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .active-filter-badge {
      font-size: 0.825rem;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .count-tag {
      color: #15803d;
      font-weight: 700;
    }
    .btn-clear-strip {
      background: none;
      border: none;
      color: #dc2626;
      font-size: 0.775rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
    }
    .btn-clear-strip:hover {
      background: #fee2e2;
    }

    /* Available Crops */
    .crops-section {
      max-width: 1360px;
      width: 100%;
      margin: 2rem auto;
      padding: 0 1.5rem;
      flex: 1;
    }
    .section-heading-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .heading-accent-bar {
      width: 4px;
      height: 38px;
      background: #15803d;
      border-radius: 2px;
    }
    .section-title {
      font-size: 1.45rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .section-desc {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0.15rem 0 0;
    }

    /* Action Alert Toast */
    .action-alert {
      max-width: 1360px;
      margin: 1rem auto 0;
      width: calc(100% - 3rem);
      background: #dcfce7;
      color: #166534;
      padding: 0.85rem 1.25rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      border: 1px solid #86efac;
    }

    /* Empty Crops State */
    .empty-crops-card {
      background: #ffffff;
      border: 1.5px dashed #cbd5e1;
      border-radius: 1rem;
      padding: 3rem 1.5rem;
      text-align: center;
      margin: 1.5rem 0;
    }
    .empty-icon-circle {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: #f0fdf4;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.25rem;
      border: 1px solid #bbf7d0;
    }

    /* Crop Grid & Marketplace Cards */
    .crops-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }
    .crop-card {
      background: #ffffff;
      border-radius: 0.75rem;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      flex-direction: column;
      text-align: center;
      align-items: stretch;
    }
    .crop-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.08);
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
      top: 10px;
      left: 10px;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(4px);
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      text-transform: uppercase;
    }
    .status-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      background: #ef4444;
      color: white;
    }
    .status-badge.available {
      background: #10b981;
    }
    .grade-badge {
      position: absolute;
      bottom: 10px;
      left: 10px;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      color: white;
    }
    .grade-badge.grade-a { background: #16a34a; }
    .grade-badge.grade-b { background: #2563eb; }

    .crop-body {
      padding: 1.15rem;
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
      margin-bottom: 0.65rem;
      width: 100%;
    }
    .crop-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .crop-stock-badge-row {
      margin: 0.2rem 0;
    }
    .stock-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.775rem;
      font-weight: 600;
    }
    .crop-price {
      font-size: 1.25rem;
      font-weight: 800;
      color: #15803d;
    }
    .crop-price small {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
    }
    .crop-details {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      margin-bottom: 0.75rem;
      font-size: 0.825rem;
      width: 100%;
      text-align: center;
    }
    .detail-item {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: #64748b;
      text-align: center;
    }
    .apmc-tag {
      background: #f0fdf4;
      border: 1px dashed #86efac;
      padding: 0.45rem 0.75rem;
      border-radius: 0.4rem;
      font-size: 0.75rem;
      color: #166534;
      font-weight: 600;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 0.4rem;
      width: 100%;
    }
    .crop-reviews-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      margin-bottom: 0.75rem;
      padding: 0.2rem 0.5rem;
      background: #fffbeb;
      border-radius: 4px;
      width: fit-content;
      transition: background 0.15s;
    }
    .crop-reviews-badge:hover { background: #fef3c7; }
    .stars { display: inline-flex; align-items: center; gap: 0.15rem; }
    .text-amber { color: #f59e0b; }
    .rating-num { font-weight: 700; color: #92400e; font-size: 0.75rem; }
    .reviews-link { color: #b45309; text-decoration: underline; }
    .crop-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: auto;
      width: 100%;
      justify-content: center;
      align-items: center;
    }

    /* Buttons */
    .flex-1 { flex: 1; }
    .btn {
      padding: 0.45rem 0.85rem;
      border-radius: 0.4rem;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      border: 1px solid transparent;
      transition: all 0.15s;
      text-decoration: none;
    }
    .btn-sm { padding: 0.4rem 0.75rem; font-size: 0.825rem; }
    .btn-primary { background: #15803d; color: white; }
    .btn-primary:hover:not([disabled]) { background: #166534; }
    .btn-secondary { background: #f1f5f9; color: #334155; border-color: #cbd5e1; }
    .btn-secondary:hover:not([disabled]) { background: #e2e8f0; }
    .btn-success { background: #16a34a; color: white; }
    .btn-success:hover { background: #15803d; }
    .btn-warning { background: #f59e0b; color: white; }
    .btn-warning:hover { background: #d97706; }
    .btn-pay-now { background: linear-gradient(135deg, #16a34a, #15803d); font-weight: 800; font-size: 0.95rem; }

    /* Dynamic Pagination */
    .pagination-row {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    .page-arrow, .page-num {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 1px solid #cbd5e1;
      background: white;
      font-size: 0.85rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .page-num.active {
      background: #15803d;
      border-color: #15803d;
      color: white;
    }
    .page-arrow:hover, .page-num:hover:not(.active) {
      background: #f1f5f9;
      color: #0f172a;
    }

    /* Modal Overlay - Positioned cleanly below 70px fixed top navbar with zero overlap */
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
    .modal-content {
      background: #ffffff;
      border-radius: 0.75rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      max-width: 90vw;
      max-height: calc(100vh - 70px - 3.5rem);
      overflow-y: auto;
      margin: 0 auto;
      width: 580px;
      position: relative;
      z-index: 100001;
    }
    .modal-header {
      padding: 1.1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a; }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    .close-btn:hover { color: #0f172a; }
    .modal-body { padding: 1.25rem 1.5rem; }
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    /* Expanded Details Only Modal */
    .crop-details-only-modal {
      width: 760px;
      max-width: 95%;
      max-height: calc(100vh - 70px - 3.5rem);
      overflow-y: auto;
      margin: 0 auto;
    }
    .crop-icon-pill { font-size: 1.6rem; }
    .subtext { font-size: 0.78rem; color: #64748b; }
    .inspection-hero {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 680px) {
      .inspection-hero { grid-template-columns: 1fr; }
    }
    .inspection-img-wrap {
      position: relative;
      border-radius: 0.5rem;
      overflow: hidden;
      height: 200px;
      background: #e2e8f0;
    }
    .inspection-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .crop-name-large {
      font-size: 1.45rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .price-box-highlight { text-align: right; }
    .price-val-large { font-size: 1.45rem; font-weight: 800; color: #15803d; }
    .price-unit-large { font-size: 0.85rem; color: #64748b; }
    .apmc-tag-large {
      background: #f0fdf4;
      border: 1px dashed #86efac;
      padding: 0.45rem 0.8rem;
      border-radius: 0.4rem;
      font-size: 0.8rem;
      color: #166534;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .specs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
    }
    .spec-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.4rem;
      padding: 0.6rem 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .spec-card i { font-size: 1.25rem; }
    .spec-label { font-size: 0.72rem; color: #64748b; display: block; text-transform: uppercase; font-weight: 600; }
    .spec-value { font-size: 0.875rem; color: #0f172a; }

    /* Farmer Profile Card */
    .farmer-profile-card {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.85rem 1rem;
    }
    .farmer-avatar { font-size: 2.2rem; }
    .farmer-meta { flex: 1; }
    .farmer-name { font-size: 1rem; color: #0f172a; }
    .farmer-location { font-size: 0.78rem; color: #64748b; display: block; margin-top: 0.15rem; }
    .farmer-stars { display: flex; align-items: center; gap: 0.15rem; font-size: 0.75rem; }
    .rating-text { font-weight: 700; color: #0f172a; }

    /* Farmer Reviews Section */
    .farmer-reviews-section {
      border-top: 1px solid #e2e8f0;
      padding-top: 1.25rem;
    }
    .reviews-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .reviews-count-badge {
      background: #dcfce7;
      color: #166534;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
    }
    .reviews-count-badge.badge-zero {
      background: #f1f5f9;
      color: #64748b;
    }
    .zero-reviews-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 0.5rem;
      padding: 1.25rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      color: #475569;
    }
    .zero-reviews-box i { font-size: 1.5rem; }
    .reviews-scroll-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      max-height: 220px;
      overflow-y: auto;
    }
    .review-item-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.4rem;
      padding: 0.75rem 1rem;
    }
    .review-dealer-name { font-weight: 700; font-size: 0.85rem; color: #0f172a; }
    .review-comment { font-size: 0.825rem; color: #334155; margin: 0.35rem 0 0.15rem; }
    .review-date { color: #94a3b8; }

    /* 3-Step Checkout Modal Styles */
    .checkout-wide { max-width: 680px; width: 95%; max-height: calc(100vh - 70px - 3.5rem); margin: 0 auto; overflow-y: auto; }
    .invoice-modal-wide { max-width: 900px; width: 95%; max-height: calc(100vh - 70px - 3.5rem); overflow-y: auto; margin: 0 auto; }
    .order-summary-box {
      background: #f8fafc;
      border-radius: 0.5rem;
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.85rem;
      border: 1px solid #e2e8f0;
    }
    .summary-row { display: flex; justify-content: space-between; }
    .fulfillment-selector { display: flex; gap: 0.75rem; margin-top: 0.35rem; }
    .fulfillment-option {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem;
      border: 1.5px solid #cbd5e1;
      border-radius: 0.5rem;
      cursor: pointer;
      background: #f8fafc;
      transition: all 0.15s;
    }
    .fulfillment-option input { display: none; }
    .fulfillment-option i { font-size: 1.5rem; color: #64748b; }
    .fulfillment-option strong { display: block; font-size: 0.85rem; color: #0f172a; }
    .fulfillment-option span { font-size: 0.725rem; color: #64748b; }
    .fulfillment-option.selected {
      background: #f0fdf4;
      border-color: #16a34a;
      box-shadow: 0 2px 8px rgba(22, 163, 74, 0.15);
    }
    .fulfillment-option.selected i { color: #16a34a; }
    .fulfillment-option.selected strong { color: #15803d; }
    .delivery-details-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
    }
    .form-row { display: flex; gap: 1rem; }
    .form-group { margin-bottom: 0.75rem; }
    .form-label { font-size: 0.825rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem; display: block; }
    .form-control {
      width: 100%;
      padding: 0.55rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.4rem;
      font-size: 0.875rem;
      outline: none;
      background: white;
    }
    .form-control:focus {
      border-color: #16a34a;
      box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.15);
    }
    .input-km-wrapper { position: relative; }
    .input-km-wrapper .form-control { padding-right: 2.5rem; }
    .km-unit { position: absolute; right: 0.85rem; top: 50%; transform: translateY(-50%); font-size: 0.8rem; font-weight: 700; color: #64748b; }
    .rate-display-group { display: flex; flex-direction: column; justify-content: center; }
    .rate-calc-label { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 0.35rem; }
    .rate-calc-badge {
      background: #dcfce7;
      color: #166534;
      padding: 0.6rem 0.85rem;
      border-radius: 0.4rem;
      font-size: 0.85rem;
      border: 1px solid #86efac;
    }
    .btn-preset { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.5rem; cursor: pointer; color: #334155; }
    .btn-preset:hover { background: #e2e8f0; }
    .address-presets { display: flex; gap: 0.35rem; }
    .self-pickup-box {
      background: #f0fdf4;
      border: 1px dashed #86efac;
      padding: 0.85rem 1rem;
      border-radius: 0.5rem;
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      font-size: 0.85rem;
    }
    .self-pickup-box p { margin: 0.15rem 0; font-weight: 600; color: #0f172a; }
    .price-breakdown-box {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 0.5rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.85rem;
    }
    .breakdown-line { display: flex; justify-content: space-between; color: #475569; }
    .breakdown-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #86efac;
      padding-top: 0.6rem;
      margin-top: 0.25rem;
    }
    .total-price { font-size: 1.45rem; font-weight: 800; margin: 0; }
    .policy-note {
      font-size: 0.75rem;
      color: #1e40af;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      line-height: 1.4;
    }

    /* Payment Simulator */
    .btn-back { background: none; border: none; font-size: 1.1rem; color: #64748b; cursor: pointer; padding: 0.25rem 0.5rem; }
    .btn-back:hover { color: #166534; }
    .payment-amount-banner { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 0.5rem; padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; }
    .pay-lbl { font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #64748b; }
    .pay-val { font-size: 1.75rem; font-weight: 800; margin: 0.15rem 0 0; }
    .payment-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
    .pay-tab-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.75rem 0.5rem; border: 1.5px solid #cbd5e1; border-radius: 0.5rem; background: #f8fafc; cursor: pointer; font-size: 0.75rem; font-weight: 700; transition: all 0.2s; }
    .pay-tab-btn.active { background: white; border-color: #16a34a; box-shadow: 0 2px 8px rgba(22, 163, 74, 0.15); color: #15803d; }
    .pay-tab-btn i { font-size: 1.25rem; }
    .stripe-demo-badge { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.8rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
    .autofill-btn { background: #2563eb; color: white; border: none; padding: 0.35rem 0.75rem; border-radius: 0.3rem; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; }
    .autofill-btn:hover { background: #1d4ed8; }
    .card-number-wrapper { position: relative; display: flex; align-items: center; }
    .card-number-wrapper .card-icon { position: absolute; left: 0.85rem; color: #64748b; }
    .card-number-wrapper .card-input { padding-left: 2.5rem; padding-right: 3.5rem; font-family: monospace; letter-spacing: 1px; font-size: 0.95rem; font-weight: 600; }
    .card-badge-test { position: absolute; right: 0.85rem; background: #e2e8f0; color: #475569; font-size: 0.65rem; font-weight: 800; padding: 0.15rem 0.4rem; border-radius: 4px; }
    .card-brand-icons { display: flex; gap: 0.35rem; font-size: 1.1rem; }
    .stripe-footer-note { font-size: 0.725rem; color: #64748b; display: flex; align-items: center; gap: 0.4rem; justify-content: center; }
    .processing-overlay { background: rgba(255,255,255,0.95); position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; border-radius: 0.75rem; text-align: center; padding: 2rem; }
    .processing-status { font-size: 0.875rem; color: #15803d; font-weight: 600; margin-top: 0.5rem; }
    .spinner-border { width: 3rem; height: 3rem; border: 4px solid #dcfce7; border-top-color: #16a34a; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .order-receipt-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem; }
    .receipt-row { display: flex; justify-content: space-between; align-items: center; }
    .receipt-row.total-row { border-top: 1.5px dashed #86efac; padding-top: 0.75rem; margin-top: 0.25rem; font-size: 1rem; }
    .success-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }
    .upi-box { display: flex; align-items: center; gap: 1.5rem; background: #f8fafc; padding: 1.25rem; border-radius: 0.5rem; }
    .upi-left { flex: 1; }
    .upi-divider { font-weight: 800; color: #94a3b8; font-size: 0.8rem; }
    .upi-qr-preview { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; }
    .qr-mock { width: 80px; height: 80px; background: white; border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: #15803d; border-radius: 0.4rem; }
    .bank-panel, .wallet-panel { background: #f8fafc; padding: 1.25rem; border-radius: 0.5rem; }
    .wallet-balance-box { background: white; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; }
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
    .invoice-meta-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1rem; border-bottom: 2px solid #e2e8f0; }
    .brand-meta h2 { font-size: 1.35rem; font-weight: 800; }
    .invoice-number-box { text-align: right; }
    .inv-badge { background: #dcfce7; color: #166534; font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 0.3rem; letter-spacing: 0.5px; display: inline-block; margin-bottom: 0.2rem; }
    .inv-date, .inv-order { font-size: 0.75rem; color: #64748b; display: block; }
    .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .party-info-card { border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem; background: #ffffff; }
    .party-card-title { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: #64748b; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.4rem; }
    .party-name { font-size: 1.05rem; font-weight: 800; color: #0f172a; margin-bottom: 0.35rem; }
    .party-detail { font-size: 0.8rem; color: #64748b; margin: 0.2rem 0; }
    .id-row { display: flex; gap: 0.35rem; flex-wrap: wrap; }
    .id-tag { font-size: 0.7rem; background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 0.3rem; color: #334155; font-weight: 600; }
    .logistics-strip { background: #f0fdf4; border: 1px dashed #86efac; border-radius: 0.5rem; padding: 0.75rem 1.25rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.825rem; }
    .log-lbl { font-size: 0.75rem; color: #64748b; margin-right: 0.35rem; }
    .invoice-table-wrapper { border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden; }
    .invoice-table { margin: 0; width: 100%; border-collapse: collapse; }
    .invoice-table th { background: #f8fafc; font-size: 0.75rem; padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .invoice-table td { padding: 0.75rem; font-size: 0.825rem; text-align: left; border-bottom: 1px solid #f1f5f9; }
    .hsn-pill { background: #e2e8f0; padding: 0.15rem 0.45rem; border-radius: 4px; font-family: monospace; font-size: 0.75rem; }
    .totals-breakdown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .payment-meta-box { background: #f8fafc; border-radius: 0.5rem; padding: 1rem; display: flex; flex-direction: column; justify-content: center; border: 1px solid #e2e8f0; }
    .escrow-cert { display: flex; gap: 0.65rem; align-items: center; font-size: 0.825rem; }
    .payment-details-line { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.75rem; color: #64748b; }
    .tax-summary-box { border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.825rem; background: #f8fafc; }
    .summary-line { display: flex; justify-content: space-between; color: #64748b; }
    .summary-grand-total { display: flex; justify-content: space-between; align-items: center; border-top: 1.5px solid #cbd5e1; padding-top: 0.5rem; margin-top: 0.35rem; }
    .font-xl { font-size: 1.25rem; font-weight: 800; }
    .digital-seal-strip { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 1rem; }
    .seal-badge { display: flex; align-items: center; gap: 0.65rem; border: 1.5px dashed #86efac; background: #f0fdf4; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.75rem; color: #166534; }
    .signature-box { text-align: right; }
    .sign-mark { font-family: cursive; font-size: 1.05rem; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.2rem; }
    .signature-box span { font-size: 0.7rem; color: #64748b; }

    /* Negotiation Modal */
    .modal-desc { font-size: 0.85rem; color: #64748b; margin-bottom: 1rem; }

    /* Footer */
    .landing-footer {
      background: #064e3b;
      color: #d1fae5;
      padding: 3rem 1.5rem 2rem;
      margin-top: auto;
    }
    .footer-container {
      max-width: 1360px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 3rem;
    }
    .footer-logo {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 1.45rem;
      font-weight: 800;
      color: white;
      margin-bottom: 0.75rem;
    }
    .logo-accent { color: #86efac; }
    .footer-mission {
      font-size: 0.85rem;
      color: #a7f3d0;
      line-height: 1.5;
      max-width: 380px;
      margin-bottom: 1.25rem;
    }
    .footer-socials { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
    .social-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      text-decoration: none;
      font-size: 0.85rem;
      transition: background 0.2s;
    }
    .social-icon:hover { background: #10b981; }
    .footer-copy { font-size: 0.75rem; color: #6ee7b7; margin: 0; }
    .footer-title { font-size: 1rem; font-weight: 700; color: white; margin: 0 0 1rem; }
    .footer-links, .footer-contact {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      font-size: 0.85rem;
    }
    .footer-links a { color: #a7f3d0; text-decoration: none; transition: color 0.2s; }
    .footer-links a:hover { color: white; text-decoration: underline; }
    .footer-contact li { display: flex; align-items: center; gap: 0.6rem; color: #a7f3d0; }

    @media (max-width: 1024px) {
      .crops-grid { grid-template-columns: repeat(3, 1fr); }
      .footer-container { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 768px) {
      .crops-grid { grid-template-columns: repeat(2, 1fr); }
      .hero-title { font-size: 1.85rem; }
      .footer-container { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
      .crops-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class LandingComponent implements OnInit {
  currentUser: User | null = null;
  currentPage = 1;
  pageSize = 4; // 12 cards split into 3 interactive pages
  actionMessage = '';
  Math = Math;

  // Selected crop for Inspection Details & Reviews Only modal
  selectedCrop: CropCard | null = null;
  farmerReviewsForBuy: FarmerReview[] = [];

  // Selected crop for 3-Step Direct Purchase Modal
  selectedCropForBuy: CropCard | null = null;
  orderQuantity = 10;
  deliveryAddress = '';
  fulfillmentType: 'SELF_PICKUP' | 'DELIVERY_AGENT' = 'DELIVERY_AGENT';
  distanceKm = 20;
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
  upiId = 'apexagro@okhdfcbank';
  selectedBank = 'State Bank of India';

  // Processing Animation State
  processingPayment = false;
  paymentProgressMessage = '';

  // Completed Trade Records
  completedOrder: any = null;
  completedInvoice: Invoice | null = null;
  selectedInvoiceForView: Invoice | null = null;
  currentWalletBalance = 0;

  // Selected crop for Negotiation Modal
  selectedCropForNeg: CropCard | null = null;
  proposedPrice = 0;
  negotiationQty = 10;
  negotiationNotes = '';

  crops: CropCard[] = [];

  // State & District Cascading Location Search Bar
  allIndianStates: string[] = [...INDIAN_STATES];
  selectedSearchState = 'All States';
  selectedSearchDistrict = 'All Districts';
  availableSearchDistricts: string[] = [];
  searchCommodity = '';

  onSearchStateChange(): void {
    if (this.selectedSearchState && this.selectedSearchState !== 'All States') {
      this.availableSearchDistricts = getDistrictsForState(this.selectedSearchState);
    } else {
      this.availableSearchDistricts = [];
    }
    this.selectedSearchDistrict = 'All Districts';
    this.currentPage = 1;
  }

  onLocationSearch(): void {
    this.currentPage = 1;
  }

  resetLocationSearch(): void {
    this.selectedSearchState = 'All States';
    this.selectedSearchDistrict = 'All Districts';
    this.availableSearchDistricts = [];
    this.searchCommodity = '';
    this.currentPage = 1;
  }

  get filteredCrops(): CropCard[] {
    return this.crops.filter(crop => {
      // 1. Check Location Match
      const locMatches = matchesPlace(
        crop.rawLocation || crop.state,
        crop.state,
        crop.district,
        this.selectedSearchState,
        this.selectedSearchDistrict
      );
      if (!locMatches) return false;

      // 2. Check Commodity Query
      if (this.searchCommodity && this.searchCommodity.trim()) {
        const query = this.searchCommodity.trim().toLowerCase();
        const nameMatches = (crop.name || '').toLowerCase().includes(query) ||
                            (crop.category || '').toLowerCase().includes(query);
        if (!nameMatches) return false;
      }

      return true;
    });
  }

  constructor(
    private authService: AuthService,
    public authModalService: AuthModalService,
    private reviewService: ReviewService,
    private orderService: OrderService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private sidebarService: SidebarService,
    private negotiationService: NegotiationService,
    private deliveryService: DeliveryService,
    private invoiceService: InvoiceService,
    private paymentService: PaymentService,
    private cropService: CropService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.currentUser = u;
      if (u) {
        const uid = String(u.id || u.userId || 'dealer-1');
        this.walletService.getWallet(uid).subscribe(w => {
          this.currentWalletBalance = w.balance;
        });
      }
    });

    this.cropService.crops$.subscribe((cropsList: Crop[]) => {
      this.crops = (cropsList || [])
        .filter((c: Crop) => c.status !== 'DELETED' && c.status !== 'BLOCKED')
        .map((c: Crop) => this.mapCropToCard(c));
    });

    this.cropService.getAllCrops().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.crops = data
            .filter((c: Crop) => c.status !== 'DELETED' && c.status !== 'BLOCKED')
            .map((c: Crop) => this.mapCropToCard(c));
        }
      },
      error: () => {}
    });
  }

  private mapCropToCard(crop: Crop): CropCard {
    const cropName = crop.cropName || (crop as any).commodity || 'Fresh Harvest';
    const qty = Number(crop.quantity !== undefined ? crop.quantity : (crop.availableQuantity || 0));
    const price = Number(crop.pricePerUnit !== undefined ? crop.pricePerUnit : ((crop as any).pricePerKg || 0));
    const loc = crop.location || '';
    const st = crop.state || this.parseStateFromLoc(loc) || 'India';
    const dist = crop.district || this.parseDistrictFromLoc(loc) || '';
    return {
      id: crop.id || crop.cropId || ('cr-' + Date.now()),
      name: cropName,
      category: crop.cropType || 'Produce',
      grade: (crop.variety && crop.variety.toLowerCase().includes('b')) ? 'Grade B' : 'Grade A',
      image: crop.imageUrl || this.getDefaultImageForCrop(cropName),
      pricePerKg: price,
      govMspPrice: crop.govMspPrice,
      state: st,
      district: dist,
      rawLocation: loc || (dist ? `${dist}, ${st}` : st),
      availableQuantity: qty,
      unit: crop.unit || 'Kg',
      farmerName: crop.farmerName || 'Verified Farmer',
      farmerId: crop.farmerId || 'farmer-1',
      farmerPhone: crop.farmerPhone || '+91 98000 00000',
      description: crop.description || (crop.variety ? `Variety: ${crop.variety}` : '')
    };
  }

  private parseStateFromLoc(loc: string): string {
    if (!loc) return '';
    const parts = loc.split(',').map(s => s.trim());
    return parts.length > 1 ? parts[parts.length - 1] : parts[0];
  }

  private parseDistrictFromLoc(loc: string): string {
    if (!loc) return '';
    const parts = loc.split(',').map(s => s.trim());
    if (parts.length >= 3) return parts[1];
    if (parts.length === 2) return parts[0];
    return '';
  }

  private getDefaultImageForCrop(name: string): string {
    const n = (name || '').toLowerCase();
    if (n.includes('rice') || n.includes('paddy')) return '/assets/images/crop-rice.jpg';
    if (n.includes('wheat')) return '/assets/images/crop-wheat.jpg';
    if (n.includes('maize') || n.includes('corn')) return '/assets/images/crop-maize.jpg';
    if (n.includes('tomato')) return '/assets/images/crop-tomato.jpg';
    if (n.includes('onion')) return '/assets/images/crop-onion.jpg';
    if (n.includes('potato')) return '/assets/images/crop-potato.jpg';
    if (n.includes('chilli') || n.includes('chili')) return '/assets/images/crop-chili.jpg';
    if (n.includes('groundnut') || n.includes('peanut')) return '/assets/images/crop-groundnut.jpg';
    if (n.includes('cotton')) return '/assets/images/crop-cotton.jpg';
    if (n.includes('sugarcane')) return '/assets/images/crop-sugarcane.jpg';
    if (n.includes('banana')) return '/assets/images/crop-banana.jpg';
    if (n.includes('turmeric')) return '/assets/images/crop-turmeric.jpg';
    return '/assets/images/crop-wheat.jpg';
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCrops.length / this.pageSize));
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginatedCrops(): CropCard[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCrops.slice(start, start + this.pageSize);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getCropRating(crop: CropCard): { avg: number; count: number } {
    return this.reviewService.getAverageRating(crop.name);
  }

  getCropReviews(crop: CropCard): FarmerReview[] {
    return this.reviewService.getReviewsForCrop(crop.name);
  }

  onImgError(event: any): void {
    event.target.src = '/assets/images/crop-rice.jpg';
  }

  onGuestAction(action: 'purchase' | 'negotiate', crop: CropCard): void {
    const verb = action === 'purchase' ? 'purchase' : 'negotiate price for';
    this.authModalService.open(`Authentication Required: Please sign in or quick-login to ${verb} ${crop.name}.`);
  }

  // =========================================================================
  // MODAL 1: EXPANDED CROP DETAILS & REVIEWS ONLY
  // =========================================================================
  openCropDetails(crop: CropCard): void {
    const freshest = this.crops.find(c => c.id === crop.id || (c.name && crop.name && c.name.toLowerCase() === crop.name.toLowerCase())) || crop;
    this.selectedCrop = { ...freshest };
    const fId = freshest.farmerId || freshest.farmerName || 'farmer-1';
    this.farmerReviewsForBuy = this.reviewService.getReviewsForFarmer(fId);
  }

  closeCropDetails(): void {
    this.selectedCrop = null;
  }

  openBuyModalFromDetails(crop: CropCard): void {
    this.closeCropDetails();
    this.onPurchaseClick(crop);
  }

  openNegotiateModalFromDetails(crop: CropCard): void {
    this.closeCropDetails();
    this.onNegotiateClick(crop);
  }

  // =========================================================================
  // MODAL 2: DIRECT PURCHASE & 3-STEP CHECKOUT SIMULATOR
  // =========================================================================
  onPurchaseClick(crop: CropCard): void {
    if (!this.currentUser) {
      this.onGuestAction('purchase', crop);
      return;
    }
    if (this.currentUser.role !== 'DEALER') {
      this.actionMessage = '⚠️ Only registered commercial dealers can purchase crops. Other users can view harvest details.';
      setTimeout(() => this.actionMessage = '', 4500);
      return;
    }
    this.openBuyModal(crop);
  }

  openBuyModal(crop: CropCard): void {
    const freshest = this.crops.find(c => c.id === crop.id || (c.name && crop.name && c.name.toLowerCase() === crop.name.toLowerCase())) || crop;
    this.selectedCropForBuy = { ...freshest };
    this.checkoutStep = 'DETAILS';
    const maxStock = freshest.availableQuantity || 0;
    this.orderQuantity = Math.max(1, Math.min(10, maxStock));
    this.fulfillmentType = 'DELIVERY_AGENT';
    this.distanceKm = 20;
    this.deliveryAddress = this.currentUser?.address || 'Apex Commercial Warehouse Hub, Yard 4, New Delhi';
    this.paymentMethod = 'STRIPE_CARD';
    this.processingPayment = false;
    this.completedOrder = null;
    this.completedInvoice = null;
    this.selectedInvoiceForView = null;

    const uid = String(this.currentUser?.id || this.currentUser?.userId || 'dealer-1');
    this.walletService.getWallet(uid).subscribe(w => {
      this.currentWalletBalance = w.balance;
    });
  }

  onOrderQuantityChange(val: any): void {
    if (!this.selectedCropForBuy) return;
    const maxStock = this.selectedCropForBuy.availableQuantity || 0;
    let num = Number(val);
    if (isNaN(num) || num < 1) {
      num = 1;
    }
    if (num > maxStock) {
      num = maxStock;
    }
    this.orderQuantity = num;
  }

  get cropSubtotal(): number {
    return this.selectedCropForBuy ? (this.orderQuantity * this.selectedCropForBuy.pricePerKg) : 0;
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

  setCustomAddressPreset(type: 'profile' | 'warehouse' | 'port'): void {
    if (type === 'profile') {
      this.deliveryAddress = this.currentUser?.address || 'Kisan Agro Terminal, GT Road, Karnal, Haryana';
    } else if (type === 'warehouse') {
      this.deliveryAddress = 'Apex Commercial Warehouse Hub, Yard 4, Mandi Complex, New Delhi 110036';
    } else if (type === 'port') {
      this.deliveryAddress = 'Nhava Sheva Port Export Cargo Terminal, JNPT Mumbai 400707';
    }
  }

  autoFillStripeCard(): void {
    this.stripeCard = {
      cardholderName: this.currentUser?.fullName || this.currentUser?.username || 'Apex Agro Mills Ltd',
      cardNumber: '4242 4242 4242 4242',
      expiry: '12/28',
      cvc: '888',
      postalCode: '110001'
    };
  }

  goToPaymentStep(): void {
    if (!this.selectedCropForBuy) return;
    if (this.orderQuantity < 1) return;
    if (this.orderQuantity > this.selectedCropForBuy.availableQuantity) {
      alert(`Cannot order more than available quantity (${this.selectedCropForBuy.availableQuantity} ${this.selectedCropForBuy.unit}).`);
      this.orderQuantity = this.selectedCropForBuy.availableQuantity;
      return;
    }
    if (this.fulfillmentType === 'DELIVERY_AGENT' && !this.deliveryAddress) return;
    this.checkoutStep = 'PAYMENT';
  }

  processPayment(): void {
    if (!this.selectedCropForBuy || !this.currentUser) return;
    const uid = String(this.currentUser.id || this.currentUser.userId || 'dealer-1');

    if (this.paymentMethod === 'WALLET') {
      if (this.currentWalletBalance < this.totalPayable) {
        alert(`Insufficient Wallet Balance!\n\nRequired: ₹${this.totalPayable.toLocaleString()}\nAvailable in Wallet: ₹${this.currentWalletBalance.toLocaleString()}\n\nOrder cannot be placed. Please recharge your wallet or choose another payment method.`);
        return;
      }

      this.processingPayment = true;
      this.paymentProgressMessage = 'Verifying and reserving wallet escrow balance...';
      setTimeout(() => {
        this.walletService.debitWallet(
          uid,
          this.totalPayable,
          `Payment for Order #${this.selectedCropForBuy?.name} (${this.orderQuantity} ${this.selectedCropForBuy?.unit})`
        ).subscribe({
          next: (res) => {
            if (!res.success) {
              this.processingPayment = false;
              alert(res.message);
              return;
            }
            this.currentWalletBalance = res.balance !== undefined ? res.balance : (this.currentWalletBalance - this.totalPayable);
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

    // Stripe, UPI, NetBanking simulation
    this.processingPayment = true;
    this.paymentProgressMessage = this.paymentMethod === 'STRIPE_CARD'
      ? 'Connecting to Stripe Tokenization Gateway...'
      : (this.paymentMethod === 'UPI' ? 'Awaiting UPI Mandate confirmation...' : 'Clearing mandate with commercial clearing bank...');

    setTimeout(() => {
      this.paymentProgressMessage = 'Authenticating Escrow Mandate...';
      setTimeout(() => {
        this.finalizeOrderPlacement();
      }, 800);
    }, 900);
  }

  private finalizeOrderPlacement(): void {
    const crop = this.selectedCropForBuy!;
    const cropName = crop.name;
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
      : (crop.state + ', India');

    // Order payload
    const orderReq: any = {
      id: orderId,
      cropId: crop.id || 'crop-101',
      dealerId: this.currentUser?.id || this.currentUser?.userId || 'dealer-1',
      farmerId: crop.farmerId || 'farmer-1',
      dealerName: this.currentUser?.fullName || this.currentUser?.username || 'Apex Agro Mills Ltd',
      dealerPhone: this.currentUser?.phone || '+91 98722 55667',
      farmerName: crop.farmerName || 'Sardar Gurpreet Singh',
      farmerPhone: crop.farmerPhone || '+91 98140 11223',
      cropName: cropName,
      quantity: this.orderQuantity,
      unit: cropUnit,
      pricePerUnit: crop.pricePerKg,
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
      isBidding: false,
      createdAt: new Date().toISOString()
    };

    // Invoice structure per Rule 46 of CGST Rules
    const inv: Invoice = {
      id: 'inv-' + orderId,
      invoiceNumber: 'CD-INV-2026-' + orderId.replace('ORD-', ''),
      orderId: orderId,
      dealerId: this.currentUser?.id || this.currentUser?.userId || 'dealer-1',
      dealerName: this.currentUser?.fullName || this.currentUser?.username || 'Apex Agro Mills Ltd',
      dealerPhone: this.currentUser?.phone || '+91 98722 55667',
      dealerAddress: effectiveDropAddress,
      dealerGstin: '07AABCC8901Z1Z8',
      farmerId: crop.farmerId || 'farmer-1',
      farmerName: crop.farmerName || 'Sardar Gurpreet Singh',
      farmerPhone: crop.farmerPhone || '+91 98140 11223',
      farmerAddress: crop.state + ', India',
      farmerPan: 'AABPG7812F',
      cropName: cropName,
      cropVariety: crop.category || 'Grade-A Certified Harvest',
      hsnCode: crop.name?.toLowerCase().includes('rice') ? '1006' :
               (crop.name?.toLowerCase().includes('mustard') ? '1207' :
               (crop.name?.toLowerCase().includes('onion') || crop.name?.toLowerCase().includes('tomato') ? '0703' : '1001')),
      quantity: this.orderQuantity,
      unit: cropUnit,
      pricePerUnit: crop.pricePerKg,
      govMspPrice: crop.govMspPrice || Math.round(crop.pricePerKg * 0.92),
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

    // Debit Dealer's Wallet if paying via wallet
    if (this.paymentMethod === 'WALLET') {
      const buyerId = String(this.currentUser?.id || this.currentUser?.userId || 'dealer-1');
      this.walletService.debitWallet(
        buyerId,
        finalTotal,
        `Crop Purchase: ${cropName} (${this.orderQuantity} ${cropUnit}) - Order #${orderId}`
      ).subscribe();
    }

    // Credit Farmer's Digital Wallet for crop purchase proceeds
    const farmerTargetId = String(crop.farmerId || 'farmer-1');
    const farmerProceeds = this.cropSubtotal;
    this.walletService.creditWallet(
      farmerTargetId,
      farmerProceeds,
      `Crop Sale Proceeds for ${cropName} (${this.orderQuantity} ${cropUnit}) - Order #${orderId}`
    ).subscribe();

    // Deduct stock: if full stocks are purchased, post is deleted automatically. If partial, available stock is updated.
    const remainingStock = Math.max(0, crop.availableQuantity - this.orderQuantity);
    const cropId = String(crop.id);
    if (remainingStock <= 0) {
      crop.availableQuantity = 0;
      this.crops = this.crops.filter(c => c.id !== crop.id && c.name.toLowerCase() !== cropName.toLowerCase());
      this.cropService.deleteCrop(cropId).subscribe();
    } else {
      crop.availableQuantity = remainingStock;
      this.crops = this.crops.map(c => (c.id === crop.id || c.name.toLowerCase() === cropName.toLowerCase()) ? { ...c, availableQuantity: remainingStock } : c);
      this.cropService.reduceQuantity(cropId, this.orderQuantity).subscribe();
      this.cropService.updateCrop(cropId, { quantity: remainingStock, availableQuantity: remainingStock } as any).subscribe();
    }

    // Dispatch delivery if delivery agent chosen
    if (this.fulfillmentType === 'DELIVERY_AGENT') {
      this.deliveryService.createDelivery({
        orderId: orderId,
        dealerId: this.currentUser?.id || this.currentUser?.userId || 'dealer-1',
        farmerId: crop.farmerId || 'farmer-1',
        cropName: cropName,
        cropQuantity: this.orderQuantity,
        cropUnit: cropUnit,
        farmerName: crop.farmerName || null,
        farmerPhone: crop.farmerPhone || null,
        pickupAddress: crop.state || null,
        dealerName: this.currentUser?.fullName || this.currentUser?.username || null,
        dealerPhone: this.currentUser?.phone || null,
        dropAddress: effectiveDropAddress,
        distanceKm: this.distanceKm,
        deliveryFee: deliveryFee,
        fulfillmentType: 'DELIVERY_AGENT',
        status: 'PENDING_ASSIGNMENT'
      }).subscribe();
    } else {
      this.deliveryService.createDelivery({
        orderId: orderId,
        fulfillmentType: 'SELF_PICKUP',
        dealerId: this.currentUser?.id || this.currentUser?.userId || null,
        farmerId: crop.farmerId || null,
        cropName: cropName,
        cropQuantity: this.orderQuantity,
        cropUnit: cropUnit,
        farmerName: crop.farmerName || null,
        farmerPhone: crop.farmerPhone || null,
        pickupAddress: crop.state || null,
        dealerName: this.currentUser?.fullName || this.currentUser?.username || null,
        dealerPhone: this.currentUser?.phone || null,
        dropAddress: 'Self Pickup by Dealer',
        status: 'DELIVERED'
      }).subscribe();
    }

    const numOrderId = parseInt(String(orderId).replace(/\D/g, ''), 10) || 1001;
    const numDealerId = parseInt(String(this.currentUser?.id || this.currentUser?.userId || '2').replace(/\D/g, ''), 10) || 2;
    const numFarmerId = parseInt(String(crop.farmerId || '1').replace(/\D/g, ''), 10) || 1;

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
        this.processingPayment = false;
        this.checkoutStep = 'SUCCESS';
      },
      error: () => {
        this.processingPayment = false;
        this.checkoutStep = 'SUCCESS';
      }
    });

    // Send notifications to Dealer and Farmer
    const dealerId = this.currentUser?.id || this.currentUser?.userId || 'dealer-1';
    const farmerId = crop.farmerId || 'farmer-1';
    const dealerName = this.currentUser?.fullName || this.currentUser?.username || 'Commercial Dealer';
    const farmerName = crop.farmerName || 'Farmer';

    this.notificationService.sendNotification(
      dealerId,
      '📦 Order Confirmed & Paid',
      `Your order #${orderId} for ${cropName} (${this.orderQuantity} ${cropUnit}) has been confirmed and paid. Total: ₹${finalTotal.toLocaleString()}.`,
      'ORDER',
      'dealer'
    );
    this.notificationService.sendNotification(
      farmerId,
      '🎉 Crop Purchased by Dealer',
      `Dealer ${dealerName} purchased your crop "${cropName}" (${this.orderQuantity} ${cropUnit}). Total earned: ₹${this.cropSubtotal.toLocaleString()}. Check your wallet for credited funds!`,
      'ORDER',
      'farmer'
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

  // =========================================================================
  // MODAL 4: DIRECT NEGOTIATION PROPOSAL
  // =========================================================================
  onNegotiateClick(crop: CropCard): void {
    if (!this.currentUser) {
      this.onGuestAction('negotiate', crop);
      return;
    }
    this.openNegotiateModal(crop);
  }

  openNegotiateModal(crop: CropCard): void {
    this.selectedCropForNeg = crop;
    this.proposedPrice = Math.round(crop.pricePerKg * 0.95);
    this.negotiationQty = Math.min(50, crop.availableQuantity);
    this.negotiationNotes = '';
  }

  submitNegotiation(): void {
    if (!this.selectedCropForNeg || !this.currentUser) return;
    const crop = this.selectedCropForNeg;
    if (!this.proposedPrice || this.proposedPrice <= 0) {
      alert('Please enter a valid proposed offer price.');
      return;
    }
    if (this.proposedPrice >= crop.pricePerKg) {
      alert(`Proposed negotiation price (₹${this.proposedPrice}) must be lower than original listed price of ₹${crop.pricePerKg}/${crop.unit || 'Kg'}.`);
      return;
    }
    const dealerId = this.currentUser.id || this.currentUser.userId || 'dealer-1';
    const farmerId = crop.farmerId || 'farmer-1';
    const dealerName = this.currentUser.fullName || this.currentUser.username || 'Apex Agro Mills Ltd';
    const farmerName = crop.farmerName || 'Sardar Gurpreet Singh';

    const newNeg: any = {
      id: Date.now(),
      cropId: String(crop.id || 'crop-101'),
      cropName: crop.name,
      grade: crop.grade,
      quantity: `${crop.availableQuantity || 100} ${crop.unit || 'Kg'}`,
      availableStock: crop.availableQuantity || 100,
      img: crop.image,
      dealerName: dealerName,
      dealerLocation: this.currentUser.address || 'Commercial Grain Terminal, Delhi',
      dealerPhone: this.currentUser.phone || '+91 98722 55667',
      farmerName: farmerName,
      farmerId: farmerId,
      dealerId: dealerId,
      standardPrice: crop.pricePerKg,
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

    this.notificationService.sendNotification(
      farmerId,
      '💬 New Price Proposal',
      `Dealer ${dealerName} proposed ₹${this.proposedPrice}/unit for ${crop.name} (Listed: ₹${crop.pricePerKg}/${crop.unit || 'Kg'}).`,
      'NEGOTIATION'
    );
    this.notificationService.sendNotification(
      dealerId,
      '💬 Proposal Sent',
      `Your price proposal of ₹${this.proposedPrice}/unit for ${crop.name} was sent to ${farmerName}.`,
      'NEGOTIATION'
    );

    this.negotiationService.createNegotiation({
      cropId: crop.id || 'crop-101',
      cropName: crop.name || 'Produce',
      dealerId: dealerId,
      dealerName: dealerName,
      farmerId: farmerId,
      farmerName: farmerName,
      originalPrice: crop.pricePerKg,
      quantity: crop.availableQuantity || 100,
      offeredPrice: this.proposedPrice,
      notes: this.negotiationNotes
    }).subscribe({
      next: () => {
        this.selectedCropForNeg = null;
        this.actionMessage = `Negotiation proposal sent directly to farmer for ₹${this.proposedPrice}/Kg.`;
        setTimeout(() => this.actionMessage = '', 5000);
      },
      error: () => {
        this.selectedCropForNeg = null;
        this.actionMessage = `Offer of ₹${this.proposedPrice} sent! Check "Negotiations" for farmer response.`;
        setTimeout(() => this.actionMessage = '', 5000);
      }
    });
  }
}
