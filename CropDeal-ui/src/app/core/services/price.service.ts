import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MarketPriceResponse,
  CropPriceResponse,
  PriceSearchRequest,
  PriceAlertSubscriptionRequest,
  PriceAlertSubscriptionResponse
} from '../models/models';
import { MOCK_PRICES } from './mock-data';
import { AuthService } from './auth.service';

const ALERTS_STORAGE_KEY = 'cropdeal_price_alerts';

@Injectable({
  providedIn: 'root'
})
export class PriceService {
  private readonly baseUrl = `${environment.apiUrl}/prices`;
  private readonly alertsUrl = `${environment.apiUrl}/prices/alerts`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const user = this.authService.currentUser;
    const token = user?.token;
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (user) {
      headers = headers.set('X-User-Id', String(user.userId));
      headers = headers.set('X-User-Role', user.role);
    }
    return headers;
  }

  // ─── Local Storage Resilience for Price Alerts ─────────────────────────────
  private loadAlertsFromStorage(): PriceAlertSubscriptionResponse[] {
    try {
      const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}

    // Initial seed alerts
    const initial: PriceAlertSubscriptionResponse[] = [
      {
        id: 1,
        userId: 1,
        userRole: 'ROLE_FARMER',
        cropName: 'Basmati Rice',
        targetPrice: 65,
        priceCondition: 'GREATER_THAN_OR_EQUAL',
        state: 'Punjab',
        district: 'Amritsar',
        unit: 'KG',
        active: true,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: 2,
        userId: 10,
        userRole: 'ROLE_DEALER',
        cropName: 'Wheat (Sharbati)',
        targetPrice: 28,
        priceCondition: 'LESS_THAN_OR_EQUAL',
        state: 'Madhya Pradesh',
        district: 'Sehore',
        unit: 'KG',
        active: true,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 3,
        userId: 1,
        userRole: 'ROLE_FARMER',
        cropName: 'Cotton (MCU-5)',
        targetPrice: 85,
        priceCondition: 'GREATER_THAN',
        state: 'Gujarat',
        district: 'Rajkot',
        unit: 'KG',
        active: false,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      }
    ];
    this.saveAlertsToStorage(initial);
    return initial;
  }

  private saveAlertsToStorage(alerts: PriceAlertSubscriptionResponse[]): void {
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    } catch {}
  }

  // ─── 1. GET /api/prices/all ────────────────────────────────────────────────
  public getAllLatestPrices(): Observable<MarketPriceResponse[]> {
    return this.http.get<MarketPriceResponse[]>(`${this.baseUrl}/all`).pipe(
      catchError(() => of(MOCK_PRICES))
    );
  }

  public getTodayPrices(): Observable<MarketPriceResponse[]> {
    return this.getAllLatestPrices();
  }

  public getPricesByCommodity(commodity: string): Observable<MarketPriceResponse[]> {
    return this.getTodayPrices().pipe(
      map(prices => prices.filter(price =>
        price.commodity.toLowerCase().includes(commodity.toLowerCase())
      ))
    );
  }

  // ─── 2. POST /api/prices/lookup ───────────────────────────────────────────
  public lookupPrice(request: PriceSearchRequest): Observable<CropPriceResponse> {
    return this.http.post<CropPriceResponse>(`${this.baseUrl}/lookup`, request).pipe(
      catchError(() => {
        // Fallback lookup against mock prices
        const found = MOCK_PRICES.find(p =>
          p.commodity.toLowerCase().includes(request.commodity.toLowerCase()) &&
          (!request.state || p.state.toLowerCase() === request.state.toLowerCase())
        );
        const base = found || MOCK_PRICES[0];
        const min = base.minPricePerKg || 40;
        const max = base.maxPricePerKg || 70;
        const result: CropPriceResponse = {
          commodity: base.commodity,
          state: base.state,
          district: base.district,
          grade: request.grade || 'A',
          priceDate: base.arrivalDate,
          minPricePerKg: min,
          maxPricePerKg: max,
          modalPricePerKg: Math.round((min + max) / 2 * 100) / 100
        };
        return of(result);
      })
    );
  }

  // ─── 3. POST /api/prices/alerts ───────────────────────────────────────────
  public createAlert(request: PriceAlertSubscriptionRequest): Observable<PriceAlertSubscriptionResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<PriceAlertSubscriptionResponse>(this.alertsUrl, request, { headers }).pipe(
      tap(created => {
        const list = this.loadAlertsFromStorage();
        this.saveAlertsToStorage([created, ...list]);
      }),
      catchError(() => {
        const user = this.authService.currentUser;
        const newAlert: PriceAlertSubscriptionResponse = {
          id: Date.now(),
          userId: user?.userId || 1,
          userRole: user?.role === 'FARMER' ? 'ROLE_FARMER' : 'ROLE_DEALER',
          cropName: request.cropName,
          targetPrice: request.targetPrice,
          priceCondition: request.priceCondition,
          state: request.state,
          district: request.district,
          unit: request.unit || 'KG',
          active: request.active ?? true,
          createdAt: new Date().toISOString()
        };
        const list = this.loadAlertsFromStorage();
        this.saveAlertsToStorage([newAlert, ...list]);
        return of(newAlert);
      })
    );
  }

  // ─── 4. GET /api/prices/alerts ────────────────────────────────────────────
  public getAlerts(): Observable<PriceAlertSubscriptionResponse[]> {
    const headers = this.getAuthHeaders();
    const currentUserId = this.authService.currentUser?.userId;

    return this.http.get<PriceAlertSubscriptionResponse[]>(this.alertsUrl, { headers }).pipe(
      tap(backendList => {
        if (backendList && backendList.length > 0) {
          this.saveAlertsToStorage(backendList);
        }
      }),
      catchError(() => {
        const list = this.loadAlertsFromStorage();
        if (currentUserId) {
          return of(list.filter(a => a.userId === currentUserId || !a.userId));
        }
        return of(list);
      })
    );
  }

  // ─── 5. GET /api/prices/alerts/{id} ───────────────────────────────────────
  public getAlertById(id: number): Observable<PriceAlertSubscriptionResponse | null> {
    const headers = this.getAuthHeaders();
    return this.http.get<PriceAlertSubscriptionResponse>(`${this.alertsUrl}/${id}`, { headers }).pipe(
      catchError(() => {
        const list = this.loadAlertsFromStorage();
        const found = list.find(a => a.id === id);
        return of(found || null);
      })
    );
  }

  // ─── 6. PUT /api/prices/alerts/{id} ───────────────────────────────────────
  public updateAlert(id: number, request: PriceAlertSubscriptionRequest): Observable<PriceAlertSubscriptionResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<PriceAlertSubscriptionResponse>(`${this.alertsUrl}/${id}`, request, { headers }).pipe(
      tap(updated => {
        const list = this.loadAlertsFromStorage().map(a => a.id === id ? updated : a);
        this.saveAlertsToStorage(list);
      }),
      catchError(() => {
        const list = this.loadAlertsFromStorage();
        const existing = list.find(a => a.id === id);
        if (existing) {
          const updated: PriceAlertSubscriptionResponse = {
            ...existing,
            cropName: request.cropName,
            targetPrice: request.targetPrice,
            priceCondition: request.priceCondition,
            district: request.district,
            state: request.state,
            unit: request.unit || existing.unit,
            active: request.active ?? existing.active,
            updatedAt: new Date().toISOString()
          };
          this.saveAlertsToStorage(list.map(a => a.id === id ? updated : a));
          return of(updated);
        }
        return of(list[0]);
      })
    );
  }

  // ─── 7. DELETE /api/prices/alerts/{id} ────────────────────────────────────
  public deleteAlert(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.alertsUrl}/${id}`, { headers }).pipe(
      tap(() => {
        const list = this.loadAlertsFromStorage().filter(a => a.id !== id);
        this.saveAlertsToStorage(list);
      }),
      catchError(() => {
        const list = this.loadAlertsFromStorage().filter(a => a.id !== id);
        this.saveAlertsToStorage(list);
        return of(void 0);
      })
    );
  }

  // ─── 8. PATCH /api/prices/alerts/{id}/activate ────────────────────────────
  public activateAlert(id: number): Observable<PriceAlertSubscriptionResponse> {
    const headers = this.getAuthHeaders();
    return this.http.patch<PriceAlertSubscriptionResponse>(`${this.alertsUrl}/${id}/activate`, {}, { headers }).pipe(
      tap(res => {
        const list = this.loadAlertsFromStorage().map(a => a.id === id ? res : a);
        this.saveAlertsToStorage(list);
      }),
      catchError(() => {
        const list = this.loadAlertsFromStorage();
        const existing = list.find(a => a.id === id);
        if (existing) {
          existing.active = true;
          existing.updatedAt = new Date().toISOString();
          this.saveAlertsToStorage(list);
          return of({ ...existing });
        }
        return of(list[0]);
      })
    );
  }

  // ─── 9. PATCH /api/prices/alerts/{id}/deactivate ──────────────────────────
  public deactivateAlert(id: number): Observable<PriceAlertSubscriptionResponse> {
    const headers = this.getAuthHeaders();
    return this.http.patch<PriceAlertSubscriptionResponse>(`${this.alertsUrl}/${id}/deactivate`, {}, { headers }).pipe(
      tap(res => {
        const list = this.loadAlertsFromStorage().map(a => a.id === id ? res : a);
        this.saveAlertsToStorage(list);
      }),
      catchError(() => {
        const list = this.loadAlertsFromStorage();
        const existing = list.find(a => a.id === id);
        if (existing) {
          existing.active = false;
          existing.updatedAt = new Date().toISOString();
          this.saveAlertsToStorage(list);
          return of({ ...existing });
        }
        return of(list[0]);
      })
    );
  }
}
