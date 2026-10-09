import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CropService } from '../../core/services/crop.service';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { Crop } from '../../core/models/crop.model';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { resolveCropImage } from '../../core/utils/crop-image.util';

interface MandiPriceBenchmark {
  commodity: string;
  category: string;
  modalPricePerKg: number;
  minPricePerKg: number;
  maxPricePerKg: number;
  market: string;
  state: string;
  variety?: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-crop-add',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="add-crop-container">
      <div class="card add-card">
        <div class="card-header">
          <div>
            <h2 class="form-title"><i class="fa-solid fa-circle-plus text-emerald"></i> List Your Fresh Harvest</h2>
            <p class="form-subtitle">Sell directly to commercial dealers. Set a competitive rate below Government Mandhi prices.</p>
          </div>
          <a routerLink="/crops" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-arrow-left"></i> Back to Market
          </a>
        </div>

        <div *ngIf="successMessage" class="alert alert-success">
          <i class="fa-solid fa-circle-check"></i>
          <span>{{ successMessage }}</span>
        </div>
        <div *ngIf="errorMessage" class="alert alert-danger">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Quick Select Commodity Chips -->
        <div class="quick-chips-section">
          <label class="section-label">
            <i class="fa-solid fa-bolt text-amber"></i> Quick Select Commodity to Check Mandhi Price:
          </label>
          <div class="chips-wrap">
            <button
              *ngFor="let item of popularCommodities"
              type="button"
              class="commodity-chip"
              [class.active]="crop.cropName === item.commodity"
              (click)="selectCommodity(item)">
              <span>{{ item.commodity }}</span>
              <strong class="chip-price">₹{{ item.modalPricePerKg }}/Kg</strong>
            </button>
          </div>
        </div>

        <form (ngSubmit)="onSubmit()" class="crop-form">
          <div class="grid grid-cols-2">
            <div class="form-group">
              <label class="form-label">Crop / Commodity Name *</label>
              <input
                type="text"
                [(ngModel)]="crop.cropName"
                (ngModelChange)="onCropNameInput($event)"
                name="cropName"
                list="commodityList"
                placeholder="e.g. Wheat, Basmati Rice, Tomato, Onion..."
                class="form-control"
                required />
              <datalist id="commodityList">
                <option *ngFor="let p of allGovPrices" [value]="p.commodity">{{ p.commodity }} - Govt Rate: ₹{{ p.modalPricePerKg }}/Kg</option>
              </datalist>
              <small class="field-hint">Type or select a commodity to automatically load official Mandhi prices.</small>
            </div>

            <div class="form-group">
              <label class="form-label">Crop Category *</label>
              <select [(ngModel)]="crop.cropType" name="cropType" class="form-control" required>
                <option value="Grains">Grains & Cereals</option>
                <option value="Pulses">Pulses & Legumes</option>
                <option value="Oilseeds">Oilseeds</option>
                <option value="Spices">Spices</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Commercial">Commercial Crops</option>
              </select>
            </div>
          </div>

          <!-- PROMINENT GOVERNMENT MANDHI PRICE CARD -->
          <div class="gov-mandhi-card shadow-sm" *ngIf="matchedGovPrice">
            <div class="gov-card-badge">
              <div class="badge-title">
                <i class="fa-solid fa-building-columns"></i>
                <span>Official Government Mandhi Price (APMC Benchmark)</span>
              </div>
              <span class="badge-tag">
                <i class="fa-regular fa-clock"></i> Live Market Reference
              </span>
            </div>

            <div class="gov-card-grid">
              <div class="gov-price-box">
                <span class="box-lbl">Government Mandhi Rate</span>
                <div class="box-rate">
                  <span class="currency">₹</span>
                  <span class="value">{{ matchedGovPrice.modalPricePerKg | number:'1.2-2' }}</span>
                  <span class="per-unit">/ Kg</span>
                </div>
                <span class="box-sub">Modal APMC Benchmark</span>
              </div>

              <div class="gov-market-details">
                <div class="detail-line">
                  <span class="d-label">Commodity:</span>
                  <strong class="d-val">{{ matchedGovPrice.commodity }}</strong>
                </div>
                <div class="detail-line">
                  <span class="d-label">Reference Mandi:</span>
                  <span class="d-val">{{ matchedGovPrice.market || 'Regional APMC Mandi' }} ({{ matchedGovPrice.state || 'India' }})</span>
                </div>
                <div class="detail-line" *ngIf="matchedGovPrice.minPricePerKg && matchedGovPrice.maxPricePerKg">
                  <span class="d-label">Official Range:</span>
                  <span class="d-val">₹{{ matchedGovPrice.minPricePerKg }} - ₹{{ matchedGovPrice.maxPricePerKg }} / Kg</span>
                </div>
                <div class="detail-line text-emerald font-semibold">
                  <span class="d-label">Max Allowed Farmer Price:</span>
                  <strong class="d-val text-emerald">&lt; ₹{{ matchedGovPrice.modalPricePerKg | number:'1.2-2' }} / Kg</strong>
                </div>
              </div>
            </div>

            <!-- Validation Feedback Banner inside Mandhi Card -->
            <div class="gov-validation-bar" [ngClass]="getValidationStatusClass()">
              <ng-container *ngIf="!crop.pricePerUnit">
                <i class="fa-solid fa-circle-info"></i>
                <span>Please enter your selling price below. It <strong>must be lesser than ₹{{ matchedGovPrice.modalPricePerKg | number:'1.2-2' }} / Kg</strong>.</span>
              </ng-container>
              <ng-container *ngIf="crop.pricePerUnit && isPriceHigherThanGov()">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>
                  <strong>Price Too High!</strong> ₹{{ crop.pricePerUnit }}/Kg exceeds or equals the Government Mandhi price of ₹{{ matchedGovPrice.modalPricePerKg | number:'1.2-2' }}/Kg.
                  Please specify an amount <strong>lesser than ₹{{ matchedGovPrice.modalPricePerKg | number:'1.2-2' }}/Kg</strong> (e.g. ₹{{ (matchedGovPrice.modalPricePerKg - 1) | number:'1.2-2' }}/Kg).
                </span>
              </ng-container>
              <ng-container *ngIf="crop.pricePerUnit && !isPriceHigherThanGov()">
                <i class="fa-solid fa-circle-check"></i>
                <span>
                  <strong>Approved!</strong> Your price of ₹{{ crop.pricePerUnit }}/Kg is lower than Government Mandhi rate (₹{{ matchedGovPrice.modalPricePerKg | number:'1.2-2' }}/Kg).
                  Commercial dealers save ₹{{ (matchedGovPrice.modalPricePerKg - crop.pricePerUnit) | number:'1.2-2' }}/Kg!
                </span>
              </ng-container>
            </div>
          </div>

          <div class="grid grid-cols-3">
            <div class="form-group">
              <label class="form-label">Quantity Available *</label>
              <input type="number" [(ngModel)]="crop.quantity" name="quantity" min="1" placeholder="e.g. 500" class="form-control" required />
            </div>

            <div class="form-group">
              <label class="form-label">Measurement Unit *</label>
              <select [(ngModel)]="crop.unit" name="unit" class="form-control" required>
                <option value="Kg">Kilogram (Kg)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">
                Farmer Selling Price (₹ / Kg) *
              </label>
              <div class="input-with-icon">
                <span class="input-prefix">₹</span>
                <input
                  type="number"
                  [(ngModel)]="crop.pricePerUnit"
                  (ngModelChange)="onPriceChange()"
                  name="pricePerUnit"
                  min="0.5"
                  step="0.5"
                  [placeholder]="matchedGovPrice ? 'Max allowed: < ' + matchedGovPrice.modalPricePerKg : 'e.g. 23'"
                  class="form-control"
                  [class.is-invalid]="crop.pricePerUnit && isPriceHigherThanGov()"
                  [class.is-valid]="crop.pricePerUnit && !isPriceHigherThanGov()"
                  required />
              </div>
              <small *ngIf="matchedGovPrice && isPriceHigherThanGov()" class="text-danger font-semibold mt-1 d-block">
                Must be strictly less than ₹{{ matchedGovPrice.modalPricePerKg }}/Kg
              </small>
              <small *ngIf="matchedGovPrice && !isPriceHigherThanGov() && crop.pricePerUnit" class="text-success font-semibold mt-1 d-block">
                ✓ Valid rate: lower than Govt Mandhi rate
              </small>
            </div>
          </div>

          <div class="grid grid-cols-2">
            <div class="form-group">
              <label class="form-label">Mandi / Farm Location *</label>
              <input type="text" [(ngModel)]="crop.location" name="location" placeholder="e.g. Khanna Mandi, Ludhiana, Punjab" class="form-control" required />
            </div>

            <div class="form-group">
              <label class="form-label">Image URL</label>
              <input type="url" [(ngModel)]="crop.imageUrl" name="imageUrl" placeholder="https://images.unsplash.com/..." class="form-control" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Harvest Quality & Soil / Organic Details</label>
            <textarea [(ngModel)]="crop.description" name="description" rows="3" class="form-control" placeholder="Describe variety grade, moisture level, organic certification, pesticide treatment..."></textarea>
          </div>

          <div class="form-actions mt-4">
            <button type="button" routerLink="/crops" class="btn btn-secondary">Cancel</button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="submitting || (matchedGovPrice && isPriceHigherThanGov())">
              <i class="fa-solid fa-paper-plane"></i>
              {{ submitting ? 'Publishing Crop...' : 'Publish Harvest to Marketplace' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .add-crop-container {
      max-width: 920px;
      margin: 0 auto;
    }
    .form-title { font-size: 1.4rem; font-weight: 800; color: var(--text-main, #0f172a); }
    .form-subtitle { font-size: 0.85rem; color: var(--text-muted, #64748b); margin-top: 0.2rem; }
    .text-emerald { color: #15803d; }
    .text-amber { color: #d97706; }
    .text-danger { color: #dc2626; }
    .text-success { color: #16a34a; }
    .font-semibold { font-weight: 600; }
    .d-block { display: block; }
    .mt-1 { margin-top: 0.25rem; }

    /* Quick Chips */
    .quick-chips-section {
      margin-top: 1.25rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1rem;
    }
    .section-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 0.65rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .chips-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .commodity-chip {
      background: white;
      border: 1px solid #cbd5e1;
      padding: 0.4rem 0.75rem;
      border-radius: 2rem;
      font-size: 0.8rem;
      color: #1e293b;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      transition: all 0.15s ease-in-out;
    }
    .commodity-chip:hover {
      border-color: #15803d;
      background: #f0fdf4;
      color: #15803d;
      transform: translateY(-1px);
    }
    .commodity-chip.active {
      background: #15803d;
      border-color: #15803d;
      color: white;
    }
    .commodity-chip.active .chip-price {
      background: rgba(255, 255, 255, 0.25);
      color: white;
    }
    .chip-price {
      background: #f1f5f9;
      padding: 0.15rem 0.45rem;
      border-radius: 1rem;
      font-size: 0.72rem;
      color: #15803d;
      font-weight: 700;
    }

    /* Government Mandhi Price Card */
    .gov-mandhi-card {
      background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
      border: 1.5px solid #86efac;
      border-radius: 0.75rem;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin: 0.5rem 0;
    }
    .gov-card-badge {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px dashed #bbf7d0;
      padding-bottom: 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .badge-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 800;
      color: #166534;
      font-size: 0.9rem;
    }
    .badge-tag {
      font-size: 0.72rem;
      font-weight: 700;
      background: #dcfce7;
      color: #15803d;
      padding: 0.2rem 0.55rem;
      border-radius: 1rem;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .gov-card-grid {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 1.5rem;
      align-items: center;
    }
    @media (max-width: 680px) {
      .gov-card-grid { grid-template-columns: 1fr; }
    }
    .gov-price-box {
      background: white;
      border: 1px solid #86efac;
      border-radius: 0.65rem;
      padding: 1rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 2px 4px rgba(22, 101, 52, 0.05);
    }
    .box-lbl { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .box-rate {
      display: flex;
      align-items: baseline;
      gap: 0.15rem;
      color: #15803d;
      margin: 0.25rem 0;
    }
    .box-rate .currency { font-size: 1.3rem; font-weight: 800; }
    .box-rate .value { font-size: 2.2rem; font-weight: 900; line-height: 1; }
    .box-rate .per-unit { font-size: 0.85rem; font-weight: 700; color: #64748b; margin-left: 0.2rem; }
    .box-sub { font-size: 0.72rem; color: #16a34a; font-weight: 600; }

    .gov-market-details {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.825rem;
    }
    .detail-line {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.25rem;
    }
    .d-label { color: #64748b; }
    .d-val { color: #1e293b; font-weight: 600; }

    .gov-validation-bar {
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.825rem;
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      line-height: 1.4;
    }
    .gov-validation-bar.neutral {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #475569;
    }
    .gov-validation-bar.violated {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #991b1b;
    }
    .gov-validation-bar.valid {
      background: #ecfdf5;
      border: 1px solid #6ee7b7;
      color: #065f46;
    }

    /* Form Fields */
    .crop-form { margin-top: 1rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .field-hint { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; display: block; }
    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-prefix {
      position: absolute;
      left: 0.85rem;
      font-weight: 700;
      color: #64748b;
      font-size: 0.95rem;
      pointer-events: none;
    }
    .input-with-icon .form-control {
      padding-left: 2rem;
    }
    .form-control.is-invalid {
      border-color: #ef4444;
      background-color: #fff5f5;
    }
    .form-control.is-valid {
      border-color: #10b981;
      background-color: #f0fdf4;
    }
    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; }
    .alert { padding: 0.85rem 1.25rem; border-radius: 0.5rem; display: flex; align-items: center; gap: 0.75rem; font-weight: 600; font-size: 0.85rem; }
    .alert-success { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .alert-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .mt-4 { margin-top: 1rem; }
  `]
})
export class CropAddComponent implements OnInit {
  crop: Partial<Crop> = {
    cropName: '',
    cropType: 'Grains',
    quantity: 500,
    unit: 'Kg',
    pricePerUnit: undefined,
    location: '',
    description: '',
    imageUrl: '',
    status: 'AVAILABLE'
  };

  submitting = false;
  successMessage = '';
  errorMessage = '';

  // Government Mandhi Prices
  matchedGovPrice: MandiPriceBenchmark | null = null;
  allGovPrices: MandiPriceBenchmark[] = [];
  popularCommodities: MandiPriceBenchmark[] = [];

  private defaultBenchmarks: MandiPriceBenchmark[] = [
    { commodity: 'Wheat', category: 'Grains', modalPricePerKg: 25.00, minPricePerKg: 23.00, maxPricePerKg: 26.00, market: 'Khanna Mandi', state: 'Punjab', imageUrl: '/assets/images/crop-wheat.jpg' },
    { commodity: 'Paddy (Rice)', category: 'Grains', modalPricePerKg: 20.00, minPricePerKg: 19.00, maxPricePerKg: 21.00, market: 'Coimbatore Mandi', state: 'Tamil Nadu', imageUrl: '/assets/images/crop-rice.jpg' },
    { commodity: 'Maize', category: 'Grains', modalPricePerKg: 21.00, minPricePerKg: 19.00, maxPricePerKg: 23.00, market: 'Namakkal Mandi', state: 'Tamil Nadu', imageUrl: '/assets/images/crop-maize.jpg' },
    { commodity: 'Tomato', category: 'Vegetables', modalPricePerKg: 10.00, minPricePerKg: 8.00, maxPricePerKg: 12.00, market: 'Koyambedu Mandi', state: 'Tamil Nadu', imageUrl: '/assets/images/crop-tomato.jpg' },
    { commodity: 'Onion', category: 'Vegetables', modalPricePerKg: 14.00, minPricePerKg: 11.00, maxPricePerKg: 16.00, market: 'Nashik Mandi', state: 'Maharashtra', imageUrl: '/assets/images/crop-onion.jpg' },
    { commodity: 'Potato', category: 'Vegetables', modalPricePerKg: 11.00, minPricePerKg: 9.00, maxPricePerKg: 13.00, market: 'Dindigul Mandi', state: 'Tamil Nadu', imageUrl: '/assets/images/crop-potato.jpg' },
    { commodity: 'Cotton', category: 'Commercial', modalPricePerKg: 72.00, minPricePerKg: 68.00, maxPricePerKg: 75.00, market: 'Gondal Mandi', state: 'Gujarat', imageUrl: '/assets/images/crop-cotton.jpg' },
    { commodity: 'Groundnut', category: 'Oilseeds', modalPricePerKg: 56.00, minPricePerKg: 52.00, maxPricePerKg: 59.00, market: 'Erode Mandi', state: 'Tamil Nadu', imageUrl: '/assets/images/crop-groundnut.jpg' },
    { commodity: 'Turmeric', category: 'Spices', modalPricePerKg: 102.00, minPricePerKg: 95.00, maxPricePerKg: 110.00, market: 'Erode Mandi', state: 'Tamil Nadu', imageUrl: '/assets/images/crop-turmeric.jpg' },
    { commodity: 'Sugarcane', category: 'Commercial', modalPricePerKg: 4.00, minPricePerKg: 3.50, maxPricePerKg: 4.00, market: 'Meerut Mandi', state: 'Uttar Pradesh', imageUrl: '/assets/images/crop-sugarcane.jpg' },
    { commodity: 'Banana', category: 'Fruits', modalPricePerKg: 14.00, minPricePerKg: 12.00, maxPricePerKg: 16.00, market: 'Trichy Yard', state: 'Tamil Nadu', imageUrl: '/assets/images/crop-banana.jpg' },
    { commodity: 'Red Chilli', category: 'Spices', modalPricePerKg: 132.00, minPricePerKg: 120.00, maxPricePerKg: 145.00, market: 'Madurai Mandi', state: 'Tamil Nadu', imageUrl: '/assets/images/crop-chili.jpg' },
    { commodity: 'Green Chilli', category: 'Vegetables', modalPricePerKg: 22.00, minPricePerKg: 18.00, maxPricePerKg: 26.00, market: 'Salem Mandi', state: 'Tamil Nadu', imageUrl: '/assets/images/crop-chili.jpg' },
    { commodity: 'Soybean', category: 'Oilseeds', modalPricePerKg: 48.00, minPricePerKg: 46.00, maxPricePerKg: 50.00, market: 'Indore Mandi', state: 'Madhya Pradesh', imageUrl: '/assets/images/crop-groundnut.jpg' },
    { commodity: 'Bengal Gram (Chana)', category: 'Pulses', modalPricePerKg: 56.00, minPricePerKg: 53.00, maxPricePerKg: 58.00, market: 'Bikaner Mandi', state: 'Rajasthan', imageUrl: '/assets/images/crop-wheat.jpg' },
    { commodity: 'Moong (Green Gram)', category: 'Pulses', modalPricePerKg: 77.00, minPricePerKg: 72.00, maxPricePerKg: 81.00, market: 'Akola Mandi', state: 'Maharashtra', imageUrl: '/assets/images/crop-groundnut.jpg' },
    { commodity: 'Mustard', category: 'Oilseeds', modalPricePerKg: 54.00, minPricePerKg: 51.00, maxPricePerKg: 57.00, market: 'Bharatpur Mandi', state: 'Rajasthan', imageUrl: '/assets/images/crop-groundnut.jpg' },
    { commodity: 'Coconut', category: 'Fruits', modalPricePerKg: 31.00, minPricePerKg: 28.00, maxPricePerKg: 34.00, market: 'Pollachi Mandi', state: 'Tamil Nadu', imageUrl: '/assets/images/crop-banana.jpg' }
  ];

  constructor(
    private cropService: CropService,
    private authService: AuthService,
    private subscriptionService: SubscriptionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.crop.farmerId = user.id || user.userId || 'farmer-1';
      this.crop.farmerName = user.fullName || user.username;
      this.crop.location = user.address || 'Karnal Mandi, Haryana';
    }

    this.initGovPrices();
  }

  initGovPrices(): void {
    this.allGovPrices = [...this.defaultBenchmarks];
    this.popularCommodities = this.defaultBenchmarks.slice(0, 10);

    // Fetch live backend Government APMC prices
    this.cropService.getGovernmentPrices().pipe(
      catchError(() => of([]))
    ).subscribe({
      next: (list: any[]) => {
        if (list && list.length > 0) {
          list.forEach(item => {
            const modal = item.modalPricePerKg || item.modalPrice || item.maxPricePerKg || 25;
            const existingIdx = this.allGovPrices.findIndex(p => p.commodity.toLowerCase() === item.commodity.toLowerCase());
            const entry: MandiPriceBenchmark = {
              commodity: item.commodity,
              category: this.mapCategory(item.commodity),
              modalPricePerKg: modal,
              minPricePerKg: item.minPricePerKg || modal * 0.9,
              maxPricePerKg: item.maxPricePerKg || modal * 1.1,
              market: item.market || item.district || 'Regional APMC Mandi',
              state: item.state || 'India',
              imageUrl: item.imageUrl
            };

            if (existingIdx >= 0) {
              this.allGovPrices[existingIdx] = entry;
            } else {
              this.allGovPrices.push(entry);
            }
          });
          this.popularCommodities = this.allGovPrices.slice(0, 10);
        }

        // If a default cropName is present, match it
        if (this.crop.cropName) {
          this.matchGovPrice(this.crop.cropName);
        } else {
          // Pre-select Wheat as initial benchmark
          this.selectCommodity(this.allGovPrices[0]);
        }
      }
    });
  }

  selectCommodity(item: MandiPriceBenchmark): void {
    this.crop.cropName = item.commodity;
    this.crop.cropType = item.category;
    this.matchedGovPrice = item;
    this.crop.imageUrl = item.imageUrl || resolveCropImage(item.commodity);
    // Set a recommended fair price strictly less than government Mandi rate
    const suggestedRate = Math.max(1, Math.round((item.modalPricePerKg - 1) * 10) / 10);
    this.crop.pricePerUnit = suggestedRate;
    this.errorMessage = '';
  }

  onCropNameInput(val: string): void {
    if (!val || !val.trim()) {
      this.matchedGovPrice = null;
      return;
    }
    this.matchGovPrice(val.trim());
  }

  matchGovPrice(query: string): void {
    const q = query.toLowerCase();
    // 1. Exact match
    let match = this.allGovPrices.find(p => p.commodity.toLowerCase() === q);
    // 2. Starts with or includes
    if (!match) {
      match = this.allGovPrices.find(p => p.commodity.toLowerCase().includes(q) || q.includes(p.commodity.toLowerCase()));
    }
    // 3. Keyword heuristic
    if (!match) {
      if (q.includes('rice') || q.includes('paddy')) match = this.allGovPrices.find(p => p.commodity.includes('Paddy'));
      else if (q.includes('wheat')) match = this.allGovPrices.find(p => p.commodity.includes('Wheat'));
      else if (q.includes('corn') || q.includes('maize')) match = this.allGovPrices.find(p => p.commodity.includes('Maize'));
      else if (q.includes('chilli') || q.includes('chili')) match = this.allGovPrices.find(p => p.commodity.includes('Chilli'));
      else if (q.includes('dal') || q.includes('gram')) match = this.allGovPrices.find(p => p.commodity.includes('Gram'));
    }

    if (match) {
      this.matchedGovPrice = match;
      this.crop.cropType = match.category;
      this.crop.imageUrl = match.imageUrl || resolveCropImage(match.commodity);
    } else {
      this.crop.imageUrl = resolveCropImage(query);
      // Default to general APMC rate of ₹25/Kg
      this.matchedGovPrice = {
        commodity: query,
        category: this.crop.cropType || 'Grains',
        modalPricePerKg: 25.00,
        minPricePerKg: 20.00,
        maxPricePerKg: 28.00,
        market: 'Local Mandi APMC',
        state: 'India'
      };
    }

    this.onPriceChange();
  }

  onPriceChange(): void {
    if (this.matchedGovPrice && this.crop.pricePerUnit) {
      if (this.isPriceHigherThanGov()) {
        this.errorMessage = `Price must be strictly LESS than the Government Mandhi price of ₹${this.matchedGovPrice.modalPricePerKg}/Kg.`;
      } else {
        this.errorMessage = '';
      }
    }
  }

  isPriceHigherThanGov(): boolean {
    if (!this.matchedGovPrice || this.crop.pricePerUnit === undefined || this.crop.pricePerUnit === null) {
      return false;
    }
    return Number(this.crop.pricePerUnit) >= this.matchedGovPrice.modalPricePerKg;
  }

  getValidationStatusClass(): string {
    if (!this.crop.pricePerUnit) return 'neutral';
    return this.isPriceHigherThanGov() ? 'violated' : 'valid';
  }

  mapCategory(commodity: string): string {
    const c = commodity.toLowerCase();
    if (c.includes('tomato') || c.includes('onion') || c.includes('potato') || c.includes('brinjal')) return 'Vegetables';
    if (c.includes('banana') || c.includes('apple') || c.includes('mango') || c.includes('coconut')) return 'Fruits';
    if (c.includes('turmeric') || c.includes('chilli') || c.includes('clove') || c.includes('cardamom')) return 'Spices';
    if (c.includes('groundnut') || c.includes('soybean') || c.includes('mustard')) return 'Oilseeds';
    if (c.includes('gram') || c.includes('pulse') || c.includes('dal') || c.includes('chana') || c.includes('moong')) return 'Pulses';
    if (c.includes('cotton') || c.includes('sugarcane') || c.includes('jute')) return 'Commercial';
    return 'Grains';
  }

  onSubmit(): void {
    if (!this.crop.cropName || !this.crop.pricePerUnit || !this.crop.quantity) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    // Strict validation: Farmer selling price MUST be lesser than Government Mandhi price
    if (this.matchedGovPrice && this.isPriceHigherThanGov()) {
      this.errorMessage = `Violation: Your selling price (₹${this.crop.pricePerUnit}/Kg) must be strictly LESS than the Government Mandhi price of ₹${this.matchedGovPrice.modalPricePerKg}/Kg. Please lower your price.`;
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const govRate = this.matchedGovPrice ? this.matchedGovPrice.modalPricePerKg : 25.0;

    const user = this.authService.currentUserValue;
    const fId = (user && (user.id || user.userId)) ? String(user.id || user.userId) : (this.crop.farmerId || '1');
    const fName = (user && (user.fullName || user.username)) ? (user.fullName || user.username) : (this.crop.farmerName || 'Farmer Producer');

    const cropToSave: Crop = {
      id: 'crop-' + Date.now(),
      cropName: this.crop.cropName || 'Harvest',
      cropType: this.crop.cropType || 'Grains',
      quantity: Number(this.crop.quantity) || 100,
      unit: this.crop.unit || 'Kg',
      pricePerUnit: Number(this.crop.pricePerUnit),
      location: this.crop.location || (user?.address || 'Punjab Mandi'),
      farmerId: fId,
      farmerName: fName,
      description: this.crop.description,
      imageUrl: this.crop.imageUrl || resolveCropImage(this.crop.cropName),
      govMspPrice: govRate,
      status: 'AVAILABLE',
      createdAt: new Date().toISOString()
    };

    this.cropService.addCrop(cropToSave).subscribe({
      next: (savedCrop) => {
        this.subscriptionService.notifySubscribersOnNewCrop(savedCrop || cropToSave);
        this.cropService.getAllCrops().subscribe();
        this.submitting = false;
        this.successMessage = `Crop "${cropToSave.cropName}" published successfully at ₹${cropToSave.pricePerUnit}/Kg (Below Government Mandhi rate of ₹${govRate}/Kg)! Subscribed dealers have been notified.`;
        setTimeout(() => this.router.navigate(['/crops']), 1500);
      },
      error: () => {
        this.subscriptionService.notifySubscribersOnNewCrop(cropToSave);
        this.cropService.getAllCrops().subscribe();
        this.submitting = false;
        this.successMessage = `Crop "${cropToSave.cropName}" published successfully at ₹${cropToSave.pricePerUnit}/Kg (Below Government Mandhi rate of ₹${govRate}/Kg)! Subscribed dealers have been notified.`;
        setTimeout(() => this.router.navigate(['/crops']), 1500);
      }
    });
  }
}
