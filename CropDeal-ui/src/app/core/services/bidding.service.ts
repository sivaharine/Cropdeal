import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BiddingSessionResponse, CreateBiddingSessionRequest,
  BidResponse, PlaceBidRequest
} from '../models/models';
import { NotificationService } from './notification.service';

const SESSIONS_KEY = 'cropdeal_sessions_cache';
const BIDS_KEY     = 'cropdeal_bids_cache';

@Injectable({ providedIn: 'root' })
export class BiddingService {
  private readonly baseUrl = `${environment.apiUrl}/bidding`;
  private sessionsCache: BiddingSessionResponse[] = this.loadSessions();
  private bidsCache: Record<number, BidResponse[]>  = this.loadBids();

  constructor(private http: HttpClient, private notifService: NotificationService) {}

  // ── Persistence helpers ─────────────────────────────────────────────────
  private loadSessions(): BiddingSessionResponse[] {
    try { const r = localStorage.getItem(SESSIONS_KEY); return r ? JSON.parse(r) : []; }
    catch { return []; }
  }
  private saveSessions(): void {
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(this.sessionsCache)); } catch {}
  }
  private loadBids(): Record<number, BidResponse[]> {
    try { const r = localStorage.getItem(BIDS_KEY); return r ? JSON.parse(r) : {}; }
    catch { return {}; }
  }
  private saveBids(): void {
    try { localStorage.setItem(BIDS_KEY, JSON.stringify(this.bidsCache)); } catch {}
  }

  // ── Auth headers helper ─────────────────────────────────────────────────
  private authHeaders(userId: number, role: string): HttpHeaders {
    return new HttpHeaders({
      'X-User-Id': userId.toString(),
      'X-User-Role': role
    });
  }

  // ── GET /sessions/active ─────────────────────────────────────────────────
  public getActiveSessions(): Observable<BiddingSessionResponse[]> {
    return this.http.get<BiddingSessionResponse[]>(`${this.baseUrl}/sessions/active`).pipe(
      tap(sessions => {
        if (sessions && sessions.length > 0) {
          const backendIds = new Set(sessions.map(s => s.id));
          const localOnly  = this.sessionsCache.filter(s => !backendIds.has(s.id));
          this.sessionsCache = [...sessions, ...localOnly];
          this.saveSessions();
        }
      }),
      catchError(() => of([...this.sessionsCache.filter(s => s.status === 'ACTIVE')]))
    );
  }

  /** Alias used by admin / delivery views */
  public getAllSessions(): Observable<BiddingSessionResponse[]> {
    return this.getActiveSessions();
  }

  // ── GET /sessions/{id} ──────────────────────────────────────────────────
  public getSessionById(id: number): Observable<BiddingSessionResponse> {
    return this.http.get<BiddingSessionResponse>(`${this.baseUrl}/sessions/${id}`).pipe(
      tap(s => {
        const idx = this.sessionsCache.findIndex(x => x.id === id);
        if (idx !== -1) this.sessionsCache[idx] = s;
        else this.sessionsCache.push(s);
        this.saveSessions();
      }),
      catchError(() => {
        const s = this.sessionsCache.find(x => x.id === id);
        return of(s || this.sessionsCache[0]);
      })
    );
  }

  // ── GET /sessions/farmer/{farmerId} ─────────────────────────────────────
  public getSessionsByFarmer(farmerId: number): Observable<BiddingSessionResponse[]> {
    return this.http.get<BiddingSessionResponse[]>(`${this.baseUrl}/sessions/farmer/${farmerId}`).pipe(
      tap(sessions => {
        if (sessions && sessions.length > 0) {
          const ids    = new Set(sessions.map(s => s.id));
          const others = this.sessionsCache.filter(s => !ids.has(s.id));
          this.sessionsCache = [...sessions, ...others];
          this.saveSessions();
        }
      }),
      catchError(() => of(this.sessionsCache.filter(s => s.farmerId === farmerId)))
    );
  }

  // ── POST /sessions ───────────────────────────────────────────────────────
  /**
   * Backend resolves farmerId from X-User-Id header.
   * We also pass it in the body for offline-fallback compatibility.
   */
  public createSession(request: CreateBiddingSessionRequest, farmerId: number): Observable<BiddingSessionResponse> {
    const headers = this.authHeaders(farmerId, 'FARMER');
    return this.http.post<BiddingSessionResponse>(`${this.baseUrl}/sessions`, request, { headers }).pipe(
      tap(newSession => {
        this.sessionsCache = [newSession, ...this.sessionsCache];
        this.saveSessions();
      }),
      catchError(() => {
        const newSession: BiddingSessionResponse = {
          id: Date.now(),
          cropId: request.cropId,
          farmerId: farmerId,
          cropName: request.cropName,
          quantity: request.quantity,
          unit: request.unit || 'KG',
          basePrice: request.basePrice,
          minIncrement: request.minIncrement || 2,
          currentHighestBid: request.basePrice,
          highestBidderId: undefined,
          startTime: request.startTime,
          endTime: request.endTime,
          status: 'ACTIVE',
          district: request.district || '',
          state: request.state || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.sessionsCache = [newSession, ...this.sessionsCache];
        this.saveSessions();
        return of(newSession);
      })
    );
  }

  // ── POST /sessions/{id}/bids ─────────────────────────────────────────────
  /**
   * Backend resolves dealerId from X-User-Id header.
   * Body only needs: { bidAmount, notes }.
   */
  public placeBid(sessionId: number, request: PlaceBidRequest, dealerId: number): Observable<BidResponse> {
    const headers = this.authHeaders(dealerId, 'DEALER');
    // Send only what backend expects — bidAmount + notes
    const body = { bidAmount: request.bidAmount, notes: request.notes };
    return this.http.post<BidResponse>(`${this.baseUrl}/sessions/${sessionId}/bids`, body, { headers }).pipe(
      tap(bid => {
        if (!this.bidsCache[sessionId]) this.bidsCache[sessionId] = [];
        this.bidsCache[sessionId] = [bid, ...this.bidsCache[sessionId]];
        const session = this.sessionsCache.find(s => s.id === sessionId);
        if (session) {
          session.currentHighestBid = bid.bidAmount;
          session.highestBidderId   = bid.dealerId;
        }
        this.saveSessions();
        this.saveBids();
      }),
      catchError(() => {
        const newBid: BidResponse = {
          id: Date.now(),
          sessionId,
          dealerId,
          bidAmount: request.bidAmount,
          bidTime: new Date().toISOString(),
          status: 'ACCEPTED',
          notes: request.notes
        };
        if (!this.bidsCache[sessionId]) this.bidsCache[sessionId] = [];
        this.bidsCache[sessionId] = [newBid, ...this.bidsCache[sessionId]];
        const session = this.sessionsCache.find(s => s.id === sessionId);
        if (session) {
          session.currentHighestBid = request.bidAmount;
          session.highestBidderId   = dealerId;
        }
        this.saveSessions();
        this.saveBids();
        return of(newBid);
      })
    );
  }

  // ── GET /sessions/{id}/bids ──────────────────────────────────────────────
  public getBidsForSession(sessionId: number): Observable<BidResponse[]> {
    return this.http.get<BidResponse[]>(`${this.baseUrl}/sessions/${sessionId}/bids`).pipe(
      tap(bids => {
        if (bids && bids.length > 0) {
          this.bidsCache[sessionId] = bids;
          this.saveBids();
        }
      }),
      catchError(() => of(this.bidsCache[sessionId] || []))
    );
  }

  // ── GET /bids/dealer/{dealerId} ──────────────────────────────────────────
  public getBidsByDealer(dealerId: number): Observable<BidResponse[]> {
    return this.http.get<BidResponse[]>(`${this.baseUrl}/bids/dealer/${dealerId}`).pipe(
      catchError(() => {
        const allBids: BidResponse[] = Object.values(this.bidsCache).flat();
        return of(allBids.filter(b => b.dealerId === dealerId));
      })
    );
  }

  // ── POST /sessions/{id}/close ────────────────────────────────────────────
  public closeSession(sessionId: number, farmerId: number): Observable<BiddingSessionResponse> {
    const headers = this.authHeaders(farmerId, 'FARMER');
    return this.http.post<BiddingSessionResponse>(
      `${this.baseUrl}/sessions/${sessionId}/close`, null, { headers }
    ).pipe(
      tap(updated => {
        const idx = this.sessionsCache.findIndex(s => s.id === sessionId);
        if (idx !== -1) { this.sessionsCache[idx] = updated; this.saveSessions(); }
      }),
      catchError(() => {
        const s = this.sessionsCache.find(x => x.id === sessionId);
        if (s) {
          s.status = 'COMPLETED';
          this.saveSessions();
          return of({ ...s });
        }
        return of(this.sessionsCache[0]);
      })
    );
  }

  // ── DELETE /sessions/{id} ────────────────────────────────────────────────
  public cancelSession(sessionId: number, farmerId: number): Observable<void> {
    const headers = this.authHeaders(farmerId, 'FARMER');
    return this.http.delete<void>(`${this.baseUrl}/sessions/${sessionId}`, { headers }).pipe(
      tap(() => {
        this.sessionsCache = this.sessionsCache.filter(s => s.id !== sessionId);
        this.saveSessions();
      }),
      catchError(() => {
        this.sessionsCache = this.sessionsCache.filter(s => s.id !== sessionId);
        this.saveSessions();
        return of(undefined);
      })
    );
  }
}
