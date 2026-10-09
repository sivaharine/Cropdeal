import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BiddingService } from '../../core/services/bidding.service';
import { resolveCropImage } from '../../core/utils/crop-image.util';

export interface AdminAuctionItem {
  id: string;
  cropName: string;
  variety: string;
  grade: string;
  totalQuantityKg: number;
  startingPriceKg: number;
  currentBidKg: number;
  farmerName: string;
  farmerPhone: string;
  location: string;
  highestBidderDealer: string;
  bidsCount: number;
  endTime: string;
  status: 'OPEN' | 'BLOCKED' | 'CLOSED';
  image: string;
  bidsHistory: Array<{ bidderName: string; bidPriceKg: number; bidTime: string }>;
}

@Component({
  selector: 'app-admin-biddings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-biddings-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">
            <i class="fa-solid fa-gavel text-emerald"></i> Bidding Management & Floor Moderation
          </h2>
          <p class="page-subtitle">
            Admin oversight of all crop live auctions, leading bidder positions, and authority to block, unblock, or delete auction floors.
          </p>
        </div>
        <div class="stats-pills">
          <span class="badge badge-primary">{{ auctions.length }} Total Auctions</span>
          <span class="badge badge-success">{{ getOpenCount() }} Live Floors</span>
          <span class="badge badge-danger">{{ getBlockedCount() }} Blocked</span>
        </div>
      </div>

      <!-- Action Toast Notification -->
      <div *ngIf="alertMsg" class="alert alert-success shadow-md mt-3">
        <i class="fa-solid fa-circle-check"></i>
        <span>{{ alertMsg }}</span>
      </div>

      <!-- Table Card -->
      <div class="card table-card mt-3">
        <div class="card-header">
          <div class="search-bar">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              [(ngModel)]="searchFilter"
              placeholder="Search by crop, farmer name, dealer bidder or location..."
              class="form-control"
            />
          </div>
          <div class="filter-controls">
            <select [(ngModel)]="statusFilter" class="form-control">
              <option value="ALL">All Active Floors</option>
              <option value="OPEN">Live / Open Floors</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Crop Lot & Auction ID</th>
                <th>Farmer & Mandi</th>
                <th>Quantity</th>
                <th>Highest Bid & Offers</th>
                <th>Leading Dealer & Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of pagedAuctions" class="auction-row">
                <td>
                  <div class="crop-cell">
                    <img [src]="a.image || '/assets/images/crop-rice.jpg'" [alt]="a.cropName" class="crop-thumb" (error)="onThumbError($event)" />
                    <div>
                      <div class="d-flex align-center gap-1">
                        <strong class="crop-title">{{ a.cropName }}</strong>
                        <span class="badge-mini">{{ a.grade }}</span>
                      </div>
                      <span class="subtext d-block">#{{ a.id }} &bull; {{ a.variety }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <strong>{{ a.farmerName }}</strong>
                  <span class="subtext d-block"><i class="fa-solid fa-location-dot sub-icon"></i> {{ a.location }}</span>
                </td>
                <td>
                  <strong>{{ a.totalQuantityKg | number:'1.0-0' }} Kg</strong>
                </td>
                <td>
                  <strong class="text-emerald">₹{{ a.currentBidKg | number:'1.2-2' }}/Kg</strong>
                  <span class="subtext d-block">Base: ₹{{ a.startingPriceKg | number:'1.2-2' }}/Kg &bull; {{ a.bidsCount }} bids</span>
                </td>
                <td>
                  <strong class="dealer-name">{{ a.highestBidderDealer }}</strong>
                  <div class="d-flex align-center gap-1 mt-1">
                    <span class="badge" [ngClass]="getStatusBadgeClass(a.status)">
                      <i class="fa-solid" [ngClass]="getStatusIcon(a.status)"></i>
                      {{ a.status }}
                    </span>
                    <span class="subtext"><i class="fa-regular fa-clock"></i> {{ a.endTime }}</span>
                  </div>
                </td>
                <td class="text-right">
                  <div class="btn-group justify-end">
                    <button
                      *ngIf="a.status !== 'BLOCKED'"
                      class="btn btn-outline-danger btn-sm"
                      (click)="toggleBlockAuction(a, true)"
                      title="Block Auction Floor">
                      <i class="fa-solid fa-ban"></i> Block
                    </button>
                    <button
                      *ngIf="a.status === 'BLOCKED'"
                      class="btn btn-outline-success btn-sm"
                      (click)="toggleBlockAuction(a, false)"
                      title="Unblock Auction Floor">
                      <i class="fa-solid fa-unlock"></i> Unblock
                    </button>
                    <button
                      class="btn btn-danger btn-sm"
                      (click)="deleteAuction(a)"
                      title="Permanently Delete Auction Floor">
                      <i class="fa-regular fa-trash-can"></i>
                    </button>
                    <button
                      class="btn btn-secondary btn-sm"
                      (click)="viewBidsModal(a)"
                      title="View Bid Log">
                      <i class="fa-regular fa-eye"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredAuctions.length === 0">
                <td colspan="10" class="empty-state">
                  <i class="fa-solid fa-gavel"></i>
                  <p>No bidding auctions match your filter criteria.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer" *ngIf="totalPages > 1">
          <span class="text-muted">Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredAuctions.length) }} of {{ filteredAuctions.length }} auction floors</span>
          <div class="pagination-buttons">
            <button class="btn-page" [disabled]="currentPage === 1" (click)="setPage(currentPage - 1)">&laquo; Prev</button>
            <button *ngFor="let p of totalPagesArray" class="btn-page" [class.active]="p === currentPage" (click)="setPage(p)">{{ p }}</button>
            <button class="btn-page" [disabled]="currentPage === totalPages" (click)="setPage(currentPage + 1)">Next &raquo;</button>
          </div>
        </div>
      </div>

      <!-- Bids History Modal -->
      <div *ngIf="selectedAuction" class="modal-backdrop">
        <div class="modal-dialog shadow-2xl">
          <div class="modal-header">
            <h3><i class="fa-solid fa-gavel text-emerald"></i> Bids History & Details: {{ selectedAuction.cropName }}</h3>
            <button class="close-x" (click)="selectedAuction = null">&times;</button>
          </div>
          <div class="modal-body">
            <div class="summary-top">
              <div>
                <strong>Farmer:</strong> {{ selectedAuction.farmerName }} &bull; {{ selectedAuction.location }}
              </div>
              <div class="mt-1">
                <strong>Quantity:</strong> {{ selectedAuction.totalQuantityKg }} Kg |
                <strong>Floor Price:</strong> ₹{{ selectedAuction.startingPriceKg }}/Kg |
                <strong class="text-emerald">Highest:</strong> ₹{{ selectedAuction.currentBidKg }}/Kg
              </div>
            </div>

            <div class="mt-3">
              <h4 class="subhead">Incoming Dealer Bids Log ({{ selectedAuction.bidsHistory.length }})</h4>
              <table class="bids-modal-table mt-1">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Dealer Name</th>
                    <th>Bid Price (₹/Kg)</th>
                    <th>Bid Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let b of selectedAuction.bidsHistory; let i = index" [class.lead-bid]="i === 0">
                    <td>{{ i + 1 }}</td>
                    <td><strong>{{ b.bidderName }}</strong></td>
                    <td class="text-emerald font-bold">₹{{ b.bidPriceKg | number:'1.2-2' }}</td>
                    <td class="text-muted">{{ b.bidTime }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button
              *ngIf="selectedAuction.status !== 'BLOCKED'"
              class="btn btn-warning"
              (click)="toggleBlockAuction(selectedAuction, true); selectedAuction = null">
              <i class="fa-solid fa-ban"></i> Block Floor
            </button>
            <button
              *ngIf="selectedAuction.status === 'BLOCKED'"
              class="btn btn-success"
              (click)="toggleBlockAuction(selectedAuction, false); selectedAuction = null">
              <i class="fa-solid fa-unlock"></i> Unblock Floor
            </button>
            <button class="btn btn-secondary" (click)="selectedAuction = null">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-biddings-container { display: flex; flex-direction: column; gap: 1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.65rem; font-weight: 800; color: #0f172a; margin: 0; }
    .page-subtitle { color: #64748b; font-size: 0.9rem; margin-top: 0.25rem; }
    .text-emerald { color: #16a34a; }
    .stats-pills { display: flex; gap: 0.5rem; }
    .badge { padding: 0.35rem 0.65rem; border-radius: 9999px; font-size: 0.78rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.3rem; }
    .badge-primary { background: #eff6ff; color: #2563eb; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .badge-info { background: #e0f2fe; color: #0369a1; }
    .badge-neutral { background: #f1f5f9; color: #475569; }
    .alert { padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
    .alert-success { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .table-card { background: white; border: 1px solid #e2e8f0; border-radius: 0.75rem; overflow: hidden; }
    .card-header { padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .search-bar { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 250px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 0.35rem 0.75rem; }
    .search-bar input { border: none; background: transparent; outline: none; width: 100%; font-size: 0.85rem; }
    .filter-controls { display: flex; gap: 0.5rem; }
    .filter-controls select { padding: 0.4rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-size: 0.825rem; outline: none; background: white; }
    .table-container { width: 100%; overflow: hidden; }
    .table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
    .table th.text-right, .table td.text-right { text-align: right; }
    .justify-end { justify-content: flex-end; }
    .badge-mini { background: #f1f5f9; color: #475569; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.72rem; font-weight: 700; border: 1px solid #cbd5e1; }
    .sub-icon { color: #94a3b8; font-size: 0.75rem; margin-right: 0.2rem; }
    .table th { background: #f8fafc; padding: 0.75rem 1rem; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; font-size: 0.78rem; text-transform: uppercase; }
    .table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
    .auction-row:hover { background: #f8fafc; }
    .auc-id-tag { font-weight: 700; color: #64748b; font-size: 0.8rem; background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 4px; }
    .crop-cell { display: flex; align-items: center; gap: 0.65rem; }
    .crop-thumb { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; border: 1px solid #e2e8f0; }
    .crop-title { color: #0f172a; font-size: 0.9rem; }
    .dealer-name { color: #1e40af; font-size: 0.85rem; }
    .subtext { font-size: 0.75rem; color: #64748b; }
    .btn-group { display: flex; gap: 0.35rem; }
    .btn { padding: 0.35rem 0.65rem; border-radius: 5px; font-size: 0.78rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; display: inline-flex; align-items: center; gap: 0.3rem; }
    .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
    .btn-outline-danger { background: white; border-color: #fca5a5; color: #b91c1c; }
    .btn-outline-danger:hover { background: #fee2e2; }
    .btn-outline-success { background: white; border-color: #86efac; color: #15803d; }
    .btn-outline-success:hover { background: #dcfce7; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-danger:hover { background: #dc2626; }
    .btn-secondary { background: #f1f5f9; color: #334155; border-color: #cbd5e1; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-warning { background: #f59e0b; color: white; }
    .btn-warning:hover { background: #d97706; }
    .btn-success { background: #16a34a; color: white; }
    .btn-success:hover { background: #15803d; }
    .empty-state { text-align: center; padding: 3rem; color: #94a3b8; }
    .empty-state i { font-size: 2.5rem; margin-bottom: 0.5rem; display: block; }
    .table-footer { display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 0.82rem; }
    .pagination-buttons { display: flex; gap: 0.35rem; }
    .btn-page {
      min-width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-page.active { background: #16a34a; border-color: #16a34a; color: white; }
    .btn-page:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Modal */
    .modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-dialog { background: white; border-radius: 12px; width: 100%; max-width: 560px; overflow: hidden; }
    .modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { font-size: 1.15rem; font-weight: 800; margin: 0; }
    .close-x { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; }
    .modal-body { padding: 1.5rem; }
    .summary-top { background: #f8fafc; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.85rem; }
    .subhead { font-size: 0.85rem; font-weight: 700; color: #475569; text-transform: uppercase; }
    .bids-modal-table { width: 100%; border-collapse: collapse; font-size: 0.825rem; }
    .bids-modal-table th { background: #f1f5f9; padding: 0.5rem 0.75rem; text-align: left; }
    .bids-modal-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; }
    .lead-bid { background: #f0fdf4; font-weight: 700; }
    .font-bold { font-weight: 700; }
    .modal-footer { padding: 1rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.5rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-3 { margin-top: 1rem; }
  `]
})
export class AdminBiddingsComponent implements OnInit {
  auctions: AdminAuctionItem[] = [];
  searchFilter = '';
  statusFilter = 'ALL';
  alertMsg = '';
  selectedAuction: AdminAuctionItem | null = null;

  currentPage = 1;
  pageSize = 5;
  Math = Math;

  get totalPages(): number {
    return Math.ceil(this.filteredAuctions.length / this.pageSize) || 1;
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedAuctions(): AdminAuctionItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAuctions.slice(start, start + this.pageSize);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  constructor(private biddingService: BiddingService) {}

  ngOnInit(): void {
    this.loadAuctions();
  }

  loadAuctions(): void {
    this.biddingService.getAllAuctions().subscribe({
      next: (data) => {
        this.auctions = (data || [])
          .filter(a => a.status !== 'CLOSED' && (a.status as string) !== 'AWARDED')
          .map(a => ({
            id: a.id,
            cropName: a.cropName || 'Auction Lot',
            variety: 'Grade A Produce',
            grade: 'Grade A',
            totalQuantityKg: a.quantity || 1000,
            startingPriceKg: a.startingPrice || 20,
            currentBidKg: a.currentHighestBid || a.startingPrice || 20,
            farmerName: a.farmerName || 'Registered Farmer',
            farmerPhone: '+91 98000 00000',
            location: 'Agricultural Mandi Yard',
            highestBidderDealer: a.highestBidderName || 'None',
            bidsCount: a.bidsCount || 0,
            endTime: a.endTime ? new Date(a.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Open',
            status: (a.status as any) || 'OPEN',
            image: resolveCropImage(a.cropName),
            bidsHistory: a.bidsHistory || []
          }));
      },
      error: () => {
        this.auctions = [];
      }
    });
  }

  get filteredAuctions(): AdminAuctionItem[] {
    return this.auctions.filter(a => {
      const q = this.searchFilter.trim().toLowerCase();
      const matchesSearch = !q ||
        a.cropName.toLowerCase().includes(q) ||
        a.variety.toLowerCase().includes(q) ||
        a.farmerName.toLowerCase().includes(q) ||
        a.highestBidderDealer.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q);

      const matchesStatus = this.statusFilter === 'ALL' || a.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  getOpenCount(): number {
    return this.auctions.filter(a => a.status === 'OPEN').length;
  }

  getBlockedCount(): number {
    return this.auctions.filter(a => a.status === 'BLOCKED').length;
  }

  toggleBlockAuction(auction: AdminAuctionItem, block: boolean): void {
    auction.status = block ? 'BLOCKED' : 'OPEN';
    this.biddingService.toggleBlockAuction(auction.id, block).subscribe();
    this.alertMsg = `✓ Auction #${auction.id} (${auction.cropName}) has been ${block ? 'BLOCKED from accepting bids' : 'UNBLOCKED and opened for live bidding'}!`;
    setTimeout(() => this.alertMsg = '', 4500);
  }

  deleteAuction(auction: AdminAuctionItem): void {
    if (confirm(`Are you sure you want to permanently delete auction floor #${auction.id} (${auction.cropName})?`)) {
      this.biddingService.deleteAuction(auction.id).subscribe();
      this.auctions = this.auctions.filter(x => x.id !== auction.id);
      this.alertMsg = `✓ Auction floor #${auction.id} (${auction.cropName}) has been permanently deleted globally from database and trading floors.`;
      setTimeout(() => this.alertMsg = '', 4500);
    }
  }

  viewBidsModal(auction: AdminAuctionItem): void {
    this.selectedAuction = auction;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'OPEN': return 'badge-success';
      case 'BLOCKED': return 'badge-danger';
      case 'CLOSED': return 'badge-neutral';
      default: return 'badge-primary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'OPEN': return 'fa-circle-check';
      case 'BLOCKED': return 'fa-ban';
      case 'CLOSED': return 'fa-lock';
      default: return 'fa-circle-info';
    }
  }

  onThumbError(event: any): void {
    event.target.src = '/assets/images/crop-rice.jpg';
  }
}
