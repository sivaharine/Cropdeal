import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FullAdminReport, PaymentReportItem, UserReportItem, CropReportItem } from '../models/report.model';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

export interface UserReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  targetUserId: string;
  targetUserName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private adminUrl = `${environment.apiUrl}/admin`;
  private reportsUrl = `${environment.apiUrl}/reports`;
  private reviewsUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  // User Management
  getAllUsers(role?: string): Observable<any[]> {
    const url = role && role !== 'ALL' ? `${this.adminUrl}/users?role=${role}` : `${this.adminUrl}/users`;
    return this.http.get<any[]>(url).pipe(
      catchError(() => of([]))
    );
  }

  blockUser(userId: string, reason: string = 'Blocked by Administrator'): Observable<any> {
    const numId = Number(userId);
    if (!isNaN(numId) && numId > 0) {
      this.http.put(`${environment.apiUrl}/auth/users/${numId}/status`, { status: 'SUSPENDED' }).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    return this.http.post<any>(`${this.adminUrl}/users/${userId}/block?reason=${encodeURIComponent(reason)}`, {}).pipe(
      catchError(() => of({ success: true, message: 'User blocked' }))
    );
  }

  unblockUser(userId: string): Observable<any> {
    const numId = Number(userId);
    if (!isNaN(numId) && numId > 0) {
      this.http.put(`${environment.apiUrl}/auth/users/${numId}/status`, { status: 'ACTIVE' }).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    return this.http.post<any>(`${this.adminUrl}/users/${userId}/unblock`, {}).pipe(
      catchError(() => of({ success: true, message: 'User unblocked' }))
    );
  }

  // Review Management
  getAllReviews(): Observable<UserReview[]> {
    return this.http.get<UserReview[]>(this.reviewsUrl).pipe(
      catchError(() => of([]))
    );
  }

  deleteReview(reviewId: string): Observable<void> {
    return this.http.delete<void>(`${this.reviewsUrl}/${reviewId}`).pipe(
      catchError(() => of(undefined as any))
    );
  }

  // Reports Section
  getFullReport(): Observable<FullAdminReport> {
    return this.http.get<FullAdminReport>(`${this.reportsUrl}/dashboard`).pipe(
      catchError(() => of({
        totalUsers: 0,
        activeCrops: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingDeliveries: 0
      } as any))
    );
  }

  getPaymentReports(): Observable<PaymentReportItem[]> {
    return this.http.get<PaymentReportItem[]>(`${this.reportsUrl}/payments`).pipe(
      catchError(() => of([]))
    );
  }

  getDealerReports(): Observable<UserReportItem[]> {
    return this.http.get<UserReportItem[]>(`${this.reportsUrl}/dealers`).pipe(
      catchError(() => of([]))
    );
  }

  getFarmerReports(): Observable<UserReportItem[]> {
    return this.http.get<UserReportItem[]>(`${this.reportsUrl}/farmers`).pipe(
      catchError(() => of([]))
    );
  }

  getDeliveryPartnerReports(): Observable<UserReportItem[]> {
    return this.http.get<UserReportItem[]>(`${this.reportsUrl}/delivery-partners`).pipe(
      catchError(() => of([]))
    );
  }

  getCropReports(): Observable<CropReportItem[]> {
    return this.http.get<CropReportItem[]>(`${this.reportsUrl}/crops`).pipe(
      catchError(() => of([]))
    );
  }
}
