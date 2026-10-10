import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of, map, catchError } from 'rxjs';
import { AppNotification } from '../models/notification.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = `${environment.apiUrl}/notifications`;

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  public resolveRoleBucket(identifier?: string | null): 'farmer' | 'dealer' | 'delivery' | 'admin' | 'guest' {
    if (!identifier) return 'guest';
    const s = String(identifier).trim().toLowerCase();
    if (s === '1' || s.includes('farmer')) return 'farmer';
    if (s === '2' || s.includes('dealer')) return 'dealer';
    if (s === '3' || s.includes('delivery')) return 'delivery';
    if (s === '4' || s.includes('admin')) return 'admin';
    try {
      const stored = localStorage.getItem('cropdeal_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (String(u.id) === s || String(u.userId) === s || String(u.username).toLowerCase() === s) {
          const r = String(u.role || '').toLowerCase();
          if (r.includes('farmer')) return 'farmer';
          if (r.includes('dealer')) return 'dealer';
          if (r.includes('delivery')) return 'delivery';
          if (r.includes('admin')) return 'admin';
        }
      }
    } catch {}
    return 'guest';
  }

  public getBucketKey(roleOrId?: string | null): string {
    const bucket = this.resolveRoleBucket(roleOrId);
    return `cropdeal_notifications_${bucket}`;
  }

  private getCurrentUserBucket(): 'farmer' | 'dealer' | 'delivery' | 'admin' | 'guest' {
    const currentStoredUser = localStorage.getItem('cropdeal_user');
    if (currentStoredUser) {
      try {
        const u = JSON.parse(currentStoredUser);
        return this.resolveRoleBucket(u.role || u.id || u.userId);
      } catch {}
    }
    return 'guest';
  }

  getUserNotifications(userId: string): Observable<AppNotification[]> {
    const userBucket = this.getCurrentUserBucket();
    const bucket = userBucket !== 'guest' ? userBucket : this.resolveRoleBucket(userId);
    const targetKey = this.getBucketKey(bucket);

    let foundList: AppNotification[] = [];
    const saved = localStorage.getItem(targetKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          foundList = parsed;
        }
      } catch {}
    }

    // Always reset active stream to this specific user's bucket (even if empty)
    this.notificationsSubject.next(foundList);
    this.unreadCountSubject.next(foundList.filter(n => !n.isRead).length);

    return this.http.get<AppNotification[]>(`${this.baseUrl}/user/${userId}`).pipe(
      tap(backendNotifications => {
        if (backendNotifications && Array.isArray(backendNotifications) && backendNotifications.length > 0) {
          const merged = [...backendNotifications, ...foundList.filter(l => !backendNotifications.some(n => n.id === l.id))];
          this.notificationsSubject.next(merged);
          this.unreadCountSubject.next(merged.filter(n => !n.isRead).length);
          localStorage.setItem(targetKey, JSON.stringify(merged));
        }
      }),
      catchError(() => of(foundList))
    );
  }

  clearStream(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  markAsRead(notificationId: string, userId?: string): Observable<void> {
    const current = this.notificationsSubject.value.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    this.notificationsSubject.next(current);
    const unread = current.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unread);

    const bucket = this.resolveRoleBucket(userId || this.getCurrentUserBucket());
    const targetKey = this.getBucketKey(bucket);
    localStorage.setItem(targetKey, JSON.stringify(current));

    return this.http.put<void>(`${this.baseUrl}/${notificationId}/read`, {}).pipe(
      catchError(() => of(undefined as any))
    );
  }

  deleteNotification(notificationId: string, userId?: string): Observable<boolean> {
    const updated = this.notificationsSubject.value.filter(n => n.id !== notificationId);
    this.notificationsSubject.next(updated);
    const unread = updated.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unread);

    const bucket = this.resolveRoleBucket(userId || this.getCurrentUserBucket());
    const targetKey = this.getBucketKey(bucket);
    const saved = localStorage.getItem(targetKey);
    if (saved) {
      try {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          const purged = list.filter((n: any) => n.id !== notificationId);
          localStorage.setItem(targetKey, JSON.stringify(purged));
        }
      } catch {}
    }

    return this.http.delete<void>(`${this.baseUrl}/${notificationId}`).pipe(
      map(() => true),
      catchError(() => of(true))
    );
  }

  markAllAsRead(userId?: string): void {
    const current = this.notificationsSubject.value.map(n => ({ ...n, isRead: true }));
    this.notificationsSubject.next(current);
    this.unreadCountSubject.next(0);

    const bucket = this.resolveRoleBucket(userId || this.getCurrentUserBucket());
    const targetKey = this.getBucketKey(bucket);
    localStorage.setItem(targetKey, JSON.stringify(current));

    this.http.put(`${this.baseUrl}/user/${userId || 'me'}/read-all`, {}).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  clearAllNotifications(userId?: string): void {
    const bucket = this.resolveRoleBucket(userId || this.getCurrentUserBucket());
    const targetKey = this.getBucketKey(bucket);
    localStorage.removeItem(targetKey);

    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);

    this.http.delete(`${this.baseUrl}/user/${userId || 'me'}/clear-all`).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  addClientNotification(notification: AppNotification, userId?: string): void {
    const targetBucket = this.resolveRoleBucket(userId || notification.userId);
    const targetKey = this.getBucketKey(targetBucket);

    let list: AppNotification[] = [];
    const saved = localStorage.getItem(targetKey);
    if (saved) {
      try { list = JSON.parse(saved); } catch {}
    }
    list = [notification, ...list.filter(n => n.id !== notification.id)];
    localStorage.setItem(targetKey, JSON.stringify(list));

    if (this.getCurrentUserBucket() === targetBucket) {
      const current = [notification, ...this.notificationsSubject.value.filter(n => n.id !== notification.id)];
      this.notificationsSubject.next(current);
      const unread = current.filter(n => !n.isRead).length;
      this.unreadCountSubject.next(unread);
    }
  }

  sendNotification(
    userId: string,
    title: string,
    message: string,
    type: 'ORDER' | 'NEGOTIATION' | 'BID' | 'PRICE_ALERT' | 'WALLET' | 'DELIVERY' | 'SYSTEM',
    targetRole?: 'farmer' | 'dealer' | 'delivery' | 'admin'
  ): void {
    const notif: AppNotification = {
      id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    const targetBucket = targetRole || this.resolveRoleBucket(userId);
    const targetKey = this.getBucketKey(targetBucket);

    // Persist into user-specific bucket
    let list: AppNotification[] = [];
    const saved = localStorage.getItem(targetKey);
    if (saved) {
      try { list = JSON.parse(saved); } catch {}
    }
    list = [notif, ...list.filter(n => n.id !== notif.id)];
    localStorage.setItem(targetKey, JSON.stringify(list));

    // Dispatch to Backend notification-service so RabbitMQ topic exchange publishes the message
    this.http.post(`${this.baseUrl}`, {
      recipient: userId,
      type: type || 'SYSTEM',
      message: `${title}: ${message}`
    }).pipe(
      catchError(err => {
        console.warn('RabbitMQ notification backend dispatch notice:', err);
        return of(null);
      })
    ).subscribe();

    // STRICT USER ISOLATION:
    // Update live notificationsSubject ONLY if currently logged-in user belongs to targetBucket
    const currentBucket = this.getCurrentUserBucket();
    if (currentBucket === targetBucket) {
      const combined = [notif, ...this.notificationsSubject.value.filter(n => n.id !== notif.id)];
      this.notificationsSubject.next(combined);
      const unread = combined.filter(n => !n.isRead).length;
      this.unreadCountSubject.next(unread);
    }
  }
}
