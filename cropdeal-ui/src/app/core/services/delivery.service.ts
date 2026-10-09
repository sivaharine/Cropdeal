import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { Delivery } from '../models/delivery.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private baseUrl = `${environment.apiUrl}/deliveries`;
  private readonly DELIVERIES_KEY = 'cropdeal_active_deliveries';

  private deliveriesSubject = new BehaviorSubject<Delivery[]>(this.loadStoredDeliveries());
  public deliveries$ = this.deliveriesSubject.asObservable();

  constructor(private http: HttpClient) {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === this.DELIVERIES_KEY) {
          this.refreshDeliveries();
        }
      });
    }
    this.refreshFromBackend();
  }

  refreshDeliveries(): Delivery[] {
    const list = this.loadStoredDeliveries();
    this.deliveriesSubject.next(list);
    return list;
  }

  refreshFromBackend(): void {
    this.http.get<any[]>(this.baseUrl).pipe(
      catchError(() => of([]))
    ).subscribe(serverItems => {
      if (serverItems && serverItems.length > 0) {
        const mapped = serverItems.map(d => this.mapBackendDelivery(d));
        // Merge with existing
        const existing = this.loadStoredDeliveries();
        const merged = [...mapped];
        existing.forEach(e => {
          if (!merged.some(m => String(m.id) === String(e.id) || String(m.orderId) === String(e.orderId))) {
            merged.push(e);
          }
        });
        this.saveDeliveries(merged);
      }
    });
  }

  getAllDeliveries(): Observable<Delivery[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map(res => {
        if (res && res.length > 0) {
          const mapped = res.map(d => this.mapBackendDelivery(d));
          this.saveDeliveries(mapped);
          return mapped;
        }
        return this.deliveriesSubject.value;
      }),
      catchError(() => of(this.deliveriesSubject.value))
    );
  }

  getDeliveryPool(): Observable<Delivery[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pool`).pipe(
      map((res) => {
        if (res && res.length > 0) {
          const mapped = res.map(d => this.mapBackendDelivery(d));
          return mapped;
        }
        return this.deliveriesSubject.value.filter(d => d.status === 'PENDING_ASSIGNMENT' || d.status === 'AVAILABLE_FOR_PICKUP');
      }),
      catchError(() => {
        return of(this.deliveriesSubject.value.filter(d => d.status === 'PENDING_ASSIGNMENT' || d.status === 'AVAILABLE_FOR_PICKUP'));
      })
    );
  }

  getDeliveriesByPartner(partnerId: string): Observable<Delivery[]> {
    const numericId = parseInt(String(partnerId || '').replace(/\D/g, ''), 10) || 3;
    return this.http.get<any[]>(`${this.baseUrl}/agent/${numericId}`).pipe(
      map(res => {
        if (res && res.length > 0) {
          return res.map(d => this.mapBackendDelivery(d));
        }
        return this.deliveriesSubject.value.filter(d => d.partnerId === partnerId || d.status === 'ASSIGNED' || d.status === 'IN_TRANSIT' || d.status === 'PICKED_UP' || d.status === 'DELIVERED');
      }),
      catchError(() => {
        return of(this.deliveriesSubject.value.filter(d => d.partnerId === partnerId || d.status === 'ASSIGNED' || d.status === 'IN_TRANSIT' || d.status === 'PICKED_UP' || d.status === 'DELIVERED'));
      })
    );
  }

  getDeliveryByOrder(orderId: string): Observable<Delivery | undefined> {
    const cleanId = String(orderId || '').trim();
    const numericId = parseInt(cleanId.replace(/\D/g, ''), 10);
    if (numericId) {
      return this.http.get<any>(`${this.baseUrl}/order/${numericId}`).pipe(
        map(d => d ? this.mapBackendDelivery(d) : this.findLocalDelivery(cleanId)),
        catchError(() => of(this.findLocalDelivery(cleanId)))
      );
    }
    return of(this.findLocalDelivery(cleanId));
  }

  private findLocalDelivery(cleanId: string): Delivery | undefined {
    return this.deliveriesSubject.value.find(d => {
      const dId = String(d.orderId || '').trim();
      return dId === cleanId ||
             ('ORD-' + dId) === cleanId ||
             dId === ('ORD-' + cleanId) ||
             dId.replace('ORD-', '') === cleanId.replace('ORD-', '');
    });
  }

  claimDelivery(deliveryId: string, partnerId: string, partnerName: string): Observable<Delivery> {
    const cleanId = parseInt(String(deliveryId || '').replace(/\D/g, ''), 10) || 1;
    const numericPartner = parseInt(String(partnerId || '').replace(/\D/g, ''), 10) || 3;

    return this.http.post<any>(`${this.baseUrl}/${cleanId}/claim?deliveryAgentId=${numericPartner}`, {}).pipe(
      map(res => {
        const mapped = this.mapBackendDelivery(res);
        this.updateLocalDelivery(mapped);
        return mapped;
      }),
      catchError(() => {
        const list = [...this.deliveriesSubject.value];
        const index = list.findIndex(d => d.id === deliveryId);
        if (index !== -1) {
          list[index] = {
            ...list[index],
            partnerId,
            partnerName,
            status: 'ASSIGNED',
            updatedAt: new Date().toISOString()
          };
          this.saveDeliveries(list);
          return of(list[index]);
        }
        return of(list[0] || ({} as Delivery));
      })
    );
  }

  updateDeliveryStatus(deliveryId: string, status: 'PENDING_ASSIGNMENT' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED'): Observable<Delivery> {
    const cleanId = parseInt(String(deliveryId || '').replace(/\D/g, ''), 10) || 1;
    const backendStatus = status === 'PENDING_ASSIGNMENT' ? 'AVAILABLE_FOR_PICKUP' : status;

    return this.http.put<any>(`${this.baseUrl}/${cleanId}/status`, { status: backendStatus, notes: 'Updated from portal' }).pipe(
      map(res => {
        const mapped = this.mapBackendDelivery(res);
        this.updateLocalDelivery(mapped);
        return mapped;
      }),
      catchError(() => {
        const list = [...this.deliveriesSubject.value];
        const index = list.findIndex(d => d.id === deliveryId);
        if (index !== -1) {
          list[index] = {
            ...list[index],
            status,
            updatedAt: new Date().toISOString()
          };
          this.saveDeliveries(list);
          return of(list[index]);
        }
        return of(list[0] || ({} as Delivery));
      })
    );
  }

  createDelivery(delivery: Partial<Delivery>): Observable<Delivery> {
    const fee = (delivery.distanceKm || 10) * 10;
    const orderNum = parseInt(String(delivery.orderId || '').replace(/\D/g, ''), 10) || Math.floor(1000 + Math.random() * 9000);
    const agentNum = delivery.partnerId ? parseInt(String(delivery.partnerId).replace(/\D/g, ''), 10) : null;

    const newDelivery: Delivery = {
      id: 'DEL-' + orderNum,
      orderId: delivery.orderId || 'ORD-' + orderNum,
      dealerId: delivery.dealerId || null as any,
      farmerId: delivery.farmerId || null as any,
      partnerId: delivery.partnerId || null as any,
      partnerName: delivery.partnerName || null as any,
      cropName: delivery.cropName || null as any,
      cropQuantity: delivery.cropQuantity != null ? delivery.cropQuantity : null as any,
      cropUnit: delivery.cropUnit || null as any,
      farmerName: delivery.farmerName || null as any,
      farmerPhone: delivery.farmerPhone || null as any,
      pickupAddress: delivery.pickupAddress || null as any,
      dealerName: delivery.dealerName || null as any,
      dealerPhone: delivery.dealerPhone || null as any,
      dropAddress: delivery.dropAddress || null as any,
      distanceKm: delivery.distanceKm || 15,
      deliveryFee: delivery.deliveryFee !== undefined ? delivery.deliveryFee : fee,
      fulfillmentType: delivery.fulfillmentType || 'DELIVERY_AGENT',
      status: delivery.fulfillmentType === 'SELF_PICKUP' ? 'DELIVERED' : (delivery.status || 'PENDING_ASSIGNMENT'),
      trackingNumber: 'TRK-IN-' + Math.floor(10000 + Math.random() * 90000),
      updatedAt: new Date().toISOString()
    };

    // Save locally
    const list = [newDelivery, ...this.deliveriesSubject.value];
    this.saveDeliveries(list);

    // Call backend
    if (delivery.fulfillmentType === 'SELF_PICKUP') {
      return this.http.post<any>(`${this.baseUrl}/self-pickup?orderId=${orderNum}&pickupAddress=${encodeURIComponent(newDelivery.pickupAddress || 'Farm Gate')}`, {}).pipe(
        map(res => {
          const mapped = this.mapBackendDelivery(res);
          this.updateLocalDelivery(mapped);
          return mapped;
        }),
        catchError(() => of(newDelivery))
      );
    } else {
      const payload = {
        orderId: orderNum,
        deliveryAgentId: agentNum,
        pickupAddress: newDelivery.pickupAddress || null,
        deliveryAddress: newDelivery.dropAddress || null,
        dealerId: delivery.dealerId ? parseInt(String(delivery.dealerId).replace(/\D/g, ''), 10) : null,
        dealerName: delivery.dealerName || null,
        dealerPhone: delivery.dealerPhone || null,
        farmerId: delivery.farmerId ? parseInt(String(delivery.farmerId).replace(/\D/g, ''), 10) : null,
        farmerName: delivery.farmerName || null,
        farmerPhone: delivery.farmerPhone || null,
        cropName: delivery.cropName || null,
        cropQuantity: delivery.cropQuantity != null ? delivery.cropQuantity : null,
        cropUnit: delivery.cropUnit || null
      };

      return this.http.post<any>(this.baseUrl, payload).pipe(
        map(res => {
          const mapped = this.mapBackendDelivery(res);
          this.updateLocalDelivery(mapped);
          return mapped;
        }),
        catchError(() => of(newDelivery))
      );
    }
  }

  private updateLocalDelivery(del: Delivery): void {
    const list = [...this.deliveriesSubject.value];
    const idx = list.findIndex(d => String(d.id) === String(del.id) || String(d.orderId) === String(del.orderId));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...del };
    } else {
      list.unshift(del);
    }
    this.saveDeliveries(list);
  }

  private saveDeliveries(list: Delivery[]): void {
    localStorage.setItem(this.DELIVERIES_KEY, JSON.stringify(list));
    this.deliveriesSubject.next(list);
  }

  private mapBackendDelivery(d: any): Delivery {
    const delId = d.deliveryId || d.id;
    return {
      id: delId ? 'DEL-' + delId : 'DEL-101',
      orderId: d.orderId ? 'ORD-' + d.orderId : 'ORD-1001',
      partnerId: d.deliveryAgentId ? String(d.deliveryAgentId) : undefined,
      partnerName: d.deliveryAgentName || null,
      cropName: d.cropName != null ? d.cropName : null,
      cropQuantity: d.cropQuantity != null ? Number(d.cropQuantity) : null as any,
      cropUnit: d.cropUnit != null ? d.cropUnit : null,
      farmerId: d.farmerId ? String(d.farmerId) : null,
      farmerName: d.farmerName != null ? d.farmerName : null,
      farmerPhone: d.farmerPhone != null ? d.farmerPhone : null,
      dealerId: d.dealerId ? String(d.dealerId) : null,
      dealerName: d.dealerName != null ? d.dealerName : null,
      dealerPhone: d.dealerPhone != null ? d.dealerPhone : null,
      pickupAddress: d.pickupAddress != null ? d.pickupAddress : null,
      dropAddress: d.deliveryAddress || d.dropAddress || null,
      status: d.status === 'AVAILABLE_FOR_PICKUP' ? 'PENDING_ASSIGNMENT' : (d.status || 'PENDING_ASSIGNMENT'),
      deliveryFee: d.deliveryFee ? Number(d.deliveryFee) : 250,
      fulfillmentType: d.fulfillmentType || 'DELIVERY_AGENT',
      trackingNumber: 'TRK-' + (delId || Math.floor(1000 + Math.random() * 9000)),
      updatedAt: d.updatedAt || d.createdAt || new Date().toISOString()
    };
  }

  private loadStoredDeliveries(): Delivery[] {
    const raw = localStorage.getItem(this.DELIVERIES_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }

    return [];
  }
}
