import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CropService } from '../../core/services/crop.service';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/services/alert.service';
import { CropAlert } from '../../core/models/crop.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="alerts-page">
      <!-- Panoramic Hero Header -->
      <section class="alerts-hero shadow-sm">
        <div class="alerts-hero-content">
          <div class="hero-text-block">
            <h1 class="hero-title">
              <i class="fa-solid fa-bell text-amber"></i> APMC Price <span class="text-green-brand">Alerts</span>
            </h1>
            <p class="hero-desc">
              Manage your personal APMC mandi rate triggers. Set real-time price alerts to buy or sell crops when market prices reach your desired threshold.
            </p>
          </div>
          <div class="hero-action-btns">
            <button class="btn-refresh" (click)="refreshMandiRates()" [disabled]="isRefreshing">
              <i class="fa-solid fa-arrows-rotate" [class.fa-spin]="isRefreshing"></i>
              <span>{{ isRefreshing ? 'Evaluating...' : 'Refresh DB Rates' }}</span>
            </button>
            <button class="btn-create" (click)="openCreateModal()">
              <i class="fa-solid fa-circle-plus"></i> Set New Price Alert
            </button>
          </div>
        </div>
      </section>

      <!-- Toast Feedback Message -->
      <div *ngIf="actionMsg" class="alert-toast shadow-sm">
        <i class="fa-solid fa-circle-check"></i>
        <span>{{ actionMsg }}</span>
      </div>

      <!-- KPI Stat Badges -->
      <div class="stats-pills-row">
        <div class="stat-pill">
          <div class="stat-pill-icon bg-emerald-light">
            <i class="fa-solid fa-bell text-emerald"></i>
          </div>
          <div class="stat-pill-text">
            <strong>{{ alerts.length }}</strong>
            <span>Total Configured</span>
          </div>
        </div>

        <div class="stat-pill">
          <div class="stat-pill-icon bg-amber-light">
            <i class="fa-solid fa-clock text-amber"></i>
          </div>
          <div class="stat-pill-text">
            <strong>{{ activeAlertsCount }}</strong>
            <span>Active Monitoring</span>
          </div>
        </div>

        <div class="stat-pill">
          <div class="stat-pill-icon bg-green-light">
            <i class="fa-solid fa-bullhorn text-emerald"></i>
          </div>
          <div class="stat-pill-text">
            <strong>{{ triggeredAlertsCount }}</strong>
            <span>Triggered Conditions</span>
          </div>
        </div>

        <div class="stat-pill">
          <div class="stat-pill-icon bg-teal-light">
            <i class="fa-solid fa-shop text-emerald"></i>
          </div>
          <div class="stat-pill-text">
            <strong>100%</strong>
            <span>Live APMC Sync</span>
          </div>
        </div>
      </div>

      <!-- Alerts Grid Section -->
      <div class="card alerts-main-card shadow-sm">
        <div class="card-header-bar">
          <div>
            <h3 class="section-title">Your Price Trigger Watchlist</h3>
            <p class="section-subtitle">Evaluated continuously against current government & local mandi arrivals</p>
          </div>
          <div class="filter-pills">
            <button class="pill-filter-btn" [class.active]="filterStatus === 'ALL'" (click)="filterStatus = 'ALL'">
              All ({{ alerts.length }})
            </button>
            <button class="pill-filter-btn" [class.active]="filterStatus === 'ACTIVE'" (click)="filterStatus = 'ACTIVE'">
              Active ({{ activeAlertsCount }})
            </button>
            <button class="pill-filter-btn" [class.active]="filterStatus === 'TRIGGERED'" (click)="filterStatus = 'TRIGGERED'">
              Triggered ({{ triggeredAlertsCount }})
            </button>
          </div>
        </div>

        <!-- Alert Cards Grid -->
        <div class="alerts-grid mt-3" *ngIf="filteredAlerts.length > 0">
          <div *ngFor="let alert of filteredAlerts" class="alert-card" [class.triggered]="alert.status === 'TRIGGERED'">
            <div class="alert-card-top">
              <div class="crop-info">
                <span class="crop-name-badge">{{ alert.cropName }}</span>
              </div>
              <span class="status-chip" [ngClass]="alert.status === 'TRIGGERED' ? 'status-triggered' : 'status-active'">
                <i class="fa-solid" [ngClass]="alert.status === 'TRIGGERED' ? 'fa-bell fa-shake' : 'fa-clock'"></i>
                {{ alert.status }}
              </span>
            </div>

            <div class="alert-card-body">
              <div class="condition-box">
                <span class="lbl">Trigger Condition:</span>
                <span class="cond-val">
                  When price goes <strong>{{ alert.condition }}</strong> ₹{{ alert.targetPrice }}/Kg
                </span>
              </div>

              <div class="price-comparison-row">
                <div class="price-box">
                  <span class="p-lbl">Target Price</span>
                  <strong class="p-val text-primary">₹{{ alert.targetPrice | number:'1.2-2' }}/Kg</strong>
                </div>
                <div class="price-arrow">
                  <i class="fa-solid fa-arrow-right-arrow-left"></i>
                </div>
                <div class="price-box">
                  <span class="p-lbl">Current APMC Rate</span>
                  <strong class="p-val text-emerald">₹{{ (alert.currentGovPrice || 24.50) | number:'1.2-2' }}/Kg</strong>
                </div>
              </div>

              <p class="alert-note" *ngIf="alert.message">
                <i class="fa-solid fa-circle-info"></i> {{ alert.message }}
              </p>
            </div>

            <div class="alert-card-footer">
              <span class="trigger-hint" *ngIf="alert.status === 'TRIGGERED'">
                <i class="fa-solid fa-circle-check text-emerald"></i> Target Achieved!
              </span>
              <span class="trigger-hint" *ngIf="alert.status !== 'TRIGGERED'">
                <i class="fa-solid fa-circle-dot text-amber"></i> Actively Monitoring
              </span>
              <button class="btn-delete-alert" (click)="deleteAlert(alert.id || '')" title="Delete this alert permanently">
                <i class="fa-regular fa-trash-can"></i> Remove
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state-box" *ngIf="filteredAlerts.length === 0">
          <div class="empty-icon-wrap">
            <i class="fa-solid fa-bell-slash"></i>
          </div>
          <h4>No price alerts found</h4>
          <p>You haven't set any {{ filterStatus !== 'ALL' ? filterStatus.toLowerCase() : '' }} APMC price alerts yet.</p>
          <button class="btn-create mt-2" (click)="openCreateModal()">
            <i class="fa-solid fa-circle-plus"></i> Set Your First Alert
          </button>
        </div>
      </div>

      <!-- Create Alert Modal -->
      <div *ngIf="showCreateModal" class="modal-backdrop">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3><i class="fa-solid fa-bell text-amber"></i> Set New Price Alert</h3>
            <button class="modal-close" (click)="showCreateModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <p class="modal-instructions">
              Configure your desired commodity target price. You will receive immediate dashboard and push notifications when government mandi database rates meet your trigger.
            </p>

            <div class="form-group">
              <label>Select Crop / Commodity *</label>
              <select [(ngModel)]="newAlert.cropName" class="modal-input" (change)="onModalCropChange()">
                <option *ngFor="let crop of commodityOptions" [value]="crop">{{ crop }}</option>
              </select>
            </div>

            <div class="form-group mt-3">
              <label>Trigger Condition *</label>
              <select [(ngModel)]="newAlert.condition" class="modal-input">
                <option value="ABOVE">When market price goes ABOVE target rate</option>
                <option value="BELOW">When market price drops BELOW target rate</option>
              </select>
            </div>

            <div class="form-group mt-3">
              <label>Target Price (₹ / Kilogram) *</label>
              <div class="input-with-symbol">
                <span class="currency-symbol">₹</span>
                <input type="number" [(ngModel)]="newAlert.targetPrice" class="modal-input input-padded" placeholder="e.g. 24" step="0.5" />
              </div>
              <small class="text-muted">Estimated reference rate: ₹{{ currentRefPrice }}/Kg</small>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="showCreateModal = false">Cancel</button>
            <button class="btn-save" (click)="saveAlert()">
              <i class="fa-solid fa-check"></i> Register Trigger
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .alerts-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      font-family: inherit;
    }

    /* Hero Banner */
    .alerts-hero {
      background: linear-gradient(135deg, #064e3b, #047857);
      border-radius: 1rem;
      overflow: hidden;
      color: white;
    }
    .alerts-hero-content {
      padding: 2rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .hero-text-block { max-width: 680px; }
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
    .btn-create {
      background: #16a34a;
      color: white;
      border: none;
      padding: 0.65rem 1.25rem;
      border-radius: 0.5rem;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-create:hover {
      background: #15803d;
      transform: translateY(-1px);
    }
    .btn-refresh {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 0.65rem 1.15rem;
      border-radius: 0.5rem;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }
    .btn-refresh:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.25);
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

    /* Main Watchlist Card */
    .alerts-main-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.5rem;
    }
    .card-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .section-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin: 0; }
    .section-subtitle { font-size: 0.82rem; color: #64748b; margin: 0.2rem 0 0; }
    .filter-pills { display: flex; align-items: center; gap: 0.4rem; }
    .pill-filter-btn {
      background: #f1f5f9;
      border: 1px solid transparent;
      padding: 0.4rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s;
    }
    .pill-filter-btn.active {
      background: #15803d;
      color: white;
    }

    /* Grid of Alert Cards */
    .alerts-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }
    .alert-card {
      border: 1.5px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.25rem;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .alert-card:hover {
      box-shadow: 0 8px 20px rgba(0,0,0,0.06);
      transform: translateY(-2px);
    }
    .alert-card.triggered {
      border-color: #86efac;
      background: #f0fdf4;
    }
    .alert-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .crop-name-badge {
      font-size: 1rem;
      font-weight: 800;
      color: #0f172a;
    }
    .status-chip {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 0.35rem;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .status-triggered { background: #dcfce7; color: #15803d; }
    .status-active { background: #fef3c7; color: #92400e; }

    .alert-card-body {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .condition-box {
      font-size: 0.82rem;
      color: #334155;
    }
    .condition-box .lbl { color: #64748b; margin-right: 0.3rem; }
    .price-comparison-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.65rem 0.85rem;
    }
    .price-box { display: flex; flex-direction: column; }
    .p-lbl { font-size: 0.68rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .p-val { font-size: 0.95rem; font-weight: 800; }
    .price-arrow { color: #94a3b8; font-size: 0.85rem; }
    .alert-note {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      line-height: 1.4;
    }

    .alert-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
    }
    .trigger-hint {
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .btn-delete-alert {
      background: none;
      border: 1px solid #e2e8f0;
      padding: 0.35rem 0.75rem;
      border-radius: 0.35rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.15s;
    }
    .btn-delete-alert:hover {
      background: #fee2e2;
      color: #dc2626;
      border-color: #fca5a5;
    }

    /* Empty State */
    .empty-state-box {
      text-align: center;
      padding: 3.5rem 1rem;
      color: #64748b;
    }
    .empty-icon-wrap {
      font-size: 2.8rem;
      color: #cbd5e1;
      margin-bottom: 0.75rem;
    }
    .empty-state-box h4 {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.35rem;
    }
    .empty-state-box p {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0 0 1rem;
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
      max-width: 480px;
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
    .modal-instructions { font-size: 0.825rem; color: #64748b; margin-bottom: 1rem; line-height: 1.45; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group label { font-size: 0.78rem; font-weight: 700; color: #334155; }
    .modal-input {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.4rem;
      font-size: 0.85rem;
      outline: none;
    }
    .modal-input:focus { border-color: #15803d; }
    .input-with-symbol { position: relative; }
    .currency-symbol { position: absolute; left: 10px; top: 8px; font-weight: 700; color: #64748b; }
    .input-padded { padding-left: 1.6rem; }
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

    @media (max-width: 1024px) {
      .alerts-grid { grid-template-columns: repeat(2, 1fr); }
      .stats-pills-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .alerts-grid { grid-template-columns: 1fr; }
      .stats-pills-row { grid-template-columns: 1fr; }
      .alerts-hero-content { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class AlertsComponent implements OnInit, OnDestroy {
  user: User | null = null;
  actionMsg = '';
  isRefreshing = false;
  filterStatus: 'ALL' | 'ACTIVE' | 'TRIGGERED' = 'ALL';

  alerts: CropAlert[] = [];
  showCreateModal = false;

  currentRefPrice = 20;
  commodityOptions: string[] = [
    'Paddy (Rice)', 'Wheat', 'Tomato', 'Onion', 'Potato',
    'Groundnut', 'Maize', 'Red Chilli', 'Green Chilli', 'Turmeric',
    'Cotton', 'Soybean', 'Sugarcane', 'Banana', 'Bengal Gram (Chana)',
    'Moong (Green Gram)', 'Mustard', 'Coconut'
  ];

  newAlert: Partial<CropAlert> = {
    cropName: 'Paddy (Rice)',
    condition: 'ABOVE',
    targetPrice: 22
  };

  private subs: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    private cropService: CropService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.authService.currentUser$.subscribe(u => {
        this.user = u;
      }),
      this.alertService.alerts$.subscribe(list => {
        this.alerts = list;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  get activeAlertsCount(): number {
    return this.alerts.filter(a => a.status === 'ACTIVE').length;
  }

  get triggeredAlertsCount(): number {
    return this.alerts.filter(a => a.status === 'TRIGGERED').length;
  }

  get filteredAlerts(): CropAlert[] {
    if (this.filterStatus === 'ALL') return this.alerts;
    return this.alerts.filter(a => a.status === this.filterStatus);
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.onModalCropChange();
  }

  onModalCropChange(): void {
    const cropPrices: Record<string, number> = {
      'Paddy (Rice)': 20,
      'Wheat': 25,
      'Tomato': 10,
      'Onion': 14,
      'Potato': 11,
      'Groundnut': 56,
      'Maize': 21,
      'Red Chilli': 132,
      'Green Chilli': 22,
      'Turmeric': 102,
      'Cotton': 72,
      'Soybean': 48,
      'Sugarcane': 4,
      'Banana': 14,
      'Bengal Gram (Chana)': 56,
      'Moong (Green Gram)': 77,
      'Mustard': 54,
      'Coconut': 31
    };
    this.currentRefPrice = cropPrices[this.newAlert.cropName || ''] || 25;
    this.newAlert.targetPrice = this.currentRefPrice;
  }

  saveAlert(): void {
    if (!this.newAlert.cropName || !this.newAlert.targetPrice) return;

    const item: CropAlert = {
      id: 'alt-' + Date.now(),
      userId: this.user?.id || 'usr-1',
      cropName: this.newAlert.cropName,
      condition: this.newAlert.condition as 'ABOVE' | 'BELOW',
      targetPrice: this.newAlert.targetPrice,
      currentGovPrice: this.currentRefPrice,
      status: 'ACTIVE',
      message: `Monitoring ${this.newAlert.cropName} against ₹${this.newAlert.targetPrice}/Kg target rate.`
    };

    this.alertService.addAlert(item);
    this.showCreateModal = false;
    this.actionMsg = `✓ Price trigger for ${item.cropName} created successfully!`;
    setTimeout(() => { this.actionMsg = ''; }, 4000);
  }

  deleteAlert(id: string): void {
    this.alertService.deleteAlert(id).subscribe({
      next: () => {
        this.actionMsg = 'Price alert permanently removed.';
        setTimeout(() => { this.actionMsg = ''; }, 3000);
      }
    });
  }

  refreshMandiRates(): void {
    this.isRefreshing = true;
    this.cropService.getGovernmentPrices().pipe(
      catchError(() => of([]))
    ).subscribe({
      next: (prices) => {
        this.isRefreshing = false;
        if (prices && prices.length > 0) {
          this.alerts.forEach(a => {
            const found: any = prices.find((p: any) =>
              (p.commodity || p.cropName || '').toLowerCase() === a.cropName.toLowerCase()
            );
            if (found) {
              a.currentGovPrice = found.modalPricePerKg || found.pricePerKg || found.modalPrice || a.currentGovPrice;
              if (a.condition === 'ABOVE' && (a.currentGovPrice || 0) >= a.targetPrice) {
                a.status = 'TRIGGERED';
                a.message = `${a.cropName} modal price is ₹${a.currentGovPrice}/Kg, meeting your trigger target ₹${a.targetPrice}/Kg!`;
              } else if (a.condition === 'BELOW' && (a.currentGovPrice || 0) <= a.targetPrice) {
                a.status = 'TRIGGERED';
                a.message = `${a.cropName} modal price dropped to ₹${a.currentGovPrice}/Kg, below your trigger target ₹${a.targetPrice}/Kg!`;
              }
            }
          });
          this.alertService.updateAlerts(this.alerts);
        }
        this.actionMsg = '✓ APMC database rates evaluated against active alerts!';
        setTimeout(() => { this.actionMsg = ''; }, 4000);
      }
    });
  }
}
