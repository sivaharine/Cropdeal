import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  WalletResponse,
  WalletTransactionResponse,
  WalletTopUpRequest,
  WalletDebitRequest,
  WalletCreditRequest,
  WalletSettlementRequest,
  CurrentUser
} from '../../../core/models/models';

type FilterType = 'ALL' | 'CREDIT' | 'DEBIT' | 'TOPUP';

@Component({
  selector: 'app-wallet-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './wallet-dashboard.component.html',
  styleUrls: ['./wallet-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WalletDashboardComponent implements OnInit, OnDestroy {
  currentUser: CurrentUser | null = null;
  wallet: WalletResponse | null = null;
  transactions: WalletTransactionResponse[] = [];
  filteredTransactions: WalletTransactionResponse[] = [];

  // Stats (cached fields, not template getters to prevent CD loops)
  totalBalance = 0;
  totalInflow = 0;
  totalOutflow = 0;
  transactionCount = 0;

  // Filter & Search
  activeFilter: FilterType = 'ALL';
  searchQuery = '';

  // Modals
  isTopUpModalOpen = false;
  isWithdrawModalOpen = false;
  isSettlementModalOpen = false;
  isCreditModalOpen = false;

  // Form Models
  topUpForm: { amount: number; paymentMethod: string; transactionReference: string } = {
    amount: 10000,
    paymentMethod: 'UPI',
    transactionReference: ''
  };

  withdrawForm: { amount: number; bankAccount: string; ifscCode: string; description: string } = {
    amount: 5000,
    bankAccount: '918237461928',
    ifscCode: 'SBIN0004321',
    description: 'Bank account transfer payout'
  };

  settlementForm: { amount: number; referenceId: string; description: string } = {
    amount: 25000,
    referenceId: '',
    description: 'Harvest fulfillment escrow settlement'
  };

  creditForm: { amount: number; transactionType: string; referenceId: string; description: string } = {
    amount: 5000,
    transactionType: 'SUBSIDY',
    referenceId: '',
    description: 'PM-KISAN DBT / Agricultural Market Incentive'
  };

  isSubmitting = false;
  private subs = new Subscription();

  constructor(
    public authService: AuthService,
    private paymentService: PaymentService,
    private notifService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  get isFarmer(): boolean {
    return this.currentUser?.role === 'FARMER';
  }

  get isDealer(): boolean {
    return this.currentUser?.role === 'DEALER';
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  get isDelivery(): boolean {
    return this.currentUser?.role === 'DELIVERY_PARTNER';
  }

  ngOnInit(): void {
    this.subs.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadWalletData(user.userId);
        }
        this.cdr.markForCheck();
      })
    );

    this.subs.add(
      this.paymentService.walletUpdated$.subscribe(userId => {
        if (this.currentUser && this.currentUser.userId === userId) {
          this.loadWalletData(userId);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadWalletData(userId: number): void {
    this.paymentService.getWallet(userId).subscribe({
      next: w => {
        this.wallet = w;
        this.transactions = w.transactions || [];
        this.updateStats();
        this.applyFilter();
        this.cdr.markForCheck();
      },
      error: () => {
        this.notifService.showToast('warning', 'Unable to sync with payment gateway. Showing offline wallet.');
        this.cdr.markForCheck();
      }
    });
  }

  private updateStats(): void {
    this.totalBalance = this.wallet?.balance || 0;
    let inflow = 0;
    let outflow = 0;

    for (const tx of this.transactions) {
      if (tx.amount > 0) {
        inflow += tx.amount;
      } else {
        outflow += Math.abs(tx.amount);
      }
    }

    this.totalInflow = inflow;
    this.totalOutflow = outflow;
    this.transactionCount = this.transactions.length;
  }

  setFilter(filter: FilterType): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    let list = [...this.transactions];

    if (this.activeFilter === 'CREDIT') {
      list = list.filter(t => t.amount > 0 && t.transactionType !== 'WALLET_TOPUP');
    } else if (this.activeFilter === 'DEBIT') {
      list = list.filter(t => t.amount < 0 || t.transactionType === 'DEBIT');
    } else if (this.activeFilter === 'TOPUP') {
      list = list.filter(t => t.transactionType === 'WALLET_TOPUP');
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(t =>
        (t.referenceId && t.referenceId.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.transactionType && t.transactionType.toLowerCase().includes(q))
      );
    }

    this.filteredTransactions = list;
    this.cdr.markForCheck();
  }

  // ─── Actions Calling All 5 Endpoints ─────────────────────────────────────

  /** 1. Top-Up Endpoint: POST /api/payments/wallet/topup */
  submitTopUp(): void {
    if (!this.currentUser || this.topUpForm.amount <= 0) {
      this.notifService.showToast('warning', 'Please enter a valid top-up amount');
      return;
    }

    this.isSubmitting = true;
    const req: WalletTopUpRequest = {
      userId: this.currentUser.userId,
      amount: Number(this.topUpForm.amount),
      paymentMethod: this.topUpForm.paymentMethod,
      transactionReference: this.topUpForm.transactionReference || ('PAY-' + Date.now().toString(36).toUpperCase())
    };

    this.paymentService.topUpWallet(req).subscribe({
      next: updated => {
        this.wallet = updated;
        this.transactions = updated.transactions || [];
        this.updateStats();
        this.applyFilter();
        this.isTopUpModalOpen = false;
        this.isSubmitting = false;
        this.cdr.markForCheck();
        this.notifService.showToast('success', `₹${req.amount.toLocaleString('en-IN')} added to wallet successfully!`);
      },
      error: () => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        this.notifService.showToast('error', 'Top-up failed. Please verify payment details.');
      }
    });
  }

  /** 2. Debit / Bank Withdrawal Endpoint: POST /api/payments/wallet/debit */
  submitWithdraw(): void {
    if (!this.currentUser || this.withdrawForm.amount <= 0) {
      this.notifService.showToast('warning', 'Please enter a valid withdrawal amount');
      return;
    }
    if (this.withdrawForm.amount > (this.wallet?.balance || 0)) {
      this.notifService.showToast('warning', 'Insufficient wallet balance for this withdrawal');
      return;
    }

    this.isSubmitting = true;
    const ref = 'WDR-' + Date.now().toString(36).toUpperCase();
    const req: WalletDebitRequest = {
      userId: this.currentUser.userId,
      amount: Number(this.withdrawForm.amount),
      transactionType: 'DEBIT',
      referenceId: ref,
      description: `${this.withdrawForm.description} (Acct: ${this.withdrawForm.bankAccount.slice(-4)})`
    };

    this.paymentService.debitWallet(req).subscribe({
      next: updated => {
        this.wallet = updated;
        this.transactions = updated.transactions || [];
        this.updateStats();
        this.applyFilter();
        this.isWithdrawModalOpen = false;
        this.isSubmitting = false;
        this.cdr.markForCheck();
        this.notifService.showToast('success', `₹${req.amount.toLocaleString('en-IN')} payout initiated to Bank Account.`);
      },
      error: () => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        this.notifService.showToast('error', 'Withdrawal failed. Insufficient funds or invalid bank details.');
      }
    });
  }

  /** 3. Settlement Credit Endpoint: POST /api/payments/wallet/settlement */
  submitSettlement(): void {
    if (!this.currentUser || this.settlementForm.amount <= 0) {
      this.notifService.showToast('warning', 'Please enter a valid settlement amount');
      return;
    }

    this.isSubmitting = true;
    const ref = this.settlementForm.referenceId || ('SETTLE-' + Date.now().toString(36).toUpperCase());
    const req: WalletSettlementRequest = {
      userId: this.currentUser.userId,
      userRole: this.currentUser.role === 'FARMER' ? 'ROLE_FARMER' : 'ROLE_DEALER',
      amount: Number(this.settlementForm.amount),
      referenceId: ref,
      description: this.settlementForm.description
    };

    this.paymentService.creditWalletSettlement(req).subscribe({
      next: updated => {
        this.wallet = updated;
        this.transactions = updated.transactions || [];
        this.updateStats();
        this.applyFilter();
        this.isSettlementModalOpen = false;
        this.isSubmitting = false;
        this.cdr.markForCheck();
        this.notifService.showToast('success', `Settlement of ₹${req.amount.toLocaleString('en-IN')} released to wallet.`);
      },
      error: () => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        this.notifService.showToast('error', 'Settlement failed. Please check order status.');
      }
    });
  }

  /** 4. Incentive / Subsidy Credit Endpoint: POST /api/payments/wallet/credit */
  submitCredit(): void {
    if (!this.currentUser || this.creditForm.amount <= 0) {
      this.notifService.showToast('warning', 'Please enter a valid credit amount');
      return;
    }

    this.isSubmitting = true;
    const ref = this.creditForm.referenceId || ('CR-' + Date.now().toString(36).toUpperCase());
    const req: WalletCreditRequest = {
      userId: this.currentUser.userId,
      amount: Number(this.creditForm.amount),
      transactionType: this.creditForm.transactionType,
      referenceId: ref,
      description: this.creditForm.description
    };

    this.paymentService.creditWallet(req).subscribe({
      next: updated => {
        this.wallet = updated;
        this.transactions = updated.transactions || [];
        this.updateStats();
        this.applyFilter();
        this.isCreditModalOpen = false;
        this.isSubmitting = false;
        this.cdr.markForCheck();
        this.notifService.showToast('success', `Credited ₹${req.amount.toLocaleString('en-IN')} to wallet successfully.`);
      },
      error: () => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        this.notifService.showToast('error', 'Credit allocation failed.');
      }
    });
  }

  /** 5. Refresh Wallet Balance: GET /api/payments/wallet/{userId} */
  refreshWallet(): void {
    if (this.currentUser) {
      this.loadWalletData(this.currentUser.userId);
      this.notifService.showToast('info', 'Wallet statement refreshed');
    }
  }

  selectPresetTopUp(amount: number): void {
    this.topUpForm.amount = amount;
  }
}
