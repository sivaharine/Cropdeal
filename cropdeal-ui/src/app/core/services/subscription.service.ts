import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { CropSubscription } from '../models/subscription.model';
import { Crop } from '../models/crop.model';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private baseUrl = `${environment.apiUrl}/subscriptions`;
  private storageKeyPrefix = 'cropdeal_subscriptions_';
  private allCropsKey = 'cropdeal_recent_crops';

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  private getKey(dealerId: string): string {
    return `${this.storageKeyPrefix}${dealerId || 'default'}`;
  }

  getSubscriptions(dealerId: string): Observable<CropSubscription[]> {
    const raw = localStorage.getItem(this.getKey(dealerId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return of(parsed);
      } catch (e) {}
    }
    return of([]);
  }

  saveSubscriptions(dealerId: string, subs: CropSubscription[]): void {
    localStorage.setItem(this.getKey(dealerId), JSON.stringify(subs));
  }

  subscribe(sub: CropSubscription): Observable<CropSubscription> {
    const raw = localStorage.getItem(this.getKey(sub.dealerId));
    let current: CropSubscription[] = raw ? JSON.parse(raw) : [];
    // Prevent duplicate commodity
    current = current.filter(s => s.commodity.toLowerCase() !== sub.commodity.toLowerCase());
    current.unshift(sub);
    this.saveSubscriptions(sub.dealerId, current);
    return of(sub);
  }

  unsubscribe(subId: string, dealerId: string): Observable<void> {
    const raw = localStorage.getItem(this.getKey(dealerId));
    if (raw) {
      const current: CropSubscription[] = JSON.parse(raw);
      const updated = current.filter(s => s.id !== subId);
      this.saveSubscriptions(dealerId, updated);
    }
    return of(void 0);
  }

  /**
   * Save a newly posted crop to local cache so subscribed dealers can view it instantly.
   */
  recordCropPosting(crop: Crop): void {
    const raw = localStorage.getItem(this.allCropsKey);
    let list: Crop[] = raw ? JSON.parse(raw) : [];
    list.unshift(crop);
    localStorage.setItem(this.allCropsKey, JSON.stringify(list.slice(0, 50)));
  }

  /**
   * Notifies the posting farmer with a single professional confirmation,
   * and notifies only subscribed dealers matching this commodity.
   */
  notifySubscribersOnNewCrop(newCrop: Crop): void {
    this.recordCropPosting(newCrop);

    // 1. Exactly ONE professional confirmation notification for the farmer who posted the crop
    const farmerId = newCrop.farmerId || 'farmer-1';
    this.notificationService.sendNotification(
      farmerId,
      '🌾 Crop Listed Successfully',
      `Your harvest listing for ${newCrop.cropName} (${newCrop.quantity} ${newCrop.unit} at ₹${newCrop.pricePerUnit}/${newCrop.unit}) is now live on the marketplace.`,
      'SYSTEM'
    );

    // 2. Notify only dealers who explicitly created a subscription for this commodity
    const notifiedDealers = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storageKeyPrefix)) {
        const dealerId = key.replace(this.storageKeyPrefix, '');
        if (notifiedDealers.has(dealerId)) continue;

        try {
          const subs: CropSubscription[] = JSON.parse(localStorage.getItem(key) || '[]');
          const isMatch = subs.some(s =>
            s.notifyInApp &&
            (newCrop.cropName?.toLowerCase().includes(s.commodity.toLowerCase()) ||
             s.commodity.toLowerCase().includes(newCrop.cropName?.toLowerCase()) ||
             (s.category && newCrop.cropType && s.category.toLowerCase() === newCrop.cropType.toLowerCase()))
          );

          if (isMatch) {
            notifiedDealers.add(dealerId);
            this.notificationService.sendNotification(
              dealerId,
              `🌾 New ${newCrop.cropName} Harvest Listed!`,
              `${newCrop.farmerName || 'A verified farmer'} listed ${newCrop.quantity} ${newCrop.unit} of ${newCrop.cropName} at ₹${newCrop.pricePerUnit}/${newCrop.unit}.`,
              'PRICE_ALERT'
            );
          }
        } catch (e) {}
      }
    }
  }

  /**
   * Returns recent crops that match the dealer's active commodity subscriptions.
   */
  getMatchingCropsForDealer(dealerId: string, availableCrops: Crop[]): Observable<Crop[]> {
    const raw = localStorage.getItem(this.getKey(dealerId));
    const subs: CropSubscription[] = raw ? JSON.parse(raw) : [];
    if (subs.length === 0) return of([]);

    // Merge availableCrops with any locally stored crops
    const cachedRaw = localStorage.getItem(this.allCropsKey);
    const cachedCrops: Crop[] = cachedRaw ? JSON.parse(cachedRaw) : [];
    const combined = [...cachedCrops, ...availableCrops];

    // Remove duplicates by id
    const uniqueMap = new Map<string, Crop>();
    combined.forEach(c => {
      if (c && (c.id || c.cropName)) {
        const idKey = c.id || `${c.cropName}_${c.location}`;
        if (!uniqueMap.has(idKey)) uniqueMap.set(idKey, c);
      }
    });

    const filtered = Array.from(uniqueMap.values()).filter(crop => {
      return subs.some(sub =>
        crop.cropName?.toLowerCase().includes(sub.commodity.toLowerCase()) ||
        sub.commodity.toLowerCase().includes(crop.cropName?.toLowerCase())
      );
    });

    return of(filtered);
  }
}
