import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SubscriptionService } from '../../core/services/subscription.service';
import { CropService } from '../../core/services/crop.service';
import { AuthService } from '../../core/services/auth.service';
import { CropSubscription } from '../../core/models/subscription.model';
import { Crop } from '../../core/models/crop.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-crop-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="subscriptions-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title"><i class="fa-solid fa-bookmark text-emerald"></i> Dealer Crop Subscriptions</h2>
          <p class="page-subtitle">
            Subscribe to agricultural commodities to receive immediate in-app notifications whenever farmers list matching harvests.
          </p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          <i class="fa-solid fa-plus"></i> Add Custom Subscription
        </button>
      </div>

      <!-- Action Toast Message -->
      <div *ngIf="statusMsg" class="alert alert-success shadow-md">
        <i class="fa-solid fa-circle-check"></i>
        <span>{{ statusMsg }}</span>
      </div>

      <!-- Quick Commodity Subscription Chips (Strictly from Active UI Crops) -->
      <div class="card p-4 text-center">
        <h4 class="card-subtitle-bold"><i class="fa-solid fa-bolt text-amber"></i> Quick Subscribe to Available Marketplace Crops</h4>
        <p class="card-desc">Showing only crops currently active in the marketplace UI. Click any crop chip below to toggle your subscription.</p>
        
        <div *ngIf="popularCommodities.length === 0" class="py-3 text-muted">
          <small>No active crops currently listed in the marketplace UI.</small>
        </div>

        <div class="commodity-chips-grid mt-3" *ngIf="popularCommodities.length > 0">
          <button
            *ngFor="let com of popularCommodities"
            class="commodity-chip"
            [class.active]="isSubscribed(com.name)"
            (click)="toggleQuickSubscription(com)">
            <i class="fa-solid" [class.fa-check]="isSubscribed(com.name)" [class.fa-plus]="!isSubscribed(com.name)"></i>
            <span>{{ com.name }}</span>
            <small class="chip-cat">({{ com.category }} • ₹{{ com.priceKg }}/Kg)</small>
          </button>
        </div>
      </div>

      <!-- Two Column Layout: Active Subscriptions & Live Subscribed Feed -->
      <div class="grid grid-cols-12 gap-4 mt-4">
        <!-- Left: Active Subscriptions List -->
        <div class="col-span-5">
          <div class="card h-100">
            <div class="card-header-clean">
              <div>
                <h3 class="section-title"><i class="fa-solid fa-tags text-primary-600"></i> My Active Subscriptions</h3>
                <span class="subtext">{{ visibleSubscriptions.length }} active UI commodities monitored</span>
              </div>
            </div>

            <div *ngIf="visibleSubscriptions.length === 0" class="empty-state py-4">
              <i class="fa-regular fa-bookmark"></i>
              <p>No active subscriptions for current marketplace crops</p>
              <small class="text-muted">Click the available crop chips above or add a subscription for crops listed in the UI!</small>
            </div>

            <div class="subscriptions-list mt-3">
              <div *ngFor="let sub of visibleSubscriptions" class="sub-item-card">
                <div class="sub-item-header">
                  <span class="sub-com-name">{{ sub.commodity }}</span>
                  <button class="btn-icon-danger" (click)="removeSubscription(sub.id)" title="Unsubscribe">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <div class="sub-meta-row">
                  <span class="badge badge-subtle">{{ sub.category || 'Commodity' }}</span>
                  <span *ngIf="sub.preferredState" class="meta-tag"><i class="fa-solid fa-location-dot"></i> {{ sub.preferredState }}</span>
                  <span *ngIf="getSubQuantityKg(sub)" class="meta-tag"><i class="fa-solid fa-scale-balanced"></i> {{ getSubQuantityKg(sub) }} Kg</span>
                  <span *ngIf="sub.maxBudgetPerUnit" class="meta-tag"><i class="fa-solid fa-indian-rupee-sign"></i> Max ₹{{ formatBudgetKg(sub.maxBudgetPerUnit) }}/Kg</span>
                </div>
                <div class="notif-indicator mt-2">
                  <i class="fa-solid fa-bell text-emerald"></i>
                  <span>Instant in-app alerts active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Live Subscribed Harvests Feed -->
        <div class="col-span-7">
          <div class="card h-100">
            <div class="card-header-clean">
              <div>
                <h3 class="section-title"><i class="fa-solid fa-wheat-awn text-emerald"></i> Subscribed Crops Live Feed</h3>
                <span class="subtext">Active marketplace harvests matching your subscribed commodities</span>
              </div>
              <button class="btn btn-secondary btn-sm" (click)="loadMatchingCrops()" title="Refresh Feed">
                <i class="fa-solid fa-arrows-rotate"></i> Refresh
              </button>
            </div>

            <div *ngIf="matchingCrops.length === 0" class="empty-state py-5">
              <i class="fa-solid fa-box-open"></i>
              <p>No matching active UI crop listings found for your subscriptions</p>
              <small class="text-muted">Only crops currently active in the marketplace UI appear here. Subscribe to an available crop above to view live matches.</small>
            </div>

            <div class="crops-feed-list mt-3" *ngIf="matchingCrops.length > 0">
              <div *ngFor="let crop of matchingCrops" class="crop-feed-card">
                <div class="crop-feed-header">
                  <div>
                    <span class="matched-badge"><i class="fa-solid fa-bookmark"></i> Subscribed Match</span>
                    <h4 class="crop-name">{{ crop.cropName }}</h4>
                    <span class="farmer-name"><i class="fa-solid fa-user"></i> Listed by {{ crop.farmerName || 'Verified Producer' }}</span>
                  </div>
                  <div class="crop-price-box">
                    <span class="price-val text-emerald">₹{{ crop.pricePerUnit }}</span>
                    <small class="price-unit">/ Kg</small>
                  </div>
                </div>

                <div class="crop-feed-details mt-2">
                  <div class="feed-detail-item">
                    <span class="lbl">Available Quantity:</span>
                    <strong>{{ crop.quantity }} Kg</strong>
                  </div>
                  <div class="feed-detail-item">
                    <span class="lbl">Farm / Mandi Location:</span>
                    <span><i class="fa-solid fa-location-dot text-danger"></i> {{ crop.location || 'Punjab Mandi' }}</span>
                  </div>
                </div>

                <p class="crop-desc-text mt-2" *ngIf="crop.description">
                  {{ crop.description }}
                </p>

                <div class="crop-feed-actions mt-3">
                  <a routerLink="/crops" class="btn btn-primary btn-sm">
                    <i class="fa-solid fa-cart-shopping"></i> Trade / Buy in Marketplace
                  </a>
                  <a routerLink="/negotiations" class="btn btn-outline btn-sm">
                    <i class="fa-solid fa-handshake"></i> Send Offer / Negotiate
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Custom Subscription Modal (Details in Kg) -->
      <div *ngIf="showAddModal" class="modal-overlay">
        <div class="modal-content shadow-xl">
          <div class="modal-header">
            <h3><i class="fa-solid fa-bookmark text-emerald"></i> Add Commodity Subscription (in Kg)</h3>
            <button class="close-btn" (click)="showAddModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Select Marketplace Crop / Commodity *</label>
              <select
                [(ngModel)]="newSub.commodity"
                (ngModelChange)="onCommoditySelect($event)"
                class="form-control"
                required>
                <option value="" disabled>-- Select an Active Crop from Marketplace UI --</option>
                <option *ngFor="let com of popularCommodities" [value]="com.name">
                  {{ com.name }} ({{ com.category }} • ₹{{ com.priceKg }}/Kg available)
                </option>
              </select>
            </div>

            <div class="form-group mt-3">
              <label class="form-label">Category</label>
              <select [(ngModel)]="newSub.category" class="form-control">
                <option value="Grains">Grains & Cereals</option>
                <option value="Pulses">Pulses & Legumes</option>
                <option value="Oilseeds">Oilseeds</option>
                <option value="Spices">Spices & Condiments</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3 mt-3">
              <div class="form-group">
                <label class="form-label">Required Quantity (in Kg) *</label>
                <input
                  type="number"
                  [(ngModel)]="newSubQuantityKg"
                  min="1"
                  placeholder="e.g. 500 Kg"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Max Target Price (₹/Kg) *</label>
                <input
                  type="number"
                  [(ngModel)]="newSub.maxBudgetPerUnit"
                  min="1"
                  placeholder="e.g. 25"
                  class="form-control"
                />
              </div>
            </div>

            <div class="form-group mt-3">
              <label class="form-label">Preferred State / Location (Optional)</label>
              <input
                type="text"
                [(ngModel)]="newSub.preferredState"
                placeholder="e.g. Punjab, Haryana, MP"
                class="form-control"
              />
            </div>

            <div class="form-check mt-4">
              <input type="checkbox" [(ngModel)]="newSub.notifyInApp" id="notifCheck" class="form-check-input" />
              <label for="notifCheck" class="form-check-label">
                <strong>Enable instant in-app notification</strong> when any farmer lists this crop in Kg
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showAddModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="saveSubscription()">
              <i class="fa-solid fa-check"></i> Save Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .subscriptions-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
    .page-subtitle { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem; }
    .card-subtitle-bold { font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem; }
    .card-desc { font-size: 0.8rem; color: var(--text-muted); }
    .commodity-chips-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
    .commodity-chip {
      background: var(--bg-subtle);
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-full);
      padding: 0.45rem 1rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-main);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all var(--transition-fast);
    }
    .commodity-chip:hover {
      border-color: var(--primary-500);
      background: var(--primary-50);
      color: var(--primary-700);
    }
    .commodity-chip.active {
      background: #dcfce7;
      border-color: #22c55e;
      color: #15803d;
      font-weight: 700;
    }
    .chip-cat { font-size: 0.7rem; color: var(--text-muted); font-weight: normal; }
    .card-header-clean { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); padding-bottom: 0.75rem; }
    .section-title { font-size: 1.1rem; font-weight: 700; color: var(--text-main); }
    .subtext { font-size: 0.75rem; color: var(--text-muted); }
    .subscriptions-list { display: flex; flex-direction: column; gap: 0.75rem; max-height: 520px; overflow-y: auto; }
    .sub-item-card {
      background: var(--bg-subtle);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 0.85rem 1rem;
      transition: all var(--transition-fast);
    }
    .sub-item-card:hover { border-color: var(--primary-400); background: #f0fdf4; }
    .sub-item-header { display: flex; justify-content: space-between; align-items: center; }
    .sub-com-name { font-size: 1rem; font-weight: 700; color: var(--text-main); }
    .btn-icon-danger {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
    }
    .btn-icon-danger:hover { color: #dc2626; background: #fee2e2; }
    .sub-meta-row { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.4rem; flex-wrap: wrap; }
    .meta-tag { font-size: 0.75rem; color: var(--text-muted); }
    .notif-indicator { font-size: 0.72rem; color: #166534; display: flex; align-items: center; gap: 0.35rem; }
    .crops-feed-list { display: flex; flex-direction: column; gap: 1rem; max-height: 520px; overflow-y: auto; }
    .crop-feed-card {
      background: white;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.15rem;
      box-shadow: var(--shadow-sm);
    }
    .crop-feed-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .matched-badge {
      display: inline-block;
      font-size: 0.65rem;
      font-weight: 700;
      color: #15803d;
      background: #dcfce7;
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-full);
      margin-bottom: 0.35rem;
    }
    .crop-name { font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin: 0; }
    .farmer-name { font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem; display: block; }
    .crop-price-box { text-align: right; }
    .price-val { font-size: 1.35rem; font-weight: 800; }
    .price-unit { font-size: 0.75rem; color: var(--text-muted); }
    .crop-feed-details {
      display: flex;
      gap: 2rem;
      background: var(--bg-subtle);
      padding: 0.6rem 0.85rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
    }
    .feed-detail-item .lbl { color: var(--text-muted); margin-right: 0.35rem; }
    .crop-desc-text { font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; }
    .crop-feed-actions { display: flex; gap: 0.75rem; }
    .btn-outline {
      border: 1px solid var(--border-color);
      background: white;
      color: var(--text-main);
      font-weight: 600;
      border-radius: var(--radius-md);
      padding: 0.4rem 0.85rem;
      font-size: 0.8rem;
    }
    .btn-outline:hover { background: var(--bg-subtle); border-color: var(--primary-500); color: var(--primary-700); }
    .empty-state { text-align: center; color: var(--text-muted); }
    .empty-state i { font-size: 2.5rem; color: var(--border-color); margin-bottom: 0.75rem; display: block; }
    .empty-state p { font-weight: 600; font-size: 0.95rem; margin-bottom: 0.25rem; }
    .grid-cols-12 { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); }
    .col-span-5 { grid-column: span 5 / span 5; }
    .col-span-7 { grid-column: span 7 / span 7; }
    @media (max-width: 900px) {
      .col-span-5, .col-span-7 { grid-column: span 12 / span 12; }
    }
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 520px;
      overflow: hidden;
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 { font-size: 1.2rem; font-weight: 800; margin: 0; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); }
    .modal-body { padding: 1.5rem; }
    .modal-footer {
      padding: 1rem 1.5rem;
      background: var(--bg-subtle);
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    .form-check { display: flex; align-items: center; gap: 0.5rem; }
    .form-check-input { width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-600); }
    .form-check-label { font-size: 0.85rem; cursor: pointer; }
    .alert-success { background: var(--success-bg); color: var(--success); border: 1px solid #86efac; padding: 0.85rem 1.25rem; border-radius: var(--radius-md); display: flex; align-items: center; gap: 0.75rem; font-weight: 600; font-size: 0.85rem; }
  `]
})
export class CropSubscriptionsComponent implements OnInit {
  user: User | null = null;
  subscriptions: CropSubscription[] = [];
  uiCrops: Crop[] = [];
  matchingCrops: Crop[] = [];
  statusMsg = '';
  showAddModal = false;
  newSubQuantityKg = 500;

  popularCommodities: { name: string; category: string; priceKg: number }[] = [];

  newSub: Partial<CropSubscription> = {
    commodity: '',
    category: 'Grains',
    preferredState: '',
    maxBudgetPerUnit: 25,
    notifyInApp: true
  };

  constructor(
    private subscriptionService: SubscriptionService,
    private cropService: CropService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Clear any stale cached crops that are no longer in the UI
    try {
      localStorage.removeItem('cropdeal_recent_crops');
    } catch {}

    this.authService.currentUser$.subscribe((u: User | null) => {
      this.user = u;
      const dealerId = this.getDealerId();
      this.loadSubscriptions(dealerId);
    });

    this.cropService.crops$.subscribe((crops) => {
      this.syncUiCrops(crops || []);
    });
  }

  private getDealerId(): string {
    return this.user?.id || this.user?.userId || 'dealer-default';
  }

  private syncUiCrops(crops: Crop[]): void {
    const active = (crops || []).filter(c =>
      c &&
      c.cropName &&
      c.status !== 'DELETED' &&
      c.status !== 'SOLD' &&
      Number(c.quantity ?? c.availableQuantity ?? 0) > 0
    );
    this.uiCrops = active;

    // Build unique commodity chips strictly from active UI crops
    const seen = new Set<string>();
    const list: { name: string; category: string; priceKg: number }[] = [];
    active.forEach(c => {
      const key = (c.cropName || '').trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push({
          name: c.cropName.trim(),
          category: c.cropType || 'Grains',
          priceKg: Number(c.pricePerUnit || 25)
        });
      }
    });
    this.popularCommodities = list;

    const dealerId = this.getDealerId();
    this.subscriptionService.getMatchingCropsForDealer(dealerId, this.uiCrops).subscribe(matched => {
      this.matchingCrops = matched;
    });
  }

  get visibleSubscriptions(): CropSubscription[] {
    if (!this.uiCrops || this.uiCrops.length === 0) return [];
    return (this.subscriptions || []).filter(sub => {
      const subName = (sub.commodity || '').toLowerCase().trim();
      return this.uiCrops.some(c => {
        const cropName = (c.cropName || '').toLowerCase().trim();
        return subName && cropName && (cropName.includes(subName) || subName.includes(cropName));
      });
    });
  }

  formatBudgetKg(val?: number): number {
    if (!val) return 25;
    return val > 500 ? Math.round(val / 100) : val;
  }

  getSubQuantityKg(sub: CropSubscription): number {
    return (sub as any).minQuantityKg || 500;
  }

  onCommoditySelect(commodityName: string): void {
    const found = this.popularCommodities.find(c => c.name.toLowerCase() === (commodityName || '').toLowerCase());
    if (found) {
      this.newSub.category = found.category;
      this.newSub.maxBudgetPerUnit = found.priceKg;
    }
  }

  loadSubscriptions(dealerId: string): void {
    this.subscriptionService.getSubscriptions(dealerId).subscribe((subs) => {
      this.subscriptions = subs;
      this.loadMatchingCrops();
    });
  }

  isSubscribed(commodity: string): boolean {
    return this.visibleSubscriptions.some(s => s.commodity.toLowerCase() === commodity.toLowerCase());
  }

  toggleQuickSubscription(com: { name: string; category: string; priceKg?: number }): void {
    const dealerId = this.getDealerId();
    const existing = this.subscriptions.find(s => s.commodity.toLowerCase() === com.name.toLowerCase());
    if (existing) {
      this.removeSubscription(existing.id);
    } else {
      const sub: any = {
        id: 'sub-' + Date.now(),
        dealerId: dealerId,
        commodity: com.name,
        category: com.category,
        maxBudgetPerUnit: com.priceKg || 25,
        minQuantityKg: 500,
        notifyInApp: true,
        createdAt: new Date().toISOString()
      };
      this.subscriptionService.subscribe(sub).subscribe(() => {
        this.statusMsg = `Subscribed to ${com.name} (₹${sub.maxBudgetPerUnit}/Kg)! You will receive in-app notifications for matching harvests.`;
        this.loadSubscriptions(dealerId);
        setTimeout(() => this.statusMsg = '', 4000);
      });
    }
  }

  removeSubscription(id: string): void {
    const dealerId = this.getDealerId();
    this.subscriptionService.unsubscribe(id, dealerId).subscribe(() => {
      this.statusMsg = 'Subscription removed.';
      this.loadSubscriptions(dealerId);
      setTimeout(() => this.statusMsg = '', 3000);
    });
  }

  loadMatchingCrops(): void {
    this.cropService.getAllCrops().subscribe({
      next: (crops) => {
        this.syncUiCrops(crops || []);
      },
      error: () => {
        this.syncUiCrops([]);
      }
    });
  }

  openAddModal(): void {
    const firstCrop = this.popularCommodities.length > 0 ? this.popularCommodities[0] : null;
    this.newSubQuantityKg = 500;
    this.newSub = {
      commodity: firstCrop ? firstCrop.name : '',
      category: firstCrop ? firstCrop.category : 'Grains',
      preferredState: '',
      maxBudgetPerUnit: firstCrop ? firstCrop.priceKg : 25,
      notifyInApp: true
    };
    this.showAddModal = true;
  }

  saveSubscription(): void {
    if (!this.newSub.commodity) {
      alert('Please select an active marketplace crop.');
      return;
    }
    const dealerId = this.getDealerId();
    const sub: any = {
      id: 'sub-' + Date.now(),
      dealerId: dealerId,
      commodity: this.newSub.commodity,
      category: this.newSub.category || 'Grains',
      preferredState: this.newSub.preferredState,
      maxBudgetPerUnit: Number(this.newSub.maxBudgetPerUnit || 25),
      minQuantityKg: Number(this.newSubQuantityKg || 500),
      notifyInApp: this.newSub.notifyInApp ?? true,
      createdAt: new Date().toISOString()
    };
    this.subscriptionService.subscribe(sub).subscribe(() => {
      this.showAddModal = false;
      this.statusMsg = `Successfully subscribed to ${sub.commodity} (${sub.minQuantityKg} Kg @ Max ₹${sub.maxBudgetPerUnit}/Kg)!`;
      this.loadSubscriptions(dealerId);
      setTimeout(() => this.statusMsg = '', 4000);
    });
  }
}
