import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { CreateOrderRequest, Order } from '../models/order.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private baseUrl = `${environment.apiUrl}/orders`;
  private readonly ORDERS_KEY = 'cropdeal_orders_cache';

  private ordersSubject = new BehaviorSubject<Order[]>(this.loadStoredOrders());
  public orders$ = this.ordersSubject.asObservable();

  constructor(private http: HttpClient) {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === this.ORDERS_KEY) {
          this.refreshOrders();
        }
      });
    }
  }

  refreshOrders(): Order[] {
    const orders = this.loadStoredOrders();
    this.ordersSubject.next(orders);
    return orders;
  }

  private loadStoredOrders(): Order[] {
    try {
      const raw = localStorage.getItem(this.ORDERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  private saveOrders(orders: Order[]): void {
    try {
      localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
      this.ordersSubject.next(orders);
    } catch {}
  }

  public mapBackendOrder(o: any): Order {
    if (!o) return {} as Order;
    const id = o.id !== undefined && o.id !== null ? String(o.id) : (o.orderNumber || ('ORD-' + Date.now()));
    const qty = Number(o.quantity) || 1;
    const unitPrice = Number(o.pricePerUnit !== undefined ? o.pricePerUnit : (o.ratePerKg || (o.totalPrice ? o.totalPrice / qty : 25)));
    const total = Number(o.totalPrice !== undefined ? o.totalPrice : (o.finalAmount || (unitPrice * qty)));
    const finalAmt = Number(o.finalAmount !== undefined ? o.finalAmount : total);

    return {
      id,
      cropId: o.cropId !== undefined ? String(o.cropId) : '1',
      cropName: o.cropName || 'Harvest Crop',
      farmerId: o.farmerId !== undefined ? String(o.farmerId) : '1',
      farmerName: o.farmerName || 'Farmer Producer',
      farmerPhone: o.farmerPhone,
      farmerLocation: o.farmerLocation,
      dealerId: o.dealerId !== undefined ? String(o.dealerId) : '2',
      dealerName: o.dealerName || o.buyerName || 'Commercial Dealer',
      dealerPhone: o.dealerPhone,
      quantity: qty,
      unit: o.unit || 'Kg',
      pricePerUnit: unitPrice,
      govMspPrice: o.govMspPrice,
      totalPrice: total,
      taxAmount: o.taxAmount || Math.round(total * 0.05),
      deliveryFee: o.deliveryFee || 0,
      finalAmount: finalAmt,
      fulfillmentType: o.fulfillmentType || 'DELIVERY_AGENT',
      distanceKm: o.distanceKm,
      paymentMethod: o.paymentMethod || 'Institutional Escrow',
      transactionId: o.transactionId,
      status: (o.status || 'PAID') as any,
      deliveryAddress: o.deliveryAddress || 'APMC Delivery Terminal',
      deliveryPartnerId: o.deliveryAgentId ? String(o.deliveryAgentId) : undefined,
      createdAt: o.createdAt || new Date().toISOString(),
      invoiceId: o.invoiceId,
      isBidding: o.isBidding ?? false
    };
  }

  createOrder(req: CreateOrderRequest): Observable<Order> {
    const orderId = (req as any).id || (req as any).orderId || ('ORD-' + Math.floor(10000 + Math.random() * 90000));
    const unitRate = req.pricePerUnit || Math.round(req.totalPrice / (req.quantity || 1));
    const newOrder: Order = {
      id: orderId,
      cropId: req.cropId,
      cropName: req.cropName || 'Harvest Crop',
      farmerId: req.farmerId || '1',
      farmerName: req.farmerName || 'Farmer Producer',
      dealerId: req.dealerId,
      dealerName: req.dealerName || 'Commercial Dealer',
      quantity: req.quantity,
      unit: req.unit || 'Kg',
      pricePerUnit: unitRate,
      govMspPrice: req.govMspPrice,
      totalPrice: req.totalPrice,
      taxAmount: req.taxAmount || Math.round(req.totalPrice * 0.05),
      deliveryFee: req.deliveryFee || 0,
      finalAmount: req.finalAmount || req.totalPrice,
      fulfillmentType: req.fulfillmentType || 'DELIVERY_AGENT',
      distanceKm: req.distanceKm,
      paymentMethod: req.paymentMethod || 'Stripe Demo (Card **** 4242)',
      transactionId: req.transactionId || 'STRIPE-TXN-' + Math.floor(100000 + Math.random() * 900000),
      status: 'PAID',
      deliveryAddress: req.deliveryAddress,
      isBidding: req.isBidding ?? false,
      createdAt: new Date().toISOString()
    };

    const payload: any = {
      ...req,
      unitPrice: unitRate,
      pricePerUnit: unitRate,
      totalPrice: req.totalPrice,
      dealerName: req.dealerName,
      farmerName: req.farmerName,
      deliveryAddress: req.deliveryAddress,
      fulfillmentType: req.fulfillmentType,
      paymentMethod: req.paymentMethod,
      transactionId: req.transactionId,
      isBidding: req.isBidding
    };

    return this.http.post<any>(this.baseUrl, payload).pipe(
      map((saved) => {
        const orderToSave = this.mapBackendOrder(saved || newOrder);
        const current = [orderToSave, ...this.ordersSubject.value.filter(o => o.id !== orderToSave.id)];
        this.saveOrders(current);
        return orderToSave;
      }),
      catchError(() => {
        const current = [newOrder, ...this.ordersSubject.value.filter(o => o.id !== newOrder.id)];
        this.saveOrders(current);
        return of(newOrder);
      })
    );
  }

  getOrderById(orderId: string): Observable<Order> {
    return this.http.get<any>(`${this.baseUrl}/${orderId}`).pipe(
      map(res => this.mapBackendOrder(res)),
      catchError(() => {
        const found = this.ordersSubject.value.find(o => o.id === orderId);
        return of(found as Order);
      })
    );
  }

  getOrdersByDealer(dealerId: string): Observable<Order[]> {
    const dId = String(dealerId).trim();
    return this.http.get<any[]>(`${this.baseUrl}/dealer/${dId}`).pipe(
      map(items => {
        if (Array.isArray(items)) {
          return items.map(o => this.mapBackendOrder(o));
        }
        return this.ordersSubject.value.filter(o => String(o.dealerId) === dId);
      }),
      catchError(() => {
        return of(this.ordersSubject.value.filter(o => String(o.dealerId) === dId));
      })
    );
  }

  getOrdersByFarmer(farmerId: string): Observable<Order[]> {
    const fId = String(farmerId).trim();
    return this.http.get<any[]>(`${this.baseUrl}/farmer/${fId}`).pipe(
      map(items => {
        if (Array.isArray(items)) {
          return items.map(o => this.mapBackendOrder(o));
        }
        return this.ordersSubject.value.filter(o => String(o.farmerId) === fId);
      }),
      catchError(() => {
        return of(this.ordersSubject.value.filter(o => String(o.farmerId) === fId));
      })
    );
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map(backendList => {
        if (Array.isArray(backendList) && backendList.length > 0) {
          const mapped = backendList.map(o => this.mapBackendOrder(o));
          const ids = new Set(mapped.map(o => o.id));
          const localOnly = this.ordersSubject.value.filter(o => !ids.has(o.id));
          const combined = [...mapped, ...localOnly];
          this.saveOrders(combined);
          return combined;
        }
        return this.ordersSubject.value;
      }),
      catchError(() => {
        return of(this.ordersSubject.value);
      })
    );
  }

  updateOrderStatus(orderId: string, status: string): Observable<Order> {
    const list = [...this.ordersSubject.value];
    const cleanId = String(orderId).trim();
    let idx = list.findIndex(o => {
      const oId = String(o.id || '').trim();
      return oId === cleanId ||
             ('ORD-' + oId) === cleanId ||
             oId === ('ORD-' + cleanId) ||
             oId.replace('ORD-', '') === cleanId.replace('ORD-', '');
    });
    if (idx === -1) {
      const cleanLower = cleanId.toLowerCase();
      idx = list.findIndex(o => {
        const cName = (o.cropName || '').trim().toLowerCase();
        return cName && (cleanLower.includes(cName) || cName.includes(cleanLower));
      });
    }
    if (idx !== -1) {
      list[idx].status = status as any;
      this.saveOrders(list);
    }
    return this.http.put<Order>(`${this.baseUrl}/${cleanId}/status`, { status }).pipe(
      catchError(() => of(idx !== -1 ? list[idx] : ({} as Order)))
    );
  }
}
