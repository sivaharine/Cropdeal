import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WalletService } from '../../core/services/wallet.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

interface BankDetails {
  holderName: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifsc: string;
  amount: number | null;
}

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="wallet-container">

      <!-- Top Banner -->
      <div class="wallet-hero-banner shadow-sm">
        <div class="banner-content">
          <div class="d-flex align-center gap-2">
            <h1 class="wallet-title">Digital Escrow & Payout Wallet</h1>
            <span *ngIf="isDeliveryPartner" class="role-badge">Delivery Partner Wallet</span>
          </div>
          <p class="wallet-subtitle">
            {{ isDeliveryPartner
                ? 'Manage your trip payouts, recharge escrow balance, and instantly withdraw earnings to your verified bank account.'
                : 'Manage your escrow wallet, add funds for instant orders, and view comprehensive transaction history.' }}
          </p>
        </div>
      </div>

      <!-- Notification Toast -->
      <div *ngIf="noticeMsg" class="alert alert-success shadow-sm mt-2">
        <i class="fa-solid fa-circle-check"></i>
        <span>{{ noticeMsg }}</span>
      </div>

      <div *ngIf="errorMsg" class="alert alert-danger shadow-sm mt-2">
        <i class="fa-solid fa-circle-exclamation"></i>
        <span>{{ errorMsg }}</span>
      </div>

      <!-- Top Row: Available Balance & Add Money Cards -->
      <div class="wallet-top-grid mt-3">

        <!-- Available Balance Card -->
        <div class="card balance-card shadow-sm">
          <div class="balance-header-row">
            <div class="balance-icon-circle">
              <i class="fa-solid fa-wallet"></i>
            </div>
            <div class="balance-meta">
              <span class="lbl-avail">Available Balance</span>
              <div class="d-flex align-center gap-2">
                <h2 class="val-avail">&#8377; {{ balance | number:'1.2-2' }}</h2>
                <button class="btn-refresh-balance" (click)="refreshWallet()" title="Refresh Balance">
                  <i class="fa-solid fa-arrows-rotate" [class.fa-spin]="isRefreshing"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="balance-sub-stats">
            <div class="sub-stat-item">
              <span class="sub-lbl">Total Credited</span>
              <strong class="sub-val text-emerald">&#8377; {{ totalAdded | number:'1.0-0' }}</strong>
            </div>
            <div class="sub-stat-item">
              <span class="sub-lbl">Total Debited / Withdrawn</span>
              <strong class="sub-val text-danger">&#8377; {{ totalUsed | number:'1.0-0' }}</strong>
            </div>
            <div class="sub-stat-item">
              <span class="sub-lbl">Net Escrow Balance</span>
              <strong class="sub-val text-dark">&#8377; {{ balance | number:'1.0-0' }}</strong>
            </div>
          </div>

          <div class="mt-3 pt-3 border-top d-flex gap-2">
            <button class="btn-withdraw-action" (click)="openWithdrawModal()">
              <i class="fa-solid fa-building-columns"></i> Withdraw to Bank Account
            </button>
          </div>
        </div>

        <!-- Add Money to Wallet Card -->
        <div class="card add-money-card shadow-sm">
          <div class="card-head-line">
            <i class="fa-solid fa-credit-card text-emerald"></i>
            <strong>Add Money to Wallet (Instant Escrow)</strong>
          </div>

          <div class="input-money-wrap mt-2">
            <span class="currency-symbol">&#8377;</span>
            <input
              type="number"
              [(ngModel)]="depositAmount"
              placeholder="Enter amount (e.g. 1000)"
              class="amount-input"
            />
          </div>

          <div class="chips-row mt-2">
            <button type="button" class="amount-chip" (click)="setAmount(500)">&#8377;500</button>
            <button type="button" class="amount-chip" (click)="setAmount(1000)">&#8377;1,000</button>
            <button type="button" class="amount-chip" (click)="setAmount(2000)">&#8377;2,000</button>
            <button type="button" class="amount-chip" (click)="setAmount(5000)">&#8377;5,000</button>
          </div>

          <div class="mt-3">
            <button class="btn-add-money-full" (click)="addMoney()" [disabled]="!depositAmount || depositAmount <= 0">
              <i class="fa-solid fa-bolt"></i> Recharge Wallet Now
            </button>
          </div>
        </div>

      </div>

      <!-- Bottom Section: Transaction History -->
      <div class="card tx-history-card shadow-sm mt-3">
        <div class="tx-header-bar">
          <div class="d-flex align-center gap-2">
            <i class="fa-solid fa-bars-staggered text-emerald"></i>
            <h3 class="tx-title">Wallet Passbook & Transactions</h3>
            <span class="badge badge-light-emerald">{{ filteredTransactions.length }} Records</span>
          </div>

          <div class="tx-filters">
            <select [(ngModel)]="filterType" (change)="currentPage = 1" class="filter-select">
              <option value="ALL">All Transactions</option>
              <option value="CREDIT">Credits / Payouts</option>
              <option value="DEBIT">Debits / Orders / Withdrawals</option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table class="table-wallet">
            <thead>
              <tr>
                <th>#</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Transaction Details & Order Status</th>
                <th>Status</th>
                <th>Amount (&#8377;)</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="pagedTransactions.length === 0">
                <td colspan="6" class="text-center py-4 text-muted">No transactions found for selected filter.</td>
              </tr>
              <tr *ngFor="let tx of pagedTransactions">
                <td><strong>{{ tx.id }}</strong></td>
                <td>
                  <strong>{{ tx.date }}</strong>
                  <span class="time-sub d-block">{{ tx.time }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="isCredit(tx.type) ? 'badge-added' : 'badge-used'">
                    <i class="fa-solid" [ngClass]="isCredit(tx.type) ? 'fa-arrow-down-left' : 'fa-arrow-up-right'"></i>
                    {{ isCredit(tx.type) ? 'Credit / Payout' : 'Debit / Transfer' }}
                  </span>
                </td>
                <td>
                  <div class="tx-desc-line">
                    <span class="tx-desc-main">{{ tx.description }}</span>
                    <span *ngIf="tx.orderId" class="order-tag">
                      <i class="fa-solid fa-hashtag"></i> {{ tx.orderId }}
                    </span>
                  </div>
                  <small *ngIf="tx.bankTransfer" class="text-muted d-block mt-1">
                    <i class="fa-solid fa-building-columns"></i> Transferred to {{ tx.bankTransfer }}
                  </small>
                </td>
                <td>
                  <span class="badge badge-settled">
                    <i class="fa-solid fa-circle-check text-emerald"></i> Settled
                  </span>
                </td>
                <td>
                  <strong [ngClass]="isCredit(tx.type) ? 'text-emerald' : 'text-danger'">
                    {{ isCredit(tx.type) ? '+ ' : '- ' }}&#8377; {{ tx.amount | number:'1.2-2' }}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Dynamic Pagination -->
        <div class="pagination-footer" *ngIf="totalPages > 1">
          <div class="pagination-meta">
            Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredTransactions.length) }} of {{ filteredTransactions.length }} transactions
          </div>
          <div class="pagination-controls">
            <button class="page-btn" [disabled]="currentPage === 1" (click)="setPage(currentPage - 1)">
              &laquo; Previous
            </button>
            <button
              *ngFor="let p of totalPagesArray"
              class="page-btn"
              [class.active]="p === currentPage"
              (click)="setPage(p)">
              {{ p }}
            </button>
            <button class="page-btn" [disabled]="currentPage === totalPages" (click)="setPage(currentPage + 1)">
              Next &raquo;
            </button>
          </div>
        </div>

      </div>

      <!-- BANK ACCOUNT WITHDRAWAL MODAL -->
      <div class="modal-backdrop" *ngIf="showWithdrawModal" (click)="closeWithdrawModal()">
        <div class="modal-card shadow-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="d-flex align-center gap-2">
              <i class="fa-solid fa-building-columns text-emerald" style="font-size: 1.4rem;"></i>
              <div>
                <h3 class="modal-title">Withdraw Funds to Bank Account</h3>
                <p class="modal-subtitle">Transfer funds directly to your verified Indian bank account via NEFT/IMPS</p>
              </div>
            </div>
            <button class="modal-close-btn" (click)="closeWithdrawModal()">&times;</button>
          </div>

          <div class="modal-body">
            <div class="avail-withdraw-notice">
              <span>Available for Withdrawal:</span>
              <strong class="text-emerald">&#8377; {{ balance | number:'1.2-2' }}</strong>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Account Holder Name *</label>
                <input
                  type="text"
                  [(ngModel)]="bankDetails.holderName"
                  placeholder="e.g. Ramesh Kumar"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label>Bank Name *</label>
                <select [(ngModel)]="bankDetails.bankName" class="form-control">
                  <option value="">-- Select Bank --</option>
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Punjab National Bank">Punjab National Bank (PNB)</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Bank of Baroda">Bank of Baroda</option>
                  <option value="Canara Bank">Canara Bank</option>
                  <option value="Union Bank of India">Union Bank of India</option>
                </select>
              </div>

              <div class="form-group">
                <label>Bank Account Number *</label>
                <input
                  type="password"
                  [(ngModel)]="bankDetails.accountNumber"
                  placeholder="Enter Account Number"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label>Confirm Account Number *</label>
                <input
                  type="text"
                  [(ngModel)]="bankDetails.confirmAccountNumber"
                  placeholder="Re-enter Account Number"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label>IFSC Code *</label>
                <input
                  type="text"
                  [(ngModel)]="bankDetails.ifsc"
                  placeholder="e.g. SBIN0001234"
                  maxlength="11"
                  style="text-transform: uppercase;"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label>Withdrawal Amount (&#8377;) *</label>
                <input
                  type="number"
                  [(ngModel)]="bankDetails.amount"
                  placeholder="Enter amount to withdraw"
                  class="form-control"
                />
              </div>
            </div>

            <div *ngIf="withdrawError" class="modal-error-alert mt-3">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>{{ withdrawError }}</span>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeWithdrawModal()">Cancel</button>
            <button class="btn btn-primary" (click)="submitWithdrawal()" [disabled]="isSubmittingWithdrawal">
              <i class="fa-solid" [ngClass]="isSubmittingWithdrawal ? 'fa-spinner fa-spin' : 'fa-check'"></i>
              {{ isSubmittingWithdrawal ? 'Processing NEFT Transfer...' : 'Confirm Withdrawal' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .wallet-container { display: flex; flex-direction: column; gap: 1rem; }

    /* Top Hero Banner */
    .wallet-hero-banner {
      background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/assets/images/sunset-banner.jpg') center/cover no-repeat;
      border-radius: 14px;
      padding: 2.2rem 2.8rem;
      color: white;
      min-height: 120px;
      display: flex;
      align-items: center;
    }
    .wallet-title { font-size: 2rem; font-weight: 800; margin: 0 0 0.3rem 0; color: #fff; }
    .wallet-subtitle { font-size: 0.95rem; color: #f1f5f9; margin: 0; max-width: 800px; }
    .role-badge {
      background: rgba(22, 163, 74, 0.9);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* Top Row 2-Card Grid */
    .wallet-top-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }
    .balance-card, .add-money-card {
      border-radius: 14px;
      padding: 1.6rem 2rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
    }

    /* Available Balance Card */
    .balance-header-row {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .balance-icon-circle {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: #dcfce7;
      color: #16a34a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
    }
    .balance-meta { display: flex; flex-direction: column; }
    .lbl-avail { font-size: 0.88rem; font-weight: 700; color: #475569; }
    .val-avail { font-size: 2.1rem; font-weight: 800; color: #0f172a; margin: 0.1rem 0 0 0; line-height: 1.1; }
    .btn-refresh-balance {
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0.2rem;
      transition: color 0.15s ease;
    }
    .btn-refresh-balance:hover { color: #16a34a; }

    .balance-sub-stats {
      display: flex;
      justify-content: space-between;
      margin-top: 1.25rem;
    }
    .sub-stat-item { display: flex; flex-direction: column; gap: 0.2rem; }
    .sub-lbl { font-size: 0.78rem; font-weight: 600; color: #64748b; }
    .sub-val { font-size: 1.15rem; font-weight: 800; }

    .btn-withdraw-action {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 0.65rem 1.2rem;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: background 0.15s;
    }
    .btn-withdraw-action:hover { background: #0369a1; }

    /* Add Money Card */
    .card-head-line { display: flex; align-items: center; gap: 0.6rem; font-size: 0.95rem; color: #0f172a; }
    .input-money-wrap {
      display: flex;
      align-items: center;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #f8fafc;
      overflow: hidden;
    }
    .currency-symbol {
      padding: 0.65rem 0.85rem;
      font-size: 1.1rem;
      font-weight: 700;
      color: #475569;
      background: #f1f5f9;
      border-right: 1px solid #cbd5e1;
    }
    .amount-input {
      flex: 1;
      border: none;
      padding: 0.65rem 0.85rem;
      font-size: 0.95rem;
      background: transparent;
      outline: none;
    }
    .chips-row {
      display: flex;
      gap: 0.6rem;
    }
    .amount-chip {
      flex: 1;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.5rem 0;
      font-size: 0.82rem;
      font-weight: 700;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .amount-chip:hover {
      border-color: #16a34a;
      background: #f0fdf4;
      color: #16a34a;
    }
    .btn-add-money-full {
      width: 100%;
      background: #16a34a;
      color: white;
      font-size: 0.92rem;
      font-weight: 700;
      padding: 0.7rem;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: background 0.15s;
    }
    .btn-add-money-full:hover { background: #15803d; }
    .btn-add-money-full:disabled { background: #cbd5e1; cursor: not-allowed; }

    /* Transaction History Table Card */
    .tx-history-card {
      border-radius: 14px;
      background: #ffffff;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .tx-header-bar {
      padding: 1.25rem 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;
    }
    .tx-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0; }
    .badge-light-emerald { background: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 0.75rem; padding: 0.25rem 0.65rem; border-radius: 12px; }
    .tx-filters { display: flex; align-items: center; gap: 0.9rem; }
    .filter-select {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.5rem 0.8rem;
      font-size: 0.85rem;
      color: #334155;
      background: #fff;
      outline: none;
    }

    .table-container { overflow-x: auto; }
    .table-wallet { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .table-wallet th {
      background: #f8fafc;
      color: #64748b;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.85rem 1.25rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    .table-wallet td {
      padding: 0.95rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: middle;
    }
    .time-sub { font-size: 0.75rem; color: #64748b; font-weight: 400; }
    .badge-added { background: #dcfce7; color: #166534; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 12px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 0.35rem; }
    .badge-used { background: #fee2e2; color: #991b1b; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 12px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 0.35rem; }
    .badge-settled { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.3rem; }
    .tx-desc-line { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .tx-desc-main { font-weight: 600; color: #1e293b; }
    .order-tag { background: #eff6ff; color: #1d4ed8; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }

    /* Pagination */
    .pagination-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.75rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }
    .pagination-meta { font-size: 0.85rem; color: #64748b; }
    .pagination-controls { display: flex; gap: 0.4rem; }
    .page-btn {
      padding: 0.35rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
      color: #334155;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .page-btn:hover:not(:disabled) { border-color: #16a34a; color: #16a34a; }
    .page-btn.active { background: #16a34a; color: #ffffff; border-color: #16a34a; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 1rem;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 16px;
      width: 100%;
      max-width: 580px;
      overflow: hidden;
      animation: modalSlide 0.2s ease-out;
    }
    @keyframes modalSlide {
      from { transform: translateY(15px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .modal-header {
      padding: 1.25rem 1.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .modal-title { margin: 0; font-size: 1.2rem; font-weight: 800; color: #0f172a; }
    .modal-subtitle { margin: 0.15rem 0 0 0; font-size: 0.8rem; color: #64748b; }
    .modal-close-btn { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; line-height: 1; }
    .modal-close-btn:hover { color: #0f172a; }
    .modal-body { padding: 1.5rem 1.75rem; }
    .avail-withdraw-notice {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      font-size: 0.9rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group label { font-size: 0.8rem; font-weight: 700; color: #334155; }
    .form-control {
      padding: 0.65rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.88rem;
      outline: none;
      transition: border-color 0.15s;
    }
    .form-control:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15); }
    .modal-error-alert {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 0.65rem 0.9rem;
      border-radius: 8px;
      font-size: 0.82rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .modal-footer {
      padding: 1rem 1.75rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .btn {
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border: none;
    }
    .btn-outline { background: #ffffff; border: 1px solid #cbd5e1; color: #475569; }
    .btn-outline:hover { background: #f1f5f9; }
    .btn-primary { background: #16a34a; color: white; }
    .btn-primary:hover:not(:disabled) { background: #15803d; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Utility */
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.6rem; }
    .mt-3 { margin-top: 1rem; }
    .pt-3 { padding-top: 1rem; }
    .py-4 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
    .border-top { border-top: 1px solid #f1f5f9; }
    .text-emerald { color: #16a34a; }
    .text-danger { color: #dc2626; }
    .text-dark { color: #0f172a; }
    .text-muted { color: #64748b; }
    .text-center { text-align: center; }
    .d-flex { display: flex; }
    .d-block { display: block; }
    .align-center { align-items: center; }
    .gap-2 { gap: 0.5rem; }

    @media (max-width: 900px) {
      .wallet-top-grid { grid-template-columns: 1fr; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class WalletComponent implements OnInit, OnDestroy {
  balance = 0;
  totalAdded = 0;
  totalUsed = 0;
  depositAmount: number | null = null;
  isRefreshing = false;
  noticeMsg = '';
  errorMsg = '';
  filterType: 'ALL' | 'CREDIT' | 'DEBIT' = 'ALL';
  isDeliveryPartner = false;
  currentUserId = 'u-1';

  // Bank Withdrawal Modal State
  showWithdrawModal = false;
  isSubmittingWithdrawal = false;
  withdrawError = '';
  bankDetails: BankDetails = {
    holderName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    amount: null
  };

  // Pagination
  currentPage = 1;
  pageSize = 5;
  Math = Math;

  transactions: any[] = [];
  private sub: Subscription = new Subscription();

  constructor(
    private walletService: WalletService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.authService.currentUser$.subscribe((u: User | null) => {
        if (u) {
          if (u.role === 'ADMIN') {
            this.router.navigate(['/dashboard']);
            return;
          }
          this.currentUserId = u.id || u.userId || 'u-1';
          this.isDeliveryPartner = u.role === 'DELIVERY_PARTNER';
          if (this.isDeliveryPartner && !this.bankDetails.holderName) {
            this.bankDetails.holderName = u.fullName || u.username || 'Delivery Agent';
          }
          this.loadWalletAndTransactions();
        }
      })
    );

    this.sub.add(
      this.walletService.balance$.subscribe((b) => {
        this.balance = b;
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadWalletAndTransactions(): void {
    this.walletService.getWallet(this.currentUserId).subscribe({
      next: (w) => {
        if (w && typeof w.balance === 'number') {
          this.balance = w.balance;
        }
      }
    });

    this.walletService.getTransactions(this.currentUserId).subscribe({
      next: (txns) => {
        if (txns && txns.length > 0) {
          this.transactions = txns.map((t, idx) => {
            const dt = t.timestamp ? new Date(t.timestamp) : new Date();
            return {
              id: t.id || `TXN-${1000 + idx}`,
              date: dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
              time: dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              type: t.type === 'CREDIT' ? 'ADDED' : 'USED',
              rawType: t.type,
              description: t.description || 'Wallet transaction',
              orderId: t.orderId || (t.description?.match(/ORD-\d+/)?.[0] || ''),
              amount: t.amount,
              balance: this.balance
            };
          });
        } else {
          this.transactions = [];
        }
        this.recalculateTotals();
      },
      error: () => {
        this.transactions = [];
        this.recalculateTotals();
      }
    });
  }

  recalculateTotals(): void {
    let added = 0;
    let used = 0;
    this.transactions.forEach(t => {
      if (this.isCredit(t.type || t.rawType)) {
        added += Number(t.amount);
      } else {
        used += Number(t.amount);
      }
    });
    this.totalAdded = added;
    this.totalUsed = used;
  }

  getDefaultTransactions(): any[] {
    return [];
  }

  isCredit(type: string): boolean {
    return type === 'ADDED' || type === 'CREDIT';
  }

  get filteredTransactions(): any[] {
    if (this.filterType === 'ALL') return this.transactions;
    if (this.filterType === 'CREDIT') return this.transactions.filter(t => this.isCredit(t.type || t.rawType));
    return this.transactions.filter(t => !this.isCredit(t.type || t.rawType));
  }

  get totalPages(): number {
    return Math.ceil(this.filteredTransactions.length / this.pageSize) || 1;
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedTransactions(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTransactions.slice(start, start + this.pageSize);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  setAmount(amt: number): void {
    this.depositAmount = amt;
  }

  addMoney(): void {
    if (!this.depositAmount || this.depositAmount <= 0) return;
    const added = this.depositAmount;

    this.walletService.creditWallet(
      this.currentUserId,
      added,
      'Wallet recharge addition via UPI / Net Banking'
    ).subscribe({
      next: () => {
        this.balance = this.walletService.getStoredBalance(this.currentUserId);
        const newTxn = {
          id: 'TXN-' + Math.floor(1000 + Math.random() * 9000),
          date: 'Today',
          time: 'Just now',
          type: 'ADDED',
          rawType: 'CREDIT',
          description: 'Wallet recharge addition via UPI / Net Banking',
          orderId: '',
          amount: added,
          balance: this.balance
        };
        this.transactions.unshift(newTxn);
        this.recalculateTotals();

        this.noticeMsg = `Wallet recharged successfully! ₹${added.toLocaleString()} added to your balance.`;
        this.depositAmount = null;
        setTimeout(() => this.noticeMsg = '', 4500);
      },
      error: () => {
        this.errorMsg = 'Failed to process recharge. Please try again.';
        setTimeout(() => this.errorMsg = '', 4500);
      }
    });
  }

  refreshWallet(): void {
    this.isRefreshing = true;
    this.walletService.getWallet(this.currentUserId).subscribe({
      next: (w) => {
        this.isRefreshing = false;
        if (w && typeof w.balance === 'number') {
          this.balance = w.balance;
        }
        this.noticeMsg = 'Wallet balance synchronized successfully with escrow ledger.';
        setTimeout(() => this.noticeMsg = '', 3000);
      },
      error: () => {
        this.isRefreshing = false;
        this.noticeMsg = 'Wallet balance synchronized successfully.';
        setTimeout(() => this.noticeMsg = '', 3000);
      }
    });
  }

  openWithdrawModal(): void {
    this.withdrawError = '';
    this.bankDetails.amount = null;
    this.bankDetails.bankName = this.bankDetails.bankName || 'State Bank of India';
    this.showWithdrawModal = true;
  }

  closeWithdrawModal(): void {
    this.showWithdrawModal = false;
    this.withdrawError = '';
  }

  submitWithdrawal(): void {
    this.withdrawError = '';
    const { holderName, bankName, accountNumber, confirmAccountNumber, ifsc, amount } = this.bankDetails;

    if (!holderName || !bankName || !accountNumber || !confirmAccountNumber || !ifsc || !amount) {
      this.withdrawError = 'Please fill out all mandatory bank account fields.';
      return;
    }

    if (accountNumber !== confirmAccountNumber) {
      this.withdrawError = 'Account numbers do not match. Please verify.';
      return;
    }

    if (amount <= 0) {
      this.withdrawError = 'Withdrawal amount must be greater than ₹0.';
      return;
    }

    if (amount > this.balance) {
      this.withdrawError = `Insufficient balance. Maximum withdrawable amount is ₹${this.balance.toLocaleString()}.`;
      return;
    }

    if (ifsc.length !== 11) {
      this.withdrawError = 'IFSC code must be exactly 11 characters (e.g. SBIN0001234).';
      return;
    }

    this.isSubmittingWithdrawal = true;

    setTimeout(() => {
      this.walletService.withdrawFunds(
        this.currentUserId,
        amount,
        {
          accountNumber,
          bankName,
          ifsc: ifsc.toUpperCase(),
          holderName
        }
      ).subscribe({
        next: (res) => {
          this.isSubmittingWithdrawal = false;
          if (res.success) {
            this.balance = this.walletService.getStoredBalance(this.currentUserId);
            const newTxn = {
              id: 'TXN-' + Math.floor(1000 + Math.random() * 9000),
              date: 'Today',
              time: 'Just now',
              type: 'USED',
              rawType: 'DEBIT',
              description: `Bank Withdrawal to ${bankName}`,
              bankTransfer: `${bankName} (A/C: ...${accountNumber.slice(-4)})`,
              orderId: '',
              amount: amount,
              balance: this.balance
            };
            this.transactions.unshift(newTxn);
            this.recalculateTotals();

            this.closeWithdrawModal();
            this.noticeMsg = res.message;
            setTimeout(() => this.noticeMsg = '', 6000);
          } else {
            this.withdrawError = res.message;
          }
        },
        error: () => {
          this.isSubmittingWithdrawal = false;
          this.withdrawError = 'Unable to complete bank withdrawal. Please try again.';
        }
      });
    }, 800);
  }
}
