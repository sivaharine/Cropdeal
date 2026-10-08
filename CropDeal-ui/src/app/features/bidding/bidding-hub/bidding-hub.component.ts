import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BiddingService } from '../../../core/services/bidding.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { BiddingSessionResponse, BidResponse, PlaceBidRequest } from '../../../core/models/models';

@Component({
  selector: 'app-bidding-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './bidding-hub.component.html',
  styleUrls: ['./bidding-hub.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BiddingHubComponent implements OnInit {
  sessions: BiddingSessionResponse[]  = [];
  selectedSession: BiddingSessionResponse | null = null;
  sessionBids: BidResponse[]          = [];
  myBids: BidResponse[]               = [];       // GET /bids/dealer/{dealerId}
  filteredMyBids: BidResponse[]       = [];

  isBidModalOpen    = false;
  isCancelModalOpen = false;     // Cancel-auction confirmation
  sessionToCancel: BiddingSessionResponse | null = null;

  bidAmount = 0;
  bidNotes  = '';
  myBidsSearch = '';
  activeTab: 'sessions' | 'my-bids' = 'sessions';

  isLoading     = true;
  isLoadingBids = false;

  constructor(
    private biddingService: BiddingService,
    private notifService: NotificationService,
    public  authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  // ── Role helpers ─────────────────────────────────────────────────────────
  get role(): string    { return this.authService.currentUser?.role || ''; }
  get userId(): number  { return this.authService.currentUser?.userId || 1; }
  get isFarmer(): boolean         { return this.role === 'FARMER'; }
  get isDealer(): boolean         { return this.role === 'DEALER'; }
  get isAdmin(): boolean          { return this.role === 'ADMIN'; }
  get isDelivery(): boolean       { return this.role === 'DELIVERY_PARTNER'; }

  ngOnInit(): void {
    this.loadSessions();
    if (this.isDealer) {
      this.loadMyBids();
    }
  }

  // ── Load sessions ─────────────────────────────────────────────────────────
  loadSessions(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    if (this.isFarmer) {
      this.biddingService.getSessionsByFarmer(this.userId).subscribe({
        next: sessions => {
          if (!sessions || sessions.length === 0) {
            this.loadAllActive();
          } else {
            this.sessions    = sessions;
            this.isLoading   = false;
            if (this.sessions.length > 0) this.selectSession(this.sessions[0]);
            this.cdr.markForCheck();
          }
        },
        error: () => this.loadAllActive()
      });
    } else {
      this.loadAllActive();
    }
  }

  private loadAllActive(): void {
    this.biddingService.getActiveSessions().subscribe(sessions => {
      this.sessions  = sessions || [];
      this.isLoading = false;
      if (this.sessions.length > 0 && !this.selectedSession) {
        this.selectSession(this.sessions[0]);
      }
      this.cdr.markForCheck();
    });
  }

  // ── GET /bids/dealer/{dealerId} ───────────────────────────────────────────
  loadMyBids(): void {
    this.isLoadingBids = true;
    this.cdr.markForCheck();
    this.biddingService.getBidsByDealer(this.userId).subscribe(bids => {
      this.myBids         = bids || [];
      this.filteredMyBids = [...this.myBids];
      this.isLoadingBids  = false;
      this.cdr.markForCheck();
    });
  }

  filterMyBids(): void {
    const q = this.myBidsSearch.toLowerCase().trim();
    this.filteredMyBids = q
      ? this.myBids.filter(b =>
          b.bidAmount.toString().includes(q) ||
          b.status.toLowerCase().includes(q) ||
          b.sessionId.toString().includes(q)
        )
      : [...this.myBids];
    this.cdr.markForCheck();
  }

  // ── Select session — calls GET /sessions/{id}/bids ────────────────────────
  selectSession(session: BiddingSessionResponse): void {
    this.selectedSession = session;
    this.cdr.markForCheck();
    this.biddingService.getBidsForSession(session.id).subscribe(bids => {
      this.sessionBids = bids || [];
      this.cdr.markForCheck();
    });
  }

  // ── Open bid modal ────────────────────────────────────────────────────────
  openBidModal(session: BiddingSessionResponse): void {
    if (!this.isDealer) return;
    this.selectedSession = session;
    this.bidAmount = (session.currentHighestBid || session.basePrice) + session.minIncrement;
    this.bidNotes  = '';
    this.isBidModalOpen = true;
    this.cdr.markForCheck();
  }

  // ── POST /sessions/{id}/bids ─────────────────────────────────────────────
  submitBid(): void {
    if (!this.selectedSession || !this.isDealer) return;
    const current = this.selectedSession.currentHighestBid || this.selectedSession.basePrice;
    const minBid  = current + this.selectedSession.minIncrement;

    if (this.bidAmount < minBid) {
      this.notifService.showToast('warning', `Bid must be at least ₹${minBid}/KG`);
      return;
    }

    const prevHighestBidderId = this.selectedSession.highestBidderId;
    const farmerId            = this.selectedSession.farmerId;
    const cropName            = this.selectedSession.cropName;
    const req: PlaceBidRequest = { dealerId: this.userId, bidAmount: this.bidAmount, notes: this.bidNotes };

    this.biddingService.placeBid(this.selectedSession.id, req, this.userId).subscribe(bid => {
      // Update session inline (immutable for OnPush)
      const idx = this.sessions.findIndex(s => s.id === this.selectedSession!.id);
      if (idx !== -1) {
        this.sessions = this.sessions.map((s, i) => i === idx
          ? { ...s, currentHighestBid: bid.bidAmount, highestBidderId: bid.dealerId }
          : s
        );
        this.selectedSession = this.sessions[idx];
      }
      this.sessionBids    = [bid, ...this.sessionBids];
      this.isBidModalOpen = false;
      this.cdr.markForCheck();

      this.notifService.showToast('success', `Bid ₹${bid.bidAmount}/KG placed! You are the highest bidder.`);

      if (farmerId && farmerId !== this.userId) {
        this.notifService.pushNotification(
          'BID',
          '🔨 New Bid on Your Auction',
          `Dealer #${this.userId} placed ₹${bid.bidAmount}/KG on your ${cropName} auction.`,
          farmerId
        );
      }
      if (prevHighestBidderId && prevHighestBidderId !== this.userId) {
        this.notifService.pushNotification(
          'BID',
          '⚠️ Outbid Alert',
          `You've been outbid on "${cropName}". New highest bid: ₹${bid.bidAmount}/KG.`,
          prevHighestBidderId
        );
      }
    });
  }

  // ── POST /sessions/{id}/close ─────────────────────────────────────────────
  closeAuction(session: BiddingSessionResponse): void {
    if (!this.isFarmer && !this.isAdmin) return;
    this.biddingService.closeSession(session.id, this.userId).subscribe(updated => {
      this.sessions = this.sessions.map(s => s.id === session.id ? updated : s);
      if (this.selectedSession?.id === session.id) this.selectedSession = updated;
      this.cdr.markForCheck();

      this.notifService.showToast('success', `Auction #${session.id} closed! Winning dealer notified.`);
      if (session.highestBidderId) {
        this.notifService.pushNotification(
          'AUCTION',
          '🎉 You Won the Auction!',
          `You won the auction for "${session.cropName}" at ₹${session.currentHighestBid}/KG. Check Orders.`,
          session.highestBidderId
        );
      }
    });
  }

  // ── DELETE /sessions/{id} — cancel auction ───────────────────────────────
  openCancelModal(session: BiddingSessionResponse): void {
    if (!this.isFarmer) return;
    this.sessionToCancel  = session;
    this.isCancelModalOpen = true;
    this.cdr.markForCheck();
  }

  confirmCancelAuction(): void {
    if (!this.sessionToCancel) return;
    this.biddingService.cancelSession(this.sessionToCancel.id, this.userId).subscribe(() => {
      this.notifService.showToast('info', `Auction "${this.sessionToCancel!.cropName}" cancelled. Any bid holds refunded.`);
      this.sessions = this.sessions.filter(s => s.id !== this.sessionToCancel!.id);
      if (this.selectedSession?.id === this.sessionToCancel!.id) {
        this.selectedSession = this.sessions[0] || null;
        this.sessionBids     = [];
      }
      this.sessionToCancel   = null;
      this.isCancelModalOpen = false;
      this.cdr.markForCheck();
    });
  }

  // ── Refresh ───────────────────────────────────────────────────────────────
  refreshSessions(): void {
    this.sessions        = [];
    this.selectedSession = null;
    this.sessionBids     = [];
    this.loadSessions();
  }
}
