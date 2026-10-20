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
    userId: '2',
    balance: 50000,
    reservedBalance: 0,
    availableBalance: 50000,
    currency: 'INR'
  });
  public wallet$ = this.walletSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Returns normalized aliases for a given user ID to ensure dealer ('2', 'dealer-1', 'dealer', 'u-1')
   * and farmer ('1', 'farmer-1', 'farmer') always share unified storage.
   */
  public getUserAliases(userId: string): string[] {
    const raw = String(userId || '').trim();
    const num = raw.replace(/\D/g, '');
    if (num === '2' || raw === 'dealer-1' || raw === 'dealer' || raw === 'u-1') {
      return ['2', 'dealer-1', 'dealer', 'u-1'];
    }
    if (num === '1' || raw === 'farmer-1' || raw === 'farmer') {
      return ['1', 'farmer-1', 'farmer'];
    }
    return [raw];
  }

  /**
   * Converts any string/alias user ID into a valid positive integer for Spring Boot @PathVariable Long endpoints.
   */
  public getNumericUserId(userId: string): number {
    const num = parseInt(String(userId || '').replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0) return num;
    const lower = String(userId || '').toLowerCase();
    if (lower.includes('dealer')) return 2;
    if (lower.includes('farmer')) return 1;
    return 2;
  }

  getWallet(userId: string): Observable<Wallet> {
    // Run reconciliation first to automatically release any orphan or timed out holds
    this.reconcileOrphanReservations(userId);

    const cached = this.getStoredWallet(userId);
    this.balanceSubject.next(cached.availableBalance);
    this.walletSubject.next(cached);

    const numericId = this.getNumericUserId(userId);
    return this.http.get<any>(`${this.baseUrl}/user/${numericId}`).pipe(
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
      userId: this.getNumericUserId(userId),
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
      userId: this.getNumericUserId(userId),
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
        message: `Insufficient unreserved funds. Required: ₹${amount.toLocaleString()}, Available: ₹${wallet.availableBalance.toLocaleString()} (₹${wallet.reservedBalance.toLocaleString()} is already locked in bids).`
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
      userId: this.getNumericUserId(userId),
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
      userId: this.getNumericUserId(userId),
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
      userId: this.getNumericUserId(userId),
      referenceId: referenceId,
      payeeUserId: payeeUserId ? this.getNumericUserId(payeeUserId) : undefined,
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

  /**
   * Retrieves merged transactions from server and local storage, ensuring no duplicate entries
   * and providing an initial funding record so the passbook is never empty.
   */
  getTransactions(userId: string): Observable<WalletTransaction[]> {
    this.reconcileOrphanReservations(userId);
    const localTxns = this.getLocalTransactions(userId);
    const numericId = this.getNumericUserId(userId);

    return this.http.get<any[]>(`${this.baseUrl}/transactions/${numericId}`).pipe(
      map(serverTxns => {
        const serverMapped: WalletTransaction[] = (serverTxns || []).map(t => ({
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

        const seenKeys = new Set<string>();
        const merged: WalletTransaction[] = [];

        // 1. Server transactions take priority
        for (const st of serverMapped) {
          const key = st.referenceId && (st.type === 'RESERVATION' || st.type === 'RELEASE' || st.type === 'PAYMENT')
            ? `${st.type}_${st.referenceId}`
            : `ID_${st.id}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            seenKeys.add(`ID_${st.id}`);
            merged.push(st);
          }
        }

        // 2. Add local transactions if not already recorded on server
        for (const lt of localTxns) {
          const key = lt.referenceId && (lt.type === 'RESERVATION' || lt.type === 'RELEASE' || lt.type === 'PAYMENT')
            ? `${lt.type}_${lt.referenceId}`
            : `ID_${lt.id}`;
          if (!seenKeys.has(key) && !seenKeys.has(`ID_${lt.id}`)) {
            seenKeys.add(key);
            seenKeys.add(`ID_${lt.id}`);
            merged.push(lt);
          }
        }

        // 3. If transactions list is empty, seed opening escrow deposit record so dealer passbook is never blank
        if (merged.length === 0) {
          const initialTxn: WalletTransaction = {
            id: 'TXN-INIT-01',
            walletId: 'w-' + userId,
            userId: String(userId),
            amount: 50000,
            type: 'CREDIT',
            description: 'Opening Escrow Deposit: Approved Mandi Commercial Trading Balance',
            status: 'SETTLED',
            timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
          };
          merged.push(initialTxn);
          this.addLocalTransaction(userId, initialTxn);
        }

        return merged.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }),
      catchError(() => {
        let fallback = [...localTxns];
        if (fallback.length === 0) {
          const initialTxn: WalletTransaction = {
            id: 'TXN-INIT-01',
            walletId: 'w-' + userId,
            userId: String(userId),
            amount: 50000,
            type: 'CREDIT',
            description: 'Opening Escrow Deposit: Approved Mandi Commercial Trading Balance',
            status: 'SETTLED',
            timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
          };
          fallback.push(initialTxn);
          this.addLocalTransaction(userId, initialTxn);
        }
        return of(fallback);
      })
    );
  }

  getStoredWallet(userId: string): Wallet {
    const aliases = this.getUserAliases(userId);
    let total = 50000;
    let reserved = 0;
    let foundTotal = false;

    for (const a of aliases) {
      const t = localStorage.getItem(`cropdeal_wallet_${a}`);
      if (t !== null && !isNaN(parseFloat(t))) {
        total = parseFloat(t);
        foundTotal = true;
      }
      const r = localStorage.getItem(`cropdeal_wallet_reserved_${a}`);
      if (r !== null && !isNaN(parseFloat(r))) {
        reserved = Math.max(reserved, parseFloat(r));
      }
    }

    if (!foundTotal) {
      // Default initial balance
      total = 50000;
      reserved = 0;
    }

    const available = Math.max(0, total - reserved);

    const w: Wallet = {
      id: 'w-' + userId,
      userId: userId,
      balance: total,
      totalBalance: total,
      reservedBalance: reserved,
      availableBalance: available,
      currency: 'INR',
      updatedAt: new Date().toISOString()
    };

    return w;
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
    const aliases = this.getUserAliases(userId);
    const totalStr = wallet.balance.toString();
    const resStr = (wallet.reservedBalance || 0).toString();

    for (const a of aliases) {
      localStorage.setItem(`cropdeal_wallet_${a}`, totalStr);
      localStorage.setItem(`cropdeal_wallet_reserved_${a}`, resStr);
    }
  }

  public addLocalTransaction(userId: string, txn: WalletTransaction): void {
    const aliases = this.getUserAliases(userId);
    let txns = this.getLocalTransactions(userId);

    // If a transaction with the same referenceId and type already exists, replace it to avoid duplicate passbook entries
    if (txn.referenceId && (txn.type === 'RESERVATION' || txn.type === 'RELEASE' || txn.type === 'PAYMENT')) {
      txns = txns.filter(t => !(t.referenceId === txn.referenceId && t.type === txn.type));
    }
    txns.unshift(txn);

    const rawStr = JSON.stringify(txns);
    for (const a of aliases) {
      localStorage.setItem(`cropdeal_txns_${a}`, rawStr);
    }
  }

  public getLocalTransactions(userId: string): WalletTransaction[] {
    const aliases = this.getUserAliases(userId);
    const seen = new Set<string>();
    const allTxns: WalletTransaction[] = [];

    for (const a of aliases) {
      const raw = localStorage.getItem(`cropdeal_txns_${a}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const t of parsed) {
              const key = t.referenceId && (t.type === 'RESERVATION' || t.type === 'RELEASE' || t.type === 'PAYMENT')
                ? `${t.type}_${t.referenceId}`
                : `ID_${t.id}`;
              if (!seen.has(key)) {
                seen.add(key);
                allTxns.push(t);
              }
            }
          }
        } catch {}
      }
    }

    return allTxns.sort((x, y) =>
      new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime()
    );
  }

  /**
   * Retrieves active held escrow amount and referenceId for a specific user and auction.
   */
  public getActiveHoldForAuction(userId: string, auctionId: string): { amount: number; referenceId: string | null } {
    if (typeof window === 'undefined') return { amount: 0, referenceId: null };
    const txns = this.getLocalTransactions(userId);
    const targetRefPrefix = `BID-${auctionId}-`;
    const targetRefExact = `BID-${auctionId}`;

    const activeReservations = txns.filter(t => {
      if (t.type !== 'RESERVATION' || !t.referenceId) return false;
      const matches = t.referenceId === targetRefExact || t.referenceId.startsWith(targetRefPrefix);
      if (!matches) return false;
      const resTime = new Date(t.timestamp).getTime();
      const isResolved = txns.some(rel =>
        rel.referenceId === t.referenceId &&
        (rel.type === 'RELEASE' || rel.type === 'PAYMENT') &&
        new Date(rel.timestamp).getTime() >= resTime
      );
      return !isResolved;
    });

    if (activeReservations.length > 0) {
      return {
        amount: activeReservations[0].amount || 0,
        referenceId: activeReservations[0].referenceId || null
      };
    }
    return { amount: 0, referenceId: null };
  }

  /**
   * Scans active reservations against the current state of auctions and deleted lots.
   * If an auction was deleted by admin/farmer, timed out without sale, closed, or won by another dealer:
   * automatically releases the held amount and logs a passbook RELEASE transaction.
   */
  public reconcileOrphanReservations(userId: string): { releasedCount: number; totalAmount: number } {
    if (typeof window === 'undefined') return { releasedCount: 0, totalAmount: 0 };

    const aliases = this.getUserAliases(userId);
    const txns = this.getLocalTransactions(userId);
    const wallet = this.getStoredWallet(userId);

    // 1. Get all known stored auctions and deleted auction IDs
    let storedAuctions: any[] = [];
    try {
      const rawAuctions = localStorage.getItem('cropdeal_bidding_auctions');
      if (rawAuctions) storedAuctions = JSON.parse(rawAuctions);
    } catch {}

    const deletedIds = new Set<string>();
    try {
      const rawDel = localStorage.getItem('cropdeal_deleted_bidding_ids');
      if (rawDel) {
        const arr = JSON.parse(rawDel);
        if (Array.isArray(arr)) arr.forEach(id => deletedIds.add(String(id)));
      }
    } catch {}

    // Hardcoded dummy IDs to treat as deleted/closed
    ['AUCT-101', 'AUCT-102', 'AUCT-103', 'AUCT-104'].forEach(id => deletedIds.add(id));

    let releasedCount = 0;
    let totalReleased = 0;
    const now = Date.now();

    // 2. Inspect active reservations that have not been resolved after their timestamp
    const reservations = txns.filter(res => {
      if (res.type !== 'RESERVATION' || !res.referenceId) return false;
      const resTime = new Date(res.timestamp).getTime();
      const isResolved = txns.some(t =>
        t.referenceId === res.referenceId &&
        (t.type === 'RELEASE' || t.type === 'PAYMENT') &&
        new Date(t.timestamp).getTime() >= resTime
      );
      return !isResolved;
    });

    for (const res of reservations) {
      const refId = res.referenceId!;
      // Extract auction ID from refId (e.g., 'BID-12-2' -> '12' or 'BID-AUCT-101-dealer-1' -> 'AUCT-101')
      const matchedParts = refId.match(/^BID-([^-]+(?:-[^-]+)?)-(?:dealer-\d+|\d+|\w+)$/);
      let auctionId = matchedParts ? matchedParts[1] : refId.replace(/^BID-/, '');
      if (auctionId.includes('-')) {
        // e.g. AUCT-101
        const split = auctionId.split('-');
        if (split.length > 2) auctionId = split.slice(0, 2).join('-');
      }

      const matchingAuction = storedAuctions.find(a => String(a.id) === String(auctionId));
      let shouldRelease = false;
      let releaseReason = '';

      if (deletedIds.has(String(auctionId))) {
        shouldRelease = true;
        releaseReason = `Auction #${auctionId} was deleted by farmer or administrator`;
      } else if (!matchingAuction) {
        shouldRelease = true;
        releaseReason = `Auction #${auctionId} is no longer active on the trading floor`;
      } else if (matchingAuction.status === 'CLOSED' || matchingAuction.status === 'AWARDED' || matchingAuction.status === 'CANCELLED') {
        shouldRelease = true;
        releaseReason = `Auction #${auctionId} closed (${matchingAuction.status})`;
      } else if (matchingAuction.endTime && new Date(matchingAuction.endTime).getTime() <= now) {
        shouldRelease = true;
        releaseReason = `Auction #${auctionId} expired after timer ended`;
      } else if (matchingAuction.highestBidderId && !aliases.includes(String(matchingAuction.highestBidderId))) {
        shouldRelease = true;
        releaseReason = `Outbid on Auction #${auctionId} by another dealer`;
      }

      if (shouldRelease) {
        const releaseAmt = res.amount || 0;
        this.addLocalTransaction(userId, {
          id: 'REL-AUTO-' + Math.floor(1000 + Math.random() * 9000),
          walletId: 'w-' + userId,
          userId: userId,
          amount: releaseAmt,
          type: 'RELEASE',
          referenceId: refId,
          description: `Auto-Released Escrow Hold: ${releaseReason}`,
          status: 'RELEASED',
          timestamp: new Date().toISOString()
        });
        releasedCount++;
        totalReleased += releaseAmt;
      }
    }

    // 3. Update wallet balances
    let newReserved = Math.max(0, wallet.reservedBalance - totalReleased);

    // If there are NO active unexpired auctions where this user is winning, the reservedBalance MUST be 0!
    const activeWinningAuctions = storedAuctions.filter(a =>
      !deletedIds.has(String(a.id)) &&
      a.status !== 'CLOSED' &&
      a.status !== 'AWARDED' &&
      (!a.endTime || new Date(a.endTime).getTime() > now) &&
      a.highestBidderId &&
      aliases.includes(String(a.highestBidderId))
    );

    if (activeWinningAuctions.length === 0 && newReserved > 0) {
      // Leftover reserved amount with no active winning auction
      this.addLocalTransaction(userId, {
        id: 'REL-CLEAR-' + Math.floor(1000 + Math.random() * 9000),
        walletId: 'w-' + userId,
        userId: userId,
        amount: newReserved,
        type: 'RELEASE',
        description: 'Auto-Reconciliation: Cleared stale escrow holds for inactive auction lots',
        status: 'RELEASED',
        timestamp: new Date().toISOString()
      });
      totalReleased += newReserved;
      releasedCount++;
      newReserved = 0;
    }

    if (totalReleased > 0 || newReserved !== wallet.reservedBalance) {
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
    }

    return { releasedCount, totalAmount: totalReleased };
  }

  /**
   * Releases reserved escrow holds for ALL dealers who placed bids on an auction.
   * Useful when an auction is deleted, closed without sale, or expired.
   * Can optionally exclude winningDealerId when awarding an auction.
   */
  public releaseAllBiddersForAuction(auctionId: string, reason?: string, excludeDealerId?: string): void {
    if (typeof window === 'undefined') return;

    const excludeAliases = excludeDealerId ? new Set(this.getUserAliases(excludeDealerId)) : new Set<string>();
    const desc = reason || `Escrow release: auction #${auctionId} removed or concluded`;

    // Snapshot keys first to avoid mutation issues during iteration
    const keys = Object.keys(localStorage).filter(k => k.startsWith('cropdeal_txns_'));
    for (const key of keys) {
      const uid = key.replace('cropdeal_txns_', '');
      if (excludeAliases.has(uid)) continue;

      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const txns: WalletTransaction[] = JSON.parse(raw);
          if (Array.isArray(txns)) {
            const matchedReservations = txns.filter(t =>
              t.type === 'RESERVATION' &&
              t.referenceId &&
              (t.referenceId === `BID-${auctionId}` || t.referenceId.startsWith(`BID-${auctionId}-`))
            );

            for (const res of matchedReservations) {
              const resTime = new Date(res.timestamp).getTime();
              const alreadyReleased = txns.some(t =>
                t.referenceId === res.referenceId &&
                (t.type === 'RELEASE' || t.type === 'PAYMENT') &&
                new Date(t.timestamp).getTime() >= resTime
              );
              if (!alreadyReleased) {
                this.releaseFunds(uid, res.referenceId!, res.amount, desc).subscribe();
              }
            }
          }
        }
      } catch {}
    }

    if (!excludeAliases.has('2')) {
      this.reconcileOrphanReservations('2');
    }
  }
}
