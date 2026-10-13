import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap, map } from 'rxjs';
import { Wallet, WalletTransaction } from '../models/wallet.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private baseUrl = `${environment.apiUrl}/wallet`;

  // Emits unreserved / spendable available balance
  private balanceSubject = new BehaviorSubject<number>(0);
  public balance$ = this.balanceSubject.asObservable();

  // Emits full wallet details
  private walletSubject = new BehaviorSubject<Wallet>({
    userId: '1',
    balance: 0,
    reservedBalance: 0,
    availableBalance: 0,
    currency: 'INR'
  });
  public wallet$ = this.walletSubject.asObservable();

  constructor(private http: HttpClient) {}

  getWallet(userId: string): Observable<Wallet> {
    const cached = this.getStoredWallet(userId);
    this.balanceSubject.next(cached.availableBalance);
    this.walletSubject.next(cached);

    return this.http.get<any>(`${this.baseUrl}/user/${userId}`).pipe(
      map(res => {
        if (res) {
          const total = Number(res.totalBalance != null ? res.totalBalance : (res.balance != null ? res.balance : cached.balance));
          const reserved = Number(res.reservedBalance != null ? res.reservedBalance : cached.reservedBalance);
          const available = Number(res.availableBalance != null ? res.availableBalance : Math.max(0, total - reserved));

          const mapped: Wallet = {
            id: res.walletId ? 'w-' + res.walletId : 'w-' + userId,
            walletId: res.walletId,
            userId: String(userId),
            userRole: res.userRole,
            balance: total,
            totalBalance: total,
            reservedBalance: reserved,
            availableBalance: available,
            currency: 'INR',
            updatedAt: new Date().toISOString()
          };

          this.saveStoredWallet(userId, mapped);
          this.balanceSubject.next(available);
          this.walletSubject.next(mapped);
          return mapped;
        }
        return cached;
      }),
      catchError(() => {
        return of(cached);
      })
    );
  }

  creditWallet(userId: string, amount: number, description: string): Observable<any> {
    const wallet = this.getStoredWallet(userId);
    const newTotal = wallet.balance + amount;
    const newAvailable = Math.max(0, newTotal - wallet.reservedBalance);

    const updated: Wallet = {
      ...wallet,
      balance: newTotal,
      totalBalance: newTotal,
      availableBalance: newAvailable,
      updatedAt: new Date().toISOString()
    };
    this.saveStoredWallet(userId, updated);
    this.balanceSubject.next(newAvailable);
    this.walletSubject.next(updated);

    this.addLocalTransaction(userId, {
      id: 'TXN-' + Math.floor(1000 + Math.random() * 9000),
      walletId: 'w-' + userId,
      userId: userId,
      amount: amount,
      type: 'CREDIT',
      description: description,
      status: 'SETTLED',
      timestamp: new Date().toISOString()
    });

    const payload = {
      userId: !isNaN(Number(userId)) ? Number(userId) : 1,
      amount: amount,
      description: description
    };

    return this.http.post<any>(`${this.baseUrl}/credit`, payload).pipe(
      catchError(() => of({ success: true, balance: newTotal, availableBalance: newAvailable }))
    );
  }

  debitWallet(userId: string, amount: number, description: string): Observable<{ success: boolean; message: string; balance?: number }> {
    const wallet = this.getStoredWallet(userId);
    if (wallet.availableBalance < amount) {
      return of({
        success: false,
        message: `Insufficient available wallet balance. Required: ₹${amount.toLocaleString()}, Available: ₹${wallet.availableBalance.toLocaleString()} (₹${wallet.reservedBalance.toLocaleString()} is locked in active bids).`
      });
    }

    const newTotal = Math.max(0, wallet.balance - amount);
    const newAvailable = Math.max(0, newTotal - wallet.reservedBalance);

    const updated: Wallet = {
      ...wallet,
      balance: newTotal,
      totalBalance: newTotal,
      availableBalance: newAvailable,
      updatedAt: new Date().toISOString()
    };
    this.saveStoredWallet(userId, updated);
    this.balanceSubject.next(newAvailable);
    this.walletSubject.next(updated);

    this.addLocalTransaction(userId, {
      id: 'TXN-' + Math.floor(1000 + Math.random() * 9000),
      walletId: 'w-' + userId,
      userId: userId,
      amount: amount,
      type: 'DEBIT',
      description: description,
      status: 'SETTLED',
      timestamp: new Date().toISOString()
    });

    const payload = {
      userId: !isNaN(Number(userId)) ? Number(userId) : 1,
      amount: amount,
      description: description
    };

    return this.http.post<any>(`${this.baseUrl}/debit`, payload).pipe(
      catchError(() => of({ success: true, message: 'Deducted from wallet successfully', balance: newAvailable }))
    );
  }

  reserveFunds(userId: string, amount: number, referenceId: string, description?: string): Observable<any> {
    const wallet = this.getStoredWallet(userId);
    if (wallet.availableBalance < amount) {
      return of({
        success: false,
        message: `Insufficient unreserved funds. Required: ₹${amount.toLocaleString()}, Available: ₹${wallet.availableBalance.toLocaleString()} (₹${wallet.reservedBalance.toLocaleString()} is already locked).`
      });
    }

    const newReserved = wallet.reservedBalance + amount;
    const newAvailable = Math.max(0, wallet.balance - newReserved);

    const updated: Wallet = {
      ...wallet,
      reservedBalance: newReserved,
      availableBalance: newAvailable,
      updatedAt: new Date().toISOString()
    };
    this.saveStoredWallet(userId, updated);
    this.balanceSubject.next(newAvailable);
    this.walletSubject.next(updated);

    const desc = description || `Escrow hold reserved for bid ${referenceId}`;
    this.addLocalTransaction(userId, {
      id: 'RES-' + Math.floor(1000 + Math.random() * 9000),
      walletId: 'w-' + userId,
      userId: userId,
      amount: amount,
      type: 'RESERVATION',
      referenceId: referenceId,
      description: desc,
      status: 'ACTIVE_ESCROW',
      timestamp: new Date().toISOString()
    });

    const payload = {
      userId: !isNaN(Number(userId)) ? Number(userId) : 2,
      referenceId: referenceId,
      amount: amount
    };

    return this.http.post<any>(`${this.baseUrl}/reserve`, payload).pipe(
      catchError(() => of({ success: true, reservedBalance: newReserved, availableBalance: newAvailable }))
    );
  }

  releaseFunds(userId: string, referenceId: string, amount?: number, description?: string): Observable<any> {
    const wallet = this.getStoredWallet(userId);
    let releaseAmount = amount || 0;

    // Look up amount from reservation history if not explicitly provided
    if (releaseAmount <= 0) {
      const txns = this.getLocalTransactions(userId);
      const matched = txns.find(t => t.referenceId === referenceId && t.type === 'RESERVATION');
      if (matched) {
        releaseAmount = matched.amount;
      }
    }

    const newReserved = Math.max(0, wallet.reservedBalance - releaseAmount);
    const newAvailable = Math.max(0, wallet.balance - newReserved);

    const updated: Wallet = {
      ...wallet,
      reservedBalance: newReserved,
      availableBalance: newAvailable,
      updatedAt: new Date().toISOString()
    };
    this.saveStoredWallet(userId, updated);
    this.balanceSubject.next(newAvailable);
    this.walletSubject.next(updated);

    const desc = description || `Released reserved escrow funds for ${referenceId}`;
    this.addLocalTransaction(userId, {
      id: 'REL-' + Math.floor(1000 + Math.random() * 9000),
      walletId: 'w-' + userId,
      userId: userId,
      amount: releaseAmount,
      type: 'RELEASE',
      referenceId: referenceId,
      description: desc,
      status: 'RELEASED',
      timestamp: new Date().toISOString()
    });

    const payload = {
      userId: !isNaN(Number(userId)) ? Number(userId) : 2,
      referenceId: referenceId
    };

    return this.http.post<any>(`${this.baseUrl}/release`, payload).pipe(
      catchError(() => of({ success: true, reservedBalance: newReserved, availableBalance: newAvailable }))
    );
  }

  consumeFunds(userId: string, referenceId: string, payeeUserId?: string, cropName?: string, amount?: number): Observable<any> {
    const wallet = this.getStoredWallet(userId);
    let consumeAmount = amount || 0;

    if (consumeAmount <= 0) {
      const txns = this.getLocalTransactions(userId);
      const matched = txns.find(t => t.referenceId === referenceId && t.type === 'RESERVATION');
      if (matched) {
        consumeAmount = matched.amount;
      }
    }

    const newReserved = Math.max(0, wallet.reservedBalance - consumeAmount);
    const newTotal = Math.max(0, wallet.balance - consumeAmount);
    const newAvailable = Math.max(0, newTotal - newReserved);

    const updated: Wallet = {
      ...wallet,
      balance: newTotal,
      totalBalance: newTotal,
      reservedBalance: newReserved,
      availableBalance: newAvailable,
      updatedAt: new Date().toISOString()
    };
    this.saveStoredWallet(userId, updated);
    this.balanceSubject.next(newAvailable);
    this.walletSubject.next(updated);

    const dealerDesc = cropName
      ? `Payment settled to farmer for won bidding lot "${cropName}" (${referenceId})`
      : `Payment consumed for won bidding lot ${referenceId}`;

    this.addLocalTransaction(userId, {
      id: 'PAY-' + Math.floor(1000 + Math.random() * 9000),
      walletId: 'w-' + userId,
      userId: userId,
      amount: consumeAmount,
      type: 'PAYMENT',
      referenceId: referenceId,
      description: dealerDesc,
      status: 'SETTLED',
      timestamp: new Date().toISOString()
    });

    // Credit Farmer if payeeUserId is provided
    if (payeeUserId) {
      const farmerWallet = this.getStoredWallet(payeeUserId);
      const fTotal = farmerWallet.balance + consumeAmount;
      const fAvailable = Math.max(0, fTotal - farmerWallet.reservedBalance);
      const fUpdated: Wallet = {
        ...farmerWallet,
        balance: fTotal,
        totalBalance: fTotal,
        availableBalance: fAvailable,
        updatedAt: new Date().toISOString()
      };
      this.saveStoredWallet(payeeUserId, fUpdated);

      const farmerDesc = cropName
        ? `Bidding proceeds received for awarded lot "${cropName}" (${referenceId})`
        : `Bidding proceeds received for won lot ${referenceId}`;

      this.addLocalTransaction(payeeUserId, {
        id: 'CR-' + Math.floor(1000 + Math.random() * 9000),
        walletId: 'w-' + payeeUserId,
        userId: payeeUserId,
        amount: consumeAmount,
        type: 'CREDIT',
        referenceId: referenceId,
        description: farmerDesc,
        status: 'SETTLED',
        timestamp: new Date().toISOString()
      });
    }

    const payload = {
      userId: !isNaN(Number(userId)) ? Number(userId) : 2,
      referenceId: referenceId,
      payeeUserId: payeeUserId && !isNaN(Number(payeeUserId)) ? Number(payeeUserId) : undefined,
      cropName: cropName
    };

    return this.http.post<any>(`${this.baseUrl}/consume`, payload).pipe(
      catchError(() => of({ success: true, balance: newTotal, availableBalance: newAvailable }))
    );
  }

  withdrawFunds(userId: string, amount: number, bankDetails: { accountNumber: string; bankName: string; ifsc: string; holderName: string }): Observable<{ success: boolean; message: string; balance?: number }> {
    const wallet = this.getStoredWallet(userId);
    if (wallet.availableBalance < amount) {
      return of({
        success: false,
        message: `Insufficient unreserved wallet balance for withdrawal. Requested: ₹${amount.toLocaleString()}, Available: ₹${wallet.availableBalance.toLocaleString()} (₹${wallet.reservedBalance.toLocaleString()} is locked in active bids).`
      });
    }

    const newTotal = Math.max(0, wallet.balance - amount);
    const newAvailable = Math.max(0, newTotal - wallet.reservedBalance);

    const updated: Wallet = {
      ...wallet,
      balance: newTotal,
      totalBalance: newTotal,
      availableBalance: newAvailable,
      updatedAt: new Date().toISOString()
    };
    this.saveStoredWallet(userId, updated);
    this.balanceSubject.next(newAvailable);
    this.walletSubject.next(updated);

    const desc = `Bank Transfer to ${bankDetails.bankName} (A/C: ...${bankDetails.accountNumber.slice(-4)})`;
    this.addLocalTransaction(userId, {
      id: 'TXN-' + Math.floor(1000 + Math.random() * 9000),
      walletId: 'w-' + userId,
      userId: userId,
      amount: amount,
      type: 'DEBIT',
      description: desc,
      bankTransfer: `${bankDetails.bankName} (...${bankDetails.accountNumber.slice(-4)})`,
      status: 'SETTLED',
      timestamp: new Date().toISOString()
    });

    return of({
      success: true,
      message: `₹${amount.toLocaleString()} successfully withdrawn to ${bankDetails.bankName} A/C ending in ${bankDetails.accountNumber.slice(-4)}. Expected clearance: within 2 hours.`,
      balance: newAvailable
    });
  }

  addFunds(userId: string, amount: number): Observable<any> {
    return this.creditWallet(userId, amount, 'Wallet deposit addition via UPI / Gateway');
  }

  getTransactions(userId: string): Observable<WalletTransaction[]> {
    const localTxns = this.getLocalTransactions(userId);
    return this.http.get<any[]>(`${this.baseUrl}/transactions/${userId}`).pipe(
      map(serverTxns => {
        if (!serverTxns || serverTxns.length === 0) return localTxns;

        const serverMapped: WalletTransaction[] = serverTxns.map(t => ({
          id: String(t.id || 'TXN-' + Math.floor(1000 + Math.random() * 9000)),
          walletId: 'w-' + userId,
          userId: String(t.userId || userId),
          amount: Number(t.amount || 0),
          type: t.type as any,
          referenceId: t.referenceId,
          description: t.description || 'Transaction',
          status: 'SETTLED',
          timestamp: t.transactionTime || new Date().toISOString()
        }));

        const mergedMap = new Map<string, WalletTransaction>();
        serverMapped.forEach(t => mergedMap.set(t.id, t));
        localTxns.forEach(t => {
          if (!mergedMap.has(t.id)) {
            mergedMap.set(t.id, t);
          }
        });

        return Array.from(mergedMap.values()).sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }),
      catchError(() => of(localTxns))
    );
  }

  getStoredWallet(userId: string): Wallet {
    const totalVal = localStorage.getItem(`cropdeal_wallet_${userId}`);
    const reservedVal = localStorage.getItem(`cropdeal_wallet_reserved_${userId}`);

    const total = totalVal ? parseFloat(totalVal) : 50000;
    const reserved = reservedVal ? parseFloat(reservedVal) : 0;
    const available = Math.max(0, total - reserved);

    return {
      id: 'w-' + userId,
      userId: userId,
      balance: total,
      totalBalance: total,
      reservedBalance: reserved,
      availableBalance: available,
      currency: 'INR',
      updatedAt: new Date().toISOString()
    };
  }

  getStoredBalance(userId: string): number {
    return this.getStoredAvailableBalance(userId);
  }

  getStoredAvailableBalance(userId: string): number {
    return this.getStoredWallet(userId).availableBalance;
  }

  getStoredReservedBalance(userId: string): number {
    return this.getStoredWallet(userId).reservedBalance;
  }

  getStoredTotalBalance(userId: string): number {
    return this.getStoredWallet(userId).balance;
  }

  saveStoredBalance(userId: string, balance: number): void {
    const wallet = this.getStoredWallet(userId);
    wallet.balance = balance;
    wallet.totalBalance = balance;
    wallet.availableBalance = Math.max(0, balance - wallet.reservedBalance);
    this.saveStoredWallet(userId, wallet);
  }

  saveStoredWallet(userId: string, wallet: Wallet): void {
    localStorage.setItem(`cropdeal_wallet_${userId}`, wallet.balance.toString());
    localStorage.setItem(`cropdeal_wallet_reserved_${userId}`, (wallet.reservedBalance || 0).toString());
  }

  private addLocalTransaction(userId: string, txn: WalletTransaction): void {
    const txns = this.getLocalTransactions(userId);
    txns.unshift(txn);
    localStorage.setItem(`cropdeal_txns_${userId}`, JSON.stringify(txns));
  }

  private getLocalTransactions(userId: string): WalletTransaction[] {
    const raw = localStorage.getItem(`cropdeal_txns_${userId}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }
}
