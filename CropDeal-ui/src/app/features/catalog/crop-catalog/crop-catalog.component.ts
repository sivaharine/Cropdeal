import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CropService } from '../../../core/services/crop.service';
import { OrderService } from '../../../core/services/order.service';
import { PriceService } from '../../../core/services/price.service';
import { NegotiationService } from '../../../core/services/negotiation.service';
import { ReviewService } from '../../../core/services/review.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  CropResponse, CreateCropRequest, CreateOrderRequest, MarketPriceResponse,
  CreateNegotiationRequest, FarmerReviewResponse, FarmerReviewRequest,
  SubscriptionResponse, BuyingRequestResponseDto
} from '../../../core/models/models';

@Component({
  selector: 'app-crop-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './crop-catalog.component.html',
  styleUrls: ['./crop-catalog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CropCatalogComponent implements OnInit {
  crops: CropResponse[] = [];
  filteredCrops: CropResponse[] = [];
  mandiPrices: MarketPriceResponse[] = [];
  buyingRequests: BuyingRequestResponseDto[] = [];
  userSubscriptions: SubscriptionResponse[] = [];

  // Tab & Nearby view models
  activeCatalogTab: 'crops' | 'demands' = 'crops';
  isNearbyOnly = false;

  // Filter models
  searchTerm = '';
  selectedState = 'All States';
  selectedGrade = 'All Grades';
  selectedCommodity = 'All Commodities';

  // Order Modal
  isOrderModalOpen = false;
  selectedCropForOrder: CropResponse | null = null;
  orderQuantity = 100;
  deliveryAddress = '';

  // Negotiate Modal
  isNegotiateModalOpen = false;
  selectedCropForNeg: CropResponse | null = null;
  negTargetPrice = 0;
  negQuantity = 100;

  // Farmer Follow Modal (dealer follows farmer profile)
  isFollowModalOpen = false;
  selectedFarmerForFollow: CropResponse | null = null;
  followedFarmerIds: Set<number> = new Set();

  // Farmer Edit/Delete own crops
  isEditCropModalOpen = false;
  cropBeingEdited: CropResponse | null = null;

  benchmarkPrices: { [commodity: string]: number } = {};

  states: string[] = ['All States', 'Punjab', 'Madhya Pradesh', 'Gujarat', 'Maharashtra', 'Uttar Pradesh', 'Haryana', 'Rajasthan'];
  grades: string[] = ['All Grades', 'A', 'B', 'C'];
  commodities: string[] = ['All Commodities', 'Basmati Rice', 'Wheat (Sharbati)', 'Cotton (MCU-5)', 'Soyabean', 'Red Onion (Nashik)', 'Potato (Kufri Jyoti)'];

  // Reviews & Ratings under all products
  cropReviewsMap: { [cropId: number]: { averageRating: number; totalReviews: number; reviews: FarmerReviewResponse[] } } = {};
  isReviewsModalOpen = false;
  isWriteReviewModalOpen = false;
  selectedCropForReviews: CropResponse | null = null;
  newReviewForm: { rating: number; reviewText: string } = { rating: 5, reviewText: '' };

  constructor(
    private cropService: CropService,
    private orderService: OrderService,
    private priceService: PriceService,
    private negotiationService: NegotiationService,
    private reviewService: ReviewService,
    private notifService: NotificationService,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (user) {
      try {
        const raw = localStorage.getItem(`cropdeal_followed_${user.userId}`);
        if (raw) this.followedFarmerIds = new Set(JSON.parse(raw));
      } catch {}
      this.loadSubscriptions(user.userId);
    }
    this.loadCatalog();
    this.loadBuyingRequests();
    this.loadReviews();
  }

  loadSubscriptions(userId: number): void {
    this.cropService.getSubscriptionsBySubscriber(userId).subscribe(subs => {
      this.userSubscriptions = subs || [];
      this.cdr.markForCheck();
    });
  }

  loadBuyingRequests(): void {
    this.cropService.getActiveBuyingRequests().subscribe(reqs => {
      this.buyingRequests = reqs || [];
      this.cdr.markForCheck();
    });
  }

  loadCatalog(): void {
    if (this.isNearbyOnly) {
      this.cropService.getNearbyCrops({
        state: this.selectedState !== 'All States' ? this.selectedState : undefined,
        commodity: this.selectedCommodity !== 'All Commodities' ? this.selectedCommodity : undefined,
        grade: this.selectedGrade !== 'All Grades' ? this.selectedGrade : undefined
      }).subscribe(crops => {
        this.crops = (crops as any) || [];
        this.applyFilter();
        this.computeBenchmarkPrices();
        this.cdr.markForCheck();
      });
    } else {
      this.cropService.getAllCrops().subscribe(crops => {
        this.crops = crops || [];
        this.applyFilter();
        this.computeBenchmarkPrices();
        this.cdr.markForCheck();
      });
    }

    this.priceService.getTodayPrices().subscribe(prices => {
      this.mandiPrices = prices || [];
      this.computeBenchmarkPrices();
      this.cdr.markForCheck();
    });
  }

  toggleNearby(): void {
    this.isNearbyOnly = !this.isNearbyOnly;
    this.loadCatalog();
  }

  isSubscribed(commodity: string): boolean {
    return this.userSubscriptions.some(s => s.commodity.toLowerCase() === commodity.toLowerCase());
  }

  toggleSubscription(crop: CropResponse): void {
    const user = this.authService.currentUser;
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const existing = this.userSubscriptions.find(s => s.commodity.toLowerCase() === crop.commodity.toLowerCase());
    if (existing) {
      // Unsubscribe
      this.cropService.unsubscribe(existing.id, user.userId).subscribe(() => {
        this.userSubscriptions = this.userSubscriptions.filter(s => s.id !== existing.id);
        this.cdr.markForCheck();
        this.notifService.showToast('info', `Unsubscribed from new harvest alerts for "${crop.commodity}".`);
      });
    } else {
      // Subscribe
      this.cropService.subscribe({
        subscriberId: user.userId,
        commodity: crop.commodity,
        state: crop.state,
        district: crop.district,
        grade: crop.grade
      }).subscribe(sub => {
        this.userSubscriptions = [sub, ...this.userSubscriptions];
        this.cdr.markForCheck();
        this.notifService.showToast('success', `Subscribed to alerts for "${crop.commodity}"! You'll be notified when farmers list new batches.`);
      });
    }
  }

  private computeBenchmarkPrices(): void {
    const map: { [commodity: string]: number } = {};
    for (const crop of this.crops) {
      if (!map[crop.commodity]) {
        const found = this.mandiPrices.find(p =>
          p.commodity && crop.commodity &&
          p.commodity.toLowerCase().includes(crop.commodity.split(' ')[0].toLowerCase())
        );
        if (found) {
          map[crop.commodity] = found.modalPricePerKg || (found.modalPrice ? found.modalPrice / 100 : 0);
        }
      }
    }
    this.benchmarkPrices = map;
  }

  applyFilter(): void {
    this.filteredCrops = this.crops.filter(crop => {
      const matchSearch = !this.searchTerm ||
        crop.commodity.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        crop.district.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        crop.state.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (crop.farmerName || '').toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchState = this.selectedState === 'All States' ||
        crop.state.toLowerCase() === this.selectedState.toLowerCase();

      const matchGrade = this.selectedGrade === 'All Grades' ||
        crop.grade.toUpperCase() === this.selectedGrade.toUpperCase();

      const matchCommodity = this.selectedCommodity === 'All Commodities' ||
        crop.commodity.toLowerCase().includes(this.selectedCommodity.toLowerCase());

      return matchSearch && matchState && matchGrade && matchCommodity;
    });
    this.cdr.markForCheck();
  }

  // ─── ORDER ───────────────────────────────────────
  openOrderModal(crop: CropResponse): void {
    this.selectedCropForOrder = crop;
    this.orderQuantity = Math.min(crop.quantity, 500);
    this.deliveryAddress = '';
    this.isOrderModalOpen = true;
  }

  submitOrder(): void {
    if (!this.selectedCropForOrder) return;
    if (!this.deliveryAddress.trim()) {
      this.notifService.showToast('warning', 'Please enter a delivery address.');
      return;
    }
    const user = this.authService.currentUser;
    if (!user) { this.router.navigate(['/auth/login']); return; }

    const req: CreateOrderRequest = {
      dealerId: user.userId,
      farmerId: this.selectedCropForOrder.farmerId,
      cropId: this.selectedCropForOrder.id,
      cropName: this.selectedCropForOrder.commodity,
      quantity: this.orderQuantity,
      unitPrice: this.selectedCropForOrder.pricePerKg,
      deliveryAddress: this.deliveryAddress
    };

    const crop = this.selectedCropForOrder;
    this.orderService.createOrder(req).subscribe(order => {
      this.isOrderModalOpen = false;
      this.cdr.markForCheck();

      // 1. Notify Customer (Dealer)
      this.notifService.showToast('success', `Order #${order.id} placed for ${crop.commodity}! Directing to payment checkout...`);

      // 2. Notify Seller (Farmer)
      if (req.farmerId) {
        this.notifService.pushNotification(
          'ORDER',
          '📦 New Purchase Order Received',
          `Customer ${user.name} placed Order #${order.id} for ${crop.commodity} (${order.quantity} KG). Total: ₹${order.totalAmount.toFixed(2)}.`,
          req.farmerId
        );
      }

      // 3. Automatically direct customer to payment checkout
      this.router.navigate(['/orders'], { queryParams: { payOrderId: order.id } });
    });
  }

  // ─── NEGOTIATE ───────────────────────────────────
  openNegotiateModal(crop: CropResponse): void {
    const user = this.authService.currentUser;
    if (!user) { this.router.navigate(['/auth/login']); return; }
    this.selectedCropForNeg = crop;
    this.negTargetPrice = Math.round(crop.pricePerKg * 0.92); // default: 8% below asking
    this.negQuantity = Math.min(crop.quantity, 200);
    this.isNegotiateModalOpen = true;
  }

  submitNegotiation(): void {
    if (!this.selectedCropForNeg || this.negTargetPrice <= 0) return;
    const user = this.authService.currentUser;
    if (!user) return;

    const crop = this.selectedCropForNeg;
    const req: CreateNegotiationRequest = {
      cropId: crop.id,
      cropName: crop.commodity,
      buyerId: user.userId || 10,
      sellerId: crop.farmerId || 1,
      quantity: this.negQuantity,
      targetPrice: this.negTargetPrice
    };

    this.negotiationService.createNegotiation(req).subscribe(neg => {
      this.isNegotiateModalOpen = false;
      this.cdr.markForCheck();

      // 1. Notify Buyer (Dealer)
      this.notifService.showToast('success', `Negotiation #${neg.id} started with farmer for ${crop.commodity}!`);

      // 2. Notify Seller (Farmer)
      if (req.sellerId) {
        this.notifService.pushNotification(
          'NEGOTIATION',
          '💬 New Negotiation Offer',
          `Buyer ${user.name} proposed ₹${req.targetPrice}/KG for ${req.quantity} KG of ${crop.commodity}. Negotiation #${neg.id}.`,
          req.sellerId
        );
      }
      this.router.navigate(['/negotiations']);
    });
  }

  // ─── FARMER FOLLOW / UNFOLLOW ─────────────────────
  followFarmer(crop: CropResponse): void {
    const user = this.authService.currentUser;
    if (!user) { this.router.navigate(['/auth/login']); return; }
    if (user.role !== 'DEALER') {
      this.notifService.showToast('info', 'Only dealers can follow farmer profiles.');
      return;
    }

    const farmerName = crop.farmerName || ('Farmer #' + crop.farmerId);

    // Toggle: if already followed, UNFOLLOW
    if (this.followedFarmerIds.has(crop.farmerId)) {
      this.followedFarmerIds.delete(crop.farmerId);
      try {
        localStorage.setItem(`cropdeal_followed_${user.userId}`, JSON.stringify(Array.from(this.followedFarmerIds)));
      } catch {}
      this.cdr.markForCheck();
      this.notifService.showToast('info', `Unfollowed ${farmerName}. You will no longer receive alerts for their new crops.`);
      return;
    }

    // Otherwise, FOLLOW
    this.followedFarmerIds.add(crop.farmerId);
    try {
      localStorage.setItem(`cropdeal_followed_${user.userId}`, JSON.stringify(Array.from(this.followedFarmerIds)));
    } catch {}
    this.cdr.markForCheck();

    // 1. Notify Dealer
    this.notifService.showToast('success',
      `Now following ${farmerName}! You'll get notified of new listings.`
    );

    // 2. Notify Farmer of new subscriber
    this.notifService.pushNotification(
      'SYSTEM',
      '⭐ New Profile Follower',
      `Dealer ${user.name} is now following your farm profile for new crop updates.`,
      crop.farmerId
    );
  }

  isFollowing(farmerId: number): boolean {
    return this.followedFarmerIds.has(farmerId);
  }

  // ─── FARMER: Edit/Delete own crops ───────────────────────────
  isOwnCrop(crop: CropResponse): boolean {
    const userId = this.authService.currentUser?.userId;
    return this.authService.currentUser?.role === 'FARMER' && crop.farmerId === userId;
  }

  openEditModal(crop: CropResponse): void {
    this.cropBeingEdited = { ...crop };
    this.isEditCropModalOpen = true;
  }

  submitEditCrop(): void {
    if (!this.cropBeingEdited) return;
    this.cropService.updateCrop(this.cropBeingEdited.id, this.cropBeingEdited).subscribe(updated => {
      this.crops = this.crops.map(c => c.id === updated.id ? updated : c);
      this.applyFilter();
      this.isEditCropModalOpen = false;
      this.cropBeingEdited = null;
      this.cdr.markForCheck();
      this.notifService.showToast('success', `"${updated.commodity}" updated successfully!`);
    });
  }

  deleteCrop(crop: CropResponse): void {
    if (!confirm(`Remove "${crop.commodity}" from the marketplace?`)) return;
    this.cropService.deleteCrop(crop.id).subscribe(() => {
      this.crops = this.crops.filter(c => c.id !== crop.id);
      this.applyFilter();
      this.cdr.markForCheck();
      this.notifService.showToast('success', `"${crop.commodity}" removed from marketplace.`);
    });
  }

  // ─── PRODUCT REVIEWS & RATINGS ──────────────────────────────
  loadReviews(): void {
    this.reviewService.getAllReviews().subscribe(allReviews => {
      const map: { [cropId: number]: { averageRating: number; totalReviews: number; reviews: FarmerReviewResponse[] } } = {};

      for (const rev of allReviews) {
        if (!map[rev.cropId]) {
          map[rev.cropId] = { averageRating: 0, totalReviews: 0, reviews: [] };
        }
        map[rev.cropId].reviews.push(rev);
      }

      for (const cropIdStr of Object.keys(map)) {
        const cId = Number(cropIdStr);
        const list = map[cId].reviews;
        const total = list.reduce((sum, r) => sum + r.rating, 0);
        map[cId].totalReviews = list.length;
        map[cId].averageRating = Math.round((total / list.length) * 10) / 10;
      }

      this.cropReviewsMap = map;
      this.cdr.markForCheck();
    });
  }

  getCropRating(cropId: number): number {
    return this.cropReviewsMap[cropId]?.averageRating || 0;
  }

  getCropReviewCount(cropId: number): number {
    return this.cropReviewsMap[cropId]?.totalReviews || 0;
  }

  getCropReviews(cropId: number): FarmerReviewResponse[] {
    return this.cropReviewsMap[cropId]?.reviews || [];
  }

  openProductReviewsModal(crop: CropResponse): void {
    this.selectedCropForReviews = crop;
    this.isReviewsModalOpen = true;
    this.cdr.markForCheck();
  }

  openWriteReviewModal(crop: CropResponse): void {
    const user = this.authService.currentUser;
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.selectedCropForReviews = crop;
    this.newReviewForm = { rating: 5, reviewText: '' };
    this.isWriteReviewModalOpen = true;
    this.cdr.markForCheck();
  }

  setReviewRating(rating: number): void {
    this.newReviewForm.rating = rating;
  }

  submitProductReview(): void {
    if (!this.selectedCropForReviews) return;
    if (!this.newReviewForm.reviewText.trim()) {
      this.notifService.showToast('warning', 'Please provide a feedback description.');
      return;
    }
    const user = this.authService.currentUser;
    const crop = this.selectedCropForReviews;

    const req: FarmerReviewRequest = {
      farmerId: crop.farmerId,
      dealerId: user?.userId || 10,
      orderId: (Date.now() % 9000) + 1000,
      cropId: crop.id,
      rating: this.newReviewForm.rating,
      reviewText: this.newReviewForm.reviewText,
      comment: this.newReviewForm.reviewText
    };

    this.reviewService.createReview(req).subscribe(created => {
      this.isWriteReviewModalOpen = false;
      this.loadReviews();
      this.notifService.showToast('success', `Thank you! Your verified review for "${crop.commodity}" has been submitted.`);
      this.cdr.markForCheck();
    });
  }
}
