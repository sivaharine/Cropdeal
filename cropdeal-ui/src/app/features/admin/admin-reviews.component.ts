import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, UserReview } from '../../core/services/admin.service';
import { ReviewService, FarmerReview } from '../../core/services/review.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-reviews-container">
      <div class="page-header">
        <div>
          <h2 class="page-title"><i class="fa-solid fa-star-half-stroke text-amber"></i> Marketplace Feedback & Reviews</h2>
          <p class="page-subtitle">Inspect ratings submitted between farmers, dealers, and logistics to maintain quality trust</p>
        </div>
        <span class="badge badge-warning">{{ reviews.length }} Reviews Moderated</span>
      </div>

      <div *ngIf="notice" class="alert alert-success shadow-md">
        <i class="fa-solid fa-circle-check"></i>
        <span>{{ notice }}</span>
      </div>

      <div *ngIf="reviews.length === 0" class="card empty-card text-center p-5 mt-4">
        <i class="fa-regular fa-comments text-subtle" style="font-size: 2.5rem; margin-bottom: 0.75rem;"></i>
        <h4 style="margin: 0; color: var(--text-main);">No Reviews or Feedback Submitted Yet</h4>
        <p style="margin: 0.5rem 0 0; color: var(--text-muted); font-size: 0.85rem;">User and farmer marketplace ratings will appear here dynamically as deals complete.</p>
      </div>

      <div class="grid grid-cols-2 mt-4" *ngIf="reviews.length > 0">
        <div *ngFor="let rev of reviews" class="card review-card">
          <div class="rev-header">
            <div class="star-rating">
              <i *ngFor="let s of [1,2,3,4,5]" class="fa-star" [ngClass]="s <= rev.rating ? 'fa-solid text-amber' : 'fa-regular text-subtle'"></i>
              <span class="rating-num">{{ rev.rating }}.0</span>
            </div>
            <button class="delete-btn" (click)="deleteReview(rev.id)" title="Remove Inappropriate Review">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>

          <p class="review-comment">"{{ rev.comment }}"</p>

          <div class="rev-meta mt-3">
            <div class="meta-item">
              <span class="lbl">Reviewer:</span>
              <strong>{{ rev.reviewerName }}</strong>
            </div>
            <div class="meta-item">
              <span class="lbl">Target User:</span>
              <strong>{{ rev.targetUserName }}</strong>
            </div>
            <div class="meta-item">
              <span class="lbl">Date:</span>
              <span>{{ rev.createdAt | date:'mediumDate' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-reviews-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 1.5rem; font-weight: 800; }
    .text-amber { color: var(--accent-amber); }
    .text-subtle { color: var(--text-subtle); }
    .page-subtitle { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem; }
    .review-card { padding: 1.25rem; display: flex; flex-direction: column; }
    .empty-card { padding: 3rem 1.5rem; border: 1px dashed var(--border-light); background: #f8fafc; border-radius: var(--radius-md); }
    .rev-header { display: flex; justify-content: space-between; align-items: center; }
    .star-rating { display: flex; align-items: center; gap: 0.25rem; font-size: 0.95rem; }
    .rating-num { font-weight: 800; margin-left: 0.4rem; font-size: 0.85rem; }
    .delete-btn {
      background: none;
      border: none;
      color: var(--text-subtle);
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25rem;
      transition: color var(--transition-fast);
    }
    .delete-btn:hover { color: var(--danger); }
    .review-comment {
      font-size: 0.9rem;
      line-height: 1.5;
      color: var(--text-main);
      font-style: italic;
      margin-top: 0.75rem;
    }
    .rev-meta {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid var(--border-light);
      padding-top: 0.75rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .meta-item { display: flex; flex-direction: column; }
    .lbl { font-size: 0.65rem; text-transform: uppercase; font-weight: 700; color: var(--text-subtle); }
    .alert { padding: 0.85rem 1.25rem; border-radius: var(--radius-md); display: flex; align-items: center; gap: 0.75rem; font-weight: 600; font-size: 0.85rem; }
    .alert-success { background: var(--success-bg); color: var(--success); border: 1px solid #86efac; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }
  `]
})
export class AdminReviewsComponent implements OnInit, OnDestroy {
  reviews: UserReview[] = [];
  notice = '';
  private sub: Subscription = new Subscription();

  constructor(
    private adminService: AdminService,
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.reviewService.reviews$.subscribe((farmerRevs: FarmerReview[]) => {
        const mapped: UserReview[] = (farmerRevs || []).map(r => ({
          id: r.id,
          reviewerId: r.dealerId || 'dealer',
          reviewerName: `${r.dealerName || 'Dealer'} (Dealer)`,
          targetUserId: r.farmerId || 'farmer',
          targetUserName: `${r.farmerName || 'Farmer'} (Farmer) - Crop: ${r.cropName || 'Produce'}`,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt
        }));
        this.reviews = mapped;
      })
    );

    this.adminService.getAllReviews().subscribe(apiRevs => {
      if (apiRevs && apiRevs.length > 0) {
        const existingIds = new Set(this.reviews.map(r => r.id));
        const newOnes = apiRevs.filter(r => !existingIds.has(r.id));
        this.reviews = [...this.reviews, ...newOnes];
      }
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  deleteReview(id: string): void {
    this.reviewService.deleteReview(id);
    this.adminService.deleteReview(id).subscribe({ error: () => {} });
    this.reviews = this.reviews.filter(r => r.id !== id);
    this.notice = 'Review removed by administrator moderation.';
    setTimeout(() => this.notice = '', 4000);
  }
}
