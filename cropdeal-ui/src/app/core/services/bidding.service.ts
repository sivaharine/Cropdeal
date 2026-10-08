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
    this.biddingsSubject.next(this.loadStoredAuctions());
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === this.STORAGE_KEY) {
          this.biddingsSubject.next(this.loadStoredAuctions());
        }
      });
    }
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
    return [
      {
        id: 'AUCT-101',
        cropId: 'crop-101',
        cropName: 'Basmati Rice (1121 Pusa)',
        farmerId: 'farmer-1',
        farmerName: 'Sardar Gurpreet Singh',
        startingPrice: 38.00,
        currentHighestBid: 41.50,
        highestBidderId: 'dealer-1',
        highestBidderName: 'Apex Agro Mills Ltd',
        quantity: 5000,
        unit: 'Kg',
        endTime: new Date(Date.now() + 14 * 3600000).toISOString(),
        status: 'OPEN',
        bidsCount: 3,
        minIncrement: 1,
        location: 'Khanna Mandi Yard, Ludhiana',
        variety: 'Pusa 1121 Export Grade',
        createdAt: new Date().toISOString(),
        bidsHistory: [
          { bidderName: 'Apex Agro Mills Ltd', bidPriceKg: 41.50, bidTime: '10:45 AM' },
          { bidderName: 'Kisan Supply Chain Corp', bidPriceKg: 40.00, bidTime: '10:30 AM' },
          { bidderName: 'Golden Grain Exporters', bidPriceKg: 39.00, bidTime: '10:15 AM' }
        ]
      },
      {
        id: 'AUCT-102',
        cropId: 'crop-102',
        cropName: 'Sharbati Golden Wheat',
        farmerId: 'farmer-2',
        farmerName: 'Rameshwar Patel',
        startingPrice: 28.00,
        currentHighestBid: 30.00,
        highestBidderId: 'dealer-2',
        highestBidderName: 'Kisan Supply Chain Corp',
        quantity: 8000,
        unit: 'Kg',
        endTime: new Date(Date.now() + 18 * 3600000).toISOString(),
        status: 'OPEN',
        bidsCount: 2,
        minIncrement: 1,
        location: 'Sehore APMC Yard, MP',
        variety: 'Sharbati Grade A',
        createdAt: new Date().toISOString(),
        bidsHistory: [
          { bidderName: 'Kisan Supply Chain Corp', bidPriceKg: 30.00, bidTime: '11:10 AM' },
          { bidderName: 'Purity Agro Traders', bidPriceKg: 29.00, bidTime: '10:50 AM' }
        ]
      },
      {
        id: 'AUCT-103',
        cropId: 'crop-103',
        cropName: 'Organic Hybrid Tomato',
        farmerId: 'farmer-3',
        farmerName: 'Venkatesh Rao',
        startingPrice: 18.00,
        currentHighestBid: 21.00,
        highestBidderId: 'dealer-3',
        highestBidderName: 'FreshBasket Wholesale',
        quantity: 3000,
        unit: 'Kg',
        endTime: new Date(Date.now() + 8 * 3600000).toISOString(),
        status: 'OPEN',
        bidsCount: 4,
        minIncrement: 0.5,
        location: 'Madanapalle APMC, AP',
        variety: 'Hybrid F1 Export Quality',
        createdAt: new Date().toISOString(),
        bidsHistory: [
          { bidderName: 'FreshBasket Wholesale', bidPriceKg: 21.00, bidTime: '11:25 AM' },
          { bidderName: 'Apex Agro Mills Ltd', bidPriceKg: 20.50, bidTime: '11:15 AM' },
          { bidderName: 'Southern Organics', bidPriceKg: 19.50, bidTime: '11:00 AM' },
          { bidderName: 'Kisan Supply Chain Corp', bidPriceKg: 18.50, bidTime: '10:40 AM' }
        ]
      },
      {
        id: 'AUCT-104',
        cropId: 'crop-104',
        cropName: 'Nasik Red Onion (Export Quality)',
        farmerId: 'farmer-4',
        farmerName: 'Dattatray Shinde',
        startingPrice: 24.00,
        currentHighestBid: 24.00,
        highestBidderId: undefined,
        highestBidderName: undefined,
        quantity: 6000,
        unit: 'Kg',
        endTime: new Date(Date.now() + 22 * 3600000).toISOString(),
        status: 'OPEN',
        bidsCount: 0,
        minIncrement: 1,
        location: 'Lasalgaon Mandi Yard, Nashik',
        variety: 'Garwa Export Red',
        createdAt: new Date().toISOString(),
        bidsHistory: []
      }
    ];
  }

  public loadStoredAuctions(): BiddingAuction[] {
    const deleted = this.getDeletedAuctionIds();
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(a => !deleted.has(String(a.id)) && a.status !== 'CLOSED' && (a.status as string) !== 'AWARDED');
        }
      } catch (e) {}
    }
    const defaults = this.getDefaultAuctions().filter(a => !deleted.has(String(a.id)));
    this.saveStoredAuctions(defaults);
    return defaults;
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
            if (!deleted.has(sid) && !mapById.has(sid)) {
              mapById.set(sid, a);
            }
          });
        }
        return Array.from(mapById.values()).filter(a => !deleted.has(String(a.id)));
      })
    );
  }

  getActiveAuctions(): Observable<BiddingAuction[]> {
    const deleted = this.getDeletedAuctionIds();
    return this.http.get<BiddingAuction[]>(this.baseUrl).pipe(
      catchError(() => of(this.loadStoredAuctions())),
      map(data => {
        const local = this.loadStoredAuctions();
        const mapById = new Map<string, BiddingAuction>();
        local.forEach(a => mapById.set(String(a.id), a));
        if (data && data.length > 0) {
          data.forEach(a => {
            const sid = String(a.id);
            if (!deleted.has(sid) && !mapById.has(sid)) {
              mapById.set(sid, a);
            }
          });
        }
        // Exclude BLOCKED, CLOSED, AWARDED biddings completely from active bidding floor
        return Array.from(mapById.values()).filter(a => !deleted.has(String(a.id)) && (a.status === 'OPEN' || !a.status));
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
    const index = list.findIndex(a => a.id === bid.biddingId);
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

      this.http.post<BiddingAuction>(`${this.baseUrl}/${bid.biddingId}/bid`, bid).subscribe({
        next: () => {},
        error: () => {}
      });

      return of(list[index]);
    }
    return of({} as BiddingAuction);
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
