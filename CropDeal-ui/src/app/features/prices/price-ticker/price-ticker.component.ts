import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PriceService } from '../../../core/services/price.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  MarketPriceResponse,
  CropPriceResponse,
  PriceAlertSubscriptionResponse,
  PriceAlertSubscriptionRequest,
  PriceSearchRequest,
  PriceCondition
} from '../../../core/models/models';

type PriceTab = 'PRICES' | 'ALERTS' | 'LOOKUP';

@Component({
  selector: 'app-price-ticker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './price-ticker.component.html',
  styleUrls: ['./price-ticker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PriceTickerComponent implements OnInit {
  activeTab: PriceTab = 'PRICES';

  // 1. Mandi Prices
  prices: MarketPriceResponse[] = [];
  pagedPrices: MarketPriceResponse[] = [];
  searchTerm = '';
  selectedState = 'All States';
  isSyncing = false;

  // Cached stat field (no getter to avoid CD loop)
  averageModalPrice = 0;

  // Pagination
  currentPage = 1;
  readonly pageSize = 15;
  totalPages = 1;
  totalFiltered = 0;

  states = [
    'All States', 'Punjab', 'Madhya Pradesh', 'Gujarat', 'Maharashtra',
    'Uttar Pradesh', 'Rajasthan', 'Andhra Pradesh', 'Karnataka', 'Kerala',
    'Telangana', 'Bihar', 'West Bengal', 'Haryana', 'Odisha', 'Goa', 'Delhi'
  ];

  // 2. Price Alerts (Backend: /api/prices/alerts)
  alerts: PriceAlertSubscriptionResponse[] = [];
  isAlertModalOpen = false;
  newAlert: PriceAlertSubscriptionRequest = {
    cropName: 'Basmati Rice',
    targetPrice: 60,
    priceCondition: 'GREATER_THAN_OR_EQUAL',
    state: 'Punjab',
    district: '',
    unit: 'KG',
    active: true
  };

  // 3. Price Lookup (Backend: POST /api/prices/lookup → returns CropPriceResponse)
  lookupReq: PriceSearchRequest = {
    commodity: 'Basmati Rice',
    state: 'Punjab',
    district: 'Amritsar',
    grade: 'A'
  };
  lookupResult: CropPriceResponse | null = null;
  isLookingUp = false;

  constructor(
    private priceService: PriceService,
    private notifService: NotificationService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPrices();
    this.loadAlerts();
  }

  // ─── Prices Methods ───────────────────────────────────────────────────────
  loadPrices(): void {
    this.priceService.getTodayPrices().subscribe(prices => {
      this.prices = prices || [];
      this.currentPage = 1;
      this.updateAveragePrice();
      this.applyFilter();
      this.cdr.markForCheck();
    });
  }

  private updateAveragePrice(): void {
    if (!this.prices.length) { this.averageModalPrice = 0; return; }
    const total = this.prices.reduce((acc, p) =>
      acc + (p.modalPricePerKg || (p.modalPrice ? p.modalPrice / 100 : 0)), 0);
    this.averageModalPrice = Math.round((total / this.prices.length) * 10) / 10;
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    const state = this.selectedState;

    const filtered = this.prices.filter(p => {
      const matchSearch = !term ||
        p.commodity.toLowerCase().includes(term) ||
        p.district.toLowerCase().includes(term) ||
        p.state.toLowerCase().includes(term);
      const matchState = !state || state === 'All States' ||
        p.state.toLowerCase() === state.toLowerCase();
      return matchSearch && matchState;
    });

    this.totalFiltered = filtered.length;
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = 1;

    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedPrices = filtered.slice(start, start + this.pageSize);
    this.cdr.markForCheck();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  prevPage(): void {
    if (this.currentPage > 1) { this.currentPage--; this.applyFilter(); }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) { this.currentPage++; this.applyFilter(); }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilter();
    }
  }

  get pageNumbers(): number[] {
    const half = 2;
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  syncGovernmentPrices(): void {
    this.isSyncing = true;
    this.cdr.markForCheck();
    this.priceService.getTodayPrices().subscribe({
      next: prices => {
        this.isSyncing = false;
        this.prices = prices || [];
        this.currentPage = 1;
        this.updateAveragePrice();
        this.applyFilter();
        this.notifService.showToast('success', `Refreshed ${this.prices.length} APMC mandi benchmarks.`);
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSyncing = false;
        this.cdr.markForCheck();
        this.notifService.showToast('info', 'Mandi benchmark refresh unavailable right now.');
      }
    });
  }

  // ─── Price Alerts Methods ─────────────────────────────────────────────────
  loadAlerts(): void {
    this.priceService.getAlerts().subscribe(alerts => {
      this.alerts = alerts || [];
      this.cdr.markForCheck();
    });
  }

  toggleAlert(alert: PriceAlertSubscriptionResponse): void {
    if (alert.active) {
      this.priceService.deactivateAlert(alert.id).subscribe(updated => {
        alert.active = false;
        this.notifService.showToast('info', `Alert for "${alert.cropName}" paused.`);
        this.cdr.markForCheck();
      });
    } else {
      this.priceService.activateAlert(alert.id).subscribe(updated => {
        alert.active = true;
        this.notifService.showToast('success', `Alert for "${alert.cropName}" activated.`);
        this.cdr.markForCheck();
      });
    }
  }

  deleteAlert(id: number): void {
    if (confirm('Delete this price alert subscription?')) {
      this.priceService.deleteAlert(id).subscribe(() => {
        this.alerts = this.alerts.filter(a => a.id !== id);
        this.notifService.showToast('info', 'Price alert removed.');
        this.cdr.markForCheck();
      });
    }
  }

  openCreateAlertModal(): void {
    this.newAlert = {
      cropName: 'Basmati Rice',
      targetPrice: 60,
      priceCondition: 'GREATER_THAN_OR_EQUAL',
      state: 'Punjab',
      district: '',
      unit: 'KG',
      active: true
    };
    this.isAlertModalOpen = true;
  }

  submitCreateAlert(): void {
    if (!this.newAlert.cropName || !this.newAlert.targetPrice) {
      this.notifService.showToast('warning', 'Please provide crop name and target price.');
      return;
    }
    this.priceService.createAlert(this.newAlert).subscribe(created => {
      this.alerts = [created, ...this.alerts];
      this.isAlertModalOpen = false;
      this.notifService.showToast('success', `Price alert for "${created.cropName}" created!`);
      this.cdr.markForCheck();
    });
  }

  // ─── Price Lookup Methods ─────────────────────────────────────────────────
  submitLookup(): void {
    if (!this.lookupReq.commodity) return;
    this.isLookingUp = true;
    this.cdr.markForCheck();
    this.priceService.lookupPrice(this.lookupReq).subscribe({
      next: res => {
        this.lookupResult = res;
        this.isLookingUp = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLookingUp = false;
        this.cdr.markForCheck();
        this.notifService.showToast('error', 'Lookup failed.');
      }
    });
  }
}
