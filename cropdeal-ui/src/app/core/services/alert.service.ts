import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { CropAlert } from '../models/crop.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private readonly STORAGE_KEY = 'cropdeal_price_alerts';
  private alertsSubject = new BehaviorSubject<CropAlert[]>([]);
  public alerts$ = this.alertsSubject.asObservable();

  private alertCountSubject = new BehaviorSubject<number>(0);
  public alertCount$ = this.alertCountSubject.asObservable();

  private defaultSeedAlerts: CropAlert[] = [
    {
      id: 'alt-1',
      userId: 'farmer-1',
      cropName: 'Paddy (Rice)',
      targetPrice: 20,
      currentGovPrice: 20,
      condition: 'ABOVE',
      status: 'TRIGGERED',
      message: 'Coimbatore Mandi modal price reached ₹19.80 / Kg (Exceeded your target of ₹19.00)!'
    },
    {
      id: 'alt-2',
      userId: 'farmer-1',
      cropName: 'Tomato',
      targetPrice: 12,
      currentGovPrice: 10,
      condition: 'BELOW',
      status: 'TRIGGERED',
      message: 'Koyambedu Mandi Tomato price dropped to ₹10.00 / Kg.'
    },
    {
      id: 'alt-3',
      userId: 'farmer-1',
      cropName: 'Wheat',
      targetPrice: 25,
      currentGovPrice: 25,
      condition: 'ABOVE',
      status: 'ACTIVE',
      message: 'Monitoring local DB APMC rates. Currently ₹24.50/Kg.'
    }
  ];

  constructor(private http: HttpClient) {
    this.loadAlertsFromStorage();
  }

  private loadAlertsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed: CropAlert[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.alertsSubject.next(parsed);
          this.alertCountSubject.next(parsed.length);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed parsing price alerts from localStorage', e);
    }

    // Seed default alerts if empty
    this.alertsSubject.next([...this.defaultSeedAlerts]);
    this.alertCountSubject.next(this.defaultSeedAlerts.length);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.defaultSeedAlerts));
  }

  getAlerts(): CropAlert[] {
    return this.alertsSubject.value;
  }

  addAlert(alert: CropAlert): void {
    const current = [alert, ...this.alertsSubject.value.filter(a => a.id !== alert.id)];
    this.alertsSubject.next(current);
    this.alertCountSubject.next(current.length);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(current));

    const numericUserId = parseInt(String(alert.userId || '').replace(/\D/g, ''), 10) || 1;
    const cond = alert.condition === 'BELOW' ? 'LESS_THAN' : 'GREATER_THAN';
    const subPayload = {
      userId: numericUserId,
      userRole: numericUserId === 2 ? 'DEALER' : 'FARMER',
      cropName: alert.cropName || 'Wheat',
      targetPrice: alert.targetPrice || 25,
      priceCondition: cond,
      district: 'Mandi',
      state: 'Punjab',
      unit: 'kg'
    };

    // Post subscription to backend MySQL
    this.http.post(`${environment.apiUrl}/price-alerts/subscriptions`, subPayload)
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  updateAlerts(alerts: CropAlert[]): void {
    this.alertsSubject.next(alerts);
    this.alertCountSubject.next(alerts.length);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(alerts));
  }

  /**
   * Permanently deletes an alert by its ID from local storage and backend.
   * Immediately decrements the alert count shown in the sidebar.
   */
  deleteAlert(alertId: string): Observable<boolean> {
    const filtered = this.alertsSubject.value.filter(a => a.id !== alertId);
    this.alertsSubject.next(filtered);
    this.alertCountSubject.next(filtered.length);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));

    const cleanId = parseInt(String(alertId || '').replace(/\D/g, ''), 10);
    const deleteUrl = cleanId ? `${environment.apiUrl}/price-alerts/subscriptions/${cleanId}` : `${environment.apiUrl}/price-alerts/${alertId}`;

    return this.http.delete(deleteUrl).pipe(
      catchError(() => of(true))
    ) as Observable<any>;
  }

  clearAllAlerts(): void {
    this.alertsSubject.next([]);
    this.alertCountSubject.next(0);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
  }
}
