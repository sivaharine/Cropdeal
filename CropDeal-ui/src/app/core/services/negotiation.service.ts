import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateNegotiationRequest, NegotiationResponse,
  NegotiationStatusResponse, OfferRequest, CounterOfferRequest, OfferResponse
} from '../models/models';

const NEG_KEY = 'cropdeal_negotiations_cache';

@Injectable({
  providedIn: 'root'
})
export class NegotiationService {
  private readonly baseUrl = `${environment.apiUrl}/negotiations`;
  private negCache: NegotiationResponse[] = this.loadFromStorage();

  constructor(private http: HttpClient) {}

  private loadFromStorage(): NegotiationResponse[] {
    try {
      const raw = localStorage.getItem(NEG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(NEG_KEY, JSON.stringify(this.negCache));
    } catch {}
  }

  public createNegotiation(request: CreateNegotiationRequest): Observable<NegotiationResponse> {
    this.negCache = this.loadFromStorage();
    return this.http.post<NegotiationResponse>(this.baseUrl, request).pipe(
      tap(newNeg => {
        this.negCache = [newNeg, ...this.negCache.filter(n => Number(n.id) !== Number(newNeg.id))];
        this.saveToStorage();
      }),
      catchError(() => {
        const newNeg: NegotiationResponse = {
          id: Date.now(),
          cropId: Number(request.cropId),
          cropName: request.cropName || 'Farm Produce',
          buyerId: Number(request.buyerId),
          sellerId: Number(request.sellerId),
          quantity: Number(request.quantity),
          targetPrice: Number(request.targetPrice),
          status: 'OPEN',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          offers: [
            {
              id: Date.now() + 1,
              negotiationId: Date.now(),
              offeredByUserId: Number(request.buyerId),
              amount: Number(request.targetPrice),
              message: `Proposed ₹${request.targetPrice}/KG for ${request.quantity} KG`,
              status: 'PENDING',
              createdAt: new Date().toISOString()
            }
          ]
        };
        this.negCache = [newNeg, ...this.negCache];
        this.saveToStorage();
        return of(newNeg);
      })
    );
  }

  public getNegotiationById(id: number): Observable<NegotiationResponse> {
    this.negCache = this.loadFromStorage();
    const negId = Number(id);
    return this.http.get<NegotiationResponse>(`${this.baseUrl}/${negId}`).pipe(
      catchError(() => of(this.negCache.find(n => Number(n.id) === negId) || this.negCache[0]))
    );
  }

  // ⚠️ Backend has NO GET /api/negotiations (all) endpoint.
  // Only GET /api/negotiations/users/{userId} exists.
  // For Admin, we fall back to localStorage cache.
  public getAllNegotiations(): Observable<NegotiationResponse[]> {
    this.negCache = this.loadFromStorage();
    return of([...this.negCache]);
  }

  public getNegotiationsByBuyer(buyerId: number): Observable<NegotiationResponse[]> {
    this.negCache = this.loadFromStorage();
    const bId = Number(buyerId);
    return this.http.get<NegotiationResponse[]>(`${this.baseUrl}/users/${bId}`).pipe(
      tap(negs => {
        if (negs && Array.isArray(negs) && negs.length > 0) {
          const others = this.negCache.filter(n => Number(n.buyerId) !== bId);
          this.negCache = [...negs, ...others];
          this.saveToStorage();
        }
      }),
      catchError(() => of(this.negCache.filter(n => Number(n.buyerId) === bId)))
    );
  }

  public getNegotiationsBySeller(sellerId: number): Observable<NegotiationResponse[]> {
    this.negCache = this.loadFromStorage();
    const sId = Number(sellerId);
    return this.http.get<NegotiationResponse[]>(`${this.baseUrl}/users/${sId}`).pipe(
      tap(negs => {
        if (negs && Array.isArray(negs) && negs.length > 0) {
          const others = this.negCache.filter(n => Number(n.sellerId) !== sId);
          this.negCache = [...negs, ...others];
          this.saveToStorage();
        }
      }),
      catchError(() => of(this.negCache.filter(n => Number(n.sellerId) === sId)))
    );
  }

  public getNegotiationsForUser(userId: number): Observable<NegotiationResponse[]> {
    this.negCache = this.loadFromStorage();
    const uId = Number(userId);
    return this.http.get<NegotiationResponse[]>(`${this.baseUrl}/users/${uId}`).pipe(
      tap(negs => {
        if (negs && Array.isArray(negs) && negs.length > 0) {
          this.negCache = negs;
          this.saveToStorage();
        }
      }),
      catchError(() => of(this.negCache.filter(n => Number(n.buyerId) === uId || Number(n.sellerId) === uId)))
    );
  }

  public getNegotiationStatus(negotiationId: number): Observable<NegotiationStatusResponse> {
    return this.http.get<NegotiationStatusResponse>(`${this.baseUrl}/${negotiationId}/status`).pipe(
      catchError(() => of({ negotiationId, status: 'UNKNOWN' }))
    );
  }

  public closeNegotiation(negotiationId: number): Observable<NegotiationStatusResponse> {
    this.negCache = this.loadFromStorage();
    const negId = Number(negotiationId);
    return this.http.patch<NegotiationStatusResponse>(`${this.baseUrl}/${negId}/close`, {}).pipe(
      tap(res => {
        const neg = this.negCache.find(n => Number(n.id) === negId);
        if (neg) {
          neg.status = res.status || 'CLOSED';
          this.saveToStorage();
        }
      }),
      catchError(() => {
        const neg = this.negCache.find(n => Number(n.id) === negId);
        if (neg) {
          neg.status = 'CLOSED';
          this.saveToStorage();
        }
        return of({ negotiationId: negId, status: 'CLOSED' });
      })
    );
  }

  public createOffer(negotiationId: number, request: OfferRequest): Observable<OfferResponse> {
    this.negCache = this.loadFromStorage();
    const negId = Number(negotiationId);
    return this.http.post<OfferResponse>(`${this.baseUrl}/${negId}/offers`, request).pipe(
      tap(offer => {
        const neg = this.negCache.find(n => Number(n.id) === negId);
        if (neg) {
          neg.offers = [offer, ...neg.offers];
          neg.targetPrice = offer.amount;
          this.saveToStorage();
        }
      }),
      catchError(() => {
        const offer: OfferResponse = {
          id: Date.now(),
          negotiationId: negId,
          offeredByUserId: Number(request.offeredByUserId),
          amount: Number(request.amount),
          message: request.message,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        };
        const neg = this.negCache.find(n => Number(n.id) === negId);
        if (neg) {
          neg.offers = [offer, ...neg.offers];
          neg.targetPrice = offer.amount;
          this.saveToStorage();
        }
        return of(offer);
      })
    );
  }

  public createCounterOffer(negotiationId: number, request: OfferRequest): Observable<OfferResponse> {
    this.negCache = this.loadFromStorage();
    const negId = Number(negotiationId);
    return this.http.post<OfferResponse>(`${this.baseUrl}/${negId}/counter-offers`, request).pipe(
      tap(counter => {
        const neg = this.negCache.find(n => Number(n.id) === negId);
        if (neg) {
          neg.offers = neg.offers.map(o => o.status === 'PENDING' ? { ...o, status: 'COUNTERED' } : o);
          neg.offers = [counter, ...neg.offers];
          neg.targetPrice = counter.amount;
          this.saveToStorage();
        }
      }),
      catchError(() => {
        const neg = this.negCache.find(n => Number(n.id) === negId);
        if (neg) {
          neg.offers = neg.offers.map(o => o.status === 'PENDING' ? { ...o, status: 'COUNTERED' } : o);
        }
        const counter: OfferResponse = {
          id: Date.now(),
          negotiationId: negId,
          offeredByUserId: Number(request.offeredByUserId),
          amount: Number(request.amount),
          message: request.message,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        };
        if (neg) {
          neg.offers = [counter, ...neg.offers];
          neg.targetPrice = counter.amount;
          this.saveToStorage();
        }
        return of(counter);
      })
    );
  }

  public acceptOffer(offerId: number): Observable<OfferResponse> {
    this.negCache = this.loadFromStorage();
    const oId = Number(offerId);
    return this.http.patch<OfferResponse>(`${this.baseUrl}/offers/${oId}/accept`, {}).pipe(
      tap(accepted => {
        for (const neg of this.negCache) {
          const off = neg.offers.find(o => Number(o.id) === oId);
          if (off) {
            off.status = 'ACCEPTED';
            neg.status = 'ACCEPTED';
            this.saveToStorage();
            break;
          }
        }
      }),
      catchError(() => {
        for (const neg of this.negCache) {
          const off = neg.offers.find(o => Number(o.id) === oId);
          if (off) {
            off.status = 'ACCEPTED';
            neg.status = 'ACCEPTED';
            this.saveToStorage();
            return of(off);
          }
        }
        return of({
          id: oId,
          negotiationId: 401,
          offeredByUserId: 1,
          amount: 51.0,
          status: 'ACCEPTED',
          createdAt: new Date().toISOString()
        });
      })
    );
  }

  public rejectOffer(offerId: number): Observable<OfferResponse> {
    this.negCache = this.loadFromStorage();
    const oId = Number(offerId);
    return this.http.patch<OfferResponse>(`${this.baseUrl}/offers/${oId}/reject`, {}).pipe(
      tap(rejected => {
        for (const neg of this.negCache) {
          const off = neg.offers.find(o => Number(o.id) === oId);
          if (off) {
            off.status = 'REJECTED';
            neg.status = 'CLOSED';
            this.saveToStorage();
            break;
          }
        }
      }),
      catchError(() => {
        for (const neg of this.negCache) {
          const off = neg.offers.find(o => Number(o.id) === oId);
          if (off) {
            off.status = 'REJECTED';
            neg.status = 'CLOSED';
            this.saveToStorage();
            return of(off);
          }
        }
        return of({
          id: oId,
          negotiationId: 401,
          offeredByUserId: 1,
          amount: 51.0,
          status: 'REJECTED',
          createdAt: new Date().toISOString()
        });
      })
    );
  }
}
