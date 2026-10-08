import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CropService } from '../../../core/services/crop.service';
import { OrderService } from '../../../core/services/order.service';
import { BiddingService } from '../../../core/services/bidding.service';
import { PriceService } from '../../../core/services/price.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ReviewService } from '../../../core/services/review.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NegotiationService } from '../../../core/services/negotiation.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  CropResponse, CreateCropRequest, OrderResponse,
  BiddingSessionResponse, MarketPriceResponse,
  FarmerRatingSummaryResponse, CreateBiddingSessionRequest,
  NegotiationResponse, BuyingRequestResponseDto
} from '../../../core/models/models';

@Component({
  selector: 'app-farmer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './farmer-dashboard.component.html',
  styleUrls: ['./farmer-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FarmerDashboardComponent implements OnInit {
  crops: CropResponse[] = [];
  orders: OrderResponse[] = [];
  auctions: BiddingSessionResponse[] = [];
  negotiations: NegotiationResponse[] = [];
  buyingDemands: BuyingRequestResponseDto[] = [];
  mandiPrices: MarketPriceResponse[] = [];
  ratingSummary: FarmerRatingSummaryResponse | null = null;
  walletBalance = 0;

  // ✅ Cached stats — NOT getters (getters re-run every CD cycle → loop)
  totalCropQuantity = 0;
  totalRevenueEarned = 0;

  // Modals
  isAddCropModalOpen = false;
  isEditCropModalOpen = false;
  isStartAuctionModalOpen = false;
  selectedCropForAuction: CropResponse | null = null;
  cropBeingEdited: CropResponse | null = null;

  // Mandi price search + pagination
  mandiSearchTerm = '';
  mandiPage = 1;
  readonly mandiPageSize = 15;
  filteredMandiPrices: MarketPriceResponse[] = [];
  mandiTotalPages = 1;

  newCrop: CreateCropRequest = {
    commodity: '', state: '', district: '',
    grade: 'A', quantity: 1000, unit: 'KG', pricePerKg: 0, description: ''
  };

  newAuction: Partial<CreateBiddingSessionRequest> = {
    basePrice: 0, minIncrement: 2,
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  };

  constructor(
    private cropService: CropService,
    private orderService: OrderService,
    private biddingService: BiddingService,
    private priceService: PriceService,
    private paymentService: PaymentService,
    private reviewService: ReviewService,
    private notifService: NotificationService,
    private negotiationService: NegotiationService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const farmerId = this.authService.currentUser?.userId || 1;

    this.cropService.getCropsByFarmer(farmerId).subscribe(crops => {
      this.crops = crops || [];
      this.updateStats();
      this.cdr.markForCheck();
    });

    this.orderService.getOrdersByFarmer(farmerId).subscribe(orders => {
      this.orders = orders || [];
      this.updateStats();
      this.cdr.markForCheck();
    });

    this.biddingService.getSessionsByFarmer(farmerId).subscribe(sessions => {
      this.auctions = sessions || [];
      this.cdr.markForCheck();
    });

    this.negotiationService.getNegotiationsBySeller(farmerId).subscribe(negs => {
      this.negotiations = negs || [];
      this.cdr.markForCheck();
    });

    this.priceService.getTodayPrices().subscribe(prices => {
      this.mandiPrices = prices || [];
      this.applyMandiFilter();
      this.cdr.markForCheck();
    });

    this.paymentService.getWallet(farmerId).subscribe(w => {
      this.walletBalance = w.balance;
      this.cdr.markForCheck();
    });

    this.reviewService.getFarmerReviews(farmerId).subscribe(summary => {
      this.ratingSummary = summary;
      this.cdr.markForCheck();
    });

    this.cropService.getActiveBuyingRequests().subscribe(demands => {
      this.buyingDemands = demands || [];
      this.cdr.markForCheck();
    });
  }

  getCropRating(cropId: number): number {
    const cropRevs = (this.ratingSummary?.reviews || []).filter(r => r.cropId === cropId);
    if (cropRevs.length > 0) {
      const avg = cropRevs.reduce((acc, r) => acc + r.rating, 0) / cropRevs.length;
      return Math.round(avg * 10) / 10;
    }
    return 0;
  }

  getCropReviewCount(cropId: number): number {
    const cropRevs = (this.ratingSummary?.reviews || []).filter(r => r.cropId === cropId);
    return cropRevs.length;
  }

  private updateStats(): void {
    this.totalCropQuantity = this.crops.reduce((acc, c) => acc + (c.quantity || 0), 0);
    this.totalRevenueEarned = this.orders
      .filter(o => o.status === 'CONFIRMED' || o.paymentStatus === 'PAID')
      .reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  }

  // ─── MANDI SEARCH + PAGINATION ───────────────────────────────
  applyMandiFilter(): void {
    const term = this.mandiSearchTerm.toLowerCase().trim();
    const all = term
      ? this.mandiPrices.filter(p =>
          p.commodity.toLowerCase().includes(term) ||
          p.state.toLowerCase().includes(term) ||
          p.district.toLowerCase().includes(term)
        )
      : [...this.mandiPrices];

    this.mandiTotalPages = Math.max(1, Math.ceil(all.length / this.mandiPageSize));
    if (this.mandiPage > this.mandiTotalPages) this.mandiPage = 1;
    const start = (this.mandiPage - 1) * this.mandiPageSize;
    this.filteredMandiPrices = all.slice(start, start + this.mandiPageSize);
    this.cdr.markForCheck();
  }

  mandiNextPage(): void {
    if (this.mandiPage < this.mandiTotalPages) {
      this.mandiPage++;
      this.applyMandiFilter();
    }
  }

  mandiPrevPage(): void {
    if (this.mandiPage > 1) {
      this.mandiPage--;
      this.applyMandiFilter();
    }
  }

  openAddCropModal(): void { this.isAddCropModalOpen = true; }

  fulfillDemand(demand: BuyingRequestResponseDto): void {
    this.newCrop = {
      commodity: demand.cropName,
      state: demand.state,
      district: demand.district,
      grade: 'A',
      quantity: demand.quantity,
      unit: demand.unit || 'KG',
      pricePerKg: demand.buyingPrice,
      description: `Harvest listed in response to Dealer #${demand.dealerId} procurement demand (${demand.notes || 'Immediate dispatch'}).`
    };
    this.isAddCropModalOpen = true;
    this.cdr.markForCheck();
  }

  submitNewCrop(): void {
    if (!this.newCrop.commodity || this.newCrop.pricePerKg <= 0 || this.newCrop.quantity <= 0) {
      this.notifService.showToast('warning', 'Please fill all required crop details.');
      return;
    }
    const user = this.authService.currentUser;
    const req = { ...this.newCrop, farmerId: user?.userId || 1, farmerName: user?.name || 'Farmer' };

    this.cropService.createCrop(req).subscribe(crop => {
      this.crops = [crop, ...this.crops];  // immutable spread for OnPush
      this.updateStats();
      this.isAddCropModalOpen = false;
      this.cdr.markForCheck();
      this.notifService.showToast('success', `Crop "${crop.commodity}" listed successfully!`);
      this.newCrop = { commodity: '', state: '', district: '', grade: 'A', quantity: 1000, unit: 'KG', pricePerKg: 0, description: '' };
    });
  }

  openAuctionModal(crop: CropResponse): void {
    this.selectedCropForAuction = crop;
    this.newAuction = {
      cropId: crop.id,
      farmerId: crop.farmerId,
      cropName: `${crop.commodity} (${crop.grade})`,
      quantity: crop.quantity,
      unit: crop.unit,
      basePrice: Math.round(crop.pricePerKg * 0.9),
      minIncrement: 2,
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      district: crop.district,
      state: crop.state
    };
    this.isStartAuctionModalOpen = true;
  }

  submitNewAuction(): void {
    if (!this.selectedCropForAuction || !this.newAuction.basePrice) return;
    const request: CreateBiddingSessionRequest = {
      cropId: this.selectedCropForAuction.id,
      farmerId: this.selectedCropForAuction.farmerId,
      cropName: this.newAuction.cropName || this.selectedCropForAuction.commodity,
      quantity: this.newAuction.quantity || this.selectedCropForAuction.quantity,
      unit: this.selectedCropForAuction.unit,
      basePrice: this.newAuction.basePrice,
      minIncrement: this.newAuction.minIncrement || 2,
      startTime: this.newAuction.startTime || new Date().toISOString(),
      endTime: this.newAuction.endTime || new Date(Date.now() + 86400000).toISOString(),
      district: this.selectedCropForAuction.district,
      state: this.selectedCropForAuction.state
    };
    const farmerId = this.selectedCropForAuction.farmerId || this.authService.currentUser?.userId || 1;
    this.biddingService.createSession(request, farmerId).subscribe(session => {
      this.auctions = [session, ...this.auctions];  // immutable for OnPush
      this.isStartAuctionModalOpen = false;
      this.cdr.markForCheck();
      this.notifService.showToast('success', `Live Auction for "${session.cropName}" started! Visible in Bidding Hub now.`);
    });
  }

  openEditModal(crop: CropResponse): void {
    this.cropBeingEdited = { ...crop }; // deep clone — don't mutate displayed data
    this.isEditCropModalOpen = true;
  }

  submitEditCrop(): void {
    if (!this.cropBeingEdited) return;
    this.cropService.updateCrop(this.cropBeingEdited.id, this.cropBeingEdited).subscribe(updated => {
      this.crops = this.crops.map(c => c.id === updated.id ? updated : c);
      this.updateStats();
      this.isEditCropModalOpen = false;
      this.cropBeingEdited = null;
      this.cdr.markForCheck();
      this.notifService.showToast('success', `Crop "${updated.commodity}" updated successfully!`);
    });
  }

  deleteCrop(id: number): void {
    if (confirm('Are you sure you want to remove this crop listing?')) {
      this.cropService.deleteCrop(id).subscribe(() => {
        this.crops = this.crops.filter(c => c.id !== id);
        this.updateStats();
        this.cdr.markForCheck();
        this.notifService.showToast('info', 'Crop listing removed');
      });
    }
  }

  closeAuction(auctionId: number): void {
    const farmerId = this.authService.currentUser?.userId || 1;
    this.biddingService.closeSession(auctionId, farmerId).subscribe(s => {
      this.auctions = this.auctions.map(a => a.id === auctionId ? s : a);
      this.cdr.markForCheck();
      this.notifService.showToast('success', `Auction #${auctionId} closed! Winning bidder notified.`);
    });
  }
}
