import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, BehaviorSubject } from 'rxjs';
import { BidOffer, BiddingAuction } from '../models/bidding.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BiddingService {
  private baseUrl = `${environment.apiUrl}/biddings`;
  private readonly STORAGE_KEY = 'cropdeal_bidding_auctions';
  private readonly DELETED_AUCTIONS_KEY = 'cropdeal_deleted_bidding_ids';

  private biddingsSubject = new BehaviorSubject<BiddingAuction[]>([]);
  public biddings$ = this.biddingsSubject.asObservable();

  constructor(private http: HttpClient) {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            const filtered = arr.filter(a => !['AUCT-101', 'AUCT-102', 'AUCT-103', 'AUCT-104'].includes(String(a.id)));
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
          }
        }
      } catch {}
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === this.STORAGE_KEY) {
          this.biddingsSubject.next(this.loadStoredAuctions());
        }
      });
    }
    this.biddingsSubject.next(this.loadStoredAuctions());
  }

  public getDeletedAuctionIds(): Set<string> {
    try {
      const raw = localStorage.getItem(this.DELETED_AUCTIONS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr.map(String));
      }
    } catch {}
    return new Set<string>();
  }

  public markAuctionAsDeleted(id: string): void {
    try {
      const deleted = this.getDeletedAuctionIds();
      deleted.add(String(id));
      localStorage.setItem(this.DELETED_AUCTIONS_KEY, JSON.stringify(Array.from(deleted)));
    } catch {}
  }

  private getDefaultAuctions(): BiddingAuction[] {
    return [];
  }

  public loadStoredAuctions(): BiddingAuction[] {
    const deleted = this.getDeletedAuctionIds();
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const now = Date.now();
          return parsed.filter(a =>
            !deleted.has(String(a.id)) &&
            a.status !== 'CLOSED' &&
            (a.status as string) !== 'AWARDED' &&
            (!a.endTime || new Date(a.endTime).getTime() > now)
          );
        }
      } catch (e) {}
    }
    return [];
  }

  private saveStoredAuctions(auctions: BiddingAuction[]): void {
    const deleted = this.getDeletedAuctionIds();
    const valid = (auctions || []).filter(a => !deleted.has(String(a.id)) && a.status !== 'CLOSED' && (a.status as string) !== 'AWARDED');
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(valid));
    this.biddingsSubject.next(valid);
  }

  getAllAuctions(): Observable<BiddingAuction[]> {
    const deleted = this.getDeletedAuctionIds();
    return this.http.get<any[]>(`${this.baseUrl}/all`).pipe(
      catchError(() => of(this.loadStoredAuctions())),
      map(data => {
        const local = this.loadStoredAuctions();
        const mapById = new Map<string, BiddingAuction>();
        local.forEach(a => mapById.set(String(a.id), a));
        if (data && data.length > 0) {
          data.forEach(a => {
            const sid = String(a.id);
            if (!deleted.has(sid)) {
              const highest = a.highestBidAmount != null && Number(a.highestBidAmount) > 0
                ? Number(a.highestBidAmount)
                : (Number(a.currentHighestBid || a.basePrice || a.startingPrice || 0));
              const bidsCount = (a.bids && a.bids.length > 0) ? a.bids.length : (a.bidsCount || 0);
              const existing = mapById.get(sid);
              if (existing) {
                existing.currentHighestBid = Math.max(highest, existing.currentHighestBid || 0);
                existing.bidsCount = Math.max(bidsCount, existing.bidsCount || 0);
                if (a.bids && a.bids.length > 0) {
                  existing.bidsHistory = a.bids.map((b: any) => ({
                    bidderName: b.dealerName || b.bidderName || ('Dealer #' + b.dealerId),
                    bidPriceKg: Number(b.bidAmount),
                    bidTime: b.bidTime || 'Recent'
                  }));
                }
                mapById.set(sid, existing);
              } else {
                mapById.set(sid, {
                  ...a,
                  startingPrice: Number(a.basePrice || a.startingPrice || 20),
                  currentHighestBid: highest,
                  bidsCount: bidsCount
                });
              }
            }
          });
        }
        return Array.from(mapById.values()).filter(a => !deleted.has(String(a.id)));
      })
    );
  }

  getActiveAuctions(): Observable<BiddingAuction[]> {
    const deleted = this.getDeletedAuctionIds();
    return this.http.get<any[]>(this.baseUrl).pipe(
      catchError(() => of(this.loadStoredAuctions())),
      map(data => {
        const local = this.loadStoredAuctions();
        const mapById = new Map<string, BiddingAuction>();
        local.forEach(a => mapById.set(String(a.id), a));
        if (data && data.length > 0) {
          data.forEach(a => {
            const sid = String(a.id);
            if (!deleted.has(sid)) {
              const highest = a.highestBidAmount != null && Number(a.highestBidAmount) > 0
                ? Number(a.highestBidAmount)
                : (Number(a.currentHighestBid || a.basePrice || a.startingPrice || 0));
              const bidsCount = (a.bids && a.bids.length > 0) ? a.bids.length : (a.bidsCount || 0);
              const existing = mapById.get(sid);
              if (existing) {
                existing.currentHighestBid = Math.max(highest, existing.currentHighestBid || 0);
                existing.bidsCount = Math.max(bidsCount, existing.bidsCount || 0);
                if (a.bids && a.bids.length > 0) {
                  existing.bidsHistory = a.bids.map((b: any) => ({
                    bidderName: b.dealerName || b.bidderName || ('Dealer #' + b.dealerId),
                    bidPriceKg: Number(b.bidAmount),
                    bidTime: b.bidTime || 'Recent'
                  }));
                }
                mapById.set(sid, existing);
              } else {
                mapById.set(sid, {
                  ...a,
                  startingPrice: Number(a.basePrice || a.startingPrice || 20),
                  currentHighestBid: highest,
                  bidsCount: bidsCount
                });
              }
            }
          });
        }
        const now = Date.now();
        // Exclude BLOCKED, CLOSED, AWARDED biddings and any bidding whose timing has completed
        return Array.from(mapById.values()).filter(a => {
          if (deleted.has(String(a.id))) return false;
          if (a.status && a.status !== 'OPEN') return false;
          if (a.endTime && new Date(a.endTime).getTime() <= now) return false;
          return true;
        });
      })
    );
  }

  getAuctionById(id: string): Observable<BiddingAuction> {
    const deleted = this.getDeletedAuctionIds();
    if (deleted.has(String(id))) return of({} as BiddingAuction);
    const local = this.loadStoredAuctions().find(a => String(a.id) === String(id));
    if (local) return of(local);
    return this.http.get<BiddingAuction>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => of({} as BiddingAuction))
    );
  }

  createAuction(auction: Partial<BiddingAuction>): Observable<BiddingAuction> {
    const list = this.loadStoredAuctions();
    const startingPrice = Number(auction.startingPrice || 20);
    const newAuction: BiddingAuction = {
      id: auction.id || ('AUCT-' + Math.floor(100 + Math.random() * 900)),
      cropId: auction.cropId || 'crop-' + Date.now(),
      cropName: auction.cropName || 'Fresh Harvest Crop Lot',
      farmerId: auction.farmerId || 'farmer-1',
      farmerName: auction.farmerName || 'Registered Producer',
      startingPrice: startingPrice,
      currentHighestBid: Number(auction.currentHighestBid || startingPrice),
      highestBidderId: auction.highestBidderId,
      highestBidderName: auction.highestBidderName,
      quantity: Number(auction.quantity || 100),
      unit: auction.unit || 'Kg',
      endTime: auction.endTime || new Date(Date.now() + (auction.durationHours || 12) * 3600000).toISOString(),
      status: 'OPEN',
      bidsCount: auction.bidsCount || 0,
      minIncrement: auction.minIncrement || 1,
      location: auction.location || 'Local Mandi APMC',
      variety: auction.variety || 'Grade A Produce',
      createdAt: new Date().toISOString(),
      bidsHistory: auction.bidsHistory || []
    };

    list.unshift(newAuction);
    this.saveStoredAuctions(list);

    // Call backend
    this.http.post<BiddingAuction>(this.baseUrl, newAuction).subscribe({
      next: () => {},
      error: () => {}
    });

    return of(newAuction);
  }

  placeBid(bid: BidOffer): Observable<BiddingAuction> {
    const list = this.loadStoredAuctions();
    const index = list.findIndex(a => String(a.id) === String(bid.biddingId));
    if (index !== -1) {
      list[index].currentHighestBid = Number(bid.bidAmount);
      list[index].highestBidderId = bid.dealerId;
      list[index].highestBidderName = bid.dealerName;
      list[index].bidsCount = (list[index].bidsCount || 0) + 1;
      if (!list[index].bidsHistory) {
        list[index].bidsHistory = [];
      }
      list[index].bidsHistory!.unshift({
        bidderName: bid.dealerName || 'Dealer',
        bidPriceKg: Number(bid.bidAmount),
        bidTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      });
      this.saveStoredAuctions(list);
    }

    let numericDealerId = Number(bid.dealerId);
    if (isNaN(numericDealerId) || numericDealerId <= 0) {
      numericDealerId = 2; // Default seeded Dealer ID
    }

    const payload = {
      dealerId: numericDealerId,
      bidAmount: Number(bid.bidAmount)
    };

    return this.http.post<any>(`${this.baseUrl}/${bid.biddingId}/bids`, payload).pipe(
      tap((res) => {
        if (res) {
          const updated = this.loadStoredAuctions();
          const idx = updated.findIndex(a => String(a.id) === String(bid.biddingId));
          if (idx !== -1) {
            updated[idx].currentHighestBid = Number(bid.bidAmount);
            updated[idx].bidsCount = (updated[idx].bidsCount || 0) + 1;
            this.saveStoredAuctions(updated);
          }
        }
      }),
      catchError(() => {
        return of(index !== -1 ? list[index] : ({} as BiddingAuction));
      }),
      map(() => index !== -1 ? list[index] : ({} as BiddingAuction))
    );
  }

  toggleBlockAuction(auctionId: string, block: boolean): Observable<BiddingAuction> {
    const list = this.loadStoredAuctions();
    const index = list.findIndex(a => String(a.id) === String(auctionId));
    let target = {} as BiddingAuction;
    if (index !== -1) {
      list[index].status = block ? 'BLOCKED' : 'OPEN';
      target = list[index];
      this.saveStoredAuctions(list);
    }
    this.http.put<BiddingAuction>(`${this.baseUrl}/${auctionId}/block?block=${block}`, {}).subscribe({
      next: () => {},
      error: () => {}
    });
    return of(target);
  }

  deleteAuction(auctionId: string): Observable<boolean> {
    this.markAuctionAsDeleted(auctionId);
    const list = this.loadStoredAuctions().filter(a => String(a.id) !== String(auctionId));
    this.saveStoredAuctions(list);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cropdeal:bidding_deleted', { detail: { id: auctionId } }));
    }

    this.http.delete(`${this.baseUrl}/${auctionId}`).subscribe({
      next: () => {},
      error: () => {}
    });
    return of(true);
  }

  closeAuction(auctionId: string, orderId?: string, awardedAmount?: number): Observable<BiddingAuction> {
    // When completed, delete the old auction lot from active storage
    const list = this.loadStoredAuctions();
    const target = list.find(a => a.id === auctionId);
    const remaining = list.filter(a => a.id !== auctionId);
    this.saveStoredAuctions(remaining);

    this.http.put<BiddingAuction>(`${this.baseUrl}/${auctionId}/close`, {}).subscribe({
      next: () => {},
      error: () => {}
    });

    if (target) {
      target.status = 'CLOSED';
      target.awardedOrderId = orderId;
      target.awardedAmount = awardedAmount;
      return of(target);
    }
    return of({} as BiddingAuction);
  }
}
