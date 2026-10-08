import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { User, UserRole } from '../models/user.model';

export interface UserProfileData {
  userId?: string | number;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
  // Farmer specific
  farmLocation?: string;
  // Dealer specific
  businessName?: string;
  // Delivery partner specific
  vehicleNumber?: string;
  vehicleType?: 'BIKE' | 'TEMPO' | 'TRUCK' | 'VAN';
  drivingLicenseNumber?: string;
  availabilityStatus?: 'AVAILABLE' | 'ON_TRIP' | 'OFFLINE';
  // Common banking
  bankDetails?: string;
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
        fullName: data.name,
        phone: data.phone,
        address: data.address
      });
    }

    // Propagate to master users so Admin User Management and Quick Logins reflect the changes immediately
    this.updateMasterUser({
      role: data.role,
      fullName: data.name,
      phone: data.phone,
      address: data.address
    });
  }

  private mapBackendResponse(res: any, role: UserRole): UserProfileData {
    return {
      userId: res.userId || res.id,
      name: res.name || res.fullName || '',
      email: res.email || '',
      phone: res.phone || '',
      address: res.address || '',
      role: role,
      farmLocation: res.farmLocation,
      businessName: res.businessName,
      vehicleNumber: res.vehicleNumber,
      vehicleType: res.vehicleType,
      drivingLicenseNumber: res.drivingLicenseNumber,
      availabilityStatus: res.availabilityStatus,
      bankDetails: res.bankDetails
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
    const isFarmer = role === 'FARMER';
    const isDealer = role === 'DEALER';
    const isPartner = role === 'DELIVERY_PARTNER';

    return {
      userId: currentUser?.id || currentUser?.userId || 'u-101',
      name: currentUser?.fullName || (isFarmer ? 'Sardar Gurpreet Singh' : (isDealer ? 'Apex Agro Mills Ltd' : (isPartner ? 'Kisan Express Agro Logistics' : 'System Administrator'))),
      email: currentUser?.email || `${role.toLowerCase()}@cropdeal.in`,
      phone: currentUser?.phone || (isFarmer ? '9814011223' : (isDealer ? '9872255667' : (isPartner ? '9888822110' : '9999999999'))),
      address: currentUser?.address || (isFarmer ? 'Khanna Mandi, Ludhiana, Punjab' : (isDealer ? 'Commercial Grain Terminal, New Delhi' : (isPartner ? 'Northern Freight Corridor Yard 3' : 'CropDeal Headquarters, Tech Park'))),
      role: role,
      farmLocation: isFarmer ? 'Khanna Mandi, Block 4, Ludhiana' : undefined,
      businessName: isDealer ? 'Apex Agro Mills Private Limited' : undefined,
      vehicleNumber: isPartner ? 'PB-10-CZ-4921' : undefined,
      vehicleType: isPartner ? 'TRUCK' : undefined,
      drivingLicenseNumber: isPartner ? 'DL-PB-20210049281' : undefined,
      availabilityStatus: isPartner ? 'AVAILABLE' : undefined,
      bankDetails: 'State Bank of India • A/C: 39482910482 • IFSC: SBIN0001423'
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
            if (uId === '1' || uLower === 'admin' || (u.email && u.email.toLowerCase().includes('admin@cropdeal'))) {
              if (u.role !== 'ADMIN') {
                u.role = 'ADMIN';
                healed = true;
              }
              if (u.isBlocked || u.status === 'BLOCKED') {
                u.isBlocked = false;
                u.status = 'ACTIVE';
                healed = true;
              }
            } else if (uId === '4' || uLower === 'dealer' || (u.email && u.email.toLowerCase().includes('dealer@'))) {
              if (u.role !== 'DEALER') {
                u.role = 'DEALER';
                healed = true;
              }
            } else if (uId === '3' || uLower === 'delivery_partner' || (u.email && u.email.toLowerCase().includes('delivery@'))) {
              if (u.role !== 'DELIVERY_PARTNER') {
                u.role = 'DELIVERY_PARTNER';
                healed = true;
              }
            } else if (['farmer'].includes(uLower)) {
              if (u.role !== 'FARMER') {
                u.role = 'FARMER';
                healed = true;
              }
              if (u.isBlocked || u.status === 'BLOCKED') {
                u.isBlocked = false;
                u.status = 'ACTIVE';
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
      { id: '1', userId: '1', username: 'admin', fullName: 'System Administrator', email: 'admin@cropdeal.com', phone: '+91 99999 99999', role: 'ADMIN', address: 'CropDeal Headquarters, Tech Park', status: 'ACTIVE', isBlocked: false, createdAt: '2026-08-01' },
      { id: '2', userId: '2', username: 'ramesh', fullName: 'Ramesh Farmer', email: 'ramesh@cropdeal.in', phone: '+91 98765 43210', role: 'FARMER', address: 'Khanna Mandi, Ludhiana, Punjab', status: 'ACTIVE', isBlocked: false, createdAt: '2026-08-10' },
      { id: '3', userId: '3', username: 'delivery_partner', fullName: 'Kisan Express Agro Logistics', email: 'delivery@cropdeal.in', phone: '+91 98888 22110', role: 'DELIVERY_PARTNER', address: 'Northern Freight Corridor Yard 3', status: 'ACTIVE', isBlocked: false, createdAt: '2026-08-20' },
      { id: '4', userId: '4', username: 'dealer', fullName: 'Apex Agro Mills Ltd', email: 'dealer@cropdeal.in', phone: '+91 98722 55667', role: 'DEALER', address: 'Commercial Grain Terminal, New Delhi', status: 'ACTIVE', isBlocked: false, createdAt: '2026-08-12' },
      { id: '11', userId: '11', username: 'farmer', fullName: 'Sardar Gurpreet Singh', email: 'farmer@cropdeal.in', phone: '+91 98140 11223', role: 'FARMER', address: 'Khanna Mandi, Ludhiana, Punjab', status: 'ACTIVE', isBlocked: false, createdAt: '2026-08-10' }
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
    if (idx === -1 && !updatedData.id && updatedData.role) {
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
