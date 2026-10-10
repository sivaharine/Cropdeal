import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { BiddingService } from '../../core/services/bidding.service';
import { AuthService } from '../../core/services/auth.service';
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

interface DealerBidRow {
  auction: BiddingAuction;
  dealerBidKg: number;
  isWinning: boolean;
}

@Component({
  selector: 'app-my-biddings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="my-biddings-page">

      <!-- ========================================== -->
      <!-- 1. DEALER VIEW: AUCTIONS PARTICIPATED IN   -->
      <!-- ========================================== -->
      <ng-container *ngIf="user?.role === 'DEALER'">
        <!-- Hero Header -->
        <section class="biddings-hero hero-dealer shadow-sm">
          <div class="hero-content">
            <div class="hero-text-block">
              <h1 class="hero-title">
                <i class="fa-solid fa-gavel text-amber"></i> My Placed <span class="text-green-brand">Bids</span>
              </h1>
              <p class="hero-desc">
                Review crop auctions where you have placed offers. Monitor if your bid is winning or outbid, and raise your offers in real time.
              </p>
            </div>
            <div class="hero-action-btns">
              <a routerLink="/bidding" class="btn-public-floor">
                <i class="fa-solid fa-store"></i> Explore Live Floor
              </a>
            </div>
          </div>
        </section>

        <!-- Toast Feedback Message -->
        <div *ngIf="actionMsg" class="alert-toast shadow-sm">
          <i class="fa-solid fa-circle-check"></i>
          <span>{{ actionMsg }}</span>
        </div>

        <!-- 4 KPI Stat Badges -->
        <div class="stats-pills-row">
          <div class="stat-pill">
            <div class="stat-pill-icon bg-emerald-light">
              <i class="fa-solid fa-layer-group text-emerald"></i>
            </div>
            <div class="stat-pill-text">
              <strong>{{ dealerBids.length }}</strong>
              <span>Auctions Participated</span>
            </div>
          </div>

          <div class="stat-pill">
            <div class="stat-pill-icon bg-green-light">
              <i class="fa-solid fa-trophy text-emerald"></i>
            </div>
            <div class="stat-pill-text">
              <strong>{{ dealerWinningCount }}</strong>
              <span>Currently Winning</span>
            </div>
          </div>

          <div class="stat-pill">
            <div class="stat-pill-icon bg-amber-light">
              <i class="fa-solid fa-triangle-exclamation text-amber"></i>
            </div>
            <div class="stat-pill-text">
              <strong>{{ dealerOutbidCount }}</strong>
              <span>Outbid (Need Raise)</span>
            </div>
          </div>

          <div class="stat-pill">
            <div class="stat-pill-icon bg-teal-light">
              <i class="fa-solid fa-wallet text-emerald"></i>
            </div>
            <div class="stat-pill-text">
              <strong>₹{{ dealerTotalCommitted | number:'1.0-0' }}</strong>
              <span>Total Capital Committed</span>
            </div>
          </div>
        </div>

        <!-- Dealer Bids Card Grid Section -->
        <div class="card content-card shadow-sm">
          <div class="card-header-bar">
            <div>
              <h3 class="section-title">Your Active Bidding Lots</h3>
              <p class="section-subtitle">Real-time status of crops you placed offers on</p>
            </div>
            <div class="filter-pills">
              <button class="pill-btn" [class.active]="dealerFilter === 'ALL'" (click)="dealerFilter = 'ALL'">
                All ({{ dealerBids.length }})
              </button>
              <button class="pill-btn" [class.active]="dealerFilter === 'WINNING'" (click)="dealerFilter = 'WINNING'">
                Winning ({{ dealerWinningCount }})
              </button>
              <button class="pill-btn" [class.active]="dealerFilter === 'OUTBID'" (click)="dealerFilter = 'OUTBID'">
                Outbid ({{ dealerOutbidCount }})
              </button>
            </div>
          </div>

          <!-- Cards Grid (Boxes like Live Bidding) -->
          <div class="auctions-grid mt-4">
            <div *ngFor="let item of filteredDealerBids" class="auction-card shadow-sm">
              <!-- Card Media Wrap -->
              <div class="card-media-wrap">
                <img [src]="item.auction.photoUrl || item.auction.imageUrl || getCropImage(item.auction.cropName)" [alt]="item.auction.cropName" class="auction-thumb" (error)="onThumbError($event)" />

                <!-- Winning or Outbid Badge -->
                <span class="status-pill" [ngClass]="item.isWinning ? 'pill-winning' : 'pill-outbid'">
                  <span class="status-dot"></span>
                  <i class="fa-solid" [ngClass]="item.isWinning ? 'fa-crown' : 'fa-arrow-up'"></i>
                  {{ item.isWinning ? 'Winning' : 'Outbid' }}
                </span>

                <!-- Timer / Floor Badge -->
                <span class="timer-badge">
                  <i class="fa-regular fa-clock"></i> {{ item.auction.status === 'CLOSED' ? 'Closed' : 'Active Floor' }}
                </span>
              </div>

              <!-- Card Body -->
              <div class="auction-card-body">
                <div class="crop-header-line">
                  <h3 class="crop-name">{{ item.auction.cropName }}</h3>
                  <span class="lot-id-badge">Lot #{{ item.auction.id }}</span>
                </div>

                <div class="location-line">
                  <i class="fa-solid fa-location-dot text-emerald"></i> {{ item.auction.location || 'APMC Mandi Yard' }}
                </div>

                <!-- Stats Box: Your Offer vs Highest Bid -->
                <div class="bid-stats-box">
                  <div class="stat-col">
                    <span class="stat-lbl">Your Offer</span>
                    <span class="stat-val text-emerald">₹{{ item.dealerBidKg | number:'1.2-2' }} <small>/ Kg</small></span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-col">
                    <span class="stat-lbl">Current High</span>
                    <span class="stat-val text-dark">₹{{ item.auction.currentHighestBid | number:'1.2-2' }} <small>/ Kg</small></span>
                  </div>
                </div>

                <!-- Seller & Quantity Info -->
                <div class="detail-info-row">
                  <div class="seller-info">
                    <div class="avatar-mini bg-emerald-light text-emerald">
                      <i class="fa-regular fa-user"></i>
                    </div>
                    <div>
                      <strong class="seller-name">{{ item.auction.farmerName || 'Registered Farmer' }}</strong>
                      <span class="subtext d-block">Seller</span>
                    </div>
                  </div>
                  <div class="qty-badge-box">
                    <span class="qty-label">Quantity</span>
                    <strong>{{ item.auction.quantity }} {{ item.auction.unit }}</strong>
                  </div>
                </div>

                <!-- Action Footer -->
                <div class="card-action-footer">
                  <button
                    class="btn-raise-bid-card"
                    (click)="openRaiseModal(item.auction)"
                    [disabled]="item.auction.status === 'CLOSED'"
                    title="Raise Offer">
                    <i class="fa-solid fa-arrow-trend-up"></i>
                    <span>{{ item.isWinning ? 'Raise My Offer' : 'Raise Offer (Outbid!)' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="filteredDealerBids.length === 0" class="empty-state-box text-center py-5">
            <i class="fa-solid fa-gavel fa-3x text-muted mb-2"></i>
            <h4 class="text-muted">No Bidding Lots Found</h4>
            <p class="text-subtle text-sm">No bidding lots match this filter. Visit Live Bidding to place bids!</p>
            <a routerLink="/bidding" class="btn btn-primary btn-sm mt-3">
              <i class="fa-solid fa-store"></i> Explore Live Floor
            </a>
          </div>
        </div>
      </ng-container>

      <!-- ========================================== -->
      <!-- 2. FARMER VIEW: AUCTIONS CREATED BY FARMER -->
      <!-- ========================================== -->
      <ng-container *ngIf="user?.role === 'FARMER' || (!user?.role)">
        <!-- Hero Header -->
        <section class="biddings-hero hero-farmer shadow-sm">
          <div class="hero-content">
            <div class="hero-text-block">
              <h1 class="hero-title">
                <i class="fa-solid fa-wheat-awn text-amber"></i> My Hosted <span class="text-green-brand">Biddings</span>
              </h1>
              <p class="hero-desc">
                Manage your harvest auctions listed for competitive bidding. Monitor incoming dealer bids, accept winning offers, or finalize deals.
              </p>
            </div>
            <div class="hero-action-btns">
              <button class="btn-create" (click)="openCreateModal()">
                <i class="fa-solid fa-circle-plus"></i> Create New Bidding Lot
              </button>
            </div>
          </div>
        </section>

        <!-- Toast Feedback Message -->
        <div *ngIf="actionMsg" class="alert-toast shadow-sm">
          <i class="fa-solid fa-circle-check"></i>
          <span>{{ actionMsg }}</span>
        </div>

        <!-- 4 KPI Stat Badges -->
        <div class="stats-pills-row">
          <div class="stat-pill">
            <div class="stat-pill-icon bg-emerald-light">
              <i class="fa-solid fa-boxes-stacked text-emerald"></i>
            </div>
            <div class="stat-pill-text">
              <strong>{{ farmerAuctions.length }}</strong>
              <span>My Hosted Lots</span>
            </div>
          </div>

          <div class="stat-pill">
            <div class="stat-pill-icon bg-green-light">
              <i class="fa-solid fa-bolt text-emerald"></i>
            </div>
            <div class="stat-pill-text">
              <strong>{{ farmerActiveCount }}</strong>
              <span>Active Open Lots</span>
            </div>
          </div>

          <div class="stat-pill">
            <div class="stat-pill-icon bg-amber-light">
              <i class="fa-solid fa-hand-holding-dollar text-amber"></i>
            </div>
            <div class="stat-pill-text">
              <strong>{{ farmerTotalBidsReceived }}</strong>
              <span>Total Bids Received</span>
            </div>
          </div>

          <div class="stat-pill">
            <div class="stat-pill-icon bg-teal-light">
              <i class="fa-solid fa-sack-dollar text-emerald"></i>
            </div>
            <div class="stat-pill-text">
              <strong>₹{{ farmerPotentialGross | number:'1.0-0' }}</strong>
              <span>Potential Gross Revenue</span>
            </div>
          </div>
        </div>

        <!-- Farmer Hosted Biddings Card Grid Section -->
        <div class="card content-card shadow-sm">
          <div class="card-header-bar">
            <div>
              <h3 class="section-title">Your Listed Crop Auctions</h3>
              <p class="section-subtitle">Real-time dealer offers and action controls</p>
            </div>
            <div class="filter-pills">
              <button class="pill-btn" [class.active]="farmerFilter === 'ALL'" (click)="farmerFilter = 'ALL'">
                All ({{ farmerAuctions.length }})
              </button>
              <button class="pill-btn" [class.active]="farmerFilter === 'OPEN'" (click)="farmerFilter = 'OPEN'">
                Active ({{ farmerActiveCount }})
              </button>
              <button class="pill-btn" [class.active]="farmerFilter === 'CLOSED'" (click)="farmerFilter = 'CLOSED'">
                Awarded/Closed ({{ farmerClosedCount }})
              </button>
            </div>
          </div>

          <!-- Cards Grid (Boxes like Live Bidding) -->
          <div class="auctions-grid mt-4">
            <div *ngFor="let auc of filteredFarmerAuctions" class="auction-card shadow-sm">
              <!-- Card Media Wrap -->
              <div class="card-media-wrap">
                <img [src]="auc.photoUrl || auc.imageUrl || getCropImage(auc.cropName)" [alt]="auc.cropName" class="auction-thumb" (error)="onThumbError($event)" />

                <!-- Status Pill -->
                <span class="status-pill" [ngClass]="auc.status === 'OPEN' ? 'pill-live' : 'pill-closed'">
                  <span class="status-dot"></span>
                  {{ auc.status === 'OPEN' ? 'Live Floor' : 'Awarded' }}
                </span>

                <!-- Bids Count Badge -->
                <span class="timer-badge">
                  <i class="fa-solid fa-gavel"></i> {{ auc.bidsCount || 0 }} Bids
                </span>
              </div>

              <!-- Card Body -->
              <div class="auction-card-body">
                <div class="crop-header-line">
                  <h3 class="crop-name">{{ auc.cropName }}</h3>
                  <span class="lot-id-badge">Lot #{{ auc.id }}</span>
                </div>

                <div class="location-line">
                  <i class="fa-solid fa-location-dot text-emerald"></i> {{ auc.location || 'APMC Yard' }}
                </div>

                <!-- Stats Box: Highest Bid vs Base Price -->
                <div class="bid-stats-box">
                  <div class="stat-col">
                    <span class="stat-lbl">Highest Bid</span>
                    <span class="stat-val text-emerald">₹{{ auc.currentHighestBid | number:'1.2-2' }} <small>/ Kg</small></span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-col">
                    <span class="stat-lbl">Base Price</span>
                    <span class="stat-val text-dark">₹{{ auc.startingPrice | number:'1.2-2' }} <small>/ Kg</small></span>
                  </div>
                </div>

                <!-- Leading Dealer & Quantity Info -->
                <div class="detail-info-row">
                  <div class="seller-info">
                    <div class="avatar-mini bg-blue-light text-primary">
                      <i class="fa-solid fa-handshake"></i>
                    </div>
                    <div>
                      <strong class="seller-name">{{ auc.highestBidderName || 'Awaiting First Bid' }}</strong>
                      <span class="subtext d-block">{{ auc.highestBidderName ? 'Leading Dealer' : 'Open for Bids' }}</span>
                    </div>
                  </div>
                  <div class="qty-badge-box">
                    <span class="qty-label">Quantity</span>
                    <strong>{{ auc.quantity }} {{ auc.unit }}</strong>
                  </div>
                </div>

                <!-- Action Footer -->
                <div class="card-action-footer">
                  <div class="d-flex gap-2 w-100" *ngIf="auc.status === 'OPEN'">
                    <button
                      class="btn-accept-card flex-1"
                      (click)="acceptBid(auc)"
                      [disabled]="!auc.highestBidderName"
                      title="Accept winning dealer bid">
                      <i class="fa-solid fa-check"></i>
                      <span>Accept Bid</span>
                    </button>
                    <button
                      class="btn-close-card"
                      (click)="closeAuction(auc)"
                      title="Close auction lot">
                      <i class="fa-solid fa-ban"></i>
                    </button>
                  </div>
                  <div class="closed-lot-chip w-100 text-center" *ngIf="auc.status !== 'OPEN'">
                    <i class="fa-solid fa-circle-check text-emerald"></i> Lot Finalized & Sold
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="filteredFarmerAuctions.length === 0" class="empty-state-box text-center py-5">
            <i class="fa-solid fa-wheat-awn fa-3x text-muted mb-2"></i>
            <h4 class="text-muted">No Hosted Biddings Found</h4>
            <p class="text-subtle text-sm">No auctions match this filter. Click below to create a new auction!</p>
            <button class="btn btn-primary btn-sm mt-3" (click)="openCreateModal()">
              <i class="fa-solid fa-circle-plus"></i> Create New Bidding Lot
            </button>
          </div>
        </div>
      </ng-container>

      <!-- Raise Bid Modal (For Dealer) -->
      <div *ngIf="showRaiseModal && selectedAuction" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3><i class="fa-solid fa-arrow-trend-up text-emerald"></i> Raise Offer for {{ selectedAuction.cropName }}</h3>
            <button class="modal-close" (click)="showRaiseModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="modal-info-strip">
              <div>
                <span class="lbl">Current Highest Bid:</span>
                <strong class="text-emerald">₹{{ selectedAuction.currentHighestBid }}/Kg</strong>
              </div>
              <div>
                <span class="lbl">Lot Quantity:</span>
                <strong>{{ selectedAuction.quantity }} {{ selectedAuction.unit }}</strong>
              </div>
            </div>

            <div class="form-group mt-3">
              <label>Your New Higher Offer (₹ / Kg) *</label>
              <input type="number" [(ngModel)]="newBidAmount" class="modal-input" [min]="selectedAuction.currentHighestBid + 1" step="0.5" />
              <small class="text-muted">Must be greater than ₹{{ selectedAuction.currentHighestBid }}/Kg</small>
            </div>

            <div class="form-group mt-2">
              <span class="lbl">Total Full-Stock Order Valuation:</span>
              <strong class="text-primary font-lg">₹{{ (newBidAmount * selectedAuction.quantity) | number:'1.2-2' }}</strong>
              <small class="text-muted d-block">({{ selectedAuction.quantity }} {{ selectedAuction.unit }} &times; ₹{{ newBidAmount }}/Kg - Bidding requires purchasing full harvest lot)</small>
            </div>

            <!-- Wallet Balance Requirement Box -->
            <div class="wallet-escrow-box mt-3 p-3 rounded" [style.background]="dealerWalletBalance >= (newBidAmount * selectedAuction.quantity) ? '#f0fdf4' : '#fef2f2'" [style.border]="dealerWalletBalance >= (newBidAmount * selectedAuction.quantity) ? '1px solid #86efac' : '1px solid #fca5a5'">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <span class="text-xs text-muted d-block"><i class="fa-solid fa-wallet text-emerald"></i> Your Digital Wallet Balance</span>
                  <strong class="text-dark font-md">₹{{ dealerWalletBalance | number:'1.2-2' }}</strong>
                </div>
                <span class="badge" [style.background]="dealerWalletBalance >= (newBidAmount * selectedAuction.quantity) ? '#16a34a' : '#dc2626'" style="color: white; padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.75rem;">
                  {{ dealerWalletBalance >= (newBidAmount * selectedAuction.quantity) ? '✓ Wallet Sufficient' : '⚠️ Insufficient Funds' }}
                </span>
              </div>
              <small *ngIf="dealerWalletBalance < (newBidAmount * selectedAuction.quantity)" class="text-danger d-block mt-2 font-weight-bold">
                <i class="fa-solid fa-triangle-exclamation"></i> In bidding, you can buy only full stocks using wallet amount. Please top up your wallet to place this bid.
              </small>
              <small *ngIf="dealerWalletBalance >= (newBidAmount * selectedAuction.quantity)" class="text-emerald d-block mt-2 font-weight-bold">
                <i class="fa-solid fa-shield-halved"></i> Wallet verified for full stock purchase of ₹{{ (newBidAmount * selectedAuction.quantity) | number:'1.0-0' }}.
              </small>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="showRaiseModal = false">Cancel</button>
            <button
              class="btn-save"
              (click)="submitRaisedBid()"
              [disabled]="dealerWalletBalance < (newBidAmount * selectedAuction.quantity) || newBidAmount <= selectedAuction.currentHighestBid">
              <i class="fa-solid fa-check"></i> {{ dealerWalletBalance >= (newBidAmount * selectedAuction.quantity) ? 'Confirm & Place Bid' : 'Insufficient Wallet Balance' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Create New Bidding Modal (For Farmer) -->
      <div *ngIf="showCreateModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3><i class="fa-solid fa-circle-plus text-emerald"></i> Create New Bidding Auction</h3>
            <button class="modal-close" (click)="showCreateModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Commodity / Crop Lot Name *</label>
              <input type="text" [(ngModel)]="newAuction.cropName" placeholder="e.g. 5000 Kg Premium ADT-36 Paddy" class="modal-input" />
            </div>

            <div class="form-row mt-2">
              <div class="form-group flex-1">
                <label>Lot Quantity (Kg) *</label>
                <input type="number" [(ngModel)]="newAuction.quantity" placeholder="5000" class="modal-input" />
              </div>
              <div class="form-group flex-1">
                <label>Starting Base Price (₹ / Kg) *</label>
                <input type="number" [(ngModel)]="newAuction.startingPrice" placeholder="20" class="modal-input" />
              </div>
            </div>

            <div class="form-group mt-2">
              <label>Auction Duration (Hours) *</label>
              <select [(ngModel)]="auctionDurationHours" class="modal-input">
                <option [value]="6">6 Hours</option>
                <option [value]="12">12 Hours (Half Day)</option>
                <option [value]="24">24 Hours (Full Day)</option>
                <option [value]="48">48 Hours (2 Days)</option>
              </select>
            </div>

            <!-- Image Upload from Device (Cloudinary) -->
            <div class="form-group mt-2">
              <label><i class="fa-solid fa-cloud-arrow-up text-emerald"></i> Lot Image (Device / Cloudinary)</label>
              <div class="image-upload-wrapper">
                <input
                  type="file"
                  id="myBiddingFileInput"
                  (change)="onBiddingFileSelected($event)"
                  accept="image/*"
                  style="display: none;" />
                <label for="myBiddingFileInput" class="btn-file-select" [class.uploading]="isUploadingBiddingImage">
                  <i class="fa-solid fa-cloud-arrow-up" *ngIf="!isUploadingBiddingImage"></i>
                  <i class="fa-solid fa-spinner fa-spin text-emerald" *ngIf="isUploadingBiddingImage"></i>
                  <span>{{ isUploadingBiddingImage ? 'Uploading to Cloudinary...' : (selectedBiddingFile ? 'Change (' + selectedBiddingFile.name + ')' : 'Choose Image from Machine') }}</span>
                </label>

                <!-- Cloudinary Preview Card -->
                <div *ngIf="newCropImage || selectedBiddingPreview" class="image-preview-card mt-2">
                  <img
                    [src]="newCropImage || selectedBiddingPreview"
                    alt="Auction preview"
                    class="produce-preview-thumb"
                    (error)="onThumbError($event)" />
                  <div class="preview-info">
                    <span class="preview-title">{{ selectedBiddingFile ? selectedBiddingFile.name : (newAuction.cropName || 'Bidding Lot Produce') }}</span>
                    <span class="badge-cloud" *ngIf="cloudinaryBiddingUrl || (newCropImage && newCropImage.includes('cloudinary'))">
                      <i class="fa-solid fa-cloud-bolt text-emerald"></i> Hosted on Cloudinary
                    </span>
                    <span class="badge-ready" *ngIf="!cloudinaryBiddingUrl && (!newCropImage || !newCropImage.includes('cloudinary'))">
                      <i class="fa-solid fa-image text-primary"></i> Ready for Upload
                    </span>
                  </div>
                </div>

                <!-- URL text input option -->
                <div class="mt-2">
                  <input
                    type="url"
                    [(ngModel)]="newCropImage"
                    placeholder="Or paste Cloud/Web Image URL (optional)"
                    class="modal-input text-xs" />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="showCreateModal = false">Cancel</button>
            <button class="btn-save" (click)="saveNewAuction()">
              <i class="fa-solid fa-check"></i> Launch Auction
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .my-biddings-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      font-family: inherit;
    }

    /* Hero Banners */
    .biddings-hero {
      border-radius: 1rem;
      overflow: hidden;
      color: white;
    }
    .hero-dealer {
      background: linear-gradient(135deg, #1e3a8a, #047857);
    }
    .hero-farmer {
      background: linear-gradient(135deg, #064e3b, #047857);
    }
    .hero-content {
      padding: 2rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .hero-text-block { max-width: 650px; }
    .hero-title {
      font-size: 2.1rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .text-green-brand { color: #86efac; }
    .text-amber { color: #f59e0b; }
    .text-emerald { color: #15803d; }
    .hero-desc {
      font-size: 0.92rem;
      color: #e2e8f0;
      line-height: 1.5;
      margin: 0;
    }
    .hero-action-btns {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .btn-public-floor, .btn-create {
      background: #16a34a;
      color: white;
      border: none;
      padding: 0.65rem 1.25rem;
      border-radius: 0.5rem;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-public-floor:hover, .btn-create:hover {
      background: #15803d;
      transform: translateY(-1px);
    }

    /* Stats Row */
    .stats-pills-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    .stat-pill {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.85rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
    }
    .stat-pill-icon {
      width: 44px;
      height: 44px;
      border-radius: 0.6rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }
    .bg-emerald-light { background: #dcfce7; }
    .bg-amber-light { background: #fef3c7; }
    .bg-green-light { background: #d1fae5; }
    .bg-teal-light { background: #ccfbf1; }
    .stat-pill-text { display: flex; flex-direction: column; }
    .stat-pill-text strong { font-size: 1.35rem; font-weight: 800; color: #0f172a; line-height: 1.1; }
    .stat-pill-text span { font-size: 0.75rem; color: #64748b; font-weight: 600; margin-top: 0.15rem; }

    /* Alert Toast */
    .alert-toast {
      background: #dcfce7;
      border: 1.5px solid #86efac;
      color: #166534;
      padding: 0.85rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Content Card */
    .content-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.25rem 1.5rem;
    }
    .card-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .section-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0; }
    .section-subtitle { font-size: 0.8rem; color: #64748b; margin: 0.2rem 0 0; }
    .filter-pills { display: flex; align-items: center; gap: 0.35rem; }
    .pill-btn {
      background: #f1f5f9;
      border: 1px solid transparent;
      padding: 0.35rem 0.8rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s;
    }
    .pill-btn.active { background: #15803d; color: white; }

    /* Responsive Auctions Card Grid (Boxes matching Live Bidding) */
    .auctions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(285px, 1fr));
      gap: 1.25rem;
    }
    .auction-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.85rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
    }
    .auction-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 24px -5px rgba(0, 0, 0, 0.08);
      border-color: #cbd5e1;
    }
    .card-media-wrap {
      position: relative;
      height: 145px;
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
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: white; }
    .pill-winning { background: #16a34a; }
    .pill-outbid { background: #d97706; }
    .pill-live { background: #16a34a; }
    .pill-closed { background: #64748b; }
    .timer-badge {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: rgba(15, 23, 42, 0.82);
      backdrop-filter: blur(2px);
      color: white;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.25rem 0.55rem;
      border-radius: 0.35rem;
      letter-spacing: 0.03em;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .auction-card-body {
      padding: 1rem 1.15rem 1.15rem;
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
    .crop-name { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 0; }
    .lot-id-badge {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      background: #f1f5f9;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
    .location-line { font-size: 0.76rem; color: #64748b; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.3rem; }

    /* Stats Box */
    .bid-stats-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.65rem 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.85rem;
    }
    .stat-col { display: flex; flex-direction: column; }
    .stat-lbl { font-size: 0.68rem; color: #64748b; font-weight: 700; text-transform: uppercase; }
    .stat-val { font-size: 0.98rem; font-weight: 800; }
    .stat-val small { font-size: 0.7rem; color: #64748b; }
    .stat-divider { width: 1px; height: 28px; background: #e2e8f0; }

    /* Detail Info Row */
    .detail-info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-top: 0.4rem;
    }
    .seller-info { display: flex; align-items: center; gap: 0.5rem; }
    .avatar-mini {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
    }
    .seller-name { font-size: 0.82rem; color: #0f172a; line-height: 1.1; }
    .qty-badge-box { display: flex; flex-direction: column; align-items: flex-end; }
    .qty-label { font-size: 0.68rem; color: #64748b; text-transform: uppercase; font-weight: 700; }
    .qty-badge-box strong { font-size: 0.85rem; color: #0f172a; }

    /* Action Footer Buttons */
    .card-action-footer { margin-top: auto; }
    .btn-raise-bid-card {
      width: 100%;
      background: #16a34a;
      color: white;
      border: none;
      padding: 0.6rem;
      border-radius: 0.45rem;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      transition: background 0.15s ease;
      box-shadow: 0 2px 6px rgba(22, 163, 74, 0.25);
    }
    .btn-raise-bid-card:hover:not(:disabled) { background: #15803d; }
    .btn-raise-bid-card:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-accept-card {
      background: #16a34a;
      color: white;
      border: none;
      padding: 0.6rem;
      border-radius: 0.45rem;
      font-size: 0.825rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      transition: background 0.15s ease;
      box-shadow: 0 2px 6px rgba(22, 163, 74, 0.25);
    }
    .btn-accept-card:hover:not(:disabled) { background: #15803d; }
    .btn-accept-card:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-close-card {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #64748b;
      padding: 0.6rem 0.85rem;
      border-radius: 0.45rem;
      cursor: pointer;
    }
    .btn-close-card:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }
    .closed-lot-chip {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      color: #475569;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.5rem;
      border-radius: 0.45rem;
    }
    .empty-state-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 0.75rem;
      padding: 3rem 1.5rem;
      margin-top: 1rem;
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-dialog {
      background: white;
      border-radius: 0.85rem;
      width: 100%;
      max-width: 460px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 { font-size: 1.15rem; font-weight: 800; margin: 0; color: #0f172a; }
    .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; }
    .modal-body { padding: 1.5rem; }
    .modal-info-strip {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      display: flex;
      justify-content: space-between;
    }
    .lbl { font-size: 0.75rem; color: #64748b; display: block; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group label { font-size: 0.78rem; font-weight: 700; color: #334155; }
    .form-row { display: flex; gap: 0.75rem; }
    .flex-1 { flex: 1; }
    .modal-input {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.4rem;
      font-size: 0.85rem;
      outline: none;
    }
    .modal-input:focus { border-color: #15803d; }
    .modal-footer {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    .btn-cancel {
      background: white;
      border: 1px solid #cbd5e1;
      padding: 0.5rem 1rem;
      border-radius: 0.4rem;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
    }
    .btn-save {
      background: #16a34a;
      color: white;
      border: none;
      padding: 0.55rem 1.25rem;
      border-radius: 0.4rem;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    /* Cloudinary Image Upload Styling */
    .image-upload-wrapper { margin-top: 0.25rem; }
    .btn-file-select {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.65rem 1.1rem;
      background: #f0fdf4;
      border: 1.5px dashed #16a34a;
      border-radius: 0.5rem;
      color: #15803d;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
      width: 100%;
      justify-content: center;
    }
    .btn-file-select:hover {
      background: #dcfce7;
      border-color: #15803d;
    }
    .btn-file-select.uploading {
      background: #f8fafc;
      border-color: #cbd5e1;
      cursor: wait;
    }
    .image-preview-card {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.6rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
    }
    .produce-preview-thumb {
      width: 58px;
      height: 58px;
      object-fit: cover;
      border-radius: 0.4rem;
      border: 1px solid #cbd5e1;
    }
    .preview-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      overflow: hidden;
    }
    .preview-title {
      font-weight: 600;
      font-size: 0.825rem;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .badge-cloud {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.725rem;
      color: #15803d;
      background: #dcfce7;
      padding: 0.15rem 0.45rem;
      border-radius: 0.3rem;
      font-weight: 600;
      width: fit-content;
    }
    .badge-ready {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.725rem;
      color: #2563eb;
      background: #dbeafe;
      padding: 0.15rem 0.45rem;
      border-radius: 0.3rem;
      font-weight: 600;
      width: fit-content;
    }

    @media (max-width: 1024px) {
      .stats-pills-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .stats-pills-row { grid-template-columns: 1fr; }
      .hero-content { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class MyBiddingsComponent implements OnInit, OnDestroy {
  user: User | null = null;
  actionMsg = '';
  dealerWalletBalance = 0;

  // Dealer Data
  dealerBids: DealerBidRow[] = [];
  dealerFilter: 'ALL' | 'WINNING' | 'OUTBID' = 'ALL';

  // Farmer Data
  farmerAuctions: BiddingAuction[] = [];
  farmerFilter: 'ALL' | 'OPEN' | 'CLOSED' = 'ALL';

  // Raise Bid Modal (Dealer)
  showRaiseModal = false;
  selectedAuction: BiddingAuction | null = null;
  newBidAmount = 0;

  // Create Auction Modal (Farmer)
  showCreateModal = false;
  auctionDurationHours = 24;
  newAuction: Partial<BiddingAuction> = {
    cropName: '',
    quantity: 1000,
    startingPrice: 20
  };
  newCropImage: string = '';
  selectedBiddingFile: File | null = null;
  selectedBiddingPreview: string | null = null;
  isUploadingBiddingImage = false;
  cloudinaryBiddingUrl: string | null = null;

  private subs: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private biddingService: BiddingService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private orderService: OrderService,
    private invoiceService: InvoiceService,
    private deliveryService: DeliveryService,
    private paymentService: PaymentService,
    private cropService: CropService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.authService.currentUser$.subscribe(u => {
        this.user = u;
        if (u) {
          const uid = String(u.id || u.userId || 'dealer-1');
          this.dealerWalletBalance = this.walletService.getStoredBalance(uid);
          this.walletService.getWallet(uid).subscribe(w => {
            if (w && typeof w.balance === 'number') this.dealerWalletBalance = w.balance;
          });
        } else {
          this.dealerWalletBalance = 0;
        }
        this.loadAuctions();
      })
    );
    this.subs.push(
      this.walletService.balance$.subscribe(b => {
        this.dealerWalletBalance = b;
      })
    );
    this.subs.push(
      this.biddingService.biddings$.subscribe(auctions => {
        if (auctions) this.processAuctions(auctions);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  loadAuctions(): void {
    this.biddingService.getActiveAuctions().subscribe({
      next: (auctions) => {
        if (auctions) this.processAuctions(auctions);
      }
    });
  }

  private processAuctions(auctions: BiddingAuction[]): void {
    const now = Date.now();
    const deleted = this.biddingService.getDeletedAuctionIds();
    const valid = auctions.filter(a => !deleted.has(String(a.id)) && (!a.endTime || new Date(a.endTime).getTime() > now));
    const uid = this.user?.id || this.user?.userId;

    // Dealer: find auctions where dealer is highest bidder or placed a bid
    const myAuctions = valid.filter(auc =>
      auc.highestBidderId === uid || (auc as any).bidderId === uid
    );
    this.dealerBids = myAuctions.map(auc => {
      const isWinning = auc.highestBidderId === uid;
      return {
        auction: auc,
        dealerBidKg: auc.currentHighestBid,
        isWinning: isWinning
      };
    });

    // Farmer: auctions created by this farmer
    this.farmerAuctions = valid.filter(a =>
      a.farmerId === uid
    );
  }

  // Dealer Computed
  get dealerWinningCount(): number {
    return this.dealerBids.filter(b => b.isWinning).length;
  }

  get dealerOutbidCount(): number {
    return this.dealerBids.filter(b => !b.isWinning).length;
  }

  get dealerTotalCommitted(): number {
    return this.dealerBids.reduce((acc, curr) => acc + (curr.dealerBidKg * curr.auction.quantity), 0);
  }

  get filteredDealerBids(): DealerBidRow[] {
    if (this.dealerFilter === 'WINNING') return this.dealerBids.filter(b => b.isWinning);
    if (this.dealerFilter === 'OUTBID') return this.dealerBids.filter(b => !b.isWinning);
    return this.dealerBids;
  }

  // Farmer Computed
  get farmerActiveCount(): number {
    return this.farmerAuctions.filter(a => a.status === 'OPEN').length;
  }

  get farmerClosedCount(): number {
    return this.farmerAuctions.filter(a => a.status === 'CLOSED').length;
  }

  get farmerTotalBidsReceived(): number {
    return this.farmerAuctions.reduce((acc, curr) => acc + (curr.bidsCount || 0), 0);
  }

  get farmerPotentialGross(): number {
    return this.farmerAuctions.reduce((acc, curr) => acc + (curr.currentHighestBid * curr.quantity), 0);
  }

  get filteredFarmerAuctions(): BiddingAuction[] {
    if (this.farmerFilter === 'OPEN') return this.farmerAuctions.filter(a => a.status === 'OPEN');
    if (this.farmerFilter === 'CLOSED') return this.farmerAuctions.filter(a => a.status === 'CLOSED');
    return this.farmerAuctions;
  }

  // Actions
  openRaiseModal(auction: BiddingAuction): void {
    if (this.user?.role !== 'DEALER') {
      alert('Only registered commercial dealers can participate in bidding.');
      return;
    }
    const uid = String(this.user?.id || this.user?.userId || 'dealer-1');
    this.dealerWalletBalance = this.walletService.getStoredBalance(uid);
    this.selectedAuction = auction;
    this.newBidAmount = auction.currentHighestBid + (auction.minIncrement || 1);
    this.showRaiseModal = true;
  }

  submitRaisedBid(): void {
    if (!this.selectedAuction || this.newBidAmount <= this.selectedAuction.currentHighestBid) {
      alert('Your offer must be higher than current highest bid.');
      return;
    }

    if (this.user?.role !== 'DEALER') {
      alert('Only registered commercial dealers can place or raise bids.');
      return;
    }

    const fullStockTotal = this.newBidAmount * this.selectedAuction.quantity;
    const uid = String(this.user?.id || this.user?.userId || 'dealer-1');
    this.dealerWalletBalance = this.walletService.getStoredBalance(uid);

    if (this.dealerWalletBalance < fullStockTotal) {
      alert(`⚠️ Insufficient Wallet Balance!\n\nIn bidding, you can buy only full stocks using wallet amount.\nRequired for full lot (${this.selectedAuction.quantity} ${this.selectedAuction.unit} @ ₹${this.newBidAmount}/Kg): ₹${fullStockTotal.toLocaleString()}.\nYour Available Wallet Balance: ₹${this.dealerWalletBalance.toLocaleString()}.\n\nPlease top up your wallet to raise your offer.`);
      return;
    }

    const offer: BidOffer = {
      biddingId: this.selectedAuction.id,
      dealerId: uid,
      dealerName: this.user?.fullName || this.user?.username || 'Apex Agro Mills Ltd',
      bidAmount: this.newBidAmount,
      bidTime: new Date().toISOString()
    };

    const closedAuction = this.selectedAuction;

    this.biddingService.placeBid(offer).subscribe({
      next: (updated) => {
        this.showRaiseModal = false;
        this.actionMsg = `✓ Offer raised to ₹${offer.bidAmount}/Kg (Total Lot: ₹${fullStockTotal.toLocaleString()}) with wallet backing! You are now the highest bidder.`;
        this.loadAuctions();

        // In-app notifications
        const farmerUid = closedAuction.farmerId || 'farmer-1';
        this.notificationService.sendNotification(
          farmerUid,
          '🔨 Bid Raised on Your Auction Lot',
          `Dealer ${offer.dealerName} raised their bid to ₹${offer.bidAmount}/Kg on "${closedAuction.cropName}" (Total: ₹${fullStockTotal.toLocaleString()}).`,
          'BID'
        );
        this.notificationService.sendNotification(
          uid,
          '🔨 Bid Raised Successfully',
          `Your offer of ₹${offer.bidAmount}/Kg on "${closedAuction.cropName}" (Total: ₹${fullStockTotal.toLocaleString()}) has been submitted with wallet backing.`,
          'BID'
        );

        setTimeout(() => this.actionMsg = '', 5000);
      }
    });
  }

  onBiddingFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;

    this.selectedBiddingFile = file;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedBiddingPreview = e.target.result;
    };
    reader.readAsDataURL(file);

    this.isUploadingBiddingImage = true;
    this.biddingService.uploadBiddingImage(file).subscribe({
      next: (res: any) => {
        this.isUploadingBiddingImage = false;
        const uploadedUrl = res.photoUrl || res.imageUrl || res.url;
        if (uploadedUrl) {
          this.cloudinaryBiddingUrl = uploadedUrl;
          this.newCropImage = uploadedUrl;
        }
      },
      error: (err) => {
        console.warn('Bidding image upload warning:', err);
        this.isUploadingBiddingImage = false;
      }
    });
  }

  openCreateModal(): void {
    this.newAuction = {
      cropName: '',
      quantity: 5000,
      startingPrice: 22
    };
    this.newCropImage = '';
    this.selectedBiddingFile = null;
    this.selectedBiddingPreview = null;
    this.cloudinaryBiddingUrl = null;
    this.isUploadingBiddingImage = false;
    this.showCreateModal = true;
  }

  saveNewAuction(): void {
    if (!this.newAuction.cropName || !this.newAuction.quantity || !this.newAuction.startingPrice) {
      alert('Please fill all required auction fields.');
      return;
    }

    const finalImageUrl = this.newCropImage || this.cloudinaryBiddingUrl || this.selectedBiddingPreview || resolveCropImage(this.newAuction.cropName);

    this.biddingService.createAuction({
      ...this.newAuction,
      imageUrl: finalImageUrl,
      photoUrl: finalImageUrl,
      farmerId: this.user?.id || 'farmer-1',
      farmerName: this.user?.fullName || this.user?.username || null,
      durationHours: this.auctionDurationHours
    } as any).subscribe({
      next: (created) => {
        this.showCreateModal = false;
        this.actionMsg = `✓ Bidding lot for ${created.cropName} launched successfully!`;
        this.loadAuctions();
        setTimeout(() => this.actionMsg = '', 4000);
      }
    });
  }

  acceptBid(auction: BiddingAuction): void {
    if (!auction.highestBidderName) {
      alert('Cannot accept bid: No dealer offers received yet on this auction lot.');
      return;
    }

    const fullStockTotal = auction.currentHighestBid * auction.quantity;
    if (!confirm(`Accept winning bid of ₹${auction.currentHighestBid}/Kg from ${auction.highestBidderName}?\n\nTotal Full Stock Lot Valuation: ₹${fullStockTotal.toLocaleString()}.\n\nThis will debit the dealer's digital wallet, credit your wallet, and finalize the order.`)) return;

    const dealerUid = auction.highestBidderId || 'dealer-1';
    const farmerUid = auction.farmerId || this.user?.id || 'farmer-1';
    const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);

    // 1. Debit Dealer's Wallet
    this.walletService.debitWallet(
      dealerUid,
      fullStockTotal,
      `Bidding Won: Payment for Lot #${auction.id} - ${auction.cropName} (${auction.quantity} ${auction.unit})`
    ).subscribe();

    // 2. Credit Farmer's Digital Wallet
    this.walletService.creditWallet(
      farmerUid,
      fullStockTotal,
      `Received Bidding Proceeds for Lot #${auction.id}: ${auction.cropName} (${auction.quantity} ${auction.unit}) from ${auction.highestBidderName}`
    ).subscribe();

    // 3. Register Order in OrderService as completed bidding lot
    const newOrder: any = {
      id: orderId,
      cropId: String(auction.cropId || auction.id),
      cropName: auction.cropName,
      quantity: auction.quantity,
      pricePerUnit: auction.currentHighestBid,
      totalAmount: fullStockTotal,
      farmerId: farmerUid,
      farmerName: auction.farmerName || this.user?.fullName || null,
      dealerId: dealerUid,
      dealerName: auction.highestBidderName || null,
      status: 'DELIVERED',
      orderDate: new Date().toISOString(),
      deliveryAddress: auction.location || 'APMC Yard Mandi Gate 2',
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
      dealerName: auction.highestBidderName || null,
      dealerPhone: '+91 98722 55667',
      dealerAddress: 'Commercial Grain Terminal, Mandi Gate 2, New Delhi',
      dealerGstin: '07AABCC8901Z1Z8',
      farmerId: farmerUid,
      farmerName: auction.farmerName || this.user?.fullName || null,
      farmerPhone: '+91 98140 11223',
      farmerAddress: auction.location || 'APMC Yard Mandi Gate 2',
      farmerPan: 'AABPG7812F',
      cropName: auction.cropName,
      cropVariety: 'Mandi Bidding Quality',
      hsnCode: '1001',
      quantity: auction.quantity,
      unit: auction.unit || 'Kg',
      pricePerUnit: auction.currentHighestBid,
      totalAmount: fullStockTotal,
      taxAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      deliveryFee: 0,
      deliveryDistanceKm: 0,
      deliveryAddress: auction.location || 'APMC Yard Mandi Gate 2',
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
      cropName: auction.cropName || null,
      cropQuantity: auction.quantity || null,
      cropUnit: auction.unit || 'Kg',
      farmerName: auction.farmerName || null,
      dealerName: auction.highestBidderName || null,
      fulfillmentType: 'SELF_PICKUP',
      pickupAddress: auction.location || null,
      dropAddress: 'Dealer Mandi Facility',
      status: 'DELIVERED'
    }).subscribe();

    // 5. If this auction was created from a Crop in CropService, update or delete it
    if (auction.cropId) {
      this.cropService.getCropById(auction.cropId).subscribe(c => {
        if (c && (c.id || c.cropId)) {
          const currentStock = c.quantity || c.availableQuantity || 0;
          const remainingStock = Math.max(0, currentStock - auction.quantity);
          const cId = String(c.id || c.cropId);
          if (remainingStock <= 0) {
            this.cropService.deleteCrop(cId).subscribe();
          } else {
            this.cropService.updateCrop(cId, { quantity: remainingStock, availableQuantity: remainingStock } as any).subscribe();
          }
        }
      });
    }

    // 6. Send in-app notifications
    this.notificationService.sendNotification(
      dealerUid,
      '🏆 Auction Deal Finalized!',
      `Farmer ${auction.farmerName || 'Farmer'} accepted your winning bid of ₹${auction.currentHighestBid}/Kg for Lot #${auction.id} (${auction.cropName}). Order #${orderId} created and ₹${fullStockTotal.toLocaleString()} debited from your wallet.`,
      'BID'
    );
    this.notificationService.sendNotification(
      farmerUid,
      '🤝 Bidding Lot Awarded & Settled',
      `You accepted the winning bid of ₹${auction.currentHighestBid}/Kg from ${auction.highestBidderName} for Lot #${auction.id}. ₹${fullStockTotal.toLocaleString()} credited to your digital wallet.`,
      'BID'
    );

    // 7. Close and delete the auction so it is completely removed from live and admin bidding floors
    this.biddingService.closeAuction(auction.id, orderId, fullStockTotal).subscribe();
    this.biddingService.deleteAuction(auction.id).subscribe({
      next: () => {
        this.actionMsg = `✓ Bid accepted! Deal awarded to ${auction.highestBidderName}. ₹${fullStockTotal.toLocaleString()} credited to your wallet and Order #${orderId} generated!`;
        this.loadAuctions();
        setTimeout(() => this.actionMsg = '', 6000);
      }
    });
  }

  closeAuction(auction: BiddingAuction): void {
    if (!confirm('Are you sure you want to end this auction early?')) return;
    this.biddingService.closeAuction(auction.id).subscribe();
    this.biddingService.deleteAuction(auction.id).subscribe({
      next: () => {
        this.actionMsg = `Auction #${auction.id} closed and removed.`;
        this.loadAuctions();
        setTimeout(() => this.actionMsg = '', 3000);
      }
    });
  }

  getCropImage(cropName: string): string {
    return resolveCropImage(cropName);
  }

  onThumbError(event: any): void {
    event.target.src = '/assets/images/crop-rice.jpg';
  }
}
