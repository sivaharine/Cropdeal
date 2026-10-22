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
            name: displayName,
            username: res.username || usernameToSend || res.email?.split('@')[0] || '',
            fullName: displayName,
            email: res.email || '',
            phone: userPhone,
            address: userAddress,
            role: rawRole,
            status: 'ACTIVE',
            isBlocked: false,
            createdAt: new Date().toISOString()
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
            (u.email && u.email.toLowerCase() === username.toLowerCase()) ||
            (u.role && u.role === role) ||
            (u.email && u.email.toLowerCase() === (username.toLowerCase() + '@cropdeal.in'))
          ) || null;
        }
      }
    } catch {}

    if (role !== 'ADMIN' && username.toLowerCase() !== 'admin' && username.toLowerCase() !== 'admin@gmail.com' && masterUser && (masterUser.status === 'BLOCKED' || masterUser.isBlocked)) {
      throw new Error('User account is blocked by administrator');
    }

    const token = 'cropdeal-jwt-token-' + role.toLowerCase() + '-' + Date.now();
    localStorage.setItem(this.TOKEN_KEY, token);

    const defaultIds: Record<string, string> = {
      'FARMER': '1',
      'DEALER': '2',
      'DELIVERY_PARTNER': '3',
      'ADMIN': '4'
    };

    const fallbackFullName = role === 'ADMIN' ? 'System Administrator' :
      (role === 'FARMER' ? 'Ramesh Kumar (Farmer)' :
      (role === 'DEALER' ? 'Super Agros (Dealer)' : 'Kisan Express Logistics'));

    const user: User = masterUser ? {
      ...masterUser,
      id: String(masterUser.id || defaultIds[role] || '1'),
      userId: String(masterUser.userId || masterUser.id || defaultIds[role] || '1'),
      name: masterUser.name || masterUser.fullName || masterUser.username || fallbackFullName,
      fullName: masterUser.fullName || masterUser.name || masterUser.username || fallbackFullName,
      createdAt: masterUser.createdAt || '2026-10-09'
    } : {
      id: defaultIds[role] || '1',
      userId: defaultIds[role] || '1',
      name: fallbackFullName,
      username: username,
      fullName: fallbackFullName,
      phone: role === 'FARMER' ? '+91 98765 43210' :
        (role === 'DEALER' ? '+91 98765 43211' :
        (role === 'DELIVERY_PARTNER' ? '+91 98765 43212' : '+91 99999 99999')),
      address: role === 'FARMER' ? 'Khanna Mandi, Ludhiana, Punjab' :
        (role === 'DEALER' ? 'Commercial Grain Terminal, New Delhi' :
        (role === 'DELIVERY_PARTNER' ? 'Northern Freight Corridor Yard 3' : 'CropDeal Headquarters, Tech Park')),
      email: username.includes('@') ? username : (role.toLowerCase() + '@gmail.com'),
      role: role,
      status: 'ACTIVE',
      createdAt: '2026-10-09'
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  // -----------------------------------------------------------------------
  // Facebook Login
  // NOTE: A valid Facebook App ID from Meta Developer Portal is required
  // for the real FB JS SDK popup to work. Without one, loginWithFacebook()
  // falls through to the backend mock-token flow automatically.
  // To enable real Facebook OAuth:
  //   1. Create an app at https://developers.facebook.com/
  //   2. Add your domain under "Valid OAuth Redirect URIs"
  //   3. Replace the fbAppId below with your real App ID
  // -----------------------------------------------------------------------
  private fbAppId = 'YOUR_FACEBOOK_APP_ID'; // Replace with real App ID to enable FB SDK popup

  async loginWithFacebook(role: UserRole = 'DEALER'): Promise<{ success: boolean; user?: User; error?: string }> {
    // Only attempt the real FB SDK flow if a proper App ID has been configured
    const hasRealAppId = this.fbAppId && this.fbAppId !== 'YOUR_FACEBOOK_APP_ID' && /^\d{10,20}$/.test(this.fbAppId);

    if (hasRealAppId) {
      const sdkLoaded = await this.initFacebookSdk();
      if (sdkLoaded && (window as any).FB) {
        return new Promise((resolve) => {
          (window as any).FB.login((response: any) => {
            if (response && response.authResponse) {
              const accessToken = response.authResponse.accessToken;
              // Send the real Facebook access token to our backend for verification and JWT issuance
              this.http.post<any>(`${environment.apiUrl}/auth/facebook`, {
                accessToken,
                role
              }).subscribe({
                next: (res) => {
                  if (res && res.token) {
                    const user = this.buildUserFromAuthResponse(res, role);
                    localStorage.setItem(this.TOKEN_KEY, res.token);
                    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
                    this.syncMasterUser(user);
                    this.currentUserSubject.next(user);
                    resolve({ success: true, user });
                  } else {
                    resolve({ success: false, error: 'Facebook login failed: Invalid response from server.' });
                  }
                },
                error: (err) => {
                  const msg = err.error?.message || err.message || 'Facebook login failed. Please try again.';
                  resolve({ success: false, error: msg });
                }
              });
            } else {
              resolve({ success: false, error: 'Facebook authentication was cancelled.' });
            }
          }, { scope: 'public_profile,email' });
        });
      }
    }

    // No valid App ID configured — use backend mock-token flow (dev/demo mode)
    return this.fallbackFacebookAuth(role);
  }

  private initFacebookSdk(): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).FB) { resolve(true); return; }

      (window as any).fbAsyncInit = () => {
        (window as any).FB.init({ appId: this.fbAppId, cookie: true, xfbml: true, version: 'v19.0' });
        resolve(true);
      };

      const id = 'facebook-jssdk';
      if (document.getElementById(id)) { resolve(true); return; }
      const js = document.createElement('script');
      js.id = id;
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      js.onerror = () => { console.warn('Facebook SDK failed to load.'); resolve(false); };
      document.body.appendChild(js);
    });
  }

  private buildUserFromAuthResponse(res: any, role: UserRole): User {
    const rawRole = String(res.role || role).replace(/^ROLE_/, '') as UserRole;
    const fbName = res.username || res.email?.split('@')[0] || 'Facebook User';
    return {
      id: String(res.userId),
      userId: String(res.userId),
      username: res.username || fbName,
      fullName: res.username || fbName,
      name: res.username || fbName,
      email: res.email || '',
      phone: '',
      address: '',
      role: rawRole,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
  }

  private fallbackFacebookAuth(_role: UserRole = 'DEALER'): Promise<{ success: boolean; user?: User; error?: string }> {
    // Facebook SDK unavailable (no valid App ID configured).
    // The UI should show its own modal instead of auto-logging in.
    return Promise.resolve({ success: false, error: 'FB_SDK_UNAVAILABLE' });
  }

  /**
   * Mock Facebook login used by the in-app Facebook modal.
   * Sends a mock_fb_ token to the backend and overrides the stored
   * user's email with the value entered by the user in the modal.
   */
  loginWithFacebookMock(mockToken: string, email: string, role: UserRole = 'DEALER'): Promise<{ success: boolean; user?: User; error?: string }> {
    return new Promise((resolve) => {
      this.http.post<any>(`${environment.apiUrl}/auth/facebook`, {
        accessToken: mockToken,
        role
      }).subscribe({
        next: (res) => {
          if (res && res.token) {
            const rawRole = String(res.role || role).replace(/^ROLE_/, '') as UserRole;
            // Use the email the user typed in the modal as the display identity
            const displayName = email.split('@')[0];
            const user: User = {
              id: String(res.userId),
              userId: String(res.userId),
              username: res.username || displayName,
              fullName: res.username || displayName,
              name: res.username || displayName,
              email: email,          // override with modal email for display
              phone: '',
              address: '',
              role: rawRole,
              status: 'ACTIVE',
              createdAt: new Date().toISOString()
            };
            localStorage.setItem(this.TOKEN_KEY, res.token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            this.syncMasterUser(user);
            this.currentUserSubject.next(user);
            resolve({ success: true, user });
          } else {
            resolve({ success: false, error: 'Facebook login failed: Invalid server response.' });
          }
        },
        error: (err) => {
          const msg = err.error?.message || err.message || 'Facebook login failed. Please try again.';
          resolve({ success: false, error: msg });
        }
      });
    });
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
      name: data.fullName || data.name || data.username,
      username: reqUsername,
      fullName: data.fullName || data.name || data.username,
      email: reqEmail,
      phone: data.phone,
      address: data.address,
      role: cleanRole,
      status: 'ACTIVE',
      isBlocked: false,
      createdAt: new Date().toISOString()
    };
//AuthService dispatches HTTP POST
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
      catchError((err) => {
        if (err.status === 404) {
          return throwError(() => new Error('No user account found with this email. Please check the email address.'));
        }
        if (err.status === 400) {
          return throwError(() => new Error(err.error?.message || 'Invalid email address provided.'));
        }
        if (err.status === 0) {
          const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
          const otpData = {
            otp: generatedOtp,
            expiry: Date.now() + 15 * 60 * 1000,
            email: cleanEmail
          };
          localStorage.setItem(`cropdeal_otp_${cleanEmail}`, JSON.stringify(otpData));
          return of({ message: `Password reset OTP generated: ${generatedOtp}`, otp: generatedOtp });
        }
        return throwError(() => new Error(err.error?.message || 'Failed to send OTP email. Please try again.'));
      })
    );
  }

  verifyResetOtp(email: string, otp: string): Observable<boolean> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!cleanOtp) {
      return throwError(() => new Error('Please enter the OTP code'));
    }

    return this.http.post<any>(`${environment.apiUrl}/auth/verify-otp?otp=${cleanOtp}`, {}).pipe(
      map(() => true),
      catchError((err) => {
        // Only if offline (status === 0), verify against local store
        if (err.status === 0) {
          const raw = localStorage.getItem(`cropdeal_otp_${cleanEmail}`);
          if (raw) {
            try {
              const data = JSON.parse(raw);
              if (data.otp === cleanOtp && Date.now() < data.expiry) {
                return of(true);
              }
            } catch {}
          }
        }
        return throwError(() => new Error(err?.error?.message || 'Invalid or expired OTP. Please check the code sent to your email.'));
      })
    );
  }

  resetPasswordWithOtp(email: string, otp: string, newPass: string): Observable<any> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    return this.http.post(`${environment.apiUrl}/auth/reset-password`, {
      token: cleanOtp,
      newPassword: newPass
    }).pipe(
      tap(() => {
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
      }),
      catchError((err) => {
        if (err.status === 0) {
          const raw = localStorage.getItem(`cropdeal_otp_${cleanEmail}`);
          if (raw) {
            try {
              const data = JSON.parse(raw);
              if (data.otp === cleanOtp && Date.now() < data.expiry) {
                try {
                  const rawUsers = localStorage.getItem('cropdeal_users_master');
                  if (rawUsers) {
                    const users = JSON.parse(rawUsers);
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
                return of({ message: 'Password reset successful' });
              }
            } catch {}
          }
        }
        return throwError(() => new Error(err?.error?.message || 'Password reset failed. Invalid or expired OTP.'));
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
    const token = this.token;

    // Clear the local session immediately — user is logged out at once
    // regardless of whether the backend call succeeds.
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);

    // Notify the backend to invalidate the token server-side (best-effort).
    // The authInterceptor automatically attaches the Bearer token, so we
    // must read it before clearing localStorage (done above via `token`).
    if (token) {
      this.http.post(
        `${environment.apiUrl}/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      ).pipe(
        catchError(error => {
          console.warn('Backend logout notification failed:', error);
          return of(null);
        })
      ).subscribe();
    }
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
        if (!u.name) {
          u.name = u.fullName || u.username || 'Verified Member';
        }
        if (!u.fullName) {
          u.fullName = u.name || u.username || 'Verified Member';
        }
        if (!u.createdAt || String(u.createdAt).includes('2024') || String(u.createdAt).includes('2004')) {
          u.createdAt = '2026-10-09';
        }
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

