import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationResponse, NotificationRequest, OtpNotificationRequest, DeliveryCompletedNotificationRequest } from '../models/models';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

const NOTIF_KEY_PREFIX = 'cropdeal_notifs_'; // + userId

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  // ── Toast stream (ephemeral floating popup banner) ────────────
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  // ── Persistent Notification Bell Stream ───────────────────────
  private notifsSubject = new BehaviorSubject<NotificationResponse[]>([]);
  public notifications$ = this.notifsSubject.asObservable();

  private currentUserId: number | null = null;
  private currentUserEmail: string = '';

  constructor(private http: HttpClient) {
    this.initFromLocalStorage();
  }

  /** Initialize immediately on service start using stored credentials */
  private initFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('cropdeal_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.userId) {
          this.currentUserId = Number(u.userId);
          this.currentUserEmail = u.email || '';
          const local = this.loadFromStorage(this.currentUserId);
          this.notifsSubject.next(local);
        }
      }
    } catch {}
  }

  /** Helper to get or restore active userId */
  private getActiveUserId(): number | null {
    if (this.currentUserId !== null) return this.currentUserId;
    try {
      const stored = localStorage.getItem('cropdeal_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.userId) {
          this.currentUserId = Number(u.userId);
          this.currentUserEmail = u.email || '';
          return this.currentUserId;
        }
      }
    } catch {}
    return null;
  }

  // ── Called by Navbar on login / role switch ───────────────────
  public initForUser(userId: number, email: string): void {
    this.currentUserId = Number(userId);
    this.currentUserEmail = email || '';

    // Load from user's localStorage immediately
    const local = this.loadFromStorage(this.currentUserId);
    this.notifsSubject.next(local);

    // Try backend (RabbitMQ consumer writes notifications by recipient email)
    if (email) {
      this.http.get<NotificationResponse[]>(
        `${this.baseUrl}/recipient/${encodeURIComponent(email)}`
      ).pipe(
        catchError(() => of([] as NotificationResponse[]))
      ).subscribe(backendNotifs => {
        if (backendNotifs && backendNotifs.length > 0) {
          const backendIds = new Set(backendNotifs.map(n => n.id));
          const localOnly = local.filter(n => !backendIds.has(n.id));
          const merged = [...backendNotifs, ...localOnly]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this.saveToStorage(this.currentUserId!, merged);
          this.notifsSubject.next(merged);
        }
      });
    }
  }

  // ── Clear on logout ───────────────────────────────────────────
  public clearForUser(): void {
    this.currentUserId = null;
    this.currentUserEmail = '';
    this.notifsSubject.next([]);
  }

  private getEmailForUserId(userId: number): string {
    if (userId === this.currentUserId && this.currentUserEmail) {
      return this.currentUserEmail;
    }
    switch (Number(userId)) {
      case 1:  return 'ramesh.farmer@cropdeal.com';
      case 10: return 'purchase@agritrade.com';
      case 5:  return 'agent@kisanlogistics.com';
      case 99: return 'admin@cropdeal.com';
      default: return `user_${userId}@cropdeal.com`;
    }
  }

  // ── Push a notification into the user's persistent bell ───────
  public pushNotification(
    type: string,
    title: string,
    message: string,
    userId?: number
  ): void {
    const uid = userId ? Number(userId) : this.getActiveUserId();
    if (!uid) return;

    const current = this.loadFromStorage(uid);

    // De-duplication check: avoid exact duplicate within 3 seconds
    if (current.length > 0 && current[0].message === message) {
      const diffMs = Date.now() - new Date(current[0].createdAt).getTime();
      if (diffMs < 3000) return;
    }

    const notif: NotificationResponse = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      userId: uid,
      type: type || 'SYSTEM',
      title: title || 'Notification',
      message: message,
      read: false,
      createdAt: new Date().toISOString()
    };

    // Fire-and-forget sync to backend with correct NotificationRequest payload
    const recipientEmail = this.getEmailForUserId(uid);
    const backendRequest: NotificationRequest = {
      recipient: recipientEmail,
      type: notif.type,
      message: notif.message
    };
    this.http.post<NotificationResponse>(this.baseUrl, backendRequest)
      .pipe(catchError(() => of(null))).subscribe();

    // Persist to user's isolated local store
    const updated = [notif, ...current].slice(0, 50); // keep up to 50
    this.saveToStorage(uid, updated);

    // Update live stream for currently active user
    if (this.currentUserId === null || Number(this.currentUserId) === uid) {
      this.currentUserId = uid;
      this.notifsSubject.next(updated);
    }
  }

  // ── Show Toast Popup + AUTOMATICALLY STORE in Notification Bell ─
  public showToast(
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    title?: string
  ): void {
    // 1. Show the floating popup on screen
    const toast: ToastMessage = {
      id: Date.now() + Math.random(),
      type,
      title,
      message
    };
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);
    setTimeout(() => this.removeToast(toast.id), 4500);

    // 2. Also PERSIST as a live notification for this user!
    const { category, derivedTitle } = this.classifyMessage(message, title);
    this.pushNotification(category, derivedTitle, message);
  }

  public removeToast(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }

  /** Categorize toast message into notification category and title */
  private classifyMessage(message: string, explicitTitle?: string): { category: string; derivedTitle: string } {
    const m = message.toLowerCase();

    if (m.includes('crop') || m.includes('listing')) {
      return {
        category: 'CROP',
        derivedTitle: explicitTitle || (m.includes('delete') || m.includes('remove') ? '🌾 Crop Removed' : (m.includes('update') ? '🌾 Crop Updated' : '🌾 Crop Listing'))
      };
    }
    if (m.includes('auction')) {
      return {
        category: 'AUCTION',
        derivedTitle: explicitTitle || (m.includes('closed') || m.includes('award') ? '🔨 Auction Awarded' : '🔨 Live Auction')
      };
    }
    if (m.includes('bid')) {
      return {
        category: 'BID',
        derivedTitle: explicitTitle || '💰 Bidding Update'
      };
    }
    if (m.includes('order')) {
      return {
        category: 'ORDER',
        derivedTitle: explicitTitle || '📦 Order Update'
      };
    }
    if (m.includes('negotiat')) {
      return {
        category: 'NEGOTIATION',
        derivedTitle: explicitTitle || '💬 Negotiation Update'
      };
    }
    if (m.includes('wallet') || m.includes('₹') || m.includes('paid') || m.includes('payment')) {
      return {
        category: 'PAYMENT',
        derivedTitle: explicitTitle || '💳 Payment & Wallet'
      };
    }
    if (m.includes('deliver') || m.includes('otp')) {
      return {
        category: 'DELIVERY',
        derivedTitle: explicitTitle || '🚚 Logistics Update'
      };
    }
    if (m.includes('mandi') || m.includes('benchmark') || m.includes('price')) {
      return {
        category: 'PRICE',
        derivedTitle: explicitTitle || '📈 Mandi Price Index'
      };
    }
    if (m.includes('welcome') || m.includes('login') || m.includes('signed in')) {
      return {
        category: 'SYSTEM',
        derivedTitle: explicitTitle || '👋 Welcome to CropDeal'
      };
    }
    return {
      category: 'SYSTEM',
      derivedTitle: explicitTitle || '🔔 System Notification'
    };
  }

  // ── Actions: Read / Delete / Clear ────────────────────────────
  public markAllAsRead(): void {
    const uid = this.getActiveUserId();
    if (!uid) return;
    const updated = this.notifsSubject.value.map(n => ({ ...n, read: true }));
    this.saveToStorage(uid, updated);
    this.notifsSubject.next(updated);
  }

  public markAsRead(id: number): void {
    const uid = this.getActiveUserId();
    if (!uid) return;
    const updated = this.notifsSubject.value.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    this.saveToStorage(uid, updated);
    this.notifsSubject.next(updated);
  }

  public deleteNotification(id: number): void {
    const uid = this.getActiveUserId();
    if (!uid) return;
    const updated = this.notifsSubject.value.filter(n => n.id !== id);
    this.saveToStorage(uid, updated);
    this.notifsSubject.next(updated);
  }

  public clearAllNotifications(): void {
    const uid = this.getActiveUserId();
    if (!uid) return;
    this.saveToStorage(uid, []);
    this.notifsSubject.next([]);
  }

  // ── Storage helpers ───────────────────────────────────────────
  private loadFromStorage(userId: number): NotificationResponse[] {
    try {
      const raw = localStorage.getItem(NOTIF_KEY_PREFIX + userId);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private saveToStorage(userId: number, notifs: NotificationResponse[]): void {
    try {
      localStorage.setItem(NOTIF_KEY_PREFIX + userId, JSON.stringify(notifs));
    } catch {}
  }

  // ── Backend API methods (matching controller endpoints exactly) ──────────

  /** GET /api/notifications/{notificationId} */
  public getNotification(notificationId: number): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.baseUrl}/${notificationId}`).pipe(
      catchError(() => of({
        id: notificationId, type: 'SYSTEM', message: 'Notification not found',
        createdAt: new Date().toISOString()
      }))
    );
  }

  /** GET /api/notifications/recipient/{recipient} — fetch notifications by recipient email */
  public getNotificationsByRecipient(recipient: string): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(
      `${this.baseUrl}/recipient/${encodeURIComponent(recipient)}`
    ).pipe(catchError(() => of([])));
  }

  /** GET /api/notifications/order/{orderId} — fetch notifications linked to an order */
  public getNotificationsForOrder(orderId: number): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.baseUrl}/order/${orderId}`).pipe(
      catchError(() => of([]))
    );
  }

  /** POST /api/notifications — send a general notification */
  public sendNotification(request: NotificationRequest): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(this.baseUrl, request).pipe(
      catchError(() => of({
        id: Date.now(), type: request.type, recipient: request.recipient,
        message: request.message, status: 'FAILED', createdAt: new Date().toISOString()
      }))
    );
  }

  /** POST /api/notifications/delivery-otp — trigger OTP SMS for delivery handover */
  public sendDeliveryOtpNotification(request: OtpNotificationRequest): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(`${this.baseUrl}/delivery-otp`, request).pipe(
      catchError(() => of({
        id: Date.now(), type: 'DELIVERY', recipient: request.phoneNumber,
        message: `OTP ${request.otp} sent via SMS`, status: 'FAILED',
        createdAt: new Date().toISOString()
      }))
    );
  }

  /** POST /api/notifications/delivery-completed — notify delivery completion via SMS */
  public sendDeliveryCompletedNotification(request: DeliveryCompletedNotificationRequest): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(`${this.baseUrl}/delivery-completed`, request).pipe(
      catchError(() => of({
        id: Date.now(), type: 'DELIVERY', recipient: request.phoneNumber,
        message: `Delivery completed for Order #${request.orderId}`, status: 'FAILED',
        createdAt: new Date().toISOString()
      }))
    );
  }

  // ── Legacy compat aliases (do not remove — used in navbar + components) ──
  public getNotifications(recipient: string = ''): Observable<NotificationResponse[]> {
    return this.notifications$;
  }
}
