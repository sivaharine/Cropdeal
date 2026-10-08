import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CropService } from '../../../core/services/crop.service';
import { OrderService } from '../../../core/services/order.service';
import { BiddingService } from '../../../core/services/bidding.service';
import { PaymentService } from '../../../core/services/payment.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import { ReviewService } from '../../../core/services/review.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NegotiationService } from '../../../core/services/negotiation.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  CropResponse, OrderResponse, BiddingSessionResponse,
  CreateOrderRequest, PlaceBidRequest, FarmerReviewRequest,
  NegotiationResponse, BuyingRequestCreateDto, BuyingRequestResponseDto
} from '../../../core/models/models';

@Component({
  selector: 'app-dealer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dealer-dashboard.component.html',
  styleUrls: ['./dealer-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DealerDashboardComponent implements OnInit {
  availableCrops: CropResponse[] = [];
  orders: OrderResponse[] = [];
  auctions: BiddingSessionResponse[] = [];
  negotiations: NegotiationResponse[] = [];
  buyingRequests: BuyingRequestResponseDto[] = [];
  walletBalance = 0;

  // ✅ Cached stat — NOT a getter
  totalPurchasedVolume = 0;

  // Modals
  isOrderModalOpen = false;
  isBidModalOpen = false;
  isReviewModalOpen = false;
  isPaymentModalOpen = false;
  isBuyingRequestModalOpen = false;

  newBuyingRequest: BuyingRequestCreateDto = {
    cropName: '',
    quantity: 500,
    unit: 'KG',
    buyingPrice: 0,
    district: '',
    state: '',
    notes: ''
  };

  selectedCrop: CropResponse | null = null;
  selectedAuction: BiddingSessionResponse | null = null;
  selectedOrderForPayment: OrderResponse | null = null;
  selectedOrderForReview: OrderResponse | null = null;

  orderQuantity = 100;
  deliveryAddress = '';   // empty — dealer must enter their own address
  bidAmount = 0;
  bidNotes = '';

  reviewForm: FarmerReviewRequest = {
    farmerId: 1, dealerId: 10, orderId: 0,
    cropId: 0, rating: 5, comment: ''
  };

  constructor(
    private cropService: CropService,
    private orderService: OrderService,
    private biddingService: BiddingService,
    private paymentService: PaymentService,
    private invoiceService: InvoiceService,
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
    const dealerId = this.authService.currentUser?.userId || 10;
    this.cropService.getAllCrops().subscribe(c => {
      this.availableCrops = c || [];
      this.cdr.markForCheck();
    });
    this.orderService.getOrdersByDealer(dealerId).subscribe(o => {
      this.orders = o || [];
      this.totalPurchasedVolume = this.orders.reduce((acc, x) => acc + (x.quantity || 0), 0);
      this.cdr.markForCheck();
    });
    this.biddingService.getActiveSessions().subscribe(a => {
      this.auctions = a || [];
      this.cdr.markForCheck();
    });
    this.negotiationService.getNegotiationsByBuyer(dealerId).subscribe(negs => {
      this.negotiations = negs || [];
      this.cdr.markForCheck();
    });
    this.paymentService.getWallet(dealerId).subscribe(w => {
      this.walletBalance = w.balance;
      this.cdr.markForCheck();
    });
    this.cropService.getBuyingRequestsByDealer(dealerId).subscribe(reqs => {
      this.buyingRequests = reqs || [];
      this.cdr.markForCheck();
    });
    this.loadReviews();
  }

  loadReviews(): void {
    this.reviewService.getAllReviews().subscribe(revs => {
      const map: Record<number, { sum: number; count: number; average: number }> = {};
      (revs || []).forEach(r => {
        if (!r.cropId) return;
        if (!map[r.cropId]) map[r.cropId] = { sum: 0, count: 0, average: 5 };
        map[r.cropId].sum += r.rating;
        map[r.cropId].count += 1;
        map[r.cropId].average = Math.round((map[r.cropId].sum / map[r.cropId].count) * 10) / 10;
      });
      this.cropReviewsMap = map;
      this.cdr.markForCheck();
    });
  }

  cropReviewsMap: Record<number, { sum: number; count: number; average: number }> = {};

  getCropRating(cropId: number): number {
    return this.cropReviewsMap[cropId]?.average || 0;
  }

  getCropReviewCount(cropId: number): number {
    return this.cropReviewsMap[cropId]?.count || 0;
  }

  openOrderModal(crop: CropResponse): void {
    this.selectedCrop = crop;
    this.orderQuantity = Math.min(crop.quantity, 500);
    this.deliveryAddress = '';
    this.isOrderModalOpen = true;
  }

  submitOrder(): void {
    if (!this.selectedCrop) return;
    if (!this.deliveryAddress.trim()) {
      this.notifService.showToast('warning', 'Please enter your delivery address.');
      return;
    }
    const dealerId = this.authService.currentUser?.userId || 10;
    const req: CreateOrderRequest = {
      dealerId,
      farmerId: this.selectedCrop.farmerId,
      cropId: this.selectedCrop.id,
      cropName: this.selectedCrop.commodity,
      quantity: this.orderQuantity,
      unitPrice: this.selectedCrop.pricePerKg,
      deliveryAddress: this.deliveryAddress
    };
    this.orderService.createOrder(req).subscribe(order => {
      this.orders = [order, ...this.orders];
      this.totalPurchasedVolume += order.quantity;
      this.isOrderModalOpen = false;
      this.cdr.markForCheck();
      this.notifService.showToast('success', `Order #${order.id} placed! Directing to payment...`);
      // Automatically direct to payment
      this.openPaymentModal(order);
    });
  }

  openBidModal(auction: BiddingSessionResponse): void {
    this.selectedAuction = auction;
    const current = auction.currentHighestBid || auction.basePrice;
    this.bidAmount = current + auction.minIncrement;
    this.bidNotes = '';
    this.isBidModalOpen = true;
  }

  submitBid(): void {
    if (!this.selectedAuction) return;
    const current = this.selectedAuction.currentHighestBid || this.selectedAuction.basePrice;
    const minBid = current + this.selectedAuction.minIncrement;
    if (this.bidAmount < minBid) {
      this.notifService.showToast('warning', `Bid must be at least ₹${minBid}/KG`);
      return;
    }
    const dealerId = this.authService.currentUser?.userId || 10;
    const req: PlaceBidRequest = {
      dealerId,
      bidAmount: this.bidAmount,
      notes: this.bidNotes || 'Dealer bid'
    };
    this.biddingService.placeBid(this.selectedAuction.id, req, dealerId).subscribe(bid => {
      this.selectedAuction!.currentHighestBid = bid.bidAmount;
      this.isBidModalOpen = false;
      this.cdr.markForCheck();
      this.notifService.showToast('success', `Bid of ₹${bid.bidAmount}/KG submitted successfully!`);
    });
  }

  openPaymentModal(order: OrderResponse): void {
    this.selectedOrderForPayment = order;
    this.isPaymentModalOpen = true;
  }

  submitPayment(): void {
    if (!this.selectedOrderForPayment) return;
    this.orderService.payOrder(this.selectedOrderForPayment.id, { paymentMethod: 'WALLET' }).subscribe(order => {
      this.orders = this.orders.map(o => o.id === order.id ? order : o);
      this.walletBalance -= order.totalAmount;
      this.isPaymentModalOpen = false;
      this.cdr.markForCheck();
      this.notifService.showToast('success', `Payment of ₹${order.totalAmount} completed via Escrow Wallet!`);
    });
  }

  openReviewModal(order: OrderResponse): void {
    this.selectedOrderForReview = order;
    this.reviewForm = {
      farmerId: order.farmerId,
      dealerId: order.dealerId,
      orderId: order.id,
      cropId: order.cropId,
      rating: 5,
      comment: ''
    };
    this.isReviewModalOpen = true;
  }

  submitReview(): void {
    if (!(this.reviewForm.comment || '').trim()) {
      this.notifService.showToast('warning', 'Please write your review comment.');
      return;
    }
    this.reviewService.createReview(this.reviewForm).subscribe({
      next: rev => {
        this.isReviewModalOpen = false;
        this.loadReviews();
        this.cdr.markForCheck();
        this.notifService.showToast('success', `Review submitted! Reference: ${rev.reviewReference}`);
      },
      error: err => {
        this.isReviewModalOpen = false;
        this.cdr.markForCheck();
        const msg = err.error?.message || 'Failed to submit review. You may have already reviewed this order.';
        this.notifService.showToast('warning', msg);
      }
    });
  }

  downloadInvoice(orderId: number): void {
    this.invoiceService.downloadInvoicePdfByOrderId(orderId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `CropDeal_Invoice_${orderId}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
      this.notifService.showToast('info', `Downloaded Invoice PDF for Order #${orderId}`);
    });
  }

  openBuyingRequestModal(): void {
    this.newBuyingRequest = {
      cropName: '',
      quantity: 500,
      unit: 'KG',
      buyingPrice: 0,
      district: '',
      state: '',
      notes: ''
    };
    this.isBuyingRequestModalOpen = true;
    this.cdr.markForCheck();
  }

  submitBuyingRequest(): void {
    if (!this.newBuyingRequest.cropName || !this.newBuyingRequest.buyingPrice || !this.newBuyingRequest.state || !this.newBuyingRequest.district) {
      this.notifService.showToast('warning', 'Please fill in all required fields for your buying demand.');
      return;
    }
    const dealerId = this.authService.currentUser?.userId || 10;
    this.cropService.createBuyingRequest(this.newBuyingRequest, dealerId).subscribe(req => {
      this.buyingRequests = [req, ...this.buyingRequests];
      this.isBuyingRequestModalOpen = false;
      this.cdr.markForCheck();
      this.notifService.showToast('success', `Buying Request for "${req.cropName}" posted successfully! Farmers have been notified.`);
    });
  }

  cancelBuyingRequest(reqId: number): void {
    const dealerId = this.authService.currentUser?.userId || 10;
    this.cropService.cancelBuyingRequest(reqId, dealerId).subscribe(() => {
      this.buyingRequests = this.buyingRequests.filter(r => r.id !== reqId);
      this.cdr.markForCheck();
      this.notifService.showToast('info', `Buying request #${reqId} was cancelled.`);
    });
  }
}
