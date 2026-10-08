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
  }

  refreshDeliveries(): Delivery[] {
    const list = this.loadStoredDeliveries();
    this.deliveriesSubject.next(list);
    return list;
  }

  getAllDeliveries(): Observable<Delivery[]> {
    return this.deliveriesSubject.asObservable();
  }

  getDeliveryPool(): Observable<Delivery[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pool`).pipe(
      map((res) => {
        if (res && res.length > 0) {
          return res.map(d => this.mapBackendDelivery(d));
        }
        return this.deliveriesSubject.value.filter(d => d.status === 'PENDING_ASSIGNMENT');
      }),
      catchError(() => {
        return of(this.deliveriesSubject.value.filter(d => d.status === 'PENDING_ASSIGNMENT'));
      })
    );
  }

  getDeliveriesByPartner(partnerId: string): Observable<Delivery[]> {
    return of(this.deliveriesSubject.value.filter(d => d.partnerId === partnerId || d.status === 'ASSIGNED' || d.status === 'IN_TRANSIT' || d.status === 'PICKED_UP' || d.status === 'DELIVERED'));
  }

  getDeliveryByOrder(orderId: string): Observable<Delivery | undefined> {
    const cleanId = String(orderId || '').trim();
    const found = this.deliveriesSubject.value.find(d => {
      const dId = String(d.orderId || '').trim();
      return dId === cleanId ||
             ('ORD-' + dId) === cleanId ||
             dId === ('ORD-' + cleanId) ||
             dId.replace('ORD-', '') === cleanId.replace('ORD-', '');
    });
    return of(found);
  }

  claimDelivery(deliveryId: string, partnerId: string, partnerName: string): Observable<Delivery> {
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
    return of(list[0]);
  }

  updateDeliveryStatus(deliveryId: string, status: 'PENDING_ASSIGNMENT' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED'): Observable<Delivery> {
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
    return of(list[0]);
  }

  createDelivery(delivery: Partial<Delivery>): Observable<Delivery> {
    const fee = (delivery.distanceKm || 10) * 10;
    const newDelivery: Delivery = {
      id: 'DEL-' + Math.floor(100 + Math.random() * 900),
      orderId: delivery.orderId || 'ORD-' + Math.floor(10000 + Math.random() * 90000),
      dealerId: delivery.dealerId || 'dealer-1',
      farmerId: delivery.farmerId || 'farmer-1',
      partnerId: delivery.partnerId,
      partnerName: delivery.partnerName,
      cropName: delivery.cropName || 'Sharbati Golden Wheat',
      cropQuantity: delivery.cropQuantity || 100,
      cropUnit: delivery.cropUnit || 'Kg',
      farmerName: delivery.farmerName || 'Sardar Gurpreet Singh',
      farmerPhone: delivery.farmerPhone || '+91 98140 11223',
      pickupAddress: delivery.pickupAddress || 'Khanna Mandi Yard, Ludhiana, Punjab',
      dealerName: delivery.dealerName || 'Apex Agro Mills Ltd',
      dealerPhone: delivery.dealerPhone || '+91 98722 55667',
      dropAddress: delivery.dropAddress || 'Commercial Mandi Warehouse, Delhi',
      distanceKm: delivery.distanceKm || 15,
      deliveryFee: delivery.deliveryFee !== undefined ? delivery.deliveryFee : fee,
      fulfillmentType: delivery.fulfillmentType || 'DELIVERY_AGENT',
      status: delivery.fulfillmentType === 'SELF_PICKUP' ? 'DELIVERED' : (delivery.status || 'PENDING_ASSIGNMENT'),
      trackingNumber: 'TRK-IN-' + Math.floor(10000 + Math.random() * 90000),
      updatedAt: new Date().toISOString()
    };

    const list = [newDelivery, ...this.deliveriesSubject.value];
    this.saveDeliveries(list);
    return of(newDelivery);
  }

  private saveDeliveries(list: Delivery[]): void {
    localStorage.setItem(this.DELIVERIES_KEY, JSON.stringify(list));
    this.deliveriesSubject.next(list);
  }

  private mapBackendDelivery(d: any): Delivery {
    return {
      id: d.deliveryId ? 'DEL-' + d.deliveryId : d.id,
      orderId: d.orderId ? 'ORD-' + d.orderId : d.orderId,
      partnerId: d.deliveryAgentId ? String(d.deliveryAgentId) : undefined,
      partnerName: d.deliveryAgentName || 'Kisan Express Logistics',
      cropName: d.cropName || 'Agricultural Commodity',
      pickupAddress: d.pickupAddress || 'Mandi Farm Gate',
      dropAddress: d.deliveryAddress || d.dropAddress || 'Warehouse',
      status: d.status || 'PENDING_ASSIGNMENT',
      deliveryFee: d.deliveryFee || 250,
      fulfillmentType: d.fulfillmentType || 'DELIVERY_AGENT',
      trackingNumber: 'TRK-' + (d.deliveryId || Math.floor(1000 + Math.random() * 9000)),
      updatedAt: d.updatedAt || new Date().toISOString()
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

