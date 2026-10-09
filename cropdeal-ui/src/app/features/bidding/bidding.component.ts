import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { BiddingService } from '../../core/services/bidding.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { WalletService } from '../../core/services/wallet.service';
import { NotificationService } from '../../core/services/notification.service';
import { OrderService } from '../../core/services/order.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { PaymentService } from '../../core/services/payment.service';
import { CropService } from '../../core/services/crop.service';
import { User } from '../../core/models/user.model';
import { BiddingAuction, BidOffer } from '../../core/models/bidding.model';
import { Invoice } from '../../core/models/invoice.model';
import { resolveCropImage } from '../../core/utils/crop-image.util';

interface AuctionItem {
  id: string;
  cropName: string;
  variety: string;
  grade: string;
  image: string;
  location: string;
  district: string;
  state: string;
  startingPriceKg: number;
  currentBidKg: number;
  totalQuantityKg: number;
  farmerName: string;
  farmerPhone: string;
  farmerRating: number;
  farmerReviewsCount: number;
  farmerId: string;
  bidsCount: number;
  timeRemaining: string;
  isEndingSoon: boolean;
  status: 'OPEN' | 'CLOSED';
  isFavorite?: boolean;
  bidsHistory: Array<{ bidderName: string; bidPriceKg: number; bidTime: string }>;
  endTime?: string;
}

@Component({
  selector: 'app-bidding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="bidding-page">
      <!-- Farmer "My Biddings" Hero Header (matches image18.png) -->
      <section class="my-biddings-banner shadow-sm" *ngIf="isMyBiddingsMode && user?.role === 'FARMER'">
        <div class="my-biddings-overlay">
          <div>
            <h1 class="my-biddings-title">My Biddings</h1>
            <p class="my-biddings-subtitle">Track your crop auctions, live incoming dealer bids, and award or close your bidding lots.</p>
          </div>
          <div class="d-flex gap-2 align-center">
            <a routerLink="/bidding" class="btn btn-outline-light">
              <i class="fa-solid fa-gavel"></i> View Live Floor
            </a>
            <button class="btn-create-auction" (click)="openCreateModal()">
              <i class="fa-solid fa-circle-plus"></i> Create New Bidding
            </button>
          </div>
        </div>
      </section>

      <!-- Panoramic Hero Header (matches image6.jpeg) -->
      <section class="bidding-hero shadow-sm" *ngIf="!isMyBiddingsMode || user?.role !== 'FARMER'">
        <div class="hero-overlay">
          <h1 class="hero-title">
            Live <span class="text-green-brand">Bidding</span>
          </h1>
          <p class="hero-desc">
            Bid directly from farmers and get the best farm fresh produce at competitive prices.
          </p>

          <!-- 3 Feature Pills (matches image6.jpeg) -->
          <div class="feature-pills-row">
            <div class="bidding-pill">
              <div class="pill-icon-circle bg-emerald-light">
                <i class="fa-solid fa-leaf text-emerald"></i>
              </div>
              <div class="pill-text-group">
                <strong>Direct from Farmers</strong>
                <span>Fresh & Quality Produce</span>
              </div>
            </div>

            <div class="bidding-pill">
              <div class="pill-icon-circle bg-green-light">
                <i class="fa-solid fa-shield-halved text-emerald"></i>
              </div>
              <div class="pill-text-group">
                <strong>Transparent Bidding</strong>
                <span>Fair and Secure</span>
              </div>
            </div>

            <div class="bidding-pill">
              <div class="pill-icon-circle bg-teal-light">
                <i class="fa-solid fa-truck text-emerald"></i>
              </div>
              <div class="pill-text-group">
                <strong>Better Prices</strong>
                <span>Save More</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Filter Row & Farmer Action (matches image6.jpeg & image18.png) -->
      <div class="card filter-bar-card">
        <div class="filters-row">
          <div class="filter-col">
            <label><i class="fa-solid fa-location-dot text-emerald"></i> State</label>
            <select [(ngModel)]="filterState" class="filter-dropdown">
              <option value="All">All States</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Punjab">Punjab</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>
          </div>

          <div class="filter-col">
            <label><i class="fa-solid fa-city text-emerald"></i> District</label>
            <select [(ngModel)]="filterDistrict" class="filter-dropdown">
              <option value="All">All Districts</option>
              <option value="Coimbatore">Coimbatore</option>
              <option value="Chennai">Chennai</option>
              <option value="Dindigul">Dindigul</option>
              <option value="Erode">Erode</option>
              <option value="Namakkal">Namakkal</option>
              <option value="Salem">Salem</option>
              <option value="Madurai">Madurai</option>
            </select>
          </div>

          <div class="filter-col">
            <label><i class="fa-solid fa-wheat-awn text-emerald"></i> Commodity</label>
            <select [(ngModel)]="filterCommodity" class="filter-dropdown">
              <option value="All">All Commodities</option>
              <option value="Paddy (Rice)">Paddy (Rice)</option>
              <option value="Tomato">Tomato</option>
              <option value="Onion">Onion</option>
              <option value="Potato">Potato</option>
              <option value="Groundnut">Groundnut</option>
              <option value="Maize">Maize</option>
              <option value="Red Chilli">Red Chilli</option>
              <option value="Green Chilli">Green Chilli</option>
            </select>
          </div>

          <div class="filter-col">
            <label><i class="fa-solid fa-arrow-down-wide-short text-emerald"></i> Sort By</label>
            <select [(ngModel)]="filterSort" class="filter-dropdown">
              <option value="ending">Ending Soon</option>
              <option value="highest">Highest Bid</option>
              <option value="lowest">Lowest Bid</option>
              <option value="quantity">Largest Quantity</option>
            </select>
          </div>

          <div class="filter-col search-col">
            <label>&nbsp;</label>
            <div class="search-input-wrap">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" [(ngModel)]="searchQuery" placeholder="Search crops, variety or farmer..." class="bidding-search-input" />
            </div>
          </div>

          <div class="filter-col btn-col">
            <label>&nbsp;</label>
            <button class="btn-filter-search">
              <i class="fa-solid fa-magnifying-glass"></i> Search
            </button>
          </div>
        </div>

        <div class="farmer-create-bar" *ngIf="user?.role === 'FARMER'">
          <button class="btn-create-auction" (click)="openCreateModal()">
            <i class="fa-solid fa-circle-plus"></i> Create New Bidding
          </button>
        </div>
      </div>

      <!-- Toast Message -->
      <div *ngIf="toastMsg" class="alert-toast shadow-md">
        <i class="fa-solid fa-circle-check"></i>
        <span>{{ toastMsg }}</span>
      </div>

      <!-- 8-Card Auction Grid (matches image6.jpeg) -->
      <div class="auctions-grid">
        <div *ngIf="pagedAuctions.length === 0" class="empty-auctions-card" style="grid-column: 1 / -1; padding: 3.5rem 1.5rem; text-align: center; border: 1px dashed var(--border-light); background: #f8fafc; border-radius: 12px; margin-top: 1rem;">
          <i class="fa-solid fa-gavel" style="font-size: 3rem; margin-bottom: 0.75rem; color: #94a3b8;"></i>
          <h3 style="margin: 0; color: #1e293b; font-weight: 800;">No Live Biddings Active</h3>
          <p style="margin: 0.5rem 0 0; color: #64748b; font-size: 0.9rem;">Farmer-hosted bidding floors will appear here dynamically as auctions are launched.</p>
        </div>

        <div *ngFor="let item of pagedAuctions" class="auction-card shadow-sm">
          <!-- Card Media Header with Countdown Timer & Badges -->
          <div class="card-media-wrap">
            <img [src]="item.image" [alt]="item.cropName" class="auction-thumb" (error)="onThumbError($event)" />

            <!-- Status Badge: Ending Soon or Live Bidding -->
            <span class="status-pill" [ngClass]="item.isEndingSoon ? 'pill-ending' : 'pill-live'">
              <span class="status-dot"></span>
              {{ item.isEndingSoon ? 'Ending Soon' : 'Live Bidding' }}
            </span>

            <!-- Timer Badge -->
            <span class="timer-badge">
              <i class="fa-regular fa-clock"></i> {{ item.timeRemaining }}
            </span>
          </div>

          <!-- Card Content Body -->
          <div class="auction-card-body">
            <div class="crop-header-line">
              <h3 class="crop-name">{{ item.cropName }}</h3>
              <span class="crop-variety">{{ item.variety }}</span>
            </div>

            <div class="location-line">
              <i class="fa-solid fa-location-dot"></i> {{ item.location }}
            </div>

            <!-- Stats Row: Farmer Fixed Price & Current Highest Bid -->
            <div class="bid-stats-box">
              <div class="stat-col">
                <span class="stat-lbl">Farmer Fixed Price</span>
                <span class="stat-val text-dark">₹{{ item.startingPriceKg | number:'1.2-2' }} <small>/ Kg</small></span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-col">
                <span class="stat-lbl">Current Highest Bid</span>
                <span class="stat-val text-emerald">
                  <ng-container *ngIf="item.bidsCount > 0">₹{{ item.currentBidKg | number:'1.2-2' }} <small>/ Kg</small></ng-container>
                  <ng-container *ngIf="item.bidsCount === 0"><small class="text-muted">Awaiting 1st Bid</small></ng-container>
                </span>
              </div>
            </div>

            <!-- Total Lot Quantity & Latest Bid Indicator -->
            <div class="lot-qty-row">
              <div class="lot-qty-pill">
                <i class="fa-solid fa-boxes-stacked text-emerald"></i>
                <span>Lot: <strong>{{ item.totalQuantityKg | number:'1.0-0' }} Kg</strong></span>
              </div>
              <div class="lot-qty-pill" *ngIf="item.bidsHistory && item.bidsHistory.length > 0">
                <i class="fa-solid fa-clock-rotate-left text-muted"></i>
                <span>Latest: <strong class="text-emerald">₹{{ item.bidsHistory[0].bidPriceKg | number:'1.2-2' }}/Kg</strong></span>
              </div>
            </div>

            <!-- Farmer Info & Bid Count Row -->
            <div class="farmer-row">
              <div class="farmer-ident">
                <div class="farmer-circle">
                  <i class="fa-regular fa-user"></i>
                </div>
                <div class="farmer-names">
                  <strong>{{ item.farmerName !== null && item.farmerName !== undefined ? item.farmerName : 'null' }}</strong>
                  <span>Farmer</span>
                </div>
              </div>
              <span class="bids-count-tag">{{ item.bidsCount }} Bids</span>
            </div>

            <!-- Action Button: Differentiates My Biddings mode vs General Live Bidding -->
            <div class="card-btn-wrap" *ngIf="isMyBiddingsMode && user?.role === 'FARMER'">
              <div class="my-bid-actions-row">
                <button *ngIf="item.status === 'OPEN'" class="btn-close-bid" (click)="closeBid(item)" title="Award crop lot to highest bidder and close auction">
                  <i class="fa-solid fa-circle-check"></i> Close Bid & Sell
                </button>
                <button *ngIf="item.status === 'OPEN'" class="btn-cancel-bid" (click)="cancelBid(item)" title="Cancel this bidding lot">
                  <i class="fa-solid fa-ban"></i> Cancel Bid
                </button>
                <span *ngIf="item.status !== 'OPEN'" class="sold-tag">
                  <i class="fa-solid fa-lock"></i> {{ item.status === 'CLOSED' ? 'Sold to ' + (item.bidsHistory.length > 0 ? item.bidsHistory[0].bidderName : 'Highest Bidder') : 'Cancelled Lot' }}
                </span>
                <button class="btn-view-bids" (click)="selectedAuction = item">
                  <i class="fa-regular fa-eye"></i> View Bids ({{ item.bidsCount }})
                </button>
              </div>
            </div>

            <div class="card-btn-wrap" *ngIf="user?.role === 'DEALER'">
              <button class="btn-place-bid" (click)="onPlaceBidClick(item)" [disabled]="item.status !== 'OPEN'">
                <i class="fa-solid fa-gavel"></i> {{ item.status === 'OPEN' ? 'Place Bid' : 'Auction Closed' }}
              </button>
            </div>
            <div class="card-btn-wrap" *ngIf="user && user.role !== 'DEALER'">
              <span class="badge badge-info" style="display: block; text-align: center; padding: 0.5rem; border-radius: 6px; font-weight: 700;">
                <i class="fa-solid fa-eye"></i> View Only (Dealer Floor)
              </span>
            </div>
            <div class="card-btn-wrap" *ngIf="!user">
              <button class="btn-place-bid" (click)="onPlaceBidClick(item)">
                <i class="fa-solid fa-arrow-right-to-bracket"></i> Login as Dealer to Bid
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination Footer -->
      <div class="pagination-footer-row" *ngIf="totalPages > 1">
        <span class="summary-text">Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredAuctions.length) }} of {{ filteredAuctions.length }} live auctions</span>
        <div class="pages-list">
          <button class="page-step-btn" [disabled]="currentPage === 1" (click)="setPage(currentPage - 1)"><i class="fa-solid fa-angle-left"></i></button>
          <button *ngFor="let p of totalPagesArray" class="page-num-btn" [class.active]="p === currentPage" (click)="setPage(p)">{{ p }}</button>
          <button class="page-step-btn" [disabled]="currentPage === totalPages" (click)="setPage(currentPage + 1)"><i class="fa-solid fa-angle-right"></i></button>
        </div>
      </div>

      <!-- AUCTION DETAIL & BID SUBMISSION MODAL (matches image7.png) -->
      <div *ngIf="selectedAuction" class="modal-backdrop">
        <div class="modal-dialog-large shadow-2xl">
          <div class="modal-header-nav">
            <button class="back-link" (click)="selectedAuction = null">
              <i class="fa-solid fa-arrow-left"></i> Back / Live Bidding / <strong>{{ selectedAuction.cropName }}</strong>
            </button>
            <button class="close-x" (click)="selectedAuction = null">&times;</button>
          </div>

          <div class="modal-grid-2col">
            <!-- Left Side: Product info, Timer & Bid Form -->
            <div class="modal-left-col">
              <div class="product-banner">
                <img [src]="selectedAuction.image" [alt]="selectedAuction.cropName" class="main-modal-img" />
                <div class="product-thumbs-strip">
                  <img [src]="selectedAuction.image" class="thumb active" />
                  <img src="/assets/images/crop-rice.jpg" class="thumb" />
                  <img src="/assets/images/crop-wheat.jpg" class="thumb" />
                  <img src="/assets/images/crop-maize.jpg" class="thumb" />
                </div>
              </div>

              <div class="product-header mt-3">
                <div class="title-pills-row">
                  <h2>{{ selectedAuction.cropName }}</h2>
                  <span class="pill-live"><span class="status-dot"></span> Live Bidding</span>
                  <span class="pill-ending" *ngIf="selectedAuction.isEndingSoon"><span class="status-dot"></span> Ending Soon</span>
                </div>
                <div class="specs-line">
                  <span>Variety: <strong>{{ selectedAuction.variety }}</strong></span>
                  <span class="dot-sep">•</span>
                  <span>Grade: <strong>{{ selectedAuction.grade }}</strong></span>
                  <span class="dot-sep">•</span>
                  <span><i class="fa-solid fa-location-dot"></i> {{ selectedAuction.location }}</span>
                </div>
              </div>

              <!-- 4 Metrics Highlights (Farmer Fixed Price + Highest Bid + Quantity + Timer) -->
              <div class="metrics-4box mt-3">
                <div class="box">
                  <span class="lbl">Farmer Fixed Price</span>
                  <strong class="val text-dark">₹{{ selectedAuction.startingPriceKg | number:'1.2-2' }} <small>/ Kg</small></strong>
                </div>
                <div class="box">
                  <span class="lbl">Current Highest Bid</span>
                  <strong class="val text-emerald">
                    <ng-container *ngIf="selectedAuction.bidsCount > 0">₹{{ selectedAuction.currentBidKg | number:'1.2-2' }} <small>/ Kg</small></ng-container>
                    <ng-container *ngIf="selectedAuction.bidsCount === 0"><small class="text-muted">Awaiting 1st Bid</small></ng-container>
                  </strong>
                </div>
                <div class="box">
                  <span class="lbl">Lot Quantity</span>
                  <strong class="val">{{ selectedAuction.totalQuantityKg | number:'1.0-0' }} Kg</strong>
                </div>
                <div class="box">
                  <span class="lbl">Time Remaining</span>
                  <strong class="val text-danger"><i class="fa-regular fa-clock"></i> {{ selectedAuction.timeRemaining }}</strong>
                </div>
              </div>

              <!-- Place Bid Form Box -->
              <div class="bid-submission-box mt-3">
                <div class="bid-box-title">
                  <i class="fa-solid fa-gavel text-emerald"></i>
                  <h4>Place Your Bid</h4>
                  <span class="subtext">Your bid must be strictly higher than the current highest bid (₹{{ selectedAuction.currentBidKg | number:'1.2-2' }}/Kg)</span>
                </div>

                <div class="bid-inputs-row mt-3">
                  <div class="input-cell">
                    <label>Your Bid Price (₹ / Kg) *</label>
                    <input
                      type="number"
                      step="0.5"
                      [min]="selectedAuction.currentBidKg + 0.5"
                      [(ngModel)]="userBidPrice"
                      (ngModelChange)="onBidPriceChange()"
                      class="bid-num-input"
                    />
                  </div>

                  <div class="calc-cell">
                    <span class="calc-lbl">Total Amount (Estimated)</span>
                    <strong class="calc-val text-emerald">₹{{ calculatedTotalAmount | number:'1.0-0' }}</strong>
                    <span class="calc-sub">({{ selectedAuction.totalQuantityKg }} Kg × ₹{{ userBidPrice || 0 }})</span>
                  </div>
                </div>

                <!-- Quick Incremental Bid Selectors -->
                <div class="quick-bid-chips-wrap mt-2">
                  <span class="quick-lbl"><i class="fa-solid fa-bolt text-amber"></i> Quick Raise:</span>
                  <div class="quick-btns-row">
                    <button type="button" class="btn-quick-bid" (click)="setQuickBid(1)">+ ₹1 (₹{{ (selectedAuction.currentBidKg + 1) | number:'1.2-2' }})</button>
                    <button type="button" class="btn-quick-bid" (click)="setQuickBid(2)">+ ₹2 (₹{{ (selectedAuction.currentBidKg + 2) | number:'1.2-2' }})</button>
                    <button type="button" class="btn-quick-bid" (click)="setQuickBid(5)">+ ₹5 (₹{{ (selectedAuction.currentBidKg + 5) | number:'1.2-2' }})</button>
                    <button type="button" class="btn-quick-bid" (click)="setQuickBid(10)">+ ₹10 (₹{{ (selectedAuction.currentBidKg + 10) | number:'1.2-2' }})</button>
                  </div>
                </div>

                <!-- Validation Alert Banner -->
                <div *ngIf="userBidPrice && userBidPrice <= selectedAuction.currentBidKg" class="alert alert-danger p-2 mt-2 text-xs">
                  <i class="fa-solid fa-triangle-exclamation"></i>
                  Your bid (₹{{ userBidPrice | number:'1.2-2' }}/Kg) must be strictly higher than the current highest bid of ₹{{ selectedAuction.currentBidKg | number:'1.2-2' }}/Kg.
                </div>

                <div class="quantity-locked-line mt-2">
                  <span>Commitment:</span>
                  <strong>{{ selectedAuction.totalQuantityKg }} Kg (Full harvest lot purchase)</strong>
                </div>

                <!-- Wallet Escrow Requirement Indicator -->
                <div class="wallet-escrow-box mt-3" [ngClass]="dealerWalletBalance >= calculatedTotalAmount ? 'escrow-ok' : 'escrow-low'">
                  <div class="d-flex justify-content-between align-center">
                    <div>
                      <span class="text-xs text-muted d-block"><i class="fa-solid fa-wallet text-emerald"></i> Your Digital Wallet Balance</span>
                      <strong class="text-base text-dark">₹{{ dealerWalletBalance | number:'1.2-2' }}</strong>
                    </div>
                    <span class="badge" [ngClass]="dealerWalletBalance >= calculatedTotalAmount ? 'badge-success' : 'badge-danger'">
                      {{ dealerWalletBalance >= calculatedTotalAmount ? '✓ Wallet Sufficient' : '⚠️ Insufficient Funds' }}
                    </span>
                  </div>
                  <div class="escrow-rule-text mt-2 text-xs" *ngIf="dealerWalletBalance < calculatedTotalAmount">
                    <i class="fa-solid fa-triangle-exclamation text-danger"></i>
                    Bidding requires sufficient wallet balance to buy the full lot (₹{{ calculatedTotalAmount | number:'1.0-0' }}). Please top up your wallet to place this bid.
                  </div>
                  <div class="escrow-rule-text mt-2 text-xs text-emerald" *ngIf="dealerWalletBalance >= calculatedTotalAmount">
                    <i class="fa-solid fa-shield-halved"></i>
                    Bidding purchases are paid using wallet balance. ₹{{ calculatedTotalAmount | number:'1.0-0' }} is verified from your wallet.
                  </div>
                </div>

                <button
                  class="btn-submit-auction-bid mt-3"
                  (click)="submitBidOnAuction()"
                  [disabled]="dealerWalletBalance < calculatedTotalAmount || !isBidAmountValid() || user?.role !== 'DEALER'">
                  <i class="fa-solid fa-gavel"></i>
                  <ng-container *ngIf="!isBidAmountValid()">
                    <span *ngIf="selectedAuction.bidsCount === 0">Bid Must Be Equal to or Higher Than ₹{{ selectedAuction.startingPriceKg | number:'1.2-2' }}/Kg</span>
                    <span *ngIf="selectedAuction.bidsCount > 0">Bid Must Be Higher Than ₹{{ selectedAuction.currentBidKg | number:'1.2-2' }}/Kg</span>
                  </ng-container>
                  <ng-container *ngIf="isBidAmountValid() && dealerWalletBalance < calculatedTotalAmount">
                    Insufficient Wallet Balance to Bid
                  </ng-container>
                  <ng-container *ngIf="isBidAmountValid() && dealerWalletBalance >= calculatedTotalAmount">
                    Place Bid of ₹{{ userBidPrice | number:'1.2-2' }}/Kg with Wallet
                  </ng-container>
                </button>
              </div>
            </div>

            <!-- Right Side: Farmer Details, Auction Details, Live Bids -->
            <div class="modal-right-col">
              <!-- Farmer Details Card (matches image7.png) -->
              <div class="detail-card">
                <h4 class="card-sec-title">Farmer Details</h4>
                <div class="farmer-profile-row">
                  <div class="farmer-avatar-lg">
                    <i class="fa-solid fa-user"></i>
                  </div>
                  <div class="farmer-profile-info">
                    <div class="f-name-row">
                      <strong>{{ selectedAuction.farmerName !== null && selectedAuction.farmerName !== undefined ? selectedAuction.farmerName : 'null' }}</strong>
                      <span class="verified-tag">✓ Verified Farmer</span>
                    </div>
                    <span class="f-sub">Producer</span>
                    <div class="rating-line">
                      ⭐ <strong>{{ selectedAuction.farmerRating }}</strong> ({{ selectedAuction.farmerReviewsCount }} reviews)
                    </div>
                  </div>
                </div>

                <div class="farmer-contact-list mt-2">
                  <div><i class="fa-solid fa-location-dot"></i> {{ selectedAuction.location !== null && selectedAuction.location !== undefined ? selectedAuction.location : 'null' }}</div>
                  <div><i class="fa-solid fa-phone"></i> {{ selectedAuction.farmerPhone !== null && selectedAuction.farmerPhone !== undefined ? selectedAuction.farmerPhone : 'null' }}</div>
                </div>
              </div>

              <!-- Auction Details (matches image7.png) -->
              <div class="detail-card mt-3">
                <h4 class="card-sec-title">Auction Details</h4>
                <div class="details-kv-list">
                  <div class="kv-line"><span class="k">Auction Type</span><span class="v">Live Bidding</span></div>
                  <div class="kv-line"><span class="k">Start Time</span><span class="v">29 Sep 2026, 10:00 AM</span></div>
                  <div class="kv-line"><span class="k">End Time</span><span class="v">29 Sep 2026, 01:00 PM</span></div>
                  <div class="kv-line"><span class="k">Total Quantity</span><span class="v">{{ selectedAuction.totalQuantityKg }} Kg</span></div>
                  <div class="kv-line"><span class="k">Commodity</span><span class="v">{{ selectedAuction.cropName }}</span></div>
                  <div class="kv-line"><span class="k">Variety</span><span class="v">{{ selectedAuction.variety !== null && selectedAuction.variety !== undefined ? selectedAuction.variety : 'null' }}</span></div>
                  <div class="kv-line"><span class="k">Grade</span><span class="v">{{ selectedAuction.grade !== null && selectedAuction.grade !== undefined ? selectedAuction.grade : 'null' }}</span></div>
                  <div class="kv-line"><span class="k">State</span><span class="v">{{ selectedAuction.state !== null && selectedAuction.state !== undefined ? selectedAuction.state : 'null' }}</span></div>
                </div>
              </div>

              <!-- Latest 5 Bids History Table -->
              <div class="detail-card mt-3">
                <div class="bids-history-header">
                  <h4 class="card-sec-title">
                    <i class="fa-solid fa-list-ol text-emerald"></i> Latest 5 Bids
                  </h4>
                  <span class="badge-count">{{ selectedAuction.bidsHistory ? Math.min(5, selectedAuction.bidsHistory.length) : 0 }} of {{ selectedAuction.bidsCount || 0 }} Bids</span>
                </div>

                <div class="bids-table-wrap">
                  <table class="bids-table" *ngIf="selectedAuction.bidsHistory && selectedAuction.bidsHistory.length > 0">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Bidder Name</th>
                        <th>Bid Price (₹/Kg)</th>
                        <th>Bid Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let b of selectedAuction.bidsHistory.slice(0, 5); let i = index" [class.lead-bid]="i === 0">
                        <td>
                          <span *ngIf="i === 0" class="lead-badge"><i class="fa-solid fa-crown text-amber"></i> #1 Highest</span>
                          <span *ngIf="i > 0">#{{ i + 1 }}</span>
                        </td>
                        <td><strong>{{ b.bidderName }}</strong></td>
                        <td class="text-emerald font-bold">₹{{ b.bidPriceKg | number:'1.2-2' }}</td>
                        <td class="text-muted">{{ b.bidTime }}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div *ngIf="!selectedAuction.bidsHistory || selectedAuction.bidsHistory.length === 0" class="p-3 text-center text-muted" style="background: #f8fafc; border-radius: 6px;">
                    <i class="fa-solid fa-gavel text-muted" style="font-size: 1.5rem; display: block; margin-bottom: 0.35rem;"></i>
                    <p style="margin: 0; font-size: 0.8rem;">No bids placed yet. Starting floor price is <strong>₹{{ selectedAuction.startingPriceKg | number:'1.2-2' }}/Kg</strong>. Place the first bid above!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create New Bidding Modal (Farmer Only) -->
      <div *ngIf="showCreateModal" class="modal-backdrop">
        <div class="modal-dialog-small shadow-xl">
          <div class="modal-header-simple">
            <h3><i class="fa-solid fa-gavel text-amber"></i> Create New Crop Auction</h3>
            <button class="close-x" (click)="showCreateModal = false">&times;</button>
          </div>
          <div class="modal-body-simple">
            <div class="form-group">
              <label>Crop / Commodity *</label>
              <input type="text" [(ngModel)]="newCropName" placeholder="e.g. Paddy (Rice)" class="form-input" />
            </div>
            <div class="form-group mt-2">
              <label>Quantity (Kg) *</label>
              <input type="number" [(ngModel)]="newQuantityKg" placeholder="5000" class="form-input" />
            </div>
            <div class="form-group mt-2">
              <label>Starting Floor Price (₹/Kg) *</label>
              <input type="number" [(ngModel)]="newStartingPriceKg" placeholder="22.00" class="form-input" />
            </div>
          </div>
          <div class="modal-footer-simple">
            <button class="btn-cancel" (click)="showCreateModal = false">Cancel</button>
            <button class="btn-create-submit" (click)="createAuctionSubmit()">
              <i class="fa-solid fa-rocket"></i> Launch Bidding Floor
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bidding-page { display: flex; flex-direction: column; gap: 1.5rem; font-family: inherit; }

    /* My Biddings Banner */
    .my-biddings-banner {
      background: linear-gradient(135deg, #14532d 0%, #15803d 100%);
      border-radius: 1rem;
      color: white;
      padding: 2rem 2.5rem;
    }
    .my-biddings-overlay {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.25rem;
    }
    .my-biddings-title { font-size: 2.2rem; font-weight: 900; margin: 0 0 0.35rem 0; color: white; }
    .my-biddings-subtitle { font-size: 0.95rem; color: #bbf7d0; margin: 0; }
    .btn-outline-light {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.7);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 700;
      font-size: 0.85rem;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-outline-light:hover { background: rgba(255,255,255,0.15); }
    .my-bid-actions-row { display: flex; flex-direction: column; gap: 0.4rem; width: 100%; }
    .btn-close-bid {
      background: #15803d;
      color: white;
      border: none;
      padding: 0.55rem 0.75rem;
      border-radius: 0.45rem;
      font-size: 0.825rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      width: 100%;
      transition: background 0.15s;
    }
    .btn-close-bid:hover { background: #166534; }
    .btn-cancel-bid {
      background: white;
      color: #dc2626;
      border: 1px solid #fca5a5;
      padding: 0.45rem 0.75rem;
      border-radius: 0.45rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      width: 100%;
    }
    .btn-cancel-bid:hover { background: #fee2e2; }
    .btn-view-bids {
      background: #f8fafc;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 0.45rem 0.75rem;
      border-radius: 0.45rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      width: 100%;
    }
    .btn-view-bids:hover { background: #e2e8f0; }
    .sold-tag {
      background: #f1f5f9;
      color: #166534;
      padding: 0.45rem 0.65rem;
      border-radius: 0.45rem;
      font-size: 0.8rem;
      font-weight: 700;
      text-align: center;
      display: block;
      width: 100%;
      border: 1px solid #bbf7d0;
    }

    /* Hero Section */
    .bidding-hero {
      background: url('/assets/images/sunset-banner.jpg') center/cover no-repeat,
                  linear-gradient(135deg, #064e3b, #047857);
      border-radius: 1rem;
      overflow: hidden;
    }
    .hero-overlay {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.90) 55%, rgba(255, 255, 255, 0.4) 100%);
      padding: 2.25rem 2.5rem;
    }
    .hero-title { font-size: 2.35rem; font-weight: 900; color: #0f172a; margin: 0 0 0.5rem; }
    .text-green-brand { color: #15803d; }
    .hero-desc { font-size: 0.95rem; color: #334155; margin: 0 0 1.75rem; max-width: 620px; }

    .feature-pills-row { display: flex; gap: 1.25rem; flex-wrap: wrap; }
    .bidding-pill {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.75rem 1.15rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    }
    .pill-icon-circle {
      width: 40px; height: 40px; border-radius: 0.5rem;
      display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
    }
    .bg-emerald-light { background: #dcfce7; }
    .bg-green-light { background: #d1fae5; }
    .bg-teal-light { background: #ccfbf1; }
    .text-emerald { color: #15803d; }
    .pill-text-group { display: flex; flex-direction: column; }
    .pill-text-group strong { font-size: 0.9rem; font-weight: 800; color: #0f172a; }
    .pill-text-group span { font-size: 0.72rem; color: #64748b; font-weight: 600; }

    /* Filter Bar Card */
    .filter-bar-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.25rem 1.5rem;
    }
    .filters-row {
      display: flex;
      gap: 0.85rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    .filter-col { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; min-width: 140px; }
    .filter-col label { font-size: 0.78rem; font-weight: 700; color: #334155; }
    .filter-dropdown {
      padding: 0.55rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      color: #1e293b;
      outline: none;
      background: white;
    }
    .search-col { flex: 2; min-width: 220px; }
    .search-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-input-wrap i {
      position: absolute;
      left: 0.85rem;
      color: #94a3b8;
      font-size: 0.85rem;
    }
    .bidding-search-input {
      width: 100%;
      padding: 0.55rem 0.85rem 0.55rem 2.25rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      outline: none;
    }
    .btn-col { flex: 0 0 auto; min-width: auto; }
    .btn-filter-search {
      background: #15803d;
      color: white;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .farmer-create-bar {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
    }
    .btn-create-auction {
      background: #15803d;
      color: white;
      border: none;
      padding: 0.55rem 1.15rem;
      border-radius: 0.5rem;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    /* 8-Card Grid */
    .auctions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }
    .auction-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .auction-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.08);
    }
    .card-media-wrap {
      position: relative;
      height: 140px;
      background: #e2e8f0;
    }
    .auction-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .status-pill {
      position: absolute;
      top: 10px;
      left: 10px;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: white;
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: white; }
    .pill-ending { background: #dc2626; }
    .pill-live { background: #16a34a; }
    .timer-badge {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: rgba(15, 23, 42, 0.8);
      color: white;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 0.3rem;
      letter-spacing: 0.03em;
    }

    .auction-card-body {
      padding: 0.85rem 1rem 1rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .crop-header-line {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.2rem;
    }
    .crop-name { font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0; }
    .crop-variety { font-size: 0.75rem; color: #64748b; font-weight: 600; }
    .location-line { font-size: 0.75rem; color: #64748b; margin-bottom: 0.65rem; }

    .bid-stats-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.6rem 0.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .stat-col { display: flex; flex-direction: column; }
    .stat-lbl { font-size: 0.68rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .stat-val { font-size: 0.95rem; font-weight: 800; }
    .stat-val small { font-size: 0.7rem; color: #64748b; }
    .stat-divider { width: 1px; height: 26px; background: #e2e8f0; }

    .farmer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.85rem;
    }
    .farmer-ident { display: flex; align-items: center; gap: 0.45rem; }
    .farmer-circle {
      width: 26px; height: 26px; border-radius: 50%; background: #e2e8f0;
      display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #64748b;
    }
    .farmer-names { display: flex; flex-direction: column; }
    .farmer-names strong { font-size: 0.78rem; color: #0f172a; line-height: 1.1; }
    .farmer-names span { font-size: 0.65rem; color: #64748b; }
    .bids-count-tag { font-size: 0.75rem; color: #475569; font-weight: 600; }

    .btn-place-bid {
      width: 100%;
      background: #15803d;
      color: white;
      border: none;
      padding: 0.55rem;
      border-radius: 0.4rem;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      transition: background 0.2s;
    }
    .btn-place-bid:hover { background: #166534; }

    /* Pagination Footer */
    .pagination-footer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .summary-text { font-size: 0.85rem; color: #64748b; }
    .pages-list { display: flex; align-items: center; gap: 0.35rem; }
    .page-step-btn, .page-num-btn {
      width: 34px; height: 34px; border-radius: 0.35rem;
      border: 1px solid #cbd5e1; background: white; font-size: 0.8rem;
      font-weight: 600; color: #475569; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .page-num-btn.active { background: #15803d; border-color: #15803d; color: white; }
    .dots { padding: 0 0.25rem; color: #94a3b8; }

    /* Modal Backdrop & Large Dialog */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px);
      z-index: 1000; display: flex; align-items: center; justify-content: center;
      padding: 1.5rem;
    }
    .modal-dialog-large {
      background: white; border-radius: 1rem; width: 100%;
      max-width: 1080px; max-height: 90vh; overflow-y: auto; padding: 1.5rem 2rem;
    }
    .modal-header-nav {
      display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0; margin-bottom: 1.5rem;
    }
    .back-link {
      background: none; border: none; font-size: 0.9rem; color: #475569;
      cursor: pointer; display: flex; align-items: center; gap: 0.5rem;
    }
    .close-x { background: none; border: none; font-size: 1.75rem; color: #64748b; cursor: pointer; }
    .modal-grid-2col { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 2rem; }

    .main-modal-img {
      width: 100%; height: 220px; object-fit: cover; border-radius: 0.75rem;
    }
    .product-thumbs-strip {
      display: flex; gap: 0.5rem; margin-top: 0.5rem;
    }
    .product-thumbs-strip .thumb {
      width: 60px; height: 50px; border-radius: 0.35rem; object-fit: cover;
      border: 1.5px solid #cbd5e1; cursor: pointer;
    }
    .product-thumbs-strip .thumb.active { border-color: #15803d; }
    .title-pills-row { display: flex; align-items: center; gap: 0.65rem; }
    .title-pills-row h2 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
    .specs-line { font-size: 0.8rem; color: #64748b; margin-top: 0.35rem; }
    .dot-sep { margin: 0 0.35rem; }

    .metrics-3box {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;
    }
    .metrics-3box .box {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem;
      padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem;
    }
    .metrics-3box .lbl { font-size: 0.68rem; color: #64748b; font-weight: 700; text-transform: uppercase; }
    .metrics-3box .val { font-size: 1.15rem; font-weight: 800; }

    .bid-submission-box {
      background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 0.75rem;
      padding: 1.25rem;
    }
    .bid-box-title h4 { font-size: 1.05rem; font-weight: 800; color: #166534; margin: 0; }
    .bid-box-title .subtext { font-size: 0.75rem; color: #15803d; }
    .bid-inputs-row { display: grid; grid-template-columns: 1fr 1.3fr; gap: 1rem; align-items: center; }
    .input-cell { display: flex; flex-direction: column; gap: 0.35rem; }
    .input-cell label { font-size: 0.75rem; font-weight: 700; color: #166534; }
    .bid-num-input {
      padding: 0.65rem; border: 1.5px solid #16a34a; border-radius: 0.4rem;
      font-size: 1.15rem; font-weight: 800; color: #0f172a; outline: none; background: white;
    }
    .calc-cell {
      background: white; border: 1px solid #bbf7d0; border-radius: 0.5rem;
      padding: 0.65rem; display: flex; flex-direction: column;
    }
    .calc-lbl { font-size: 0.68rem; color: #64748b; font-weight: 700; text-transform: uppercase; }
    .calc-val { font-size: 1.3rem; font-weight: 900; }
    .calc-sub { font-size: 0.7rem; color: #64748b; }
    .quantity-locked-line { font-size: 0.8rem; color: #166534; font-weight: 600; }
    .info-bubble {
      background: #dbeafe; border: 1px solid #bfdbfe; border-radius: 0.4rem;
      padding: 0.5rem 0.75rem; font-size: 0.75rem; color: #1e40af; display: flex; gap: 0.4rem;
    }
    .btn-submit-auction-bid {
      width: 100%; background: #15803d; color: white; border: none;
      padding: 0.75rem; border-radius: 0.5rem; font-size: 1rem; font-weight: 800;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    }
    .btn-submit-auction-bid:hover { background: #166534; }

    /* Right Details Cards */
    .detail-card {
      background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1rem 1.25rem;
    }
    .card-sec-title { font-size: 0.95rem; font-weight: 800; color: #0f172a; margin: 0 0 0.75rem; }
    .farmer-profile-row { display: flex; align-items: center; gap: 0.75rem; }
    .farmer-avatar-lg {
      width: 44px; height: 44px; border-radius: 50%; background: #dcfce7;
      display: flex; align-items: center; justify-content: center; font-size: 1.15rem; color: #15803d;
    }
    .farmer-profile-info { display: flex; flex-direction: column; }
    .f-name-row { display: flex; align-items: center; gap: 0.5rem; }
    .verified-tag { font-size: 0.65rem; color: #15803d; font-weight: 700; background: #dcfce7; padding: 0.1rem 0.4rem; border-radius: 0.25rem; }
    .f-sub { font-size: 0.72rem; color: #64748b; }
    .rating-line { font-size: 0.78rem; color: #0f172a; margin-top: 0.15rem; }
    .farmer-contact-list { font-size: 0.78rem; color: #475569; display: flex; flex-direction: column; gap: 0.35rem; }

    .details-kv-list { display: flex; flex-direction: column; gap: 0.45rem; font-size: 0.8rem; }
    .kv-line { display: flex; justify-content: space-between; }
    .kv-line .k { color: #64748b; }
    .kv-line .v { font-weight: 700; color: #0f172a; }

    .bids-history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; }
    .badge-count { font-size: 0.7rem; font-weight: 700; color: #15803d; background: #dcfce7; padding: 0.15rem 0.5rem; border-radius: 9999px; }
    .bids-table-wrap { max-height: 180px; overflow-y: auto; }
    .bids-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: left; }
    .bids-table th { padding: 0.4rem 0.5rem; color: #64748b; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
    .bids-table td { padding: 0.45rem 0.5rem; border-bottom: 1px solid #f1f5f9; }
    .bids-table tr.lead-bid { background: #f0fdf4; font-weight: 700; }

    /* Small Modal Dialog */
    .modal-dialog-small {
      background: white; border-radius: 0.75rem; width: 100%; max-width: 440px; overflow: hidden;
    }
    .modal-header-simple {
      padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;
    }
    .modal-header-simple h3 { font-size: 1.15rem; font-weight: 800; margin: 0; }
    .modal-body-simple { padding: 1.5rem; }
    .form-group label { font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem; display: block; }
    .form-input { width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.4rem; font-size: 0.85rem; outline: none; }
    .modal-footer-simple {
      padding: 1rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.75rem;
    }
    .btn-cancel { background: white; border: 1px solid #cbd5e1; padding: 0.45rem 0.85rem; border-radius: 0.35rem; font-weight: 600; cursor: pointer; }
    .btn-create-submit { background: #15803d; color: white; border: none; padding: 0.45rem 1rem; border-radius: 0.35rem; font-weight: 700; cursor: pointer; }

    .alert-toast { background: #dcfce7; border: 1px solid #86efac; color: #166534; padding: 0.75rem 1.25rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.85rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .wallet-escrow-box { border-radius: 8px; padding: 0.85rem 1rem; }
    .wallet-escrow-box.escrow-ok { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .wallet-escrow-box.escrow-low { background: #fef2f2; border: 1px solid #fecaca; }
    .escrow-rule-text { line-height: 1.4; display: flex; align-items: flex-start; gap: 0.35rem; }
    .badge-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

    @media (max-width: 1024px) {
      .auctions-grid { grid-template-columns: repeat(3, 1fr); }
      .modal-grid-2col { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .auctions-grid { grid-template-columns: repeat(2, 1fr); }
      .filters-row { flex-direction: column; }
    }
    @media (max-width: 480px) {
      .auctions-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class BiddingComponent implements OnInit, OnDestroy {
  user: User | null = null;
  toastMsg = '';
  currentPage = 1;

  // Filters
  filterState = 'All';
  filterDistrict = 'All';
  filterCommodity = 'All';
  filterSort = 'ending';
  searchQuery = '';

  // Modal State
  selectedAuction: AuctionItem | null = null;
  userBidPrice = 23.00;
  calculatedTotalAmount = 115000;
  dealerWalletBalance = 0;

  // Create Auction
  showCreateModal = false;
  newCropName = '';
  newQuantityKg = 5000;
  newStartingPriceKg = 20.00;

  // Dynamic auctions list
  auctions: AuctionItem[] = [];

  isMyBiddingsMode = false;
  private timerInterval: any = null;

  constructor(
    private biddingService: BiddingService,
    private authService: AuthService,
    private authModalService: AuthModalService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private orderService: OrderService,
    private invoiceService: InvoiceService,
    private deliveryService: DeliveryService,
    private paymentService: PaymentService,
    private cropService: CropService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.user = u;
      if (u) {
        const uid = String(u.id || u.userId || 'dealer-1');
        this.walletService.getWallet(uid).subscribe(w => {
          this.dealerWalletBalance = w.balance;
        });
        this.dealerWalletBalance = this.walletService.getStoredBalance(uid);
      } else {
        this.dealerWalletBalance = 0;
      }
    });

    this.walletService.balance$.subscribe(b => {
      this.dealerWalletBalance = b;
    });

    this.route.queryParams.subscribe(params => {
      this.isMyBiddingsMode = params['mode'] === 'my';
    });

    this.biddingService.biddings$.subscribe((bList) => {
      const deletedIds = this.biddingService.getDeletedAuctionIds();
      this.auctions = (bList || [])
        .filter(a => !deletedIds.has(String(a.id)) && (a.status === 'OPEN' || !a.status))
        .map(sa => this.mapServerAuctionToItem(sa));
      this.updateCountdowns();
    });

    this.biddingService.getActiveAuctions().subscribe({
      next: (serverAuctions) => {
        const deletedIds = this.biddingService.getDeletedAuctionIds();
        if (serverAuctions && serverAuctions.length > 0) {
          this.auctions = serverAuctions
            .filter(a => !deletedIds.has(String(a.id)) && (a.status === 'OPEN' || !a.status))
            .map(sa => this.mapServerAuctionToItem(sa));
        } else {
          this.auctions = [];
        }
        this.updateCountdowns();
      },
      error: () => {
        this.auctions = [];
      }
    });

    this.timerInterval = setInterval(() => {
      this.updateCountdowns();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private updateCountdowns(): void {
    const now = Date.now();
    this.auctions.forEach(item => {
      if (item.endTime) {
        const end = new Date(item.endTime).getTime();
        const diff = end - now;
        if (diff <= 0) {
          item.status = 'CLOSED';
          item.timeRemaining = '00 : 00 : 00';
          item.isEndingSoon = true;
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          const pad = (n: number) => n.toString().padStart(2, '0');
          item.timeRemaining = `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;
          item.isEndingSoon = diff < 3600000;
        }
      }
    });
  }

  private mapServerAuctionToItem(sa: any): AuctionItem {
    const startingPrice = Number(sa.startingPrice || sa.startingBid || sa.basePrice || 20);
    const highestServerBid = sa.highestBidAmount != null ? Number(sa.highestBidAmount) : null;
    const currentBid = (highestServerBid && highestServerBid > 0) ? highestServerBid : Number(sa.currentHighestBid || sa.currentBid || startingPrice);
    const endTime = sa.endTime || new Date(Date.now() + 8.5 * 3600000).toISOString();
    const serverBids = Array.isArray(sa.bids) ? sa.bids : [];
    const count = serverBids.length > 0 ? serverBids.length : (sa.bidsCount || sa.totalBids || 0);

    return {
      id: String(sa.id),
      cropName: sa.cropName || 'Fresh Harvest Crop',
      variety: sa.variety || null,
      grade: sa.grade || null,
      image: sa.imageUrl || resolveCropImage(sa.cropName),
      location: sa.location || null,
      district: sa.district || null,
      state: sa.state || null,
      startingPriceKg: startingPrice,
      currentBidKg: currentBid,
      totalQuantityKg: Number(sa.quantity || 1000),
      farmerName: sa.farmerName !== undefined ? sa.farmerName : null,
      farmerPhone: sa.farmerPhone !== undefined ? sa.farmerPhone : null,
      farmerRating: 4.8,
      farmerReviewsCount: 15,
      farmerId: String(sa.farmerId || '1'),
      bidsCount: count,
      timeRemaining: '08 : 30 : 00',
      isEndingSoon: false,
      status: (sa.status as any) || 'OPEN',
      endTime: endTime,
      bidsHistory: serverBids.length > 0 ? serverBids.map((b: any) => ({
        dealerId: b.dealerId ? String(b.dealerId) : undefined,
        bidderName: b.dealerName || b.bidderName || ('Dealer #' + b.dealerId),
        bidPriceKg: Number(b.bidAmount),
        bidTime: b.bidTime || 'Recent'
      })) : (sa.bidsHistory || [])
    };
  }

  isMyAuction(a: AuctionItem): boolean {
    if (!this.user || this.user.role !== 'FARMER') return false;
    const currentName = (this.user.fullName || this.user.username || '').toLowerCase();
    const farmer = (a.farmerName || '').toLowerCase();
    return Boolean(
      (a.farmerId && (a.farmerId === this.user.id || a.farmerId === this.user.userId)) ||
      (currentName && farmer && (farmer.includes(currentName) || currentName.includes(farmer))) ||
      a.farmerId === 'farmer-1' || a.farmerId === 'farmer-2'
    );
  }

  isTimingCompleted(a: AuctionItem): boolean {
    if (a.status === 'CLOSED' || (a.status as any) === 'COMPLETED' || (a.status as any) === 'AWARDED') return true;
    if (a.endTime) {
      return new Date(a.endTime).getTime() <= Date.now();
    }
    return false;
  }

  get filteredAuctions(): AuctionItem[] {
    return this.auctions.filter(a => {
      // Exclude auctions whose timing has completed
      if (this.isTimingCompleted(a)) {
        return false;
      }
      if (this.isMyBiddingsMode && this.user?.role === 'FARMER' && !this.isMyAuction(a)) {
        return false;
      }
      const stateMatch = this.filterState === 'All' || (a.state && a.state.toLowerCase() === this.filterState.toLowerCase());
      const distMatch = this.filterDistrict === 'All' || (a.district && a.district.toLowerCase() === this.filterDistrict.toLowerCase());
      const commMatch = this.filterCommodity === 'All' || (a.cropName && a.cropName.toLowerCase().includes(this.filterCommodity.toLowerCase()));
      const searchMatch = !this.searchQuery.trim() ||
        (a.cropName && a.cropName.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (a.variety && a.variety.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (a.farmerName && a.farmerName.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return stateMatch && distMatch && commMatch && searchMatch;
    });
  }

  pageSize = 4;
  Math = Math;

  get totalPages(): number {
    return Math.ceil(this.filteredAuctions.length / this.pageSize) || 1;
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedAuctions(): AuctionItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAuctions.slice(start, start + this.pageSize);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  closeBid(item: AuctionItem): void {
    const highestBidder = item.bidsHistory.length > 0 ? item.bidsHistory[0].bidderName : (item.farmerName || null);
    const highestBid = item.currentBidKg;
    const fullStockTotal = highestBid * item.totalQuantityKg;

    if (confirm(`Close Bidding Floor: Sell "${item.cropName}" (${item.totalQuantityKg} kg) to highest bidder ${highestBidder || 'winner'} at ₹${highestBid}/kg?\n\nTotal Full Stock Valuation: ₹${fullStockTotal.toLocaleString()}.\n\nThis will debit the dealer's digital wallet, credit your wallet, and finalize the order.`)) {
      item.status = 'CLOSED';
      this.toastMsg = `✓ Success! "${item.cropName}" awarded and sold to ${highestBidder || 'winner'} at ₹${highestBid}/kg! ₹${fullStockTotal.toLocaleString()} credited to your wallet.`;

      const dealerUid = (item.bidsHistory.length > 0 && (item.bidsHistory[0] as any).dealerId)
        ? String((item.bidsHistory[0] as any).dealerId)
        : (this.user?.role === 'DEALER' ? String(this.user.id || this.user.userId || '2') : '2');
      const farmerUid = item.farmerId || this.user?.id || '1';
      const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);

      // 1. Debit Dealer's Wallet
      this.walletService.debitWallet(
        dealerUid,
        fullStockTotal,
        `Bidding Won: Payment for Lot #${item.id} - ${item.cropName} (${item.totalQuantityKg} Kg)`
      ).subscribe();

      // 2. Credit Farmer's Digital Wallet
      this.walletService.creditWallet(
        farmerUid,
        fullStockTotal,
        `Received Bidding Proceeds for Lot #${item.id}: ${item.cropName} (${item.totalQuantityKg} Kg) from ${highestBidder || 'Dealer'}`
      ).subscribe();

      // 3. Register Order in OrderService as completed bidding lot
      const newOrder: any = {
        id: orderId,
        cropId: String(item.id),
        cropName: item.cropName,
        quantity: item.totalQuantityKg,
        pricePerUnit: highestBid,
        totalAmount: fullStockTotal,
        farmerId: farmerUid,
        farmerName: item.farmerName || null,
        dealerId: dealerUid,
        dealerName: highestBidder || null,
        status: 'DELIVERED',
        orderDate: new Date().toISOString(),
        deliveryAddress: item.location || 'APMC Yard Mandi Gate 2',
        fulfillmentType: 'SELF_PICKUP',
        isBidding: true
      };
      this.orderService.createOrder(newOrder).subscribe();

      // 4. Create certified Tax Invoice in InvoiceService
      const invoicePayload: Invoice = {
        id: 'inv-' + orderId,
        invoiceNumber: 'CD-INV-2026-' + orderId.replace('ORD-', ''),
        orderId: orderId,
        dealerId: dealerUid,
        dealerName: highestBidder,
        dealerPhone: '+91 98722 55667',
        dealerAddress: 'Commercial Grain Terminal, Mandi Gate 2, New Delhi',
        dealerGstin: '07AABCC8901Z1Z8',
        farmerId: farmerUid,
        farmerName: item.farmerName || 'Sardar Gurpreet Singh',
        farmerPhone: item.farmerPhone || '+91 98140 11223',
        farmerAddress: item.location || 'APMC Yard Mandi Gate 2',
        farmerPan: 'AABPG7812F',
        cropName: item.cropName,
        cropVariety: item.variety || 'Mandi Bidding Grade',
        hsnCode: '1001',
        quantity: item.totalQuantityKg,
        unit: 'Kg',
        pricePerUnit: highestBid,
        totalAmount: fullStockTotal,
        taxAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        deliveryFee: 0,
        deliveryDistanceKm: 0,
        deliveryAddress: item.location || 'APMC Yard Mandi Gate 2',
        finalAmount: fullStockTotal,
        paymentMethod: 'CropDeal Digital Escrow Wallet',
        transactionId: 'TXN-BID-' + Math.floor(100000 + Math.random() * 900000),
        status: 'PAID',
        issuedAt: new Date().toISOString()
      };
      this.invoiceService.createInvoice(invoicePayload).subscribe();

      const numOrderId = parseInt(String(orderId).replace(/\D/g, ''), 10) || 1001;
      const numDealerId = parseInt(String(dealerUid).replace(/\D/g, ''), 10) || 2;
      const numFarmerId = parseInt(String(farmerUid).replace(/\D/g, ''), 10) || 1;

      // Persist Payment in PaymentService
      this.paymentService.makePayment({
        orderId: numOrderId,
        dealerId: numDealerId,
        farmerId: numFarmerId,
        amount: fullStockTotal,
        paymentMethod: 'WALLET'
      }).subscribe();

      // Persist Delivery in DeliveryService
      this.deliveryService.createDelivery({
        orderId: orderId,
        dealerId: String(dealerUid),
        farmerId: String(farmerUid),
        cropName: item.cropName || null,
        cropQuantity: item.totalQuantityKg || null,
        cropUnit: 'Kg',
        farmerName: item.farmerName || null,
        dealerName: highestBidder || null,
        fulfillmentType: 'SELF_PICKUP',
        pickupAddress: item.location || null,
        dropAddress: 'Dealer Mandi Facility',
        status: 'DELIVERED'
      }).subscribe();

      // 5. Close and delete auction in BiddingService so it is removed from live bidding floor
      this.biddingService.closeAuction(item.id, orderId, fullStockTotal).subscribe();
      this.biddingService.deleteAuction(item.id).subscribe();
      this.auctions = this.auctions.filter(a => a.id !== item.id);

      // 6. Deduct or delete crop post from CropService if matching
      this.cropService.getAllCrops().subscribe(allCrops => {
        const matchingCrop = (allCrops || []).find(c =>
          c.id === item.id ||
          (c.cropName.toLowerCase() === item.cropName.toLowerCase() && (c.farmerId === farmerUid || c.farmerName === item.farmerName))
        );
        if (matchingCrop) {
          const currentStock = matchingCrop.quantity || matchingCrop.availableQuantity || 0;
          const remainingStock = Math.max(0, currentStock - item.totalQuantityKg);
          const cId = String(matchingCrop.id || matchingCrop.cropId);
          if (remainingStock <= 0) {
            this.cropService.deleteCrop(cId).subscribe();
          } else {
            this.cropService.updateCrop(cId, { quantity: remainingStock, availableQuantity: remainingStock } as any).subscribe();
          }
        }
      });

      // 7. Notify highest bidder (dealer) and farmer
      this.notificationService.sendNotification(
        dealerUid,
        '🏆 Auction Won & Finalized!',
        `Congratulations! You won the bidding floor for "${item.cropName}" (${item.totalQuantityKg} kg) at ₹${highestBid}/kg from farmer ${item.farmerName}. Order #${orderId} created and ₹${fullStockTotal.toLocaleString()} debited from your wallet.`,
        'BID'
      );
      this.notificationService.sendNotification(
        farmerUid,
        '🤝 Auction Floor Closed & Settled',
        `Your live auction for "${item.cropName}" (${item.totalQuantityKg} kg) was awarded to highest bidder ${highestBidder} at ₹${highestBid}/kg. ₹${fullStockTotal.toLocaleString()} credited to your wallet.`,
        'BID'
      );

      setTimeout(() => this.toastMsg = '', 6000);
    }
  }

  cancelBid(item: AuctionItem): void {
    if (confirm(`Are you sure you want to cancel the bidding lot for "${item.cropName}"?`)) {
      this.biddingService.deleteAuction(item.id).subscribe();
      this.auctions = this.auctions.filter(a => a.id !== item.id);
      this.toastMsg = `✓ Bidding lot for "${item.cropName}" has been cancelled and removed from live bidding floor.`;
      setTimeout(() => this.toastMsg = '', 5000);
    }
  }

  // Intercept guest action!
  onPlaceBidClick(item: AuctionItem): void {
    if (!this.user) {
      this.authModalService.open(`Authentication Required: Please sign in or quick-login as a Dealer to place a bid on ${item.cropName}.`);
      return;
    }
    if (this.user.role !== 'DEALER') {
      alert('⚠️ Only verified commercial dealers can place bids in the live bidding floor. Other roles can only view auctions.');
      return;
    }
    const uid = String(this.user.id || this.user.userId || 'dealer-1');
    this.dealerWalletBalance = this.walletService.getStoredBalance(uid);
    this.selectedAuction = item;
    this.userBidPrice = item.bidsCount === 0 ? item.startingPriceKg : +(item.currentBidKg + 0.5).toFixed(2);
    this.onBidPriceChange();
  }

  isBidAmountValid(): boolean {
    if (!this.selectedAuction || this.userBidPrice == null) return false;
    if (this.selectedAuction.bidsCount === 0) {
      return this.userBidPrice >= this.selectedAuction.startingPriceKg;
    }
    return this.userBidPrice > this.selectedAuction.currentBidKg;
  }

  toggleFavorite(item: AuctionItem): void {
    if (!this.user) {
      this.authModalService.open('Please sign in or quick-login to add auctions to your watchlist.');
      return;
    }
    item.isFavorite = !item.isFavorite;
  }

  onBidPriceChange(): void {
    if (this.selectedAuction) {
      this.calculatedTotalAmount = Math.round((this.userBidPrice || 0) * this.selectedAuction.totalQuantityKg);
    }
  }

  setQuickBid(increment: number): void {
    if (!this.selectedAuction) return;
    this.userBidPrice = +(this.selectedAuction.currentBidKg + increment).toFixed(2);
    this.onBidPriceChange();
  }

  submitBidOnAuction(): void {
    if (!this.selectedAuction || !this.user) return;

    if (this.user.role !== 'DEALER') {
      alert('⚠️ Only verified commercial dealers can place bids in the auction floor.');
      return;
    }

    if (!this.userBidPrice) {
      alert('Please enter a valid bid amount.');
      return;
    }

    if (this.selectedAuction.bidsCount === 0 && this.userBidPrice < this.selectedAuction.startingPriceKg) {
      alert(`Your bid must be equal to or higher than the starting price of ₹${this.selectedAuction.startingPriceKg}/Kg.`);
      return;
    }

    if (this.selectedAuction.bidsCount > 0 && this.userBidPrice <= this.selectedAuction.currentBidKg) {
      alert(`Your bid must be higher than current highest bid of ₹${this.selectedAuction.currentBidKg}/Kg.`);
      return;
    }

    const uid = String(this.user.id || this.user.userId || 'dealer-1');
    this.dealerWalletBalance = this.walletService.getStoredBalance(uid);

    if (this.dealerWalletBalance < this.calculatedTotalAmount) {
      alert(`⚠️ Insufficient Wallet Balance!\n\nTo place a bid for the full lot (${this.selectedAuction.totalQuantityKg} Kg @ ₹${this.userBidPrice}/Kg), you must have at least ₹${this.calculatedTotalAmount.toLocaleString()} in your digital wallet.\nYour Current Balance: ₹${this.dealerWalletBalance.toLocaleString()}.\n\nPlease top up your wallet to bid on this harvest lot.`);
      return;
    }

    const bidder = this.user?.fullName || this.user?.username || 'Apex Agro Mills Ltd';
    this.selectedAuction.currentBidKg = this.userBidPrice;
    this.selectedAuction.bidsCount = (this.selectedAuction.bidsCount || 0) + 1;
    this.selectedAuction.bidsHistory.unshift({
      bidderName: bidder,
      bidPriceKg: this.userBidPrice,
      bidTime: 'Just now'
    });

    const found = this.auctions.find(a => a.id === this.selectedAuction!.id);
    if (found) {
      found.currentBidKg = this.userBidPrice;
      found.bidsCount = (found.bidsCount || 0) + 1;
      found.bidsHistory.unshift({
        bidderName: bidder,
        bidPriceKg: this.userBidPrice,
        bidTime: 'Just now'
      });
    }

    const closedAuction = this.selectedAuction;
    const bidAmount = this.userBidPrice;
    const totalEst = this.calculatedTotalAmount;

    // Persist bid offer in bidding service
    const offer: BidOffer = {
      biddingId: closedAuction.id,
      dealerId: uid,
      dealerName: bidder,
      bidAmount: bidAmount,
      bidTime: new Date().toISOString()
    };
    this.biddingService.placeBid(offer).subscribe({
      next: () => {
        this.biddingService.getActiveAuctions().subscribe(res => {
          if (res) {
            const deletedIds = this.biddingService.getDeletedAuctionIds();
            this.auctions = res
              .filter(a => !deletedIds.has(String(a.id)) && (a.status === 'OPEN' || !a.status))
              .map(sa => this.mapServerAuctionToItem(sa));
            this.updateCountdowns();
          }
        });
      }
    });

    // Send notifications to Farmer and Dealer
    const farmerId = closedAuction.farmerId || 'farmer-1';
    const dealerId = this.user?.id || this.user?.userId || 'dealer-1';

    this.notificationService.sendNotification(
      farmerId,
      '🔨 New Incoming Bid',
      `Dealer ${bidder} placed a new highest bid of ₹${bidAmount}/kg on your crop "${closedAuction.cropName}" (Total Full Stock: ₹${totalEst.toLocaleString()}).`,
      'BID'
    );
    this.notificationService.sendNotification(
      dealerId,
      '🔨 Bid Placed Successfully',
      `Your bid of ₹${bidAmount}/kg on "${closedAuction.cropName}" (Total: ₹${totalEst.toLocaleString()}) has been submitted with wallet backing.`,
      'BID'
    );

    this.toastMsg = `🎉 Your bid of ₹${this.userBidPrice}/Kg for ${this.selectedAuction.cropName} (Total: ₹${this.calculatedTotalAmount.toLocaleString()}) has been submitted!`;
    this.selectedAuction = null;

    setTimeout(() => { this.toastMsg = ''; }, 6000);
  }

  openCreateModal(): void {
    if (!this.user) {
      this.authModalService.open('Please sign in or quick-login to create auctions.');
      return;
    }
    this.showCreateModal = true;
  }

  createAuctionSubmit(): void {
    if (!this.newCropName.trim()) {
      alert('Please enter crop name.');
      return;
    }

    const endIso = new Date(Date.now() + 12 * 3600000).toISOString();
    const newAuc: AuctionItem = {
      id: 'auc-' + Date.now(),
      cropName: this.newCropName,
      variety: 'Grade A Produce',
      grade: 'A Grade',
      image: resolveCropImage(this.newCropName),
      location: 'Ludhiana, Punjab',
      district: 'Ludhiana',
      state: 'Punjab',
      startingPriceKg: this.newStartingPriceKg,
      currentBidKg: this.newStartingPriceKg,
      totalQuantityKg: this.newQuantityKg,
      farmerName: this.user?.fullName || this.user?.username || 'Sardar Gurpreet Singh',
      farmerPhone: '+91 98140 11223',
      farmerRating: 4.9,
      farmerReviewsCount: 12,
      farmerId: this.user?.id || 'farmer-1',
      bidsCount: 0,
      timeRemaining: '12 : 00 : 00',
      isEndingSoon: false,
      status: 'OPEN',
      endTime: endIso,
      bidsHistory: []
    };

    this.auctions.unshift(newAuc);
    this.updateCountdowns();
    this.biddingService.createAuction({
      id: newAuc.id,
      cropId: 'crop-' + newAuc.id,
      cropName: newAuc.cropName,
      variety: newAuc.variety,
      location: newAuc.location,
      startingPrice: newAuc.startingPriceKg,
      currentHighestBid: newAuc.currentBidKg,
      quantity: newAuc.totalQuantityKg,
      unit: 'Kg',
      endTime: endIso,
      farmerName: newAuc.farmerName,
      farmerId: newAuc.farmerId,
      status: 'OPEN',
      bidsCount: 0
    }).subscribe({ error: () => {} });

    this.showCreateModal = false;
    this.toastMsg = `🎉 New Bidding Floor for "${newAuc.cropName}" launched! Dealers can place bids now.`;

    // Notify registered dealers about new auction
    this.notificationService.sendNotification(
      'dealer-1',
      '📢 New Live Auction Floor Launched',
      `Farmer ${newAuc.farmerName} opened a new live auction floor for "${newAuc.cropName}" (${newAuc.totalQuantityKg} kg) starting at ₹${newAuc.currentBidKg}/kg.`,
      'BID'
    );

    setTimeout(() => { this.toastMsg = ''; }, 6000);
  }

  onThumbError(event: any): void {
    event.target.src = '/assets/images/crop-rice.jpg';
  }
}
