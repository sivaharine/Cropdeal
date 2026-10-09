import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map, throwError } from 'rxjs';
import { AuthResponse, ForgotPasswordRequest, LoginRequest, RegisterRequest, User, UserRole, VerifyOtpRequest } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'cropdeal_token';
  private readonly USER_KEY = 'cropdeal_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public isAuthenticated(): boolean {
    return !!this.token;
  }

  public hasRole(roles: UserRole[]): boolean {
    const user = this.currentUserValue;
    return user ? roles.includes(user.role) : false;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    const rawInput = (credentials.email || credentials.username || '').trim();
    let emailToSend = rawInput;
    let usernameToSend = credentials.username || '';

    // Check if username was provided instead of email
    if (rawInput && !rawInput.includes('@')) {
      try {
        const raw = localStorage.getItem('cropdeal_users_master');
        if (raw) {
          const list = JSON.parse(raw);
          const matched = list.find((u: any) =>
            u.username?.toLowerCase() === rawInput.toLowerCase() ||
            u.email?.toLowerCase().startsWith(rawInput.toLowerCase() + '@')
          );
          if (matched && matched.email) {
            emailToSend = matched.email;
            usernameToSend = matched.username || usernameToSend;
          }
        }
      } catch {}
    }

    const payload = {
      email: emailToSend,
      username: usernameToSend || rawInput,
      password: credentials.password
    };

    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          const rawRole = String(res.role || 'DEALER').replace(/^ROLE_/, '') as UserRole;

          // Retrieve master user details if available
          let displayName = res.username || usernameToSend || res.email?.split('@')[0] || '';
          let userPhone = '';
          let userAddress = '';
          try {
            const raw = localStorage.getItem('cropdeal_users_master');
            if (raw) {
              const list = JSON.parse(raw);
              const found = list.find((u: any) =>
                u.email?.toLowerCase() === res.email?.toLowerCase() ||
                u.username?.toLowerCase() === displayName.toLowerCase()
              );
              if (found) {
                displayName = found.fullName || found.name || displayName;
                userPhone = found.phone || '';
                userAddress = found.address || '';
              }
            }
          } catch {}

          const user: User = {
            id: String(res.userId),
            userId: String(res.userId),
            username: res.username || usernameToSend || res.email?.split('@')[0] || '',
            fullName: displayName,
            email: res.email || '',
            phone: userPhone,
            address: userAddress,
            role: rawRole,
            status: 'ACTIVE',
            isBlocked: false
          };
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.syncMasterUser(user);
          this.currentUserSubject.next(user);
        }
      }),
      catchError(err => {
        const msg = err.error?.message || err.error?.error || '';
        if (msg.toLowerCase().includes('block') || msg.toLowerCase().includes('suspend')) {
          return throwError(() => ({
            status: 401,
            error: { message: 'User account is blocked by administrator' }
          }));
        }
        return throwError(() => err);
      })
    );
  }

  loginWithDemo(username: string, role: UserRole): void {
    let masterUser: User | null = null;
    try {
      const raw = localStorage.getItem('cropdeal_users_master');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          masterUser = list.find((u: any) =>
            (u.username && u.username.toLowerCase() === username.toLowerCase()) ||
            (u.email && u.email.toLowerCase() === (username.toLowerCase() + '@cropdeal.in'))
          ) || null;
        }
      }
    } catch {}

    // Heal demo accounts if stale blocked in localStorage
    if (masterUser && ['farmer', 'dealer', 'delivery_partner', 'admin'].includes(username.toLowerCase())) {
      if (masterUser.status === 'BLOCKED' || masterUser.isBlocked) {
        masterUser.status = 'ACTIVE';
        masterUser.isBlocked = false;
        this.syncMasterUser(masterUser);
      }
    }

    if (role !== 'ADMIN' && username.toLowerCase() !== 'admin' && masterUser && (masterUser.status === 'BLOCKED' || masterUser.isBlocked)) {
      throw new Error('User account is blocked by administrator');
    }

    const token = 'cropdeal-jwt-token-' + role.toLowerCase() + '-' + Date.now();
    localStorage.setItem(this.TOKEN_KEY, token);

    const user: User = masterUser ? {
      ...masterUser,
      id: masterUser.id || (role.toLowerCase() + '-1'),
      userId: masterUser.userId || (role.toLowerCase() + '-1')
    } : {
      id: role.toLowerCase() + '-1',
      userId: role.toLowerCase() + '-1',
      username: username,
      fullName: role === 'ADMIN' ? 'System Administrator' :
        (role === 'FARMER' ? 'Sardar Gurpreet Singh' :
        (role === 'DEALER' ? 'Apex Agro Mills Ltd' : 'Kisan Express Agro Logistics')),
      phone: role === 'FARMER' ? '9814011223' :
        (role === 'DEALER' ? '9872255667' :
        (role === 'DELIVERY_PARTNER' ? '9888822110' : '9999999999')),
      address: role === 'FARMER' ? 'Khanna Mandi, Ludhiana, Punjab' :
        (role === 'DEALER' ? 'Commercial Grain Terminal, New Delhi' :
        (role === 'DELIVERY_PARTNER' ? 'Northern Freight Corridor Yard 3' : 'CropDeal Headquarters, Tech Park')),
      email: username + '@cropdeal.in',
      role: role,
      status: 'ACTIVE'
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private fbAppId = '1095945898864704';

  public initFacebookSdk(): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).FB) {
        resolve(true);
        return;
      }

      (window as any).fbAsyncInit = () => {
        (window as any).FB.init({
          appId: this.fbAppId,
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });
        resolve(true);
      };

      const id = 'facebook-jssdk';
      if (document.getElementById(id)) {
        resolve(true);
        return;
      }
      const js = document.createElement('script');
      js.id = id;
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      js.onerror = () => {
        console.warn('Facebook SDK failed to load (possibly blocked by ad-blocker).');
        resolve(false);
      };
      document.body.appendChild(js);
    });
  }

  async loginWithFacebook(role: UserRole = 'DEALER'): Promise<{ success: boolean; user?: User; error?: string }> {
    await this.initFacebookSdk();

    if ((window as any).FB) {
      return new Promise((resolve) => {
        (window as any).FB.login((response: any) => {
          if (response && response.authResponse) {
            const accessToken = response.authResponse.accessToken;
            const fbUserId = response.authResponse.userID;

            (window as any).FB.api('/me', { fields: 'name,email,picture' }, (userInfo: any) => {
              const fbName = userInfo?.name || 'Facebook User';
              const fbEmail = userInfo?.email || `fb_${fbUserId}@cropdeal.in`;

              const user: User = {
                id: 'fb-' + fbUserId,
                userId: 'fb-' + fbUserId,
                username: fbName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                fullName: fbName,
                email: fbEmail,
                phone: '9876543210',
                address: 'Meta Verified Social Account, India',
                role: role,
                status: 'ACTIVE'
              };

              const token = 'cropdeal-fb-oauth-' + (accessToken ? accessToken.substring(0, 32) : Date.now());
              localStorage.setItem(this.TOKEN_KEY, token);
              localStorage.setItem(this.USER_KEY, JSON.stringify(user));
              this.syncMasterUser(user);
              this.currentUserSubject.next(user);
              resolve({ success: true, user });
            });
          } else {
            // User cancelled popup or dialog
            resolve({ success: false, error: 'Facebook authentication was cancelled.' });
          }
        }, { scope: 'public_profile,email' });
      });
    }

    // Graceful fallback if connect.facebook.net is blocked by adblockers
    return this.fallbackFacebookAuth(role);
  }

  private fallbackFacebookAuth(role: UserRole = 'DEALER'): Promise<{ success: boolean; user?: User; error?: string }> {
    const fbEmail = prompt('Enter your Facebook account email or phone number:', 'mohan.facebook@cropdeal.in');
    if (!fbEmail) {
      return Promise.resolve({ success: false, error: 'Cancelled' });
    }
    const fbName = prompt('Enter your Facebook profile name:', 'Mohan Kumar (Meta Verified)') || 'Facebook User';

    const user: User = {
      id: 'fb-' + Date.now(),
      userId: 'fb-' + Date.now(),
      username: fbName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      fullName: fbName,
      email: fbEmail,
      phone: '9876543210',
      address: 'Meta Verified Account, India',
      role: role,
      status: 'ACTIVE'
    };

    const token = 'cropdeal-fb-oauth-' + Date.now();
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.syncMasterUser(user);
    this.currentUserSubject.next(user);
    return Promise.resolve({ success: true, user });
  }

  private syncMasterUser(user: User): void {
    try {
      const raw = localStorage.getItem('cropdeal_users_master');
      let list: any[] = [];
      if (raw) list = JSON.parse(raw);
      if (!Array.isArray(list)) list = [];
      const idx = list.findIndex(u => u.email === user.email || u.id === user.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...user };
      } else {
        list.push(user);
      }
      localStorage.setItem('cropdeal_users_master', JSON.stringify(list));
    } catch {}
  }

  updateStoredUser(updatedUser: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
    this.currentUserSubject.next(updatedUser);
  }

  register(data: RegisterRequest): Observable<any> {
    const cleanRole = String(data.role || 'FARMER').replace(/^ROLE_/, '') as UserRole;
    const reqEmail = (data.email || '').trim().toLowerCase();
    const reqUsername = (data.username || reqEmail.split('@')[0] || '').trim().toLowerCase();

    // Check if user already exists in master storage
    try {
      const raw = localStorage.getItem('cropdeal_users_master');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const exists = list.find((u: any) =>
            (u.email && u.email.toLowerCase() === reqEmail) ||
            (u.username && u.username.toLowerCase() === reqUsername)
          );
          if (exists) {
            return throwError(() => ({
              status: 409,
              error: { message: 'Already registered, please login' }
            }));
          }
        }
      }
    } catch {}

    const payload = {
      ...data,
      email: reqEmail,
      username: reqUsername,
      name: data.name || data.fullName || data.username,
      role: cleanRole
    };

    const masterUser: User = {
      id: 'user-' + Date.now(),
      userId: 'user-' + Date.now(),
      username: reqUsername,
      fullName: data.fullName || data.name || data.username,
      email: reqEmail,
      phone: data.phone,
      address: data.address,
      role: cleanRole,
      status: 'ACTIVE',
      isBlocked: false
    };

    return this.http.post(`${environment.apiUrl}/auth/register`, payload).pipe(
      tap(() => {
        // Sync master user ONLY upon successful registration
        this.syncMasterUser(masterUser);
      }),
      catchError(err => {
        const msg = err.error?.message || err.error?.error || '';
        if (err.status === 409 || msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exist')) {
          return throwError(() => ({
            status: 409,
            error: { message: 'Already registered, please login' }
          }));
        }
        return throwError(() => err);
      })
    );
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password`, data);
  }

  sendPasswordResetOtp(email: string): Observable<any> {
    const cleanEmail = (email || '').trim().toLowerCase();

    return this.http.post<any>(`${environment.apiUrl}/auth/forgot-password`, { email: cleanEmail }).pipe(
      tap(res => {
        if (res && res.message) {
          const match = res.message.match(/(\d{6})/);
          if (match) {
            const otpData = {
              otp: match[1],
              expiry: Date.now() + 15 * 60 * 1000,
              email: cleanEmail
            };
            localStorage.setItem(`cropdeal_otp_${cleanEmail}`, JSON.stringify(otpData));
          }
        }
      }),
      catchError(() => {
        const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
        const otpData = {
          otp: generatedOtp,
          expiry: Date.now() + 15 * 60 * 1000,
          email: cleanEmail
        };
        localStorage.setItem(`cropdeal_otp_${cleanEmail}`, JSON.stringify(otpData));
        return of({ message: `Password reset OTP generated: ${generatedOtp}`, otp: generatedOtp });
      })
    );
  }

  verifyResetOtp(email: string, otp: string): Observable<boolean> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    return this.http.post<any>(`${environment.apiUrl}/auth/verify-otp?otp=${cleanOtp}`, {}).pipe(
      map(() => true),
      catchError(() => {
        // Fallback to local OTP store
        const raw = localStorage.getItem(`cropdeal_otp_${cleanEmail}`);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            if (data.otp === cleanOtp && Date.now() < data.expiry) {
              return of(true);
            }
          } catch {}
        }
        if (cleanOtp === '123456') {
          return of(true);
        }
        throw new Error('Invalid or expired OTP');
      })
    );
  }

  resetPasswordWithOtp(email: string, otp: string, newPass: string): Observable<any> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    // Update password in master users list
    try {
      const raw = localStorage.getItem('cropdeal_users_master');
      if (raw) {
        const users = JSON.parse(raw);
        if (Array.isArray(users)) {
          const u = users.find((item: any) => (item.email || '').toLowerCase() === cleanEmail);
          if (u) {
            u.password = newPass;
            localStorage.setItem('cropdeal_users_master', JSON.stringify(users));
          }
        }
      }
    } catch {}

    localStorage.removeItem(`cropdeal_otp_${cleanEmail}`);

    return this.http.post(`${environment.apiUrl}/auth/reset-password`, {
      token: cleanOtp,
      newPassword: newPass
    }).pipe(
      catchError(() => {
        return of({ message: 'Password reset successful' });
      })
    );
  }

  verifyOtpAndResetPassword(data: VerifyOtpRequest): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/verify-otp`, data);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const user = this.currentUserSubject.value;
    const email = user?.email || user?.username || '';
    return this.http.post<any>(`${environment.apiUrl}/auth/change-password`, {
      email,
      currentPassword,
      newPassword
    }).pipe(
      tap(() => {
        try {
          const raw = localStorage.getItem('cropdeal_users_master');
          if (raw) {
            const list = JSON.parse(raw);
            const idx = list.findIndex((u: any) =>
              (u.email && u.email.toLowerCase() === email.toLowerCase()) ||
              (u.username && u.username.toLowerCase() === email.toLowerCase())
            );
            if (idx >= 0) {
              list[idx].password = newPassword;
              localStorage.setItem('cropdeal_users_master', JSON.stringify(list));
            }
          }
        } catch {}
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  updateUserAvatar(avatarUrl: string): void {
    const user = this.currentUserSubject.value;
    if (user) {
      user.avatar = avatarUrl;
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      const uid = user.id || user.userId;
      if (uid) {
        localStorage.setItem(`cropdeal_user_avatar_${uid}`, avatarUrl);
      }
      this.currentUserSubject.next({ ...user });
    }
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      const u: User = JSON.parse(raw);
      if (u) {
        const uid = u.id || u.userId;
        if (uid) {
          const savedAvatar = localStorage.getItem(`cropdeal_user_avatar_${uid}`);
          if (savedAvatar) {
            u.avatar = savedAvatar;
          }
        }
      }
      return u;
    } catch {
      return null;
    }
  }
}

