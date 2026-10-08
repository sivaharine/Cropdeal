import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, catchError, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FarmerReviewRequest,
  FarmerReviewResponse,
  FarmerRatingSummaryResponse,
  UpdateReviewRequest
} from '../models/models';
import { MOCK_REVIEWS } from './mock-data';

const REVIEWS_STORAGE_KEY = 'cropdeal_reviews_cache';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly baseUrl = `${environment.apiUrl}/reviews`;
  private reviewsCache: FarmerReviewResponse[] = this.loadFromStorage();

  constructor(private http: HttpClient) {}

  private loadFromStorage(): FarmerReviewResponse[] {
    try {
      const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    this.saveToStorage([...MOCK_REVIEWS]);
    return [...MOCK_REVIEWS];
  }

  private saveToStorage(reviews: FarmerReviewResponse[]): void {
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    } catch {}
  }

  // ─── 1. POST /api/reviews/farmers ─────────────────────────────────────────
  public createReview(request: FarmerReviewRequest): Observable<FarmerReviewResponse> {
    const backendPayload = {
      orderId: request.orderId,
      cropId: request.cropId,
      dealerId: request.dealerId,
      farmerId: request.farmerId,
      rating: request.rating,
      reviewText: request.reviewText || request.comment || 'Verified Quality Crop'
    };

    return this.http.post<FarmerReviewResponse>(`${this.baseUrl}/farmers`, backendPayload).pipe(
      tap(created => {
        this.reviewsCache = [created, ...this.reviewsCache.filter(r => r.id !== created.id)];
        this.saveToStorage(this.reviewsCache);
      }),
      catchError(err => {
        if (err.status && err.status !== 0) {
          return throwError(() => err);
        }
        const rev: FarmerReviewResponse = {
          id: Date.now(),
          farmerId: request.farmerId,
          dealerId: request.dealerId,
          orderId: request.orderId,
          cropId: request.cropId,
          rating: request.rating,
          reviewText: backendPayload.reviewText,
          comment: backendPayload.reviewText,
          reviewReference: 'REV-' + Date.now().toString(36).toUpperCase(),
          status: 'ACTIVE',
          dealerName: 'Verified B2B Dealer #' + request.dealerId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.reviewsCache = [rev, ...this.reviewsCache];
        this.saveToStorage(this.reviewsCache);
        return of(rev);
      })
    );
  }

  // ─── 2. GET /api/reviews/{reviewId} ───────────────────────────────────────
  public getReviewById(reviewId: number): Observable<FarmerReviewResponse | null> {
    return this.http.get<FarmerReviewResponse>(`${this.baseUrl}/${reviewId}`).pipe(
      catchError(() => {
        const found = this.reviewsCache.find(r => r.id === Number(reviewId));
        return of(found || null);
      })
    );
  }

  // ─── 3. GET /api/reviews/reference/{reviewReference} ───────────────────────
  public getReviewByReference(reviewReference: string): Observable<FarmerReviewResponse | null> {
    return this.http.get<FarmerReviewResponse>(`${this.baseUrl}/reference/${reviewReference}`).pipe(
      catchError(() => {
        const found = this.reviewsCache.find(r => r.reviewReference === reviewReference);
        return of(found || null);
      })
    );
  }

  // ─── 4. GET /api/reviews/farmer/{farmerId} ────────────────────────────────
  public getFarmerReviews(farmerId: number): Observable<FarmerRatingSummaryResponse> {
    return this.http.get<FarmerRatingSummaryResponse>(`${this.baseUrl}/farmer/${farmerId}`).pipe(
      catchError(() => {
        const list = this.reviewsCache.filter(r => r.farmerId === Number(farmerId));
        const avg = list.length
          ? list.reduce((acc, r) => acc + r.rating, 0) / list.length
          : 0;
        return of({
          farmerId: Number(farmerId),
          totalReviews: list.length,
          averageRating: Math.round(avg * 10) / 10,
          reviews: list
        });
      })
    );
  }

  // ─── 5. GET /api/reviews/dealer/{dealerId} ────────────────────────────────
  public getDealerReviews(dealerId: number): Observable<FarmerReviewResponse[]> {
    return this.http.get<FarmerReviewResponse[]>(`${this.baseUrl}/dealer/${dealerId}`).pipe(
      catchError(() => of(this.reviewsCache.filter(r => r.dealerId === Number(dealerId))))
    );
  }

  // ─── 6. GET /api/reviews/order/{orderId} ──────────────────────────────────
  public getOrderReviews(orderId: number): Observable<FarmerReviewResponse[]> {
    return this.http.get<FarmerReviewResponse[]>(`${this.baseUrl}/order/${orderId}`).pipe(
      catchError(() => of(this.reviewsCache.filter(r => r.orderId === Number(orderId))))
    );
  }

  // ─── 7. GET /api/reviews/crop/{cropId} ────────────────────────────────────
  public getCropReviews(cropId: number): Observable<FarmerReviewResponse[]> {
    return this.http.get<FarmerReviewResponse[]>(`${this.baseUrl}/crop/${cropId}`).pipe(
      catchError(() => of(this.reviewsCache.filter(r => r.cropId === Number(cropId))))
    );
  }

  // ─── 8. PUT /api/reviews/{reviewId} ───────────────────────────────────────
  public updateReview(
    reviewId: number,
    request: UpdateReviewRequest,
    dealerId?: number
  ): Observable<FarmerReviewResponse> {
    let params = new HttpParams();
    if (dealerId) params = params.set('dealerId', String(dealerId));

    const backendPayload = {
      rating: request.rating,
      reviewText: request.reviewText || request.comment || ''
    };

    return this.http.put<FarmerReviewResponse>(`${this.baseUrl}/${reviewId}`, backendPayload, { params }).pipe(
      tap(updated => {
        this.reviewsCache = this.reviewsCache.map(r => r.id === reviewId ? updated : r);
        this.saveToStorage(this.reviewsCache);
      }),
      catchError(() => {
        const r = this.reviewsCache.find(x => x.id === reviewId);
        if (r) {
          if (request.rating) r.rating = request.rating;
          if (backendPayload.reviewText) {
            r.reviewText = backendPayload.reviewText;
            r.comment = backendPayload.reviewText;
          }
          r.updatedAt = new Date().toISOString();
          this.saveToStorage(this.reviewsCache);
          return of({ ...r });
        }
        return of(this.reviewsCache[0]);
      })
    );
  }

  // ─── 9. DELETE /api/reviews/{reviewId} ────────────────────────────────────
  public deleteReview(
    reviewId: number,
    dealerId?: number,
    role: string = 'ROLE_DEALER'
  ): Observable<void> {
    let params = new HttpParams().set('role', role);
    if (dealerId) params = params.set('dealerId', String(dealerId));

    return this.http.delete<void>(`${this.baseUrl}/${reviewId}`, { params }).pipe(
      tap(() => {
        this.reviewsCache = this.reviewsCache.filter(r => r.id !== reviewId);
        this.saveToStorage(this.reviewsCache);
      }),
      catchError(() => {
        this.reviewsCache = this.reviewsCache.filter(r => r.id !== reviewId);
        this.saveToStorage(this.reviewsCache);
        return of(void 0);
      })
    );
  }

  // ─── Helper: Get All Reviews ──────────────────────────────────────────────
  public getAllReviews(): Observable<FarmerReviewResponse[]> {
    return this.http.get<FarmerReviewResponse[]>(this.baseUrl).pipe(
      tap(reviews => {
        if (reviews && Array.isArray(reviews)) {
          this.reviewsCache = reviews;
          this.saveToStorage(reviews);
        }
      }),
      catchError(() => of([...this.reviewsCache]))
    );
  }
}
