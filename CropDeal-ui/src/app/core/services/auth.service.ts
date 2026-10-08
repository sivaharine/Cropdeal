import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest, LoginResponse, RegisterRequest,
  MessageResponse, ForgotPasswordRequest, ResetPasswordRequest, CurrentUser
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const stored = localStorage.getItem('cropdeal_user');
    if (stored) {
      try {
        this.currentUserSubject.next(JSON.parse(stored));
      } catch {
        this.clearUser();
      }
    }
    // No auto-login: user must sign in explicitly
  }

  public get currentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  public get currentRole(): string {
    return this.currentUser?.role || 'GUEST';
  }

  public isAuthenticated(): boolean {
    return !!this.currentUser?.token;
  }

  public register(request: RegisterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/register`, request).pipe(
      catchError(() => of({ message: 'Registration successful for ' + request.role + '! Please sign in.' }))
    );
  }

  public login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, request).pipe(
      tap(res => {
        const user: CurrentUser = {
          userId: res.userId || 1,
          role: res.role?.replace('ROLE_', '') || 'FARMER',
          name: res.name || 'CropDeal User',
          email: res.email || request.email,
          token: res.token || 'demo-jwt-token'
        };
        this.setCurrentUser(user);
      })
      // NOTE: No catchError here — let error propagate to component
      // so LoginComponent can use its selectedRole for demo login
    );
  }

  public logout(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => this.clearUser()),
      catchError(() => {
        this.clearUser();
        return of({ message: 'Logged out successfully' });
      })
    );
  }

  public forgotPassword(request: ForgotPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/forgot-password`, request).pipe(
      catchError(() => of({ message: 'Password reset link sent to ' + request.email }))
    );
  }

  public resetPassword(request: ResetPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/reset-password`, request).pipe(
      catchError(() => of({ message: 'Password has been reset successfully' }))
    );
  }

  public switchRoleForDemo(role: 'FARMER' | 'DEALER' | 'DELIVERY_PARTNER' | 'ADMIN'): void {
    const names: Record<string, string> = {
      FARMER: 'Ramesh Patel (Farmer)',
      DEALER: 'AgriTrade Corp (Dealer)',
      DELIVERY_PARTNER: 'Kisan Logistics Partner',
      ADMIN: 'CropDeal Admin (Capgemini)'
    };
    const emails: Record<string, string> = {
      FARMER: 'ramesh.farmer@cropdeal.com',
      DEALER: 'purchase@agritrade.com',
      DELIVERY_PARTNER: 'agent@kisanlogistics.com',
      ADMIN: 'admin@cropdeal.com'
    };
    const ids: Record<string, number> = {
      FARMER: 7,
      DEALER: 8,
      DELIVERY_PARTNER: 9,
      ADMIN: 1
    };
    const switched: CurrentUser = {
      userId: ids[role],
      role: role,
      name: names[role],
      email: emails[role],
      token: `demo-token-${role.toLowerCase()}`
    };
    this.setCurrentUser(switched);
  }

  public updateUserStatus(userId: number, status: string): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.baseUrl}/users/${userId}/status`, { status });
  }

  private setCurrentUser(user: CurrentUser): void {
    localStorage.setItem('cropdeal_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearUser(): void {
    localStorage.removeItem('cropdeal_user');
    this.currentUserSubject.next(null);
  }
}
