import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { User, UserRole } from '../models/user.model';

export interface UserProfileData {
  userId?: string | number | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  role?: UserRole | null;
  // Farmer specific
  farmLocation?: string | null;
  // Dealer specific
  businessName?: string | null;
  // Delivery partner specific
  vehicleNumber?: string | null;
  vehicleType?: 'BIKE' | 'TEMPO' | 'TRUCK' | 'VAN' | null;
  drivingLicenseNumber?: string | null;
  availabilityStatus?: 'AVAILABLE' | 'ON_TRIP' | 'OFFLINE' | null;
  // Common banking
  bankDetails?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;
  private readonly PROFILE_CACHE_KEY = 'cropdeal_user_profile';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getProfile(role: UserRole): Observable<UserProfileData> {
    let endpoint = '';
    switch (role) {
      case 'FARMER':
        endpoint = `${this.apiUrl}/farmers/me`;
        break;
      case 'DEALER':
        endpoint = `${this.apiUrl}/dealers/me`;
        break;
      case 'DELIVERY_PARTNER':
        endpoint = `${this.apiUrl}/delivery-partners/me`;
        break;
      default:
        return of(this.getFallbackProfile(role));
    }

    return this.http.get<any>(endpoint).pipe(
      tap((res) => {
        if (res) {
          const profile = this.mapBackendResponse(res, role);
          localStorage.setItem(this.PROFILE_CACHE_KEY, JSON.stringify(profile));
        }
      }),
      catchError(() => {
        return of(this.getFallbackProfile(role));
      })
    );
  }

  updateProfile(role: UserRole, data: UserProfileData): Observable<any> {
    let endpoint = '';
    let payload: any = {
      name: data.name,
      phone: data.phone,
      address: data.address,
      bankDetails: data.bankDetails
    };

    switch (role) {
      case 'FARMER':
        endpoint = `${this.apiUrl}/farmers/me`;
        payload.farmLocation = data.farmLocation;
        break;
      case 'DEALER':
        endpoint = `${this.apiUrl}/dealers/me`;
        payload.businessName = data.businessName;
        break;
      case 'DELIVERY_PARTNER':
        endpoint = `${this.apiUrl}/delivery-partners/me`;
        payload.vehicleNumber = data.vehicleNumber;
        payload.vehicleType = data.vehicleType || 'TRUCK';
        payload.drivingLicenseNumber = data.drivingLicenseNumber;
        payload.availabilityStatus = data.availabilityStatus || 'AVAILABLE';
        break;
      default:
        // Admin or local fallback
        this.saveLocalProfile(data);
        return of(data);
    }

    return this.http.put<any>(endpoint, payload).pipe(
      tap((res) => {
        this.saveLocalProfile(data);
      }),
      catchError(() => {
        // Fallback save in local state
        this.saveLocalProfile(data);
        return of(data);
      })
    );
  }

  private saveLocalProfile(data: UserProfileData): void {
    localStorage.setItem(this.PROFILE_CACHE_KEY, JSON.stringify(data));
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.authService.updateStoredUser({
        ...currentUser,
        fullName: data.name || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined
      });
    }

    // Propagate to master users so Admin User Management and Quick Logins reflect the changes immediately
    this.updateMasterUser({
      role: data.role || undefined,
      fullName: data.name || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined
    });
  }

  private mapBackendResponse(res: any, role: UserRole): UserProfileData {
    return {
      userId: res.userId != null ? res.userId : (res.id != null ? res.id : null),
      name: res.name != null ? res.name : (res.fullName != null ? res.fullName : null),
      email: res.email != null ? res.email : null,
      phone: res.phone != null ? res.phone : null,
      address: res.address != null ? res.address : null,
      role: role,
      farmLocation: res.farmLocation != null ? res.farmLocation : null,
      businessName: res.businessName != null ? res.businessName : null,
      vehicleNumber: res.vehicleNumber != null ? res.vehicleNumber : null,
      vehicleType: res.vehicleType != null ? res.vehicleType : null,
      drivingLicenseNumber: res.drivingLicenseNumber != null ? res.drivingLicenseNumber : null,
      availabilityStatus: res.availabilityStatus != null ? res.availabilityStatus : null,
      bankDetails: res.bankDetails != null ? res.bankDetails : null
    };
  }

  private getFallbackProfile(role: UserRole): UserProfileData {
    const cached = localStorage.getItem(this.PROFILE_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.role === role) return parsed;
      } catch {}
    }

    const currentUser = this.authService.currentUserValue;

    return {
      userId: currentUser?.id || currentUser?.userId || null,
      name: currentUser?.fullName || currentUser?.username || null,
      email: currentUser?.email || null,
      phone: currentUser?.phone || null,
      address: currentUser?.address || null,
      role: role,
      farmLocation: (currentUser as any)?.farmLocation || null,
      businessName: (currentUser as any)?.businessName || null,
      vehicleNumber: (currentUser as any)?.vehicleNumber || null,
      vehicleType: (currentUser as any)?.vehicleType || null,
      drivingLicenseNumber: (currentUser as any)?.drivingLicenseNumber || null,
      availabilityStatus: (currentUser as any)?.availabilityStatus || null,
      bankDetails: (currentUser as any)?.bankDetails || null
    };
  }

  private readonly MASTER_USERS_KEY = 'cropdeal_users_master';

  getMasterUsers(): User[] {
    const raw = localStorage.getItem(this.MASTER_USERS_KEY);
    if (raw) {
      try {
        const parsed: User[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let healed = false;
          parsed.forEach(u => {
            const uLower = (u.username || '').toLowerCase();
            const uId = String(u.id || u.userId);
            if (uId === '4' || uLower.includes('admin')) {
              if (u.role !== 'ADMIN') {
                u.role = 'ADMIN';
                healed = true;
              }
              if (u.isBlocked || u.status === 'BLOCKED') {
                u.isBlocked = false;
                u.status = 'ACTIVE';
                healed = true;
              }
            } else if (uId === '2' || uLower.includes('dealer')) {
              if (u.role !== 'DEALER') {
                u.role = 'DEALER';
                healed = true;
              }
            } else if (uId === '3' || uLower.includes('delivery')) {
              if (u.role !== 'DELIVERY_PARTNER') {
                u.role = 'DELIVERY_PARTNER';
                healed = true;
              }
            } else if (uId === '1' || uLower.includes('farmer')) {
              if (u.role !== 'FARMER') {
                u.role = 'FARMER';
                healed = true;
              }
            }
          });
          if (healed) {
            localStorage.setItem(this.MASTER_USERS_KEY, JSON.stringify(parsed));
          }
          return parsed;
        }
      } catch {}
    }
    const defaults = this.getDefaultSeedUsers();
    localStorage.setItem(this.MASTER_USERS_KEY, JSON.stringify(defaults));
    return defaults;
  }

  getDefaultSeedUsers(): User[] {
    return [
      { id: '1', userId: '1', username: 'farmer@gmail.com', fullName: 'Ramesh Kumar (Farmer)', email: 'farmer@gmail.com', phone: '+91 98765 43210', role: 'FARMER', address: 'Khanna Mandi, Ludhiana, Punjab', status: 'ACTIVE', isBlocked: false, createdAt: '2026-08-10' },
      { id: '2', userId: '2', username: 'dealer@gmail.com', fullName: 'Super Agros (Dealer)', email: 'dealer@gmail.com', phone: '+91 98765 43211', role: 'DEALER', address: 'Commercial Grain Terminal, New Delhi', status: 'ACTIVE', isBlocked: false, createdAt: '2026-08-12' },
      { id: '3', userId: '3', username: 'delivery@gmail.com', fullName: 'Kisan Express Logistics', email: 'delivery@gmail.com', phone: '+91 98765 43212', role: 'DELIVERY_PARTNER', address: 'Northern Freight Corridor Yard 3', status: 'ACTIVE', isBlocked: false, createdAt: '2026-08-20' },
      { id: '4', userId: '4', username: 'admin@gmail.com', fullName: 'System Administrator', email: 'admin@gmail.com', phone: '+91 99999 99999', role: 'ADMIN', address: 'CropDeal Headquarters, Tech Park', status: 'ACTIVE', isBlocked: false, createdAt: '2026-08-01' }
    ];
  }

  updateMasterUser(updatedData: Partial<User>): void {
    const users = this.getMasterUsers();
    let idx = users.findIndex(u => {
      if (updatedData.id && (String(u.id) === String(updatedData.id) || String(u.userId) === String(updatedData.id))) return true;
      if (updatedData.email && u.email && u.email.toLowerCase() === updatedData.email.toLowerCase()) return true;
      if (updatedData.username && u.username && u.username.toLowerCase() === updatedData.username.toLowerCase()) return true;
      return false;
    });
    if (idx === -1 && updatedData.role) {
      idx = users.findIndex(u => u.role === updatedData.role);
    }
    if (idx !== -1) {
      // Prevent blocking any admin account
      if (users[idx].role === 'ADMIN' || users[idx].username === 'admin') {
        updatedData.isBlocked = false;
        updatedData.status = 'ACTIVE';
      }
      users[idx] = { ...users[idx], ...updatedData };
      localStorage.setItem(this.MASTER_USERS_KEY, JSON.stringify(users));

      // Also update currently stored user in AuthService if applicable
      const curr = this.authService.currentUserValue;
      if (curr && (curr.id === users[idx].id || curr.userId === users[idx].userId || curr.email === users[idx].email)) {
        this.authService.updateStoredUser({ ...curr, ...users[idx] });
      }
    }
  }

  getUserByRole(role: UserRole): User {
    const users = this.getMasterUsers();
    const found = users.find(u => u.role === role);
    return found || this.getDefaultSeedUsers().find(u => u.role === role)!;
  }
}
