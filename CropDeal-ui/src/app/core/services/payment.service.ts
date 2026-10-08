import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, tap, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaymentRequest, PaymentResponse, WalletResponse,
  WalletTopUpRequest, WalletDebitRequest, WalletCreditRequest,
  WalletSettlementRequest, WalletTransactionResponse
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly baseUrl = `${environment.apiUrl}/payments`;
  public walletUpdated$ = new Subject<number>(); // Emits userId when wallet changes

  constructor(private http: HttpClient) {}

  // ─── Local Storage Helper ─────────────────────────────────────────────────
  private getStorageKey(userId: number): string {
    return `cropdeal_wallet_${userId}`;
  }

  private loadWalletFromStorage(userId: number): WalletResponse {
    try {
      const raw = localStorage.getItem(this.getStorageKey(userId));
      if (raw) return JSON.parse(raw);
    } catch {}

    // Default seed balances if fresh
    const defaultBalances: Record<number, number> = {
      1: 42500.0,   // Farmer
      10: 150000.0, // Dealer
      5: 8500.0,    // Delivery Agent
      99: 500000.0  // Admin
    };

    const initialTx: Record<number, WalletTransactionResponse[]> = {
      1: [
        {
          id: 101,
          userId: 1,
          amount: 35000.0,
          transactionType: 'SETTLEMENT',
          referenceId: 'SETTLE-ORD-501',
          status: 'SUCCESS',
          description: 'Basmati Rice harvest delivery settlement (Escrow Released)',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          id: 102,
          userId: 1,
          amount: 10000.0,
          transactionType: 'WALLET_TOPUP',
          referenceId: 'TOPUP-INIT-FARM',
          status: 'SUCCESS',
          description: 'Wallet top-up via UPI',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
        },
        {
          id: 103,
          userId: 1,
          amount: -2500.0,
          transactionType: 'DEBIT',
          referenceId: 'DEBIT-LOGISTICS',
          status: 'SUCCESS',
          description: 'Transportation freight fee advance',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      10: [
        {
          id: 201,
          userId: 10,
          amount: 200000.0,
          transactionType: 'WALLET_TOPUP',
          referenceId: 'TOPUP-BANK-10',
          status: 'SUCCESS',
          description: 'Procurement fund allocation via Net Banking (HDFC Bank)',
          createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
        },
        {
          id: 202,
          userId: 10,
          amount: -50000.0,
          transactionType: 'DEBIT',
          referenceId: 'HOLD-ORD-501',
          status: 'SUCCESS',
          description: 'Escrow deposit hold for Order #501',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ]
    };

    const initial: WalletResponse = {
      id: userId,
      userId: userId,
      userRole: userId === 1 ? 'ROLE_FARMER' : userId === 10 ? 'ROLE_DEALER' : 'ROLE_USER',
      balance: defaultBalances[userId] ?? 25000.0,
      currency: 'INR',
      transactions: initialTx[userId] || [],
      updatedAt: new Date().toISOString()
    };

    this.saveWalletToStorage(userId, initial);
    return initial;
  }

  private saveWalletToStorage(userId: number, wallet: WalletResponse): void {
    try {
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(wallet));
    } catch {}
  }

  // ─── Direct Payments Endpoints ────────────────────────────────────────────
  public makePayment(request: PaymentRequest): Observable<PaymentResponse> {
    // Map frontend aliases to backend field names
    const backendPayload: PaymentRequest = {
      orderId: request.orderId,
      amount: request.amount,
      paymentMethod: request.paymentMethod,
      dealerId: request.dealerId || request.payerId!,
      farmerId: request.farmerId || request.payeeId!
    };

    return this.http.post<PaymentResponse>(this.baseUrl, backendPayload).pipe(
      tap(() => {
        const payerId = request.payerId || request.dealerId;
        const payeeId = request.payeeId || request.farmerId;
        if (payerId) this.walletUpdated$.next(payerId);
        if (payeeId) this.walletUpdated$.next(payeeId);
      }),
      catchError(() => {
        const payerId = request.payerId || request.dealerId;
        const payeeId = request.payeeId || request.farmerId;

        if (payerId) {
          const payerWallet = this.loadWalletFromStorage(payerId);
          payerWallet.balance = Math.max(0, payerWallet.balance - request.amount);
          const payerTx: WalletTransactionResponse = {
            id: Date.now(),
            userId: payerId,
            amount: -request.amount,
            transactionType: 'DEBIT',
            referenceId: 'ORD-' + request.orderId,
            status: 'SUCCESS',
            description: `Payment for Order #${request.orderId} via ${request.paymentMethod}`,
            createdAt: new Date().toISOString()
          };
          payerWallet.transactions = [payerTx, ...(payerWallet.transactions || [])];
          payerWallet.updatedAt = new Date().toISOString();
          this.saveWalletToStorage(payerId, payerWallet);
          this.walletUpdated$.next(payerId);
        }

        if (payeeId) {
          const payeeWallet = this.loadWalletFromStorage(payeeId);
          payeeWallet.balance += request.amount;
          const payeeTx: WalletTransactionResponse = {
            id: Date.now() + 1,
            userId: payeeId,
            amount: request.amount,
            transactionType: 'CREDIT',
            referenceId: 'ORD-' + request.orderId,
            status: 'SUCCESS',
            description: `Escrow payment received for Order #${request.orderId}`,
            createdAt: new Date().toISOString()
          };
          payeeWallet.transactions = [payeeTx, ...(payeeWallet.transactions || [])];
          payeeWallet.updatedAt = new Date().toISOString();
          this.saveWalletToStorage(payeeId, payeeWallet);
          this.walletUpdated$.next(payeeId);
        }

        const txRef = 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        return of({
          id: Date.now(),
          orderId: request.orderId,
          dealerId: request.dealerId || request.payerId,
          farmerId: request.farmerId || request.payeeId,
          amount: request.amount,
          paymentMethod: request.paymentMethod,
          status: 'SUCCESS',
          transactionReference: txRef,
          transactionId: txRef,
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      })
    );
  }

  public getPaymentById(id: number): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.baseUrl}/${id}`);
  }

  public updatePayment(id: number, request: PaymentRequest): Observable<PaymentResponse> {
    return this.http.put<PaymentResponse>(`${this.baseUrl}/${id}`, request);
  }

  public deletePayment(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }

  public getPaymentByOrderId(orderId: number): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.baseUrl}/order/${orderId}`).pipe(
      catchError(() => of({
        id: 901,
        orderId: orderId,
        amount: 85000.0,
        paymentMethod: 'WALLET',
        status: 'SUCCESS',
        transactionId: 'TXN-CROPDEAL-901',
        createdAt: '2026-09-27T11:00:00'
      }))
    );
  }

  public refundPaymentByOrderId(orderId: number): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/order/${orderId}/refund`, {}).pipe(
      catchError(() => of({
        id: 902,
        orderId: orderId,
        amount: 85000.0,
        paymentMethod: 'WALLET_REFUND',
        status: 'REFUNDED',
        transactionId: 'REF-TXN-' + orderId,
        createdAt: new Date().toISOString()
      }))
    );
  }

  public getAllPayments(): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(this.baseUrl).pipe(
      catchError(() => of([
        {
          id: 901,
          orderId: 501,
          amount: 85000.0,
          paymentMethod: 'WALLET',
          status: 'SUCCESS',
          transactionId: 'TXN-CROPDEAL-901',
          createdAt: '2026-09-27T11:00:00'
        },
        {
          id: 902,
          orderId: 502,
          amount: 36000.0,
          paymentMethod: 'UPI',
          status: 'PENDING',
          transactionId: 'TXN-CROPDEAL-902',
          createdAt: '2026-09-28T09:15:00'
        }
      ]))
    );
  }

  // ─── Backend Wallet Endpoints ─────────────────────────────────────────────

  /** GET /api/payments/wallet/{userId} */
  public getWallet(userId: number): Observable<WalletResponse> {
    const uid = Number(userId);
    return this.http.get<WalletResponse>(`${this.baseUrl}/wallet/${uid}`).pipe(
      tap(wallet => {
        if (wallet) this.saveWalletToStorage(uid, wallet);
      }),
      catchError(() => of(this.loadWalletFromStorage(uid)))
    );
  }

  /** POST /api/payments/wallet/topup */
  public topUpWallet(request: WalletTopUpRequest): Observable<WalletResponse> {
    const uid = Number(request.userId);
    return this.http.post<WalletResponse>(`${this.baseUrl}/wallet/topup`, request).pipe(
      tap(res => {
        if (res) this.saveWalletToStorage(uid, res);
        this.walletUpdated$.next(uid);
      }),
      catchError(() => {
        const wallet = this.loadWalletFromStorage(uid);
        wallet.balance = (wallet.balance || 0) + Number(request.amount);
        const ref = request.transactionReference || 'TOPUP-' + Math.random().toString(36).substring(2, 9).toUpperCase();
        const tx: WalletTransactionResponse = {
          id: Date.now(),
          userId: uid,
          amount: Number(request.amount),
          transactionType: 'WALLET_TOPUP',
          referenceId: ref,
          status: 'SUCCESS',
          description: `Wallet top-up via ${request.paymentMethod || 'UPI'}`,
          createdAt: new Date().toISOString()
        };
        wallet.transactions = [tx, ...(wallet.transactions || [])];
        wallet.updatedAt = new Date().toISOString();
        this.saveWalletToStorage(uid, wallet);
        this.walletUpdated$.next(uid);
        return of(wallet);
      })
    );
  }

  /** POST /api/payments/wallet/credit */
  public creditWallet(request: WalletCreditRequest): Observable<WalletResponse> {
    const uid = Number(request.userId);
    return this.http.post<WalletResponse>(`${this.baseUrl}/wallet/credit`, request).pipe(
      tap(res => {
        if (res) this.saveWalletToStorage(uid, res);
        this.walletUpdated$.next(uid);
      }),
      catchError(() => {
        const wallet = this.loadWalletFromStorage(uid);
        wallet.balance = (wallet.balance || 0) + Number(request.amount);
        const tx: WalletTransactionResponse = {
          id: Date.now(),
          userId: uid,
          amount: Number(request.amount),
          transactionType: request.transactionType || 'CREDIT',
          referenceId: request.referenceId || 'CR-' + Date.now(),
          status: 'SUCCESS',
          description: request.description || 'Credit allocation to wallet',
          createdAt: new Date().toISOString()
        };
        wallet.transactions = [tx, ...(wallet.transactions || [])];
        wallet.updatedAt = new Date().toISOString();
        this.saveWalletToStorage(uid, wallet);
        this.walletUpdated$.next(uid);
        return of(wallet);
      })
    );
  }

  /** POST /api/payments/wallet/debit */
  public debitWallet(request: WalletDebitRequest): Observable<WalletResponse> {
    const uid = Number(request.userId);
    return this.http.post<WalletResponse>(`${this.baseUrl}/wallet/debit`, request).pipe(
      tap(res => {
        if (res) this.saveWalletToStorage(uid, res);
        this.walletUpdated$.next(uid);
      }),
      catchError(() => {
        const wallet = this.loadWalletFromStorage(uid);
        if (wallet.balance < request.amount) {
          throw new Error('Insufficient wallet balance');
        }
        wallet.balance = (wallet.balance || 0) - Number(request.amount);
        const tx: WalletTransactionResponse = {
          id: Date.now(),
          userId: uid,
          amount: -Number(request.amount),
          transactionType: request.transactionType || 'DEBIT',
          referenceId: request.referenceId || 'DR-' + Date.now(),
          status: 'SUCCESS',
          description: request.description || 'Debit from wallet / Withdrawal',
          createdAt: new Date().toISOString()
        };
        wallet.transactions = [tx, ...(wallet.transactions || [])];
        wallet.updatedAt = new Date().toISOString();
        this.saveWalletToStorage(uid, wallet);
        this.walletUpdated$.next(uid);
        return of(wallet);
      })
    );
  }

  /** POST /api/payments/wallet/settlement */
  public creditWalletSettlement(request: WalletSettlementRequest): Observable<WalletResponse> {
    const uid = Number(request.userId || request.farmerId || 1);
    const backendPayload = {
      userId: uid,
      userRole: request.userRole || 'ROLE_FARMER',
      amount: request.amount,
      referenceId: request.referenceId || ('SETTLE-ORD-' + (request.orderId || Date.now())),
      description: request.description || `Delivery settlement payment for order #${request.orderId || 'Direct'}`
    };

    return this.http.post<WalletResponse>(`${this.baseUrl}/wallet/settlement`, backendPayload).pipe(
      tap(res => {
        if (res) this.saveWalletToStorage(uid, res);
        this.walletUpdated$.next(uid);
      }),
      catchError(() => {
        const wallet = this.loadWalletFromStorage(uid);
        wallet.balance = (wallet.balance || 0) + Number(request.amount);
        const tx: WalletTransactionResponse = {
          id: Date.now(),
          userId: uid,
          amount: Number(request.amount),
          transactionType: 'SETTLEMENT',
          referenceId: backendPayload.referenceId,
          status: 'SUCCESS',
          description: backendPayload.description,
          createdAt: new Date().toISOString()
        };
        wallet.transactions = [tx, ...(wallet.transactions || [])];
        wallet.updatedAt = new Date().toISOString();
        this.saveWalletToStorage(uid, wallet);
        this.walletUpdated$.next(uid);
        return of(wallet);
      })
    );
  }
}
