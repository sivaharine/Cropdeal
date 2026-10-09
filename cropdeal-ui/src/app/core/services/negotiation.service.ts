import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Negotiation, NegotiationRequest } from '../models/negotiation.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NegotiationService {
  private baseUrl = `${environment.apiUrl}/negotiations`;
  private readonly NEGOTIATIONS_KEY = 'cropdeal_negotiations_data';

  constructor(private http: HttpClient) {}

  private addLocalNegotiation(item: any): void {
    try {
      const raw = localStorage.getItem(this.NEGOTIATIONS_KEY);
      let list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
      const idx = list.findIndex((x: any) => String(x.id) === String(item.id));
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...item };
      } else {
        list.unshift(item);
      }
      localStorage.setItem(this.NEGOTIATIONS_KEY, JSON.stringify(list));
    } catch {}
  }

  private updateLocalNegotiation(id: string | number, updates: any): void {
    try {
      const raw = localStorage.getItem(this.NEGOTIATIONS_KEY);
      if (raw) {
        let list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const idx = list.findIndex((x: any) => String(x.id) === String(id));
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...updates };
            localStorage.setItem(this.NEGOTIATIONS_KEY, JSON.stringify(list));
          }
        }
      }
    } catch {}
  }

  getNegotiationsByUser(userId: string): Observable<Negotiation[]> {
    const cleanId = parseInt(String(userId || '').replace(/\D/g, ''), 10) || 1;
    return this.http.get<any[]>(`${this.baseUrl}/users/${cleanId}`).pipe(
      map(list => {
        if (!list || list.length === 0) return [];
        return list.map(item => this.mapBackendNegotiation(item));
      }),
      catchError(() => of([]))
    );
  }

  getAllNegotiations(): Observable<Negotiation[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map(list => {
        if (!list || list.length === 0) return [];
        return list.map(item => this.mapBackendNegotiation(item));
      }),
      catchError(() => of([]))
    );
  }

  createNegotiation(req: NegotiationRequest): Observable<Negotiation> {
    const cropId = parseInt(String(req.cropId || '').replace(/\D/g, ''), 10) || 101;
    const buyerId = parseInt(String(req.dealerId || '').replace(/\D/g, ''), 10) || 2;
    const sellerId = parseInt(String(req.farmerId || '').replace(/\D/g, ''), 10) || 1;
    const qty = Number(req.quantity || 100);
    const targetPrice = Number(req.offeredPrice || 50);

    const localItem = {
      id: 'neg-' + Date.now(),
      cropId: String(cropId),
      cropName: req.cropName || 'Fresh Harvest Produce',
      farmerId: String(sellerId),
      farmerName: req.farmerName || ('Farmer Partner #' + sellerId),
      dealerId: String(buyerId),
      dealerName: req.dealerName || ('Dealer Partner #' + buyerId),
      standardPrice: req.originalPrice || (targetPrice + 5),
      originalPrice: req.originalPrice || (targetPrice + 5),
      expectedCounter: targetPrice,
      offeredPrice: targetPrice,
      currentCounter: targetPrice,
      quantity: qty + ' Kg',
      numericQty: qty,
      unit: 'Kg',
      status: 'WAITING',
      statusText: 'Waiting for response',
      lastActionBy: 'DEALER',
      notes: req.notes,
      updatedAt: new Date().toISOString()
    };
    this.addLocalNegotiation(localItem);

    const backendPayload = {
      cropId: cropId,
      buyerId: buyerId,
      sellerId: sellerId,
      quantity: qty,
      targetPrice: targetPrice,
      cropName: req.cropName || 'Fresh Harvest Produce',
      buyerName: req.dealerName || null,
      sellerName: req.farmerName || null
    };

    return this.http.post<any>(this.baseUrl, backendPayload).pipe(
      map(res => {
        const mapped = this.mapBackendNegotiation(res);
        this.addLocalNegotiation(mapped);
        return mapped;
      }),
      catchError(() => of(localItem as any as Negotiation))
    );
  }

  counterOffer(negotiationId: string | number, counterPrice: number, notes?: string, actorId: number = 1): Observable<any> {
    const cleanId = parseInt(String(negotiationId || '').replace(/\D/g, ''), 10) || 1;
    const actor = actorId === 1 ? 'Farmer' : 'Dealer';
    this.updateLocalNegotiation(negotiationId, {
      status: 'COUNTERED',
      statusText: `${actor} Countered`,
      currentCounter: counterPrice,
      currentParty: actor,
      lastCounterBy: actor
    });

    const payload = {
      offeredBy: actorId,
      counterPrice: counterPrice,
      notes: notes || 'Counter proposal'
    };

    return this.http.post<any>(`${this.baseUrl}/${cleanId}/counter`, payload).pipe(
      catchError(() => of({ id: negotiationId, currentOfferPrice: counterPrice }))
    );
  }

  acceptOffer(negotiationId: string | number): Observable<any> {
    const cleanId = parseInt(String(negotiationId || '').replace(/\D/g, ''), 10) || 1;
    this.updateLocalNegotiation(negotiationId, {
      status: 'ACCEPTED',
      statusText: 'Accepted'
    });

    return this.http.patch<any>(`${this.baseUrl}/${cleanId}/accept`, {}).pipe(
      catchError(() => of({ id: negotiationId, status: 'ACCEPTED' }))
    );
  }

  rejectOffer(negotiationId: string | number): Observable<any> {
    const cleanId = parseInt(String(negotiationId || '').replace(/\D/g, ''), 10) || 1;
    this.updateLocalNegotiation(negotiationId, {
      status: 'REJECTED',
      statusText: 'Rejected'
    });

    return this.http.patch<any>(`${this.baseUrl}/${cleanId}/reject`, {}).pipe(
      catchError(() => of({ id: negotiationId, status: 'REJECTED' }))
    );
  }

  private mapBackendNegotiation(item: any): Negotiation {
    let latestOffer = item.targetPrice;
    if (item.offers && item.offers.length > 0) {
      latestOffer = item.offers[item.offers.length - 1].amount || item.targetPrice;
    }
    return {
      id: String(item.id),
      cropId: String(item.cropId),
      cropName: item.cropName || ('Farm Crop Lot #' + item.cropId),
      farmerId: String(item.sellerId),
      farmerName: item.sellerName || ('Farmer Partner #' + item.sellerId),
      dealerId: String(item.buyerId),
      dealerName: item.buyerName || ('Dealer Partner #' + item.buyerId),
      originalPrice: Number(item.targetPrice) + 5,
      offeredPrice: Number(item.targetPrice),
      counterPrice: Number(latestOffer),
      quantity: Number(item.quantity),
      status: item.status === 'OPEN' ? 'PENDING' : item.status,
      lastActionBy: 'DEALER',
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString()
    };
  }
}
