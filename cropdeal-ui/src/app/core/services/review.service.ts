import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface FarmerReview {
  id: string;
  orderId?: string;
  orderNumber?: string;
  cropId?: string;
  cropName: string;
  dealerId: string;
  dealerName: string;
  farmerId: string;
  farmerName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly STORAGE_KEY = 'cropdeal_farmer_reviews';
  private reviewsSubject: BehaviorSubject<FarmerReview[]>;
  public reviews$: Observable<FarmerReview[]>;

  constructor() {
    const initial = this.loadFromStorage();
    this.reviewsSubject = new BehaviorSubject<FarmerReview[]>(initial);
    this.reviews$ = this.reviewsSubject.asObservable();
  }

  private loadFromStorage(): FarmerReview[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse farmer reviews from storage', e);
      }
    }
    return [];
  }

  private saveToStorage(reviews: FarmerReview[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reviews));
    this.reviewsSubject.next(reviews);
  }

  getAllReviews(): FarmerReview[] {
    return this.reviewsSubject.getValue();
  }

  getReviewsForFarmer(farmerNameOrId: string): FarmerReview[] {
    const list = this.getAllReviews();
    const query = (farmerNameOrId || '').toLowerCase().trim();
    return list.filter(r => 
      (r.farmerId && r.farmerId.toLowerCase().includes(query)) ||
      (r.farmerName && r.farmerName.toLowerCase().includes(query))
    );
  }

  getReviewsForCrop(cropName: string): FarmerReview[] {
    const list = this.getAllReviews();
    const query = (cropName || '').toLowerCase().trim();
    return list.filter(r => r.cropName && r.cropName.toLowerCase().includes(query));
  }

  getReviewByOrder(orderIdentifier: string, dealerIdentifier?: string): FarmerReview | undefined {
    const list = this.getAllReviews();
    return list.find(r => 
      (r.orderId === orderIdentifier || r.orderNumber === orderIdentifier) &&
      (!dealerIdentifier || r.dealerId === dealerIdentifier || r.dealerName === dealerIdentifier)
    );
  }

  getAverageRating(farmerNameOrCrop: string): { avg: number; count: number } {
    const list = this.getAllReviews();
    const q = (farmerNameOrCrop || '').toLowerCase().trim();
    const matches = list.filter(r => 
      (r.farmerName && r.farmerName.toLowerCase().includes(q)) ||
      (r.cropName && r.cropName.toLowerCase().includes(q))
    );
    if (matches.length === 0) return { avg: 0, count: 0 };
    const sum = matches.reduce((acc, curr) => acc + curr.rating, 0);
    return { avg: parseFloat((sum / matches.length).toFixed(1)), count: matches.length };
  }

  submitOrUpdateReview(review: Omit<FarmerReview, 'id' | 'createdAt'> & { id?: string }): FarmerReview {
    const list = [...this.getAllReviews()];
    const existingIndex = list.findIndex(r => 
      (review.id && r.id === review.id) ||
      (review.orderId && r.orderId === review.orderId)
    );

    if (existingIndex >= 0) {
      const updated: FarmerReview = {
        ...list[existingIndex],
        ...review,
        rating: Number(review.rating),
        updatedAt: new Date().toISOString()
      };
      list[existingIndex] = updated;
      this.saveToStorage(list);
      return updated;
    } else {
      const created: FarmerReview = {
        ...review,
        id: review.id || 'rev-' + Date.now(),
        rating: Number(review.rating),
        createdAt: new Date().toISOString()
      };
      list.unshift(created);
      this.saveToStorage(list);
      return created;
    }
  }

  deleteReview(reviewId: string): void {
    const filtered = this.getAllReviews().filter(r => r.id !== reviewId);
    this.saveToStorage(filtered);
  }
}
