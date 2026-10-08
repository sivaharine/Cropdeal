import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CropResponse,
  CropSearchResponse,
  CreateCropRequest,
  SubscriptionRequest,
  SubscriptionResponse,
  BuyingRequestCreateDto,
  BuyingRequestResponseDto,
  QuantityUpdateRequest
} from '../models/models';
import { NotificationService } from './notification.service';

const STORAGE_KEY = 'cropdeal_crops_cache';
const BUYING_REQ_KEY = 'cropdeal_buying_requests_cache';
const SUBS_KEY = 'cropdeal_subscriptions_cache';

@Injectable({ providedIn: 'root' })
export class CropService {
  private readonly baseUrl = `${environment.apiUrl}/crops`;
  private readonly subUrl = `${environment.apiUrl}/subscriptions`;
  private readonly buyingReqUrl = `${environment.apiUrl}/crops/buying-requests`;

  private cropsCache: CropResponse[] = this.loadFromStorage(STORAGE_KEY);
  private buyingRequestsCache: BuyingRequestResponseDto[] = this.loadFromStorage(BUYING_REQ_KEY);
  private subscriptionsCache: SubscriptionResponse[] = this.loadFromStorage(SUBS_KEY);

  constructor(private http: HttpClient, private notifService: NotificationService) {}

  // ── Persistence helpers ───────────────────────────────────────
  private loadFromStorage<T>(key: string): T[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch { /* quota exceeded — ignore */ }
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. CROP LISTING & SEARCH ENDPOINTS (/api/crops)
  // ═══════════════════════════════════════════════════════════════

  /** GET /api/crops/search — all crops (or filtered by query params) */
  public getAllCrops(): Observable<CropResponse[]> {
    return this.http.get<CropResponse[]>(`${this.baseUrl}/search`).pipe(
      tap(crops => {
        if (crops && crops.length > 0) {
          this.cropsCache = crops;
          this.saveToStorage(STORAGE_KEY, this.cropsCache);
        }
      }),
      catchError(() => of([...this.cropsCache]))
    );
  }

  /** GET /api/crops/search with query parameters */
  public searchCrops(filters: { commodity?: string; state?: string; district?: string; grade?: string }): Observable<CropSearchResponse[]> {
    let params = new HttpParams();
    if (filters.commodity && filters.commodity !== 'All Commodities') params = params.set('commodity', filters.commodity);
    if (filters.state && filters.state !== 'All States') params = params.set('state', filters.state);
    if (filters.district) params = params.set('district', filters.district);
    if (filters.grade && filters.grade !== 'All Grades') params = params.set('grade', filters.grade);

    return this.http.get<CropSearchResponse[]>(`${this.baseUrl}/search`, { params }).pipe(
      catchError(() => {
        // Fallback filter over local cache
        const filtered = this.cropsCache.filter(c => {
          const matchComm = !filters.commodity || filters.commodity === 'All Commodities' ||
            c.commodity.toLowerCase().includes(filters.commodity.toLowerCase());
          const matchState = !filters.state || filters.state === 'All States' ||
            c.state.toLowerCase() === filters.state.toLowerCase();
          const matchDist = !filters.district ||
            c.district.toLowerCase().includes(filters.district.toLowerCase());
          const matchGrade = !filters.grade || filters.grade === 'All Grades' ||
            c.grade.toUpperCase() === filters.grade.toUpperCase();
          return matchComm && matchState && matchDist && matchGrade;
        });
        return of(filtered as CropSearchResponse[]);
      })
    );
  }

  /** GET /api/crops/nearby or GET /api/crops/products/nearby */
  public getNearbyCrops(filters: { state?: string; district?: string; commodity?: string; grade?: string }): Observable<CropSearchResponse[]> {
    let params = new HttpParams();
    if (filters.state) params = params.set('state', filters.state);
    if (filters.district) params = params.set('district', filters.district);
    if (filters.commodity) params = params.set('commodity', filters.commodity);
    if (filters.grade) params = params.set('grade', filters.grade);

    return this.http.get<CropSearchResponse[]>(`${this.baseUrl}/nearby`, { params }).pipe(
      catchError(() => {
        // Fallback search nearby
        const filtered = this.cropsCache.filter(c => {
          const matchState = !filters.state || c.state.toLowerCase() === filters.state.toLowerCase();
          const matchDist = !filters.district || c.district.toLowerCase() === filters.district.toLowerCase();
          return matchState || matchDist;
        });
        return of(filtered as CropSearchResponse[]);
      })
    );
  }

  /** GET /api/crops/nearby?state=...&district=...&commodity=...&grade=... */
  public getNearbyProducts(
    state?: string,
    district?: string,
    commodity?: string,
    grade?: string
  ): Observable<CropSearchResponse[]> {
    let params = new HttpParams();
    if (state) params = params.set('state', state);
    if (district) params = params.set('district', district);
    if (commodity) params = params.set('commodity', commodity);
    if (grade) params = params.set('grade', grade);

    return this.http.get<CropSearchResponse[]>(`${this.baseUrl}/nearby`, { params }).pipe(
      catchError(() => {
        // Fallback to search endpoint
        return this.http.get<CropSearchResponse[]>(`${this.baseUrl}/search`, { params }).pipe(
          catchError(() => of([...this.cropsCache
            .filter(c =>
              (!state || (c.state || '').toLowerCase().includes(state.toLowerCase())) &&
              (!district || (c.district || '').toLowerCase().includes(district.toLowerCase()))
            )
            .map(c => ({
              id: c.id,
              commodity: c.commodity,
              state: c.state,
              district: c.district,
              grade: c.grade,
              quantity: c.quantity,
              unit: c.unit || 'KG',
              pricePerKg: c.pricePerKg,
              status: c.status || 'AVAILABLE'
            }))
          ]))
        );
      })
    );
  }

  /** GET /api/crops/farmer/{farmerId} */
  public getCropsByFarmer(farmerId: number): Observable<CropResponse[]> {
    return this.http.get<CropResponse[]>(`${this.baseUrl}/farmer/${farmerId}`).pipe(
      tap(crops => {
        if (crops && crops.length > 0) {
          const otherFarmerCrops = this.cropsCache.filter(c => c.farmerId !== farmerId);
          this.cropsCache = [...otherFarmerCrops, ...crops];
          this.saveToStorage(STORAGE_KEY, this.cropsCache);
        }
      }),
      catchError(() => of(this.cropsCache.filter(c => c.farmerId === farmerId)))
    );
  }

  /** GET /api/crops/{id} */
  public getCropById(id: number): Observable<CropResponse> {
    return this.http.get<CropResponse>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => of(this.cropsCache.find(c => c.id === id) || this.cropsCache[0]))
    );
  }

  /** POST /api/crops — create new crop */
  public createCrop(request: CreateCropRequest): Observable<CropResponse> {
    return this.http.post<CropResponse>(this.baseUrl, request).pipe(
      tap(newCrop => {
        this.cropsCache = [newCrop, ...this.cropsCache];
        this.saveToStorage(STORAGE_KEY, this.cropsCache);
      }),
      catchError(() => {
        const newCrop: CropResponse = {
          id: Date.now(),
          farmerId: request.farmerId || 1,
          farmerName: request.farmerName || 'Farmer',
          commodity: request.commodity,
          state: request.state,
          district: request.district,
          grade: request.grade,
          quantity: request.quantity,
          unit: request.unit || 'KG',
          pricePerKg: request.pricePerKg,
          description: request.description,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.cropsCache = [newCrop, ...this.cropsCache];
        this.saveToStorage(STORAGE_KEY, this.cropsCache);
        return of(newCrop);
      })
    );
  }

  /** PUT /api/crops/{id} — update crop */
  public updateCrop(id: number, request: Partial<CropResponse>): Observable<CropResponse> {
    return this.http.put<CropResponse>(`${this.baseUrl}/${id}`, request).pipe(
      tap(updated => {
        this.cropsCache = this.cropsCache.map(c => c.id === id ? updated : c);
        this.saveToStorage(STORAGE_KEY, this.cropsCache);
      }),
      catchError(() => {
        const idx = this.cropsCache.findIndex(c => c.id === id);
        if (idx !== -1) {
          this.cropsCache[idx] = { ...this.cropsCache[idx], ...request, updatedAt: new Date().toISOString() };
          this.saveToStorage(STORAGE_KEY, this.cropsCache);
          return of({ ...this.cropsCache[idx] });
        }
        return of(this.cropsCache[0]);
      })
    );
  }

  /** PATCH /api/crops/{id}/quantity — reduce quantity on purchase */
  public reduceQuantity(id: number, purchasedQuantity: number): Observable<CropResponse> {
    const payload: QuantityUpdateRequest = { purchasedQuantity };
    return this.http.patch<CropResponse>(`${this.baseUrl}/${id}/quantity`, payload).pipe(
      tap(updated => {
        this.cropsCache = this.cropsCache.map(c => c.id === id ? updated : c);
        this.saveToStorage(STORAGE_KEY, this.cropsCache);
      }),
      catchError(() => {
        const crop = this.cropsCache.find(c => c.id === id);
        if (crop) {
          crop.quantity = Math.max(0, crop.quantity - purchasedQuantity);
          if (crop.quantity === 0) crop.status = 'SOLD_OUT';
          this.saveToStorage(STORAGE_KEY, this.cropsCache);
          return of({ ...crop });
        }
        return of(this.cropsCache[0]);
      })
    );
  }

  /** PATCH /api/crops/{id}/quantity/restore — restore quantity on saga order failure */
  public restoreQuantity(id: number, purchasedQuantity: number): Observable<CropResponse> {
    const payload: QuantityUpdateRequest = { purchasedQuantity };
    return this.http.patch<CropResponse>(`${this.baseUrl}/${id}/quantity/restore`, payload).pipe(
      tap(updated => {
        this.cropsCache = this.cropsCache.map(c => c.id === id ? updated : c);
        this.saveToStorage(STORAGE_KEY, this.cropsCache);
      }),
      catchError(() => {
        const crop = this.cropsCache.find(c => c.id === id);
        if (crop) {
          crop.quantity += purchasedQuantity;
          if (crop.status === 'SOLD_OUT') crop.status = 'ACTIVE';
          this.saveToStorage(STORAGE_KEY, this.cropsCache);
          return of({ ...crop });
        }
        return of(this.cropsCache[0]);
      })
    );
  }

  /** DELETE /api/crops/{id} */
  public deleteCrop(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.cropsCache = this.cropsCache.filter(c => c.id !== id);
        this.saveToStorage(STORAGE_KEY, this.cropsCache);
      }),
      catchError(() => {
        this.cropsCache = this.cropsCache.filter(c => c.id !== id);
        this.saveToStorage(STORAGE_KEY, this.cropsCache);
        return of(undefined);
      })
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. SUBSCRIPTION ENDPOINTS (/api/subscriptions)
  // ═══════════════════════════════════════════════════════════════

  /** POST /api/subscriptions — subscribe to crop alerts */
  public subscribe(request: SubscriptionRequest): Observable<SubscriptionResponse> {
    return this.http.post<SubscriptionResponse>(this.subUrl, request).pipe(
      tap(sub => {
        this.subscriptionsCache = [sub, ...this.subscriptionsCache];
        this.saveToStorage(SUBS_KEY, this.subscriptionsCache);
      }),
      catchError(() => {
        const fakeSub: SubscriptionResponse = {
          id: Date.now(),
          subscriberId: request.subscriberId,
          commodity: request.commodity,
          state: request.state,
          district: request.district,
          grade: request.grade,
          subscribedAt: new Date().toISOString()
        };
        this.subscriptionsCache = [fakeSub, ...this.subscriptionsCache];
        this.saveToStorage(SUBS_KEY, this.subscriptionsCache);
        return of(fakeSub);
      })
    );
  }

  /** DELETE /api/subscriptions/{subscriptionId}?subscriberId={subscriberId} */
  public unsubscribe(subscriptionId: number, subscriberId: number): Observable<void> {
    const params = new HttpParams().set('subscriberId', subscriberId.toString());
    return this.http.delete<void>(`${this.subUrl}/${subscriptionId}`, { params }).pipe(
      tap(() => {
        this.subscriptionsCache = this.subscriptionsCache.filter(s => s.id !== subscriptionId);
        this.saveToStorage(SUBS_KEY, this.subscriptionsCache);
      }),
      catchError(() => {
        this.subscriptionsCache = this.subscriptionsCache.filter(s => s.id !== subscriptionId);
        this.saveToStorage(SUBS_KEY, this.subscriptionsCache);
        return of(undefined);
      })
    );
  }

  /** GET /api/subscriptions/subscriber/{subscriberId} */
  public getSubscriptionsBySubscriber(subscriberId: number): Observable<SubscriptionResponse[]> {
    return this.http.get<SubscriptionResponse[]>(`${this.subUrl}/subscriber/${subscriberId}`).pipe(
      tap(subs => {
        if (subs) {
          const others = this.subscriptionsCache.filter(s => s.subscriberId !== subscriberId);
          this.subscriptionsCache = [...others, ...subs];
          this.saveToStorage(SUBS_KEY, this.subscriptionsCache);
        }
      }),
      catchError(() => of(this.subscriptionsCache.filter(s => s.subscriberId === subscriberId)))
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. DEALER BUYING REQUESTS (/api/crops/buying-requests)
  // ═══════════════════════════════════════════════════════════════

  /** POST /api/crops/buying-requests */
  public createBuyingRequest(dto: BuyingRequestCreateDto, userId?: number): Observable<BuyingRequestResponseDto> {
    let headers = new HttpHeaders();
    if (userId) {
      headers = headers.set('X-User-Id', userId.toString());
    }
    return this.http.post<BuyingRequestResponseDto>(this.buyingReqUrl, dto, { headers }).pipe(
      tap(created => {
        this.buyingRequestsCache = [created, ...this.buyingRequestsCache];
        this.saveToStorage(BUYING_REQ_KEY, this.buyingRequestsCache);
      }),
      catchError(() => {
        const fakeReq: BuyingRequestResponseDto = {
          id: Date.now(),
          dealerId: userId || dto.dealerId || 10,
          cropName: dto.cropName,
          quantity: dto.quantity,
          unit: dto.unit || 'KG',
          buyingPrice: dto.buyingPrice,
          district: dto.district,
          state: dto.state,
          notes: dto.notes,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.buyingRequestsCache = [fakeReq, ...this.buyingRequestsCache];
        this.saveToStorage(BUYING_REQ_KEY, this.buyingRequestsCache);
        return of(fakeReq);
      })
    );
  }

  /** GET /api/crops/buying-requests */
  public getActiveBuyingRequests(): Observable<BuyingRequestResponseDto[]> {
    return this.http.get<BuyingRequestResponseDto[]>(this.buyingReqUrl).pipe(
      tap(requests => {
        if (requests && requests.length > 0) {
          this.buyingRequestsCache = requests;
          this.saveToStorage(BUYING_REQ_KEY, this.buyingRequestsCache);
        }
      }),
      catchError(() => of([...this.buyingRequestsCache.filter(r => r.status === 'ACTIVE')]))
    );
  }

  /** GET /api/crops/buying-requests/dealer/{dealerId} */
  public getBuyingRequestsByDealer(dealerId: number): Observable<BuyingRequestResponseDto[]> {
    return this.http.get<BuyingRequestResponseDto[]>(`${this.buyingReqUrl}/dealer/${dealerId}`).pipe(
      tap(requests => {
        if (requests && requests.length > 0) {
          const others = this.buyingRequestsCache.filter(r => r.dealerId !== dealerId);
          this.buyingRequestsCache = [...others, ...requests];
          this.saveToStorage(BUYING_REQ_KEY, this.buyingRequestsCache);
        }
      }),
      catchError(() => of(this.buyingRequestsCache.filter(r => r.dealerId === dealerId)))
    );
  }

  /** GET /api/crops/buying-requests/{id} */
  public getBuyingRequestById(id: number): Observable<BuyingRequestResponseDto> {
    return this.http.get<BuyingRequestResponseDto>(`${this.buyingReqUrl}/${id}`).pipe(
      catchError(() => of(this.buyingRequestsCache.find(r => r.id === id) || this.buyingRequestsCache[0]))
    );
  }

  /** DELETE /api/crops/buying-requests/{id} */
  public cancelBuyingRequest(id: number, userId?: number): Observable<void> {
    let headers = new HttpHeaders();
    if (userId) {
      headers = headers.set('X-User-Id', userId.toString());
    }
    return this.http.delete<void>(`${this.buyingReqUrl}/${id}`, { headers }).pipe(
      tap(() => {
        this.buyingRequestsCache = this.buyingRequestsCache.filter(r => r.id !== id);
        this.saveToStorage(BUYING_REQ_KEY, this.buyingRequestsCache);
      }),
      catchError(() => {
        this.buyingRequestsCache = this.buyingRequestsCache.filter(r => r.id !== id);
        this.saveToStorage(BUYING_REQ_KEY, this.buyingRequestsCache);
        return of(undefined);
      })
    );
  }

  /** Clear all locally cached crops */
  public clearLocalCache(): void {
    this.cropsCache = [];
    this.buyingRequestsCache = [];
    this.subscriptionsCache = [];
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BUYING_REQ_KEY);
    localStorage.removeItem(SUBS_KEY);
  }
}
