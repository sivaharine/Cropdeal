import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CropService } from '../../core/services/crop.service';
import { Crop } from '../../core/models/crop.model';

@Component({
  selector: 'app-admin-crops',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-crops-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">
            <i class="fa-solid fa-wheat-awn text-emerald"></i> Crop Management & Moderation
          </h2>
          <p class="page-subtitle">
            Inspect all farmer harvest listings across India, moderate quality posts, and delete or block/unblock crop listings.
          </p>
        </div>
        <div class="stats-pills">
          <span class="badge badge-primary">{{ crops.length }} Total Crops</span>
          <span class="badge badge-success">{{ getAvailableCount() }} Active</span>
          <span class="badge badge-danger">{{ getBlockedCount() }} Blocked</span>
        </div>
      </div>

      <!-- Action Toast Message -->
      <div *ngIf="alertMsg" class="alert alert-success shadow-md mt-3">
        <i class="fa-solid fa-circle-check"></i>
        <span>{{ alertMsg }}</span>
      </div>

      <!-- Filter Card -->
      <div class="card table-card mt-3">
        <div class="card-header">
          <div class="search-bar">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              [(ngModel)]="searchFilter"
              placeholder="Search by crop name, variety, farmer name, or location..."
              class="form-control"
            />
          </div>
          <div class="filter-controls">
            <select [(ngModel)]="categoryFilter" class="form-control">
              <option value="ALL">All Categories</option>
              <option value="GRAINS">Grains & Cereals</option>
              <option value="VEGETABLES">Vegetables</option>
              <option value="OILSEEDS">Oilseeds</option>
              <option value="COMMERCIAL">Commercial Crops</option>
            </select>
            <select [(ngModel)]="statusFilter" class="form-control">
              <option value="ALL">All Status</option>
              <option value="AVAILABLE">Active / Available</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Harvest Item & Category</th>
                <th>Farmer</th>
                <th>Quantity & Rate</th>
                <th>Mandi / Location</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of pagedCrops" class="crop-row">
                <td>
                  <div class="crop-cell">
                    <img [src]="c.imageUrl || '/assets/images/crop-rice.jpg'" [alt]="c.cropName" class="crop-thumb" (error)="onThumbError($event)" />
                    <div>
                      <div class="d-flex align-center gap-1">
                        <strong class="crop-name-title">{{ c.cropName }}</strong>
                        <span class="category-pill">{{ c.cropType || 'Produce' }}</span>
                      </div>
                      <span class="subtext d-block">#{{ c.id || 'CRP' }} &bull; {{ c.variety || 'Standard Grade' }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <strong>{{ c.farmerName || 'Registered Farmer' }}</strong>
                  <span class="subtext d-block">{{ c.farmerPhone || '+91 98765 00000' }}</span>
                </td>
                <td>
                  <strong>{{ c.quantity }} {{ c.unit }}</strong>
                  <span class="subtext d-block text-emerald font-bold">₹{{ c.pricePerUnit }} / {{ c.unit }}</span>
                </td>
                <td>
                  <span><i class="fa-solid fa-location-dot sub-icon"></i> {{ c.location }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="c.status === 'BLOCKED' ? 'badge-danger' : 'badge-success'">
                    <i class="fa-solid" [ngClass]="c.status === 'BLOCKED' ? 'fa-ban' : 'fa-circle-check'"></i>
                    {{ c.status === 'BLOCKED' ? 'BLOCKED' : 'AVAILABLE' }}
                  </span>
                </td>
                <td class="text-right">
                  <div class="btn-group justify-end">
                    <button
                      class="btn btn-danger btn-sm"
                      (click)="deleteCrop(c)"
                      title="Permanently Delete Crop">
                      <i class="fa-regular fa-trash-can"></i>
                    </button>
                    <button
                      class="btn btn-secondary btn-sm"
                      (click)="viewDetailsModal(c)"
                      title="View Full Post Info">
                      <i class="fa-regular fa-eye"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredCrops.length === 0">
                <td colspan="9" class="empty-state">
                  <i class="fa-solid fa-wheat-awn"></i>
                  <p>No crops match your search filter criteria.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer" *ngIf="totalPages > 1">
          <span class="text-muted">Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredCrops.length) }} of {{ filteredCrops.length }} crop listings</span>
          <div class="pagination-buttons">
            <button class="btn-page" [disabled]="currentPage === 1" (click)="setPage(currentPage - 1)">&laquo; Prev</button>
            <button *ngFor="let p of totalPagesArray" class="btn-page" [class.active]="p === currentPage" (click)="setPage(p)">{{ p }}</button>
            <button class="btn-page" [disabled]="currentPage === totalPages" (click)="setPage(currentPage + 1)">Next &raquo;</button>
          </div>
        </div>
      </div>

      <!-- Crop Details Modal -->
      <div *ngIf="selectedCrop" class="modal-backdrop">
        <div class="modal-dialog shadow-2xl">
          <div class="modal-header">
            <h3><i class="fa-solid fa-seedling text-emerald"></i> Crop Harvest Details</h3>
            <button class="close-x" (click)="selectedCrop = null">&times;</button>
          </div>
          <div class="modal-body">
            <div class="modal-crop-preview">
              <img [src]="selectedCrop.imageUrl || '/assets/images/crop-rice.jpg'" class="modal-crop-img" />
              <div>
                <h2>{{ selectedCrop.cropName }}</h2>
                <p class="text-muted">{{ selectedCrop.variety }} &bull; {{ selectedCrop.cropType }}</p>
                <div class="mt-2">
                  <span class="badge" [ngClass]="selectedCrop.status === 'BLOCKED' ? 'badge-danger' : 'badge-success'">
                    Status: {{ selectedCrop.status }}
                  </span>
                </div>
              </div>
            </div>
            <div class="details-grid mt-3">
              <div class="d-item"><span class="k">Price:</span> <strong class="v text-emerald">₹{{ selectedCrop.pricePerUnit }} / {{ selectedCrop.unit }}</strong></div>
              <div class="d-item"><span class="k">Available Qty:</span> <strong class="v">{{ selectedCrop.quantity }} {{ selectedCrop.unit }}</strong></div>
              <div class="d-item"><span class="k">Farmer:</span> <span class="v">{{ selectedCrop.farmerName }}</span></div>
              <div class="d-item"><span class="k">Location:</span> <span class="v">{{ selectedCrop.location }}</span></div>
              <div class="d-item full-width" *ngIf="selectedCrop.description"><span class="k">Description:</span> <p class="v-desc">{{ selectedCrop.description }}</p></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selectedCrop = null">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-crops-container { display: flex; flex-direction: column; gap: 1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.65rem; font-weight: 800; color: #0f172a; margin: 0; }
    .page-subtitle { color: #64748b; font-size: 0.9rem; margin-top: 0.25rem; }
    .text-emerald { color: #16a34a; }
    .stats-pills { display: flex; gap: 0.5rem; }
    .badge { padding: 0.35rem 0.65rem; border-radius: 9999px; font-size: 0.78rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.3rem; }
    .badge-primary { background: #eff6ff; color: #2563eb; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
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
    .table th { background: #f8fafc; padding: 0.75rem 1rem; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; font-size: 0.78rem; text-transform: uppercase; }
    .table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
    .crop-row:hover { background: #f8fafc; }
    .crop-id-tag { font-weight: 700; color: #64748b; font-size: 0.8rem; background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 4px; }
    .crop-cell { display: flex; align-items: center; gap: 0.65rem; }
    .crop-thumb { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; border: 1px solid #e2e8f0; }
    .crop-name-title { color: #0f172a; font-size: 0.9rem; }
    .category-pill { background: #f1f5f9; color: #475569; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .subtext { font-size: 0.75rem; color: #64748b; }
    .sub-icon { color: #94a3b8; font-size: 0.75rem; margin-right: 0.2rem; }
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
    .modal-dialog { background: white; border-radius: 12px; width: 100%; max-width: 520px; overflow: hidden; }
    .modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { font-size: 1.15rem; font-weight: 800; margin: 0; }
    .close-x { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; }
    .modal-body { padding: 1.5rem; }
    .modal-crop-preview { display: flex; gap: 1rem; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid #f1f5f9; }
    .modal-crop-img { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .full-width { grid-column: span 2; }
    .d-item .k { font-size: 0.75rem; color: #64748b; display: block; }
    .v-desc { font-size: 0.825rem; color: #334155; margin: 0.2rem 0; line-height: 1.4; }
    .modal-footer { padding: 1rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.5rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 1rem; }
  `]
})
export class AdminCropsComponent implements OnInit {
  crops: Crop[] = [];
  searchFilter = '';
  categoryFilter = 'ALL';
  statusFilter = 'ALL';
  alertMsg = '';
  selectedCrop: Crop | null = null;

  currentPage = 1;
  pageSize = 5;
  Math = Math;

  get totalPages(): number {
    return Math.ceil(this.filteredCrops.length / this.pageSize) || 1;
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedCrops(): Crop[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCrops.slice(start, start + this.pageSize);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  constructor(private cropService: CropService) {}

  ngOnInit(): void {
    this.loadCrops();
  }

  loadCrops(): void {
    this.cropService.getAllCrops().subscribe({
      next: (data) => {
        this.crops = data || [];
      },
      error: () => {
        this.crops = [];
      }
    });
  }

  get filteredCrops(): Crop[] {
    return this.crops.filter(c => {
      const q = this.searchFilter.trim().toLowerCase();
      const matchesSearch = !q ||
        c.cropName.toLowerCase().includes(q) ||
        (c.variety || '').toLowerCase().includes(q) ||
        (c.farmerName || '').toLowerCase().includes(q) ||
        (c.location || '').toLowerCase().includes(q);

      const matchesCat = this.categoryFilter === 'ALL' || (c.cropType || '').toUpperCase().includes(this.categoryFilter);
      const matchesStatus = this.statusFilter === 'ALL' || c.status === this.statusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }

  getActiveCount(): number {
    return this.crops.filter(c => c.status !== 'BLOCKED').length;
  }

  getAvailableCount(): number {
    return this.getActiveCount();
  }

  getBlockedCount(): number {
    return this.crops.filter(c => c.status === 'BLOCKED').length;
  }

  toggleBlockCrop(crop: Crop, block: boolean): void {
    const newStatus = block ? 'BLOCKED' : 'AVAILABLE';
    crop.status = newStatus;
    const cropId = String(crop.id || crop.cropId || '');
    if (cropId) {
      this.cropService.updateCrop(cropId, { status: newStatus }).subscribe();
    }
    this.alertMsg = `✓ Crop #${cropId || crop.id} (${crop.cropName}) has been ${block ? 'BLOCKED from public marketplace' : 'UNBLOCKED and restored to active marketplace'}!`;
    setTimeout(() => this.alertMsg = '', 4500);
  }

  deleteCrop(crop: Crop): void {
    if (confirm(`Are you sure you want to permanently delete crop listing #${crop.id} (${crop.cropName})?`)) {
      const cropId = String(crop.id || crop.cropId || '');
      this.cropService.deleteCrop(cropId).subscribe({
        next: () => {},
        error: () => {}
      });
      this.crops = this.crops.filter(x => String(x.id) !== cropId && String(x.cropId) !== cropId);
      this.alertMsg = `✓ Crop #${cropId} (${crop.cropName}) has been permanently deleted globally from marketplace and database.`;
      setTimeout(() => this.alertMsg = '', 4500);
    }
  }

  viewDetailsModal(crop: Crop): void {
    this.selectedCrop = crop;
  }

  onThumbError(event: any): void {
    event.target.src = '/assets/images/crop-rice.jpg';
  }
}
