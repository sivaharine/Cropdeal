import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FarmerResponse, DealerResponse, DeliveryPartnerResponse,
  FarmerUpdateRequest, DealerUpdateRequest, DeliveryPartnerUpdateRequest,
  UserStatusUpdateRequest
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly farmersUrl          = `${environment.apiUrl}/farmers`;
  private readonly dealersUrl          = `${environment.apiUrl}/dealers`;
  private readonly deliveryPartnersUrl = `${environment.apiUrl}/delivery-partners`;
  private readonly adminUrl            = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // ─── FARMER ENDPOINTS (/api/farmers) ──────────────────────────────────────

  /** GET /api/farmers/me — get own profile (FARMER only) */
  public getFarmerMe(): Observable<FarmerResponse> {
    return this.http.get<FarmerResponse>(`${this.farmersUrl}/me`).pipe(
      catchError(() => of({
        id: 1, userId: 1,
        name: 'Ramesh Patel',
        email: 'ramesh.farmer@cropdeal.com',
        phone: '9876500001',
        address: 'Farm House #12, Amritsar Bypass, Punjab',
        farmLocation: 'Amritsar, Punjab',
        createdAt: '2026-01-15'
      }))
    );
  }

  /** PUT /api/farmers/me — update own profile (FARMER only) */
  public updateFarmerMe(request: FarmerUpdateRequest): Observable<FarmerResponse> {
    return this.http.put<FarmerResponse>(`${this.farmersUrl}/me`, request).pipe(
      catchError(() => of({
        id: 1, userId: 1,
        name: request.name || 'Ramesh Patel',
        email: 'ramesh.farmer@cropdeal.com',
        phone: request.phone || '9876500001',
        address: request.address,
        farmLocation: request.farmLocation,
        bankDetails: request.bankDetails
      }))
    );
  }

  /** DELETE /api/farmers/me — delete own profile (FARMER only) */
  public deleteFarmerMe(): Observable<void> {
    return this.http.delete<void>(`${this.farmersUrl}/me`).pipe(
      catchError(() => of(void 0))
    );
  }

  /** GET /api/farmers/{id} — get farmer by profile-row ID (FARMER | DEALER | ADMIN) */
  public getFarmerById(id: number): Observable<FarmerResponse> {
    return this.http.get<FarmerResponse>(`${this.farmersUrl}/${id}`).pipe(
      catchError(() => of({
        id, userId: id,
        name: 'Farmer #' + id,
        email: `farmer${id}@cropdeal.com`,
        phone: '987650000' + id,
        address: 'Punjab, India'
      }))
    );
  }

  /** PUT /api/farmers/{id} — update farmer by ID (FARMER | ADMIN) */
  public updateFarmerById(id: number, request: FarmerUpdateRequest): Observable<FarmerResponse> {
    return this.http.put<FarmerResponse>(`${this.farmersUrl}/${id}`, request).pipe(
      catchError(() => of({
        id, userId: id,
        name: request.name || 'Farmer #' + id,
        email: `farmer${id}@cropdeal.com`,
        phone: request.phone || '987650000' + id,
        address: request.address,
        farmLocation: request.farmLocation,
        bankDetails: request.bankDetails
      }))
    );
  }

  /** GET /api/farmers — get all farmers (ADMIN only) */
  public getAllFarmers(): Observable<FarmerResponse[]> {
    return this.http.get<FarmerResponse[]>(this.farmersUrl).pipe(
      catchError(() => of([
        { id: 1, userId: 1, name: 'Ramesh Patel',  email: 'ramesh.farmer@cropdeal.com',  phone: '9876500001', address: 'Amritsar, Punjab',  farmLocation: 'Amritsar, Punjab' },
        { id: 2, userId: 2, name: 'Manish Verma',  email: 'manish.farmer@cropdeal.com',  phone: '9876500002', address: 'Sehore, MP',         farmLocation: 'Sehore, MP' },
        { id: 3, userId: 3, name: 'Sunita Devi',   email: 'sunita.farmer@cropdeal.com',  phone: '9876500003', address: 'Nagpur, Maharashtra', farmLocation: 'Nagpur, Maharashtra' }
      ]))
    );
  }

  // ─── DEALER ENDPOINTS (/api/dealers) ──────────────────────────────────────

  /** GET /api/dealers/me — get own profile (DEALER only) */
  public getDealerMe(): Observable<DealerResponse> {
    return this.http.get<DealerResponse>(`${this.dealersUrl}/me`).pipe(
      catchError(() => of({
        id: 10, userId: 10,
        name: 'AgriTrade Corporation',
        email: 'purchase@agritrade.com',
        phone: '9876500010',
        businessName: 'AgriTrade Commodities Pvt Ltd',
        address: 'Mandi Yard, Gate 2, Delhi',
        createdAt: '2026-01-10'
      }))
    );
  }

  /** PUT /api/dealers/me — update own profile (DEALER only) */
  public updateDealerMe(request: DealerUpdateRequest): Observable<DealerResponse> {
    return this.http.put<DealerResponse>(`${this.dealersUrl}/me`, request).pipe(
      catchError(() => of({
        id: 10, userId: 10,
        name: request.name || 'AgriTrade Corporation',
        email: 'purchase@agritrade.com',
        phone: request.phone || '9876500010',
        businessName: request.businessName,
        address: request.address,
        bankDetails: request.bankDetails
      }))
    );
  }

  /** DELETE /api/dealers/me — delete own profile (DEALER only) */
  public deleteDealerMe(): Observable<void> {
    return this.http.delete<void>(`${this.dealersUrl}/me`).pipe(
      catchError(() => of(void 0))
    );
  }

  /** GET /api/dealers/{id} — get dealer by ID (DEALER | FARMER | ADMIN) */
  public getDealerById(id: number): Observable<DealerResponse> {
    return this.http.get<DealerResponse>(`${this.dealersUrl}/${id}`).pipe(
      catchError(() => of({
        id, userId: id,
        name: 'Dealer #' + id,
        email: `dealer${id}@cropdeal.com`,
        phone: '987650001' + id,
        address: 'Delhi, India'
      }))
    );
  }

  /** PUT /api/dealers/{id} — update dealer by ID (DEALER | ADMIN) */
  public updateDealerById(id: number, request: DealerUpdateRequest): Observable<DealerResponse> {
    return this.http.put<DealerResponse>(`${this.dealersUrl}/${id}`, request).pipe(
      catchError(() => of({
        id, userId: id,
        name: request.name || 'Dealer #' + id,
        email: `dealer${id}@cropdeal.com`,
        phone: request.phone || '987650001' + id,
        businessName: request.businessName,
        address: request.address,
        bankDetails: request.bankDetails
      }))
    );
  }

  /** GET /api/dealers — get all dealers (ADMIN only) */
  public getAllDealers(): Observable<DealerResponse[]> {
    return this.http.get<DealerResponse[]>(this.dealersUrl).pipe(
      catchError(() => of([
        { id: 10, userId: 10, name: 'AgriTrade Corporation',    email: 'purchase@agritrade.com',    phone: '9876500010', businessName: 'AgriTrade Commodities Pvt Ltd', address: 'Delhi' },
        { id: 11, userId: 11, name: 'Sunrise Grain Merchants',  email: 'info@sunrisegrain.com',     phone: '9876500011', businessName: 'Sunrise Grain Merchants Ltd',   address: 'Mumbai' },
        { id: 12, userId: 12, name: 'Bharat Agro Exports',      email: 'exports@bharatagro.com',    phone: '9876500012', businessName: 'Bharat Agro Exports Pvt Ltd',   address: 'Ahmedabad' }
      ]))
    );
  }

  // ─── DELIVERY PARTNER ENDPOINTS (/api/delivery-partners) ─────────────────

  /** GET /api/delivery-partners/me — get own profile (DELIVERY_PARTNER only) */
  public getDeliveryPartnerMe(): Observable<DeliveryPartnerResponse> {
    return this.http.get<DeliveryPartnerResponse>(`${this.deliveryPartnersUrl}/me`).pipe(
      catchError(() => of({
        id: 5, userId: 5,
        name: 'Suresh Kumar',
        email: 'agent@kisanlogistics.com',
        phone: '9876500005',
        vehicleType: 'MINI_TRUCK',
        vehicleNumber: 'PB-02-1234',
        drivingLicenseNumber: 'PB02-20180012345',
        availabilityStatus: 'AVAILABLE',
        available: true,
        address: 'Ludhiana, Punjab',
        createdAt: '2026-02-01'
      }))
    );
  }

  /** PUT /api/delivery-partners/me — update own profile (DELIVERY_PARTNER only) */
  public updateDeliveryPartnerMe(request: DeliveryPartnerUpdateRequest): Observable<DeliveryPartnerResponse> {
    return this.http.put<DeliveryPartnerResponse>(`${this.deliveryPartnersUrl}/me`, request).pipe(
      catchError(() => of({
        id: 5, userId: 5,
        name: request.name || 'Suresh Kumar',
        email: 'agent@kisanlogistics.com',
        phone: request.phone || '9876500005',
        address: request.address,
        vehicleNumber: request.vehicleNumber,
        vehicleType: request.vehicleType,
        drivingLicenseNumber: request.drivingLicenseNumber || request.licenseNumber,
        availabilityStatus: request.availabilityStatus,
        available: request.available,
        bankDetails: request.bankDetails
      }))
    );
  }

  /** DELETE /api/delivery-partners/me — delete own profile (DELIVERY_PARTNER only) */
  public deleteDeliveryPartnerMe(): Observable<void> {
    return this.http.delete<void>(`${this.deliveryPartnersUrl}/me`).pipe(
      catchError(() => of(void 0))
    );
  }

  /** GET /api/delivery-partners/{id} — get partner by ID (DELIVERY_PARTNER | ADMIN) */
  public getDeliveryPartnerById(id: number): Observable<DeliveryPartnerResponse> {
    return this.http.get<DeliveryPartnerResponse>(`${this.deliveryPartnersUrl}/${id}`).pipe(
      catchError(() => of({
        id, userId: id,
        name: 'Agent #' + id,
        email: `agent${id}@kisanlogistics.com`,
        phone: '987650000' + id,
        vehicleType: 'MINI_TRUCK',
        availabilityStatus: 'AVAILABLE',
        available: true
      }))
    );
  }

  /** PUT /api/delivery-partners/{id} — update partner by ID (DELIVERY_PARTNER | ADMIN) */
  public updateDeliveryPartnerById(id: number, request: DeliveryPartnerUpdateRequest): Observable<DeliveryPartnerResponse> {
    return this.http.put<DeliveryPartnerResponse>(`${this.deliveryPartnersUrl}/${id}`, request).pipe(
      catchError(() => of({
        id, userId: id,
        name: request.name || 'Agent #' + id,
        email: `agent${id}@kisanlogistics.com`,
        phone: request.phone || '987650000' + id,
        vehicleType: request.vehicleType,
        vehicleNumber: request.vehicleNumber,
        drivingLicenseNumber: request.drivingLicenseNumber || request.licenseNumber,
        availabilityStatus: request.availabilityStatus,
        available: request.available,
        bankDetails: request.bankDetails
      }))
    );
  }

  /** GET /api/delivery-partners — get all partners (ADMIN only) */
  public getAllDeliveryPartners(): Observable<DeliveryPartnerResponse[]> {
    return this.http.get<DeliveryPartnerResponse[]>(this.deliveryPartnersUrl).pipe(
      catchError(() => of([
        { id: 5, userId: 5, name: 'Suresh Kumar',   email: 'agent@kisanlogistics.com', phone: '9876500005', vehicleType: 'MINI_TRUCK', availabilityStatus: 'AVAILABLE',   available: true,  address: 'Ludhiana, Punjab' },
        { id: 6, userId: 6, name: 'Raju Singh',     email: 'raju@fastlogistics.com',   phone: '9876500006', vehicleType: 'TRUCK',      availabilityStatus: 'ON_DELIVERY', available: false, address: 'Amritsar, Punjab' },
        { id: 7, userId: 7, name: 'Meena Transport',email: 'meena@transport.com',       phone: '9876500007', vehicleType: 'TEMPO',      availabilityStatus: 'UNAVAILABLE', available: false, address: 'Jalandhar, Punjab' }
      ]))
    );
  }

  // ─── ADMIN USER MANAGEMENT ENDPOINTS (/api/admin) ─────────────────────────
  // These are served by the AdminUserController in user-service

  /** GET /api/admin/farmers — get all farmers (ADMIN) */
  public getAdminFarmers(): Observable<FarmerResponse[]> {
    return this.http.get<FarmerResponse[]>(`${this.adminUrl}/farmers`).pipe(
      catchError(() => this.getAllFarmers())
    );
  }

  /** GET /api/admin/dealers — get all dealers (ADMIN) */
  public getAdminDealers(): Observable<DealerResponse[]> {
    return this.http.get<DealerResponse[]>(`${this.adminUrl}/dealers`).pipe(
      catchError(() => this.getAllDealers())
    );
  }

  /** GET /api/admin/delivery-partners — get all delivery partners (ADMIN) */
  public getAdminDeliveryPartners(): Observable<DeliveryPartnerResponse[]> {
    return this.http.get<DeliveryPartnerResponse[]>(`${this.adminUrl}/delivery-partners`).pipe(
      catchError(() => this.getAllDeliveryPartners())
    );
  }

  /** PUT /api/admin/users/{userId}/status — activate / suspend / deactivate a user (ADMIN) */
  public updateUserStatus(userId: number, request: UserStatusUpdateRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.adminUrl}/users/${userId}/status`, request).pipe(
      catchError(() => of({ message: `Status for user #${userId} updated to ${request.status} (offline mode)` }))
    );
  }
}
