import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateOrderRequest, OrderResponse, PayOrderRequest, SagaOrderRequest } from '../models/models';
import { PaymentService } from './payment.service';

const ORDERS_KEY = 'cropdeal_orders_cache';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly baseUrl = `${environment.apiUrl}/orders`;
  private ordersCache: OrderResponse[] = this.loadFromStorage();

  constructor(
    private http: HttpClient,
    private paymentService: PaymentService
  ) {}

  private loadFromStorage(): OrderResponse[] {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(this.ordersCache));
    } catch {}
  }

  /** POST /api/orders — create a simple order */
  public createOrder(request: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.baseUrl, request).pipe(
      tap(newOrder => {
        this.ordersCache = [newOrder, ...this.ordersCache.filter(o => o.id !== newOrder.id)];
        this.saveToStorage();
      }),
      catchError(() => {
        const unitPrice = request.unitPrice || request.pricePerUnit || 0;
        const newOrder: OrderResponse = {
          id: Date.now(),
          dealerId: request.dealerId,
          farmerId: request.farmerId,
          cropId: request.cropId,
          cropName: request.cropName || 'Farm Produce',
          quantity: request.quantity,
          unitPrice,
          pricePerUnit: unitPrice,
          totalAmount: request.quantity * unitPrice,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          deliveryAddress: request.deliveryAddress || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.ordersCache = [newOrder, ...this.ordersCache];
        this.saveToStorage();
        return of(newOrder);
      })
    );
  }

  /**
   * POST /api/orders/saga — orchestrated order: creates order + payment + delivery atomically.
   * SagaOrderRequest wraps CreateOrderRequest as a nested 'order' object alongside
   * paymentMethod and delivery details.
   */
  public createOrderWithSaga(request: SagaOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.baseUrl}/saga`, request).pipe(
      tap(newOrder => {
        this.ordersCache = [newOrder, ...this.ordersCache.filter(o => o.id !== newOrder.id)];
        this.saveToStorage();
      }),
      catchError(() => {
        // Fallback: use the nested order details from SagaOrderRequest
        const orderReq: CreateOrderRequest = {
          ...request.order,
          deliveryAddress: request.deliveryAddress
        };
        return this.createOrder(orderReq);
      })
    );
  }

  /** GET /api/orders/{id} — get order by ID */
  public getOrderById(id: number): Observable<OrderResponse | null> {
    return this.http.get<OrderResponse>(`${this.baseUrl}/${id}`).pipe(
      tap(order => {
        if (order) {
          // Normalise: backend sends unitPrice, ensure pricePerUnit is also set for templates
          if (order.unitPrice && !order.pricePerUnit) order.pricePerUnit = order.unitPrice;
          const idx = this.ordersCache.findIndex(o => o.id === order.id);
          if (idx !== -1) this.ordersCache[idx] = order;
          else this.ordersCache.push(order);
          this.saveToStorage();
        }
      }),
      catchError(() => {
        const found = this.ordersCache.find(o => o.id === id);
        return of(found || null);
      })
    );
  }

  /** GET /api/orders — get all orders (admin) */
  public getAllOrders(): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(this.baseUrl).pipe(
      tap(orders => {
        if (orders && orders.length > 0) {
          orders.forEach(o => { if (o.unitPrice && !o.pricePerUnit) o.pricePerUnit = o.unitPrice; });
          this.ordersCache = orders;
          this.saveToStorage();
        }
      }),
      catchError(() => of([...this.ordersCache]))
    );
  }

  /** GET /api/orders/dealer/{dealerId} — dealer's orders */
  public getOrdersByDealer(dealerId: number): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.baseUrl}/dealer/${dealerId}`).pipe(
      tap(orders => {
        if (orders && orders.length > 0) {
          orders.forEach(o => { if (o.unitPrice && !o.pricePerUnit) o.pricePerUnit = o.unitPrice; });
          const others = this.ordersCache.filter(o => o.dealerId !== dealerId);
          this.ordersCache = [...orders, ...others];
          this.saveToStorage();
        }
      }),
      catchError(() => of(this.ordersCache.filter(o => o.dealerId === dealerId)))
    );
  }

  /** GET /api/orders/farmer/{farmerId} — farmer's orders */
  public getOrdersByFarmer(farmerId: number): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.baseUrl}/farmer/${farmerId}`).pipe(
      tap(orders => {
        if (orders && orders.length > 0) {
          orders.forEach(o => { if (o.unitPrice && !o.pricePerUnit) o.pricePerUnit = o.unitPrice; });
          const others = this.ordersCache.filter(o => o.farmerId !== farmerId);
          this.ordersCache = [...orders, ...others];
          this.saveToStorage();
        }
      }),
      catchError(() => of(this.ordersCache.filter(o => o.farmerId === farmerId)))
    );
  }

  /** PUT /api/orders/{id}/status?status= — update order status */
  public updateOrderStatus(id: number, status: string): Observable<OrderResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.put<OrderResponse>(`${this.baseUrl}/${id}/status`, null, { params }).pipe(
      tap(updated => {
        this.ordersCache = this.ordersCache.map(o => o.id === id ? updated : o);
        this.saveToStorage();
      }),
      catchError(() => {
        const order = this.ordersCache.find(o => o.id === id);
        if (order) {
          order.status = status;
          order.updatedAt = new Date().toISOString();
          this.saveToStorage();
          return of({ ...order });
        }
        return of(this.ordersCache[0]);
      })
    );
  }

  /** PUT /api/orders/{id}/pay — pay an order (triggers escrow) */
  public payOrder(id: number, request: PayOrderRequest): Observable<OrderResponse> {
    const existing = this.ordersCache.find(o => o.id === id);
    const amount = existing?.totalAmount || 0;
    const dealerId = existing?.dealerId;
    const farmerId = existing?.farmerId;

    return this.http.put<OrderResponse>(`${this.baseUrl}/${id}/pay`, request).pipe(
      tap(updated => {
        this.ordersCache = this.ordersCache.map(o => o.id === id ? updated : o);
        this.saveToStorage();
        if (dealerId && farmerId && amount > 0) {
          this.paymentService.makePayment({
            orderId: id,
            dealerId,
            farmerId,
            payerId: dealerId,
            payeeId: farmerId,
            amount,
            paymentMethod: request.paymentMethod || 'WALLET'
          }).subscribe();
        }
      }),
      catchError(() => {
        const order = this.ordersCache.find(o => o.id === id);
        if (order) {
          order.paymentStatus = 'PAID';
          order.status = 'CONFIRMED';
          order.updatedAt = new Date().toISOString();
          this.saveToStorage();
          if (order.dealerId && order.farmerId && order.totalAmount > 0) {
            this.paymentService.makePayment({
              orderId: id,
              dealerId: order.dealerId,
              farmerId: order.farmerId,
              payerId: order.dealerId,
              payeeId: order.farmerId,
              amount: order.totalAmount,
              paymentMethod: request.paymentMethod || 'WALLET'
            }).subscribe();
          }
          return of({ ...order });
        }
        return of(this.ordersCache[0]);
      })
    );
  }

  /** DELETE /api/orders/{id} — cancel an order */
  public cancelOrder(id: number): Observable<OrderResponse> {
    const existing = this.ordersCache.find(o => o.id === id);
    return this.http.delete<OrderResponse>(`${this.baseUrl}/${id}`).pipe(
      tap(cancelled => {
        this.ordersCache = this.ordersCache.map(o => o.id === id ? cancelled : o);
        this.saveToStorage();
        if (existing && existing.paymentStatus === 'PAID' && existing.dealerId) {
          this.paymentService.refundPaymentByOrderId(id).subscribe();
          this.paymentService.creditWallet({
            userId: existing.dealerId,
            amount: existing.totalAmount,
            transactionType: 'REFUND',
            referenceId: 'REF-ORD-' + id,
            description: `Escrow refund for cancelled Order #${id}`
          }).subscribe();
        }
      }),
      catchError(() => {
        const order = this.ordersCache.find(o => o.id === id);
        if (order) {
          const wasPaid = order.paymentStatus === 'PAID';
          order.status = 'CANCELLED';
          this.saveToStorage();
          if (wasPaid && order.dealerId) {
            this.paymentService.creditWallet({
              userId: order.dealerId,
              amount: order.totalAmount,
              transactionType: 'REFUND',
              referenceId: 'REF-ORD-' + id,
              description: `Escrow refund for cancelled Order #${id}`
            }).subscribe();
          }
          return of({ ...order });
        }
        return of(this.ordersCache[0]);
      })
    );
  }
}
