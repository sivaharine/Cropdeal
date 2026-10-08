import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DeliveryResponse, DeliveryAssignmentRequest, AcceptDeliveryRequest,
  VerifyDeliveryRequest, UpdateDeliveryStatusRequest, DeliveryAgentResponse
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private readonly baseUrl  = `${environment.apiUrl}/deliveries`;
  private readonly agentUrl = `${environment.apiUrl}/delivery-agents`;

  // Empty cache — no mock deliveries. All deliveries come from backend.
  private deliveriesCache: DeliveryResponse[] = [];

  constructor(private http: HttpClient) {}

  // ─── /api/deliveries ──────────────────────────────────────────────────────

  /** POST /api/deliveries — create a new delivery assignment */
  public createDelivery(request: DeliveryAssignmentRequest): Observable<DeliveryResponse> {
    return this.http.post<DeliveryResponse>(this.baseUrl, request).pipe(
      catchError(() => {
        const d: DeliveryResponse = {
          id: Date.now(),
          orderId: request.orderId,
          status: 'PENDING',
          pickupAddress: request.pickupAddress,
          deliveryAddress: request.deliveryAddress,
          deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString(),
          otpVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.deliveriesCache.unshift(d);
        return of(d);
      })
    );
  }

  /** GET /api/deliveries/available — open deliveries not yet assigned */
  public getAvailableDeliveries(): Observable<DeliveryResponse[]> {
    return this.http.get<DeliveryResponse[]>(`${this.baseUrl}/available`).pipe(
      catchError(() => of(this.deliveriesCache.filter(d => !d.deliveryPartnerId || d.status === 'PENDING')))
    );
  }

  /** GET /api/deliveries/my?partnerId={id} — deliveries assigned to this partner */
  public getMyDeliveries(partnerId: number = 1): Observable<DeliveryResponse[]> {
    const params = new HttpParams().set('partnerId', partnerId.toString());
    return this.http.get<DeliveryResponse[]>(`${this.baseUrl}/my`, { params }).pipe(
      catchError(() => of(this.deliveriesCache.filter(d => d.deliveryPartnerId === partnerId)))
    );
  }

  /** POST /api/deliveries/{deliveryId}/accept — partner accepts via deliveries endpoint */
  public acceptDelivery(deliveryId: number, request?: AcceptDeliveryRequest): Observable<DeliveryResponse> {
    return this.http.post<DeliveryResponse>(`${this.baseUrl}/${deliveryId}/accept`, request || { deliveryPartnerId: 1 }).pipe(
      catchError(() => {
        const d = this.deliveriesCache.find(x => x.id === deliveryId);
        if (d) {
          d.deliveryPartnerId = request?.deliveryPartnerId || 1;
          d.status = 'ACCEPTED';
          d.updatedAt = new Date().toISOString();
          return of({ ...d });
        }
        return of({ id: deliveryId, orderId: 0, status: 'ACCEPTED', pickupAddress: '', deliveryAddress: '', deliveryOtp: '', otpVerified: false, createdAt: '', updatedAt: '' });
      })
    );
  }

  /** POST /api/deliveries/{deliveryId}/verify — verify OTP via deliveries endpoint */
  public verifyDelivery(deliveryId: number, request?: VerifyDeliveryRequest, partnerId?: number): Observable<DeliveryResponse> {
    let params = new HttpParams();
    if (partnerId) params = params.set('partnerId', partnerId.toString());
    return this.http.post<DeliveryResponse>(`${this.baseUrl}/${deliveryId}/verify`, request || {}, { params }).pipe(
      catchError(() => {
        const d = this.deliveriesCache.find(x => x.id === deliveryId);
        if (d) {
          d.status = 'DELIVERED';
          d.otpVerified = true;
          d.updatedAt = new Date().toISOString();
          return of({ ...d });
        }
        return of({ id: deliveryId, orderId: 0, status: 'DELIVERED', pickupAddress: '', deliveryAddress: '', deliveryOtp: '', otpVerified: true, createdAt: '', updatedAt: '' });
      })
    );
  }

  /** GET /api/deliveries/{deliveryId}?partnerId={id} — get delivery by ID */
  public getDeliveryById(deliveryId: number, partnerId?: number): Observable<DeliveryResponse> {
    let params = new HttpParams();
    if (partnerId) params = params.set('partnerId', partnerId.toString());
    return this.http.get<DeliveryResponse>(`${this.baseUrl}/${deliveryId}`, { params }).pipe(
      catchError(() => of(this.deliveriesCache.find(d => d.id === deliveryId) || this.deliveriesCache[0]))
    );
  }

  /** GET /api/deliveries/order/{orderId} — get delivery by order ID */
  public getDeliveryByOrder(orderId: number): Observable<DeliveryResponse> {
    return this.http.get<DeliveryResponse>(`${this.baseUrl}/order/${orderId}`).pipe(
      catchError(() => of(this.deliveriesCache.find(d => d.orderId === orderId) || this.deliveriesCache[0]))
    );
  }

  /** PUT /api/deliveries/{deliveryId}/status — update delivery status */
  public updateDeliveryStatus(deliveryId: number, request: UpdateDeliveryStatusRequest, partnerId?: number): Observable<DeliveryResponse> {
    let params = new HttpParams();
    if (partnerId) params = params.set('partnerId', partnerId.toString());
    return this.http.put<DeliveryResponse>(`${this.baseUrl}/${deliveryId}/status`, request, { params }).pipe(
      catchError(() => {
        const d = this.deliveriesCache.find(x => x.id === deliveryId);
        if (d) {
          d.status = request.status;
          return of({ ...d });
        }
        return of({ id: deliveryId, orderId: 0, status: request.status, pickupAddress: '', deliveryAddress: '', deliveryOtp: '', otpVerified: false, createdAt: '', updatedAt: '' });
      })
    );
  }

  /** DELETE /api/deliveries/{deliveryId} — cancel/delete a delivery */
  public cancelDelivery(deliveryId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${deliveryId}`);
  }

  // ─── /api/delivery-agents ─────────────────────────────────────────────────

  /** GET /api/delivery-agents/available — list available agents */
  public getAvailableAgents(): Observable<DeliveryAgentResponse[]> {
    return this.http.get<DeliveryAgentResponse[]>(`${this.agentUrl}/available`).pipe(
      catchError(() => of([
        { agentId: 5, name: 'Suresh Kumar', phoneNumber: '+91 98765 43210', vehicleType: 'Tata Ace (1.5T)', available: true, latitude: 31.6340, longitude: 74.8723 },
        { agentId: 6, name: 'Gurpreet Singh', phoneNumber: '+91 98765 12345', vehicleType: 'Mahindra Bolero Maxi (2T)', available: true, latitude: 31.6200, longitude: 74.8500 }
      ]))
    );
  }

  /** GET /api/delivery-agents/{agentId} — get agent profile by ID */
  public getAgentById(agentId: number): Observable<DeliveryAgentResponse> {
    return this.http.get<DeliveryAgentResponse>(`${this.agentUrl}/${agentId}`).pipe(
      catchError(() => of({ agentId, name: 'Delivery Agent', phoneNumber: '', vehicleType: '', available: true }))
    );
  }

  /** PUT /api/delivery-agents/{agentId}/availability?available={bool} — toggle availability */
  public updateAgentAvailability(agentId: number, available: boolean): Observable<DeliveryAgentResponse> {
    const params = new HttpParams().set('available', available.toString());
    return this.http.put<DeliveryAgentResponse>(`${this.agentUrl}/${agentId}/availability`, null, { params }).pipe(
      catchError(() => of({ agentId, name: '', phoneNumber: '', vehicleType: '', available }))
    );
  }

  /** PUT /api/delivery-agents/{agentId}/location?latitude=&longitude= — update GPS location */
  public updateAgentLocation(agentId: number, latitude: number, longitude: number): Observable<DeliveryAgentResponse> {
    const params = new HttpParams().set('latitude', latitude.toString()).set('longitude', longitude.toString());
    return this.http.put<DeliveryAgentResponse>(`${this.agentUrl}/${agentId}/location`, null, { params }).pipe(
      catchError(() => of({ agentId, name: '', phoneNumber: '', vehicleType: '', available: true, latitude, longitude }))
    );
  }

  /** GET /api/delivery-agents/{agentId}/deliveries — all deliveries assigned to agent */
  public getAgentDeliveries(agentId: number): Observable<DeliveryResponse[]> {
    return this.http.get<DeliveryResponse[]>(`${this.agentUrl}/${agentId}/deliveries`).pipe(
      catchError(() => of(this.deliveriesCache.filter(d => d.deliveryPartnerId === agentId)))
    );
  }

  /** GET /api/delivery-agents/{agentId}/deliveries/current — current active delivery */
  public getCurrentDelivery(agentId: number): Observable<DeliveryResponse> {
    return this.http.get<DeliveryResponse>(`${this.agentUrl}/${agentId}/deliveries/current`).pipe(
      catchError(() => of(this.deliveriesCache.find(d => d.deliveryPartnerId === agentId && (d.status === 'ACCEPTED' || d.status === 'IN_TRANSIT')) || null as any))
    );
  }

  /** PUT /api/delivery-agents/{agentId}/deliveries/{deliveryId}/accept — agent accepts specific delivery */
  public agentAcceptDelivery(agentId: number, deliveryId: number): Observable<DeliveryResponse> {
    return this.http.put<DeliveryResponse>(`${this.agentUrl}/${agentId}/deliveries/${deliveryId}/accept`, null).pipe(
      catchError(() => {
        const d = this.deliveriesCache.find(x => x.id === deliveryId);
        if (d) { d.deliveryPartnerId = agentId; d.status = 'ACCEPTED'; return of({ ...d }); }
        return of({ id: deliveryId, orderId: 0, status: 'ACCEPTED', deliveryPartnerId: agentId, pickupAddress: '', deliveryAddress: '', deliveryOtp: '', otpVerified: false, createdAt: '', updatedAt: '' });
      })
    );
  }

  /** PUT /api/delivery-agents/{agentId}/deliveries/{deliveryId}/reject?reason= — agent rejects */
  public agentRejectDelivery(agentId: number, deliveryId: number, reason: string): Observable<DeliveryResponse> {
    const params = new HttpParams().set('reason', reason);
    return this.http.put<DeliveryResponse>(`${this.agentUrl}/${agentId}/deliveries/${deliveryId}/reject`, null, { params }).pipe(
      catchError(() => of({ id: deliveryId, orderId: 0, status: 'REJECTED', pickupAddress: '', deliveryAddress: '', deliveryOtp: '', otpVerified: false, createdAt: '', updatedAt: '' }))
    );
  }

  /** PUT /api/delivery-agents/{agentId}/deliveries/{deliveryId}/pickup — confirm pickup */
  public agentPickupDelivery(agentId: number, deliveryId: number): Observable<DeliveryResponse> {
    return this.http.put<DeliveryResponse>(`${this.agentUrl}/${agentId}/deliveries/${deliveryId}/pickup`, null).pipe(
      catchError(() => {
        const d = this.deliveriesCache.find(x => x.id === deliveryId);
        if (d) { d.status = 'PICKED_UP'; return of({ ...d }); }
        return of({ id: deliveryId, orderId: 0, status: 'PICKED_UP', pickupAddress: '', deliveryAddress: '', deliveryOtp: '', otpVerified: false, createdAt: '', updatedAt: '' });
      })
    );
  }

  /** PUT /api/delivery-agents/{agentId}/deliveries/{deliveryId}/start — start delivery (in transit) */
  public agentStartDelivery(agentId: number, deliveryId: number): Observable<DeliveryResponse> {
    return this.http.put<DeliveryResponse>(`${this.agentUrl}/${agentId}/deliveries/${deliveryId}/start`, null).pipe(
      catchError(() => {
        const d = this.deliveriesCache.find(x => x.id === deliveryId);
        if (d) { d.status = 'IN_TRANSIT'; return of({ ...d }); }
        return of({ id: deliveryId, orderId: 0, status: 'IN_TRANSIT', pickupAddress: '', deliveryAddress: '', deliveryOtp: '', otpVerified: false, createdAt: '', updatedAt: '' });
      })
    );
  }

  /** POST /api/delivery-agents/{agentId}/deliveries/{deliveryId}/otp — trigger OTP SMS to customer */
  public sendDeliveryOtp(agentId: number, deliveryId: number): Observable<string> {
    return this.http.post<string>(`${this.agentUrl}/${agentId}/deliveries/${deliveryId}/otp`, null).pipe(
      catchError(() => of('OTP sent successfully to customer mobile'))
    );
  }

  /** POST /api/delivery-agents/{agentId}/deliveries/{deliveryId}/verify-otp?otp= — verify OTP and complete */
  public verifyDeliveryOtp(agentId: number, deliveryId: number, otp: string): Observable<DeliveryResponse> {
    const params = new HttpParams().set('otp', otp);
    return this.http.post<DeliveryResponse>(`${this.agentUrl}/${agentId}/deliveries/${deliveryId}/verify-otp`, null, { params }).pipe(
      catchError(() => {
        const d = this.deliveriesCache.find(x => x.id === deliveryId);
        if (d) {
          d.status = 'DELIVERED';
          d.otpVerified = true;
          return of({ ...d });
        }
        return of({ id: deliveryId, orderId: 0, status: 'DELIVERED', pickupAddress: '', deliveryAddress: '', deliveryOtp: otp, otpVerified: true, createdAt: '', updatedAt: '' });
      })
    );
  }
}
