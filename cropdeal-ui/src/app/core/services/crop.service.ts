import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Crop, CropAlert, GovernmentPrice } from '../models/crop.model';
import { environment } from '../../../environments/environment';
import { resolveCropImage } from '../utils/crop-image.util';

@Injectable({
  providedIn: 'root'
})
export class CropService {
  private baseUrl = `${environment.apiUrl}/crops`;
  private priceUrl = `${environment.apiUrl}/prices`;
  private readonly CROPS_KEY = 'cropdeal_crops_cache';
  private cropsSubject = new BehaviorSubject<Crop[]>(this.getLocalCrops());
  public crops$ = this.cropsSubject.asObservable();

  constructor(private http: HttpClient) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.DELETED_CROPS_KEY);
      } catch {}
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === this.CROPS_KEY) {
          this.cropsSubject.next(this.getLocalCrops());
        }
      });
    }
  }

  uploadCropImage(file: File): Observable<{ imageUrl: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string; filename: string }>(`${this.baseUrl}/upload-image`, formData);
  }

  public mapBackendCrop(c: any): Crop {
    if (!c) return {} as Crop;
    const cropName = c.cropName || c.commodity || 'Fresh Harvest';
    const rawQty = c.quantity !== undefined ? c.quantity : (c.availableQuantity !== undefined ? c.availableQuantity : 100);
    const qty = typeof rawQty === 'number' ? rawQty : Number(rawQty) || 100;
    const price = Number(c.pricePerUnit !== undefined ? c.pricePerUnit : (c.pricePerKg !== undefined ? c.pricePerKg : 20));
    const location = c.location || (c.district && c.state ? `${c.district}, ${c.state}` : (c.district || c.state || 'Local Mandi'));
    const farmerId = c.farmerId !== undefined && c.farmerId !== null ? String(c.farmerId) : '1';
    const farmerName = c.farmerName || 'Farmer Producer';
    const id = c.id !== undefined && c.id !== null ? String(c.id) : (c.cropId ? String(c.cropId) : `cr-${Date.now()}`);
    const rawStatus = (c.status || 'AVAILABLE').toUpperCase();
    const status = (rawStatus === 'PUBLISHED') ? 'AVAILABLE' : rawStatus;

    return {
      id,
      cropId: id,
      cropName,
      cropType: c.cropType || 'Grains',
      variety: c.variety || 'Standard Grade A',
      quantity: qty,
      availableQuantity: qty,
      unit: c.unit || 'Kg',
      pricePerUnit: price,
      location,
      state: c.state || (c.location ? c.location.split(',')[1]?.trim() : undefined),
      district: c.district || (c.location ? c.location.split(',')[0]?.trim() : undefined),
      farmerId,
      farmerName,
      farmerPhone: c.farmerPhone,
      harvestDate: c.harvestDate,
      imageUrl: c.imageUrl || resolveCropImage(cropName),
      status: status,
      description: c.description || '',
      govMspPrice: c.govMspPrice || 25,
      createdAt: c.createdAt || new Date().toISOString()
    };
  }

  refreshCrops(): Crop[] {
    const fresh = this.getLocalCrops();
    this.cropsSubject.next(fresh);
    return fresh;
  }

  public findCropIndex(list: Crop[], idOrName: string): number {
    if (!idOrName) return -1;
    const target = String(idOrName).trim().toLowerCase();
    return list.findIndex(c => {
      const cId = c.id !== undefined && c.id !== null ? String(c.id).trim().toLowerCase() : '';
      const cropId = c.cropId !== undefined && c.cropId !== null ? String(c.cropId).trim().toLowerCase() : '';
      const cName = c.cropName ? c.cropName.trim().toLowerCase() : '';
      return cId === target || cropId === target || cName === target ||
             (cName && target && (cName.includes(target) || target.includes(cName)));
    });
  }

  private readonly DELETED_CROPS_KEY = 'cropdeal_deleted_crop_ids';

  public getDeletedCropIds(): Set<string> {
    try {
      const raw = localStorage.getItem(this.DELETED_CROPS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr.map(String));
      }
    } catch {}
    return new Set<string>();
  }

  public markCropAsDeleted(id: string): void {
    try {
      const deleted = this.getDeletedCropIds();
      deleted.add(String(id));
      localStorage.setItem(this.DELETED_CROPS_KEY, JSON.stringify(Array.from(deleted)));
    } catch {}
  }

  public getDefaultSeedCrops(): Crop[] {
    return [
      {
        id: 'cr-101',
        cropId: 'cr-101',
        cropName: 'Sona Masoori Rice',
        cropType: 'Grains',
        variety: 'Grade A Premium',
        quantity: 850,
        availableQuantity: 850,
        unit: 'Kg',
        pricePerUnit: 26,
        location: 'Thanjavur APMC Mandi, Thanjavur, Tamil Nadu',
        state: 'Tamil Nadu',
        district: 'Thanjavur',
        farmerId: '1',
        farmerName: 'Ramesh Kumar (Farmer)',
        farmerPhone: '+91 98765 43210',
        imageUrl: '/assets/images/crop-rice.jpg',
        status: 'AVAILABLE',
        description: 'Naturally aged premium Sona Masoori paddy harvest from Cauvery delta basin.',
        govMspPrice: 28.5,
        createdAt: '2026-10-01T08:00:00.000Z'
      },
      {
        id: 'cr-102',
        cropId: 'cr-102',
        cropName: 'Coimbatore Sugarcane',
        cropType: 'Cash Crops',
        variety: 'Co-86032 Grade A',
        quantity: 1200,
        availableQuantity: 1200,
        unit: 'Kg',
        pricePerUnit: 18,
        location: 'Pollachi Mandi, Coimbatore, Tamil Nadu',
        state: 'Tamil Nadu',
        district: 'Coimbatore',
        farmerId: '1',
        farmerName: 'Ramesh Kumar (Farmer)',
        farmerPhone: '+91 98765 43210',
        imageUrl: '/assets/images/crop-sugarcane.jpg',
        status: 'AVAILABLE',
        description: 'Juicy, high sucrose cane harvested directly from Pollachi organic farms.',
        govMspPrice: 20.0,
        createdAt: '2026-10-02T09:00:00.000Z'
      },
      {
        id: 'cr-103',
        cropId: 'cr-103',
        cropName: 'Salem Turmeric Fingers',
        cropType: 'Spices',
        variety: 'Salem Curcumin High',
        quantity: 450,
        availableQuantity: 450,
        unit: 'Kg',
        pricePerUnit: 74,
        location: 'Shevapet Mandi, Salem, Tamil Nadu',
        state: 'Tamil Nadu',
        district: 'Salem',
        farmerId: '1',
        farmerName: 'Ramesh Kumar (Farmer)',
        farmerPhone: '+91 98765 43210',
        imageUrl: '/assets/images/crop-turmeric.jpg',
        status: 'AVAILABLE',
        description: 'Sun-dried golden turmeric with >4.5% curcumin content, lab tested.',
        govMspPrice: 80.0,
        createdAt: '2026-10-03T10:00:00.000Z'
      },
      {
        id: 'cr-104',
        cropId: 'cr-104',
        cropName: 'Sharbati Golden Wheat',
        cropType: 'Grains',
        variety: 'Sharbati Grade A',
        quantity: 950,
        availableQuantity: 950,
        unit: 'Kg',
        pricePerUnit: 24,
        location: 'Khanna Mandi, Ludhiana, Punjab',
        state: 'Punjab',
        district: 'Ludhiana',
        farmerId: '1',
        farmerName: 'Ramesh Kumar (Farmer)',
        farmerPhone: '+91 98765 43210',
        imageUrl: '/assets/images/crop-wheat.jpg',
        status: 'AVAILABLE',
        description: 'Golden heavy grains with high protein content direct from Khanna grain hub.',
        govMspPrice: 26.0,
        createdAt: '2026-10-04T07:30:00.000Z'
      },
      {
        id: 'cr-105',
        cropId: 'cr-105',
        cropName: 'Bt Cotton Long Staple',
        cropType: 'Fiber Crops',
        variety: 'Grade A White',
        quantity: 600,
        availableQuantity: 600,
        unit: 'Kg',
        pricePerUnit: 68,
        location: 'Bathinda Cotton Yard, Bathinda, Punjab',
        state: 'Punjab',
        district: 'Bathinda',
        farmerId: '1',
        farmerName: 'Ramesh Kumar (Farmer)',
        farmerPhone: '+91 98765 43210',
        imageUrl: '/assets/images/crop-cotton.jpg',
        status: 'AVAILABLE',
        description: 'Clean, machine-picked long staple cotton fibers suitable for textile spinning.',
        govMspPrice: 72.0,
        createdAt: '2026-10-05T08:15:00.000Z'
      },
      {
        id: 'cr-106',
        cropId: 'cr-106',
        cropName: 'Nashik Red Onion',
        cropType: 'Vegetables',
        variety: 'Medium Bold Grade A',
        quantity: 1500,
        availableQuantity: 1500,
        unit: 'Kg',
        pricePerUnit: 28,
        location: 'Lasalgaon Mandi, Nashik, Maharashtra',
        state: 'Maharashtra',
        district: 'Nashik',
        farmerId: '1',
        farmerName: 'Ramesh Kumar (Farmer)',
        farmerPhone: '+91 98765 43210',
        imageUrl: '/assets/images/crop-onion.jpg',
        status: 'AVAILABLE',
        description: 'Firm, dry-skinned red onions with long shelf life from Asia largest onion market.',
        govMspPrice: 31.0,
        createdAt: '2026-10-06T11:00:00.000Z'
      }
    ];
  }

  public getLocalCrops(): Crop[] {
    try {
      const raw = localStorage.getItem(this.CROPS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter(c => c.status !== 'DELETED');
          if (filtered.length > 0) return filtered;
        }
      }
    } catch {}
    const defaults = this.getDefaultSeedCrops();
    try {
      localStorage.setItem(this.CROPS_KEY, JSON.stringify(defaults));
    } catch {}
    return defaults;
  }

  private saveLocalCrops(crops: Crop[]): void {
    try {
      const activeOnly = (crops || []).filter(c => c.status !== 'DELETED');
      localStorage.setItem(this.CROPS_KEY, JSON.stringify(activeOnly));
      this.cropsSubject.next(activeOnly);
    } catch {}
  }

  getAllCrops(): Observable<Crop[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map(items => {
        if (Array.isArray(items)) {
          const mapped = items
            .map(c => this.mapBackendCrop(c))
            .filter(c => c.status !== 'DELETED');
          this.saveLocalCrops(mapped);
          return mapped;
        }
        return this.getLocalCrops();
      }),
      catchError(() => of(this.getLocalCrops()))
    );
  }

  getCropById(id: string): Observable<Crop> {
    const deleted = this.getDeletedCropIds();
    if (deleted.has(String(id))) {
      return of({} as Crop);
    }
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(res => {
        const mapped = this.mapBackendCrop(res);
        if (deleted.has(String(mapped.id)) || deleted.has(String(mapped.cropId))) {
          return {} as Crop;
        }
        return mapped;
      }),
      catchError(() => {
        const found = this.getLocalCrops().find(c => c.id === id || c.cropId === id || c.cropName?.toLowerCase() === id?.toLowerCase());
        return of(found || ({} as Crop));
      })
    );
  }

  getCropsByFarmer(farmerId: string): Observable<Crop[]> {
    const fId = String(farmerId).trim();
    return this.http.get<any[]>(`${this.baseUrl}/farmer/${fId}`).pipe(
      map(items => {
        if (Array.isArray(items)) {
          return items.map(c => this.mapBackendCrop(c));
        }
        return this.getLocalCrops().filter(c => String(c.farmerId) === fId);
      }),
      catchError(() => {
        const list = this.getLocalCrops().filter(c => String(c.farmerId) === fId);
        return of(list);
      })
    );
  }

  addCrop(crop: Partial<Crop>): Observable<Crop> {
    const qty = crop.quantity || crop.availableQuantity || 100;
    const price = crop.pricePerUnit || 20;
    const name = crop.cropName || 'Fresh Harvest';
    const loc = crop.location || 'Local Mandi';
    const fId = crop.farmerId || '1';
    const fName = crop.farmerName || 'Farmer Producer';

    const payload: any = {
      ...crop,
      farmerId: fId,
      commodity: name,
      cropName: name,
      grade: 'A',
      quantity: qty,
      unit: crop.unit || 'KG',
      pricePerKg: price,
      pricePerUnit: price,
      location: loc,
      farmerName: fName,
      imageUrl: crop.imageUrl || resolveCropImage(name),
      description: crop.description || ''
    };

    return this.http.post<any>(this.baseUrl, payload).pipe(
      map(res => {
        const mapped = this.mapBackendCrop(res || payload);
        const current = [mapped, ...this.getLocalCrops().filter(c => c.id !== mapped.id)];
        this.saveLocalCrops(current);
        return mapped;
      }),
      catchError(() => {
        const fallback = this.mapBackendCrop(payload);
        const current = [fallback, ...this.getLocalCrops().filter(c => c.id !== fallback.id)];
        this.saveLocalCrops(current);
        return of(fallback);
      })
    );
  }

  updateCrop(id: string, crop: Partial<Crop>): Observable<Crop> {
    const list = this.getLocalCrops();
    const idx = this.findCropIndex(list, id);
    const qty = crop.quantity !== undefined ? crop.quantity : crop.availableQuantity;
    const finalCrop = { ...crop };
    if (qty !== undefined) {
      finalCrop.quantity = qty;
      finalCrop.availableQuantity = qty;
    }
    let updatedCrop: Crop = idx >= 0 ? { ...list[idx], ...finalCrop } : ({ ...finalCrop, id } as Crop);
    if (idx >= 0) {
      if (qty !== undefined && qty <= 0) {
        return this.deleteCrop(id).pipe(map(() => updatedCrop));
      }
      list[idx] = updatedCrop;
      this.saveLocalCrops(list);
    }

    return this.http.put<Crop>(`${this.baseUrl}/${id}`, crop).pipe(
      catchError(() => of(updatedCrop))
    );
  }

  deleteCrop(id: string): Observable<void> {
    this.markCropAsDeleted(id);
    const list = this.getLocalCrops();
    const target = String(id).trim().toLowerCase();
    const filtered = list.filter(c => {
      const cId = c.id !== undefined && c.id !== null ? String(c.id).trim().toLowerCase() : '';
      const cropId = c.cropId !== undefined && c.cropId !== null ? String(c.cropId).trim().toLowerCase() : '';
      const cName = c.cropName ? c.cropName.trim().toLowerCase() : '';
      const isMatch = cId === target || cropId === target || (target && cName === target);
      if (isMatch) {
        if (c.id) this.markCropAsDeleted(String(c.id));
        if (c.cropId) this.markCropAsDeleted(String(c.cropId));
      }
      return !isMatch;
    });
    this.saveLocalCrops(filtered);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cropdeal:crop_deleted', { detail: { id } }));
    }

    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => of(undefined as any))
    );
  }

  reduceQuantity(id: string, purchasedQuantity: number): Observable<any> {
    const list = this.getLocalCrops();
    const idx = this.findCropIndex(list, id);
    if (idx >= 0) {
      const current = list[idx].quantity !== undefined ? list[idx].quantity : (list[idx].availableQuantity || 0);
      const remaining = Math.max(0, current - purchasedQuantity);
      if (remaining <= 0) {
        return this.deleteCrop(id);
      } else {
        list[idx] = { ...list[idx], quantity: remaining, availableQuantity: remaining };
        this.saveLocalCrops(list);
      }
    }
    const numId = Number(id);
    if (!isNaN(numId) && numId > 0) {
      return this.http.patch(`${this.baseUrl}/${id}/quantity`, { purchasedQuantity }).pipe(
        catchError(() => of(null))
      );
    }
    return of(null);
  }

  deductCropStock(idOrName: string, purchasedQuantity: number): { remaining: number; deleted: boolean } {
    const list = this.getLocalCrops();
    const idx = this.findCropIndex(list, idOrName);
    if (idx === -1) {
      return { remaining: 0, deleted: false };
    }
    const current = list[idx].quantity !== undefined ? list[idx].quantity : (list[idx].availableQuantity || 0);
    const remaining = Math.max(0, current - purchasedQuantity);
    const targetId = String(list[idx].id || list[idx].cropId || idOrName);

    if (remaining <= 0) {
      this.deleteCrop(targetId).subscribe();
      return { remaining: 0, deleted: true };
    } else {
      list[idx] = { ...list[idx], quantity: remaining, availableQuantity: remaining };
      this.saveLocalCrops(list);
      this.http.patch(`${this.baseUrl}/${targetId}/quantity`, { purchasedQuantity }).pipe(
        catchError(() => of(null))
      ).subscribe();
      return { remaining, deleted: false };
    }
  }

  // APMC Government Market Prices
  getGovernmentPrices(): Observable<GovernmentPrice[]> {
    return this.http.get<GovernmentPrice[]>(`${this.priceUrl}/all`).pipe(
      catchError(() => of([]))
    );
  }

  syncGovernmentPrices(): Observable<any> {
    return this.http.post<any>(`${this.priceUrl}/sync`, {}).pipe(
      catchError(() => of({ message: 'Synchronized with local APMC market database.' }))
    );
  }

  getGovernmentPriceByCommodity(commodity: string): Observable<GovernmentPrice[]> {
    return this.http.get<GovernmentPrice[]>(`${this.priceUrl}/commodity/${commodity}`).pipe(
      catchError(() => of([]))
    );
  }

  // Crop Price Alert endpoints
  checkLoginPriceAlerts(userId: string): Observable<CropAlert[]> {
    return this.http.get<CropAlert[]>(`${this.priceUrl}/alerts/check-login/${userId}`).pipe(
      catchError(() => of([]))
    );
  }

  getUserPriceAlerts(userId: string): Observable<CropAlert[]> {
    return this.http.get<CropAlert[]>(`${this.priceUrl}/alerts/user/${userId}`).pipe(
      catchError(() => of([]))
    );
  }

  createPriceAlert(alert: Partial<CropAlert>): Observable<CropAlert> {
    return this.http.post<CropAlert>(`${this.priceUrl}/alerts`, alert).pipe(
      catchError(() => of(alert as CropAlert))
    );
  }

  deletePriceAlert(alertId: string): Observable<void> {
    return this.http.delete<void>(`${this.priceUrl}/alerts/${alertId}`).pipe(
      catchError(() => of(undefined as any))
    );
  }
}
