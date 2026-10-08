import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NegotiationService } from '../../../core/services/negotiation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { NegotiationResponse, OfferResponse, OfferRequest } from '../../../core/models/models';

@Component({
  selector: 'app-negotiation-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './negotiation-hub.component.html',
  styleUrls: ['./negotiation-hub.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NegotiationHubComponent implements OnInit {
  negotiations: NegotiationResponse[] = [];
  selectedNegotiation: NegotiationResponse | null = null;

  counterAmount: number = 0;
  counterMessage: string = '';

  constructor(
    private negotiationService: NegotiationService,
    private notifService: NotificationService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(() => {
      this.loadNegotiations();
      this.cdr.markForCheck();
    });
  }

  loadNegotiations(): void {
    const user = this.authService.currentUser;
    const userId = Number(user?.userId || (user?.role === 'FARMER' ? 1 : 10));

    if (user?.role === 'ADMIN') {
      this.negotiationService.getAllNegotiations().subscribe(list => {
        this.negotiations = list || [];
        this.syncSelection();
        this.cdr.markForCheck();
      });
    } else if (user?.role === 'FARMER') {
      this.negotiationService.getNegotiationsBySeller(userId).subscribe(list => {
        this.negotiations = list || [];
        this.syncSelection();
        this.cdr.markForCheck();
      });
    } else {
      this.negotiationService.getNegotiationsByBuyer(userId).subscribe(list => {
        this.negotiations = list || [];
        this.syncSelection();
        this.cdr.markForCheck();
      });
    }
  }

  private syncSelection(): void {
    if (this.negotiations.length > 0) {
      if (this.selectedNegotiation) {
        const found = this.negotiations.find(n => Number(n.id) === Number(this.selectedNegotiation?.id));
        this.selectNegotiation(found || this.negotiations[0]);
      } else {
        this.selectNegotiation(this.negotiations[0]);
      }
    } else {
      this.selectedNegotiation = null;
    }
  }

  selectNegotiation(neg: NegotiationResponse): void {
    this.selectedNegotiation = neg;
    const offers = neg.offers || [];
    const lastOffer = offers.length > 0 ? offers[0] : null;
    this.counterAmount = lastOffer ? lastOffer.amount : neg.targetPrice;
    this.counterMessage = '';
    this.cdr.markForCheck();
  }

  isMine(off: OfferResponse): boolean {
    const currentId = Number(this.authService.currentUser?.userId);
    return Number(off.offeredByUserId) === currentId;
  }

  isPendingFromOther(off: OfferResponse): boolean {
    const currentId = Number(this.authService.currentUser?.userId);
    return off.status === 'PENDING' && Number(off.offeredByUserId) !== currentId;
  }

  getSenderLabel(off: OfferResponse): string {
    const currentId = Number(this.authService.currentUser?.userId);
    if (Number(off.offeredByUserId) === currentId) {
      return `You (${this.authService.currentUser?.role === 'FARMER' ? 'Farmer' : 'Dealer'})`;
    }
    return this.authService.currentUser?.role === 'FARMER' ? 'Dealer (Buyer)' : 'Farmer (Seller)';
  }

  sendCounterOffer(): void {
    if (!this.selectedNegotiation || this.counterAmount <= 0) return;
    const user = this.authService.currentUser;
    const userId = Number(user?.userId || (user?.role === 'FARMER' ? 1 : 10));
    const neg = this.selectedNegotiation;
    const counterPartyId = (userId === Number(neg.buyerId)) ? Number(neg.sellerId) : Number(neg.buyerId);

    const req: OfferRequest = {
      offeredByUserId: userId,
      amount: Number(this.counterAmount),
      message: this.counterMessage || `Proposing revised rate of ₹${this.counterAmount}/KG`
    };

    this.negotiationService.createCounterOffer(neg.id, req).subscribe(offer => {
      // 1. Immediately update the live view with the farmer's (or dealer's) new counter offer!
      if (this.selectedNegotiation && Number(this.selectedNegotiation.id) === Number(neg.id)) {
        this.selectedNegotiation.offers = (this.selectedNegotiation.offers || []).map(o =>
          o.status === 'PENDING' ? { ...o, status: 'COUNTERED' } : o
        );
        this.selectedNegotiation.offers = [offer, ...this.selectedNegotiation.offers];
        this.selectedNegotiation.targetPrice = offer.amount;

        const idx = this.negotiations.findIndex(n => Number(n.id) === Number(neg.id));
        if (idx !== -1) {
          this.negotiations[idx] = { ...this.selectedNegotiation };
          this.negotiations = [...this.negotiations];
        }
      }

      this.counterMessage = '';
      this.cdr.markForCheck();
      this.notifService.showToast('success', `Counter offer of ₹${offer.amount}/KG transmitted to counterpart!`);

      // 2. Notify counterpart
      if (counterPartyId) {
        this.notifService.pushNotification(
          'NEGOTIATION',
          '💬 Counter-Offer Received',
          `${user?.name || 'Counterpart'} submitted a counter-proposal of ₹${offer.amount}/KG on ${neg.cropName || 'Produce'} (Deal #${neg.id}).`,
          counterPartyId
        );
      }
    });
  }

  acceptOffer(offer: OfferResponse): void {
    const neg = this.selectedNegotiation;
    if (!neg) return;
    const user = this.authService.currentUser;
    const userId = Number(user?.userId);
    const counterPartyId = (userId === Number(neg.buyerId)) ? Number(neg.sellerId) : Number(neg.buyerId);

    this.negotiationService.acceptOffer(offer.id).subscribe(() => {
      offer.status = 'ACCEPTED';
      if (this.selectedNegotiation) {
        this.selectedNegotiation.status = 'ACCEPTED';
        this.selectedNegotiation.offers = this.selectedNegotiation.offers.map(o =>
          Number(o.id) === Number(offer.id) ? { ...o, status: 'ACCEPTED' } : o
        );
        const idx = this.negotiations.findIndex(n => Number(n.id) === Number(neg.id));
        if (idx !== -1) {
          this.negotiations[idx] = { ...this.selectedNegotiation };
          this.negotiations = [...this.negotiations];
        }
      }
      this.cdr.markForCheck();
      this.notifService.showToast('success', `Offer of ₹${offer.amount}/KG accepted! Deal closed.`);

      if (counterPartyId) {
        this.notifService.pushNotification(
          'NEGOTIATION',
          '🤝 Negotiation Deal Closed!',
          `Your offer of ₹${offer.amount}/KG on ${neg.cropName || 'Produce'} was ACCEPTED. Proceed to order checkout.`,
          counterPartyId
        );
      }
    });
  }

  rejectOffer(offer: OfferResponse): void {
    const neg = this.selectedNegotiation;
    if (!neg) return;
    const user = this.authService.currentUser;
    const userId = Number(user?.userId);
    const counterPartyId = (userId === Number(neg.buyerId)) ? Number(neg.sellerId) : Number(neg.buyerId);

    this.negotiationService.rejectOffer(offer.id).subscribe(() => {
      offer.status = 'REJECTED';
      if (this.selectedNegotiation) {
        this.selectedNegotiation.status = 'CLOSED';
        this.selectedNegotiation.offers = this.selectedNegotiation.offers.map(o =>
          Number(o.id) === Number(offer.id) ? { ...o, status: 'REJECTED' } : o
        );
        const idx = this.negotiations.findIndex(n => Number(n.id) === Number(neg.id));
        if (idx !== -1) {
          this.negotiations[idx] = { ...this.selectedNegotiation };
          this.negotiations = [...this.negotiations];
        }
      }
      this.cdr.markForCheck();
      this.notifService.showToast('info', `Offer of ₹${offer.amount}/KG rejected.`);

      if (counterPartyId) {
        this.notifService.pushNotification(
          'NEGOTIATION',
          '❌ Offer Declined',
          `Offer of ₹${offer.amount}/KG on ${neg.cropName || 'Produce'} was declined.`,
          counterPartyId
        );
      }
    });
  }
}
