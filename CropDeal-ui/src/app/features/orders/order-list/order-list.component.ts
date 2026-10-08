import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrderResponse } from '../../../core/models/models';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderListComponent implements OnInit {
  orders: OrderResponse[] = [];
  // ✅ Cached field — NOT a getter (avoids CD loop)
  filteredOrders: OrderResponse[] = [];
  statusFilter = 'ALL';

  isFarmer = false;
  isDealer = false;
  isAdmin = false;

  isPayModalOpen = false;
  selectedOrder: OrderResponse | null = null;
  selectedPaymentMethod: string = 'WALLET';
  walletBalance = 0;
  pendingPayOrderId: number | null = null;

  constructor(
    private orderService: OrderService,
    private paymentService: PaymentService,
    private invoiceService: InvoiceService,
    private notifService: NotificationService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isFarmer = user?.role === 'FARMER';
      this.isDealer = user?.role === 'DEALER';
      this.isAdmin = user?.role === 'ADMIN';
      this.loadOrders();
      this.cdr.markForCheck();
    });

    // Listen to query parameters (e.g. ?payOrderId=123) to automatically open payment modal
    this.route.queryParams.subscribe(params => {
      if (params['payOrderId']) {
        this.pendingPayOrderId = Number(params['payOrderId']);
        this.checkPendingPayment();
      }
    });

    // Live wallet balance sync
    this.paymentService.walletUpdated$.subscribe(uid => {
      if (this.authService.currentUser?.userId === uid) {
        this.paymentService.getWallet(uid).subscribe(w => {
          this.walletBalance = w.balance;
          this.cdr.markForCheck();
        });
      }
    });
  }

  loadOrders(): void {
    const user = this.authService.currentUser;
    if (user?.role === 'FARMER') {
      this.orderService.getOrdersByFarmer(user.userId).subscribe(o => {
        this.orders = o || [];
        this.applyStatusFilter();
        this.checkPendingPayment();
        this.cdr.markForCheck();
      });
    } else if (user?.role === 'DEALER') {
      this.orderService.getOrdersByDealer(user.userId).subscribe(o => {
        this.orders = o || [];
        this.applyStatusFilter();
        this.checkPendingPayment();
        this.cdr.markForCheck();
      });
    } else {
      this.orderService.getAllOrders().subscribe(o => {
        this.orders = o || [];
        this.applyStatusFilter();
        this.checkPendingPayment();
        this.cdr.markForCheck();
      });
    }
    if (user) {
      this.paymentService.getWallet(user.userId).subscribe(w => {
        this.walletBalance = w.balance;
        this.cdr.markForCheck();
      });
    }
  }

  checkPendingPayment(): void {
    if (this.pendingPayOrderId && this.orders.length > 0) {
      const target = this.orders.find(o => o.id === this.pendingPayOrderId);
      if (target && target.paymentStatus !== 'PAID') {
        this.openPayModal(target);
        this.pendingPayOrderId = null;
      }
    }
  }

  applyStatusFilter(): void {
    this.filteredOrders = this.statusFilter === 'ALL'
      ? [...this.orders]
      : this.orders.filter(o => o.status === this.statusFilter);
    this.cdr.markForCheck();
  }

  openPayModal(order: OrderResponse): void {
    this.selectedOrder = order;
    this.selectedPaymentMethod = 'WALLET';
    this.isPayModalOpen = true;

    // Refresh wallet balance from service
    const user = this.authService.currentUser;
    if (user) {
      this.paymentService.getWallet(user.userId).subscribe(w => {
        this.walletBalance = w.balance;
        this.cdr.markForCheck();
      });
    }
  }

  submitPayment(): void {
    if (!this.selectedOrder) return;
    const targetOrder = this.selectedOrder;

    if (this.selectedPaymentMethod === 'WALLET' && this.walletBalance < targetOrder.totalAmount) {
      this.notifService.showToast('warning', `Insufficient wallet balance (₹${this.walletBalance.toLocaleString('en-IN')}). Please top up wallet or select UPI/Net Banking.`);
      return;
    }

    this.orderService.payOrder(targetOrder.id, { paymentMethod: this.selectedPaymentMethod }).subscribe(order => {
      this.orders = this.orders.map(o => o.id === order.id ? order : o);
      if (this.selectedPaymentMethod === 'WALLET') {
        this.walletBalance = Math.max(0, this.walletBalance - order.totalAmount);
      }
      this.applyStatusFilter();
      this.isPayModalOpen = false;
      this.cdr.markForCheck();

      // 1. Notify Buyer (Dealer)
      this.notifService.showToast('success', `Payment for Order #${order.id} transferred to Escrow. Amount: ₹${order.totalAmount.toLocaleString('en-IN')}`);

      // 2. Notify Seller (Farmer) - matches backend WorkflowNotificationListener.handlePaymentCompleted
      if (order.farmerId) {
        this.notifService.pushNotification(
          'PAYMENT',
          '💰 Payment Received in Escrow',
          `Payment of ₹${order.totalAmount} secured in Escrow for Order #${order.id}. Please prepare crops for logistics pickup.`,
          order.farmerId
        );
      }
    });
  }

  cancelOrder(id: number): void {
    const orderToCancel = this.orders.find(o => o.id === id);
    if (confirm(`Cancel Order #${id}?`)) {
      this.orderService.cancelOrder(id).subscribe(order => {
        this.orders = this.orders.map(o => o.id === id ? order : o);
        this.applyStatusFilter();
        this.cdr.markForCheck();

        // 1. Notify current user
        this.notifService.showToast('info', `Order #${id} cancelled.`);

        // 2. Notify counterparty
        const currentUserId = this.authService.currentUser?.userId;
        const targetUserId = (orderToCancel?.dealerId === currentUserId) ? orderToCancel?.farmerId : orderToCancel?.dealerId;
        if (targetUserId) {
          this.notifService.pushNotification(
            'ORDER',
            '⚠️ Order Cancelled',
            `Order #${id} has been cancelled. If payment was held, escrow will initiate refund.`,
            targetUserId
          );
        }
      });
    }
  }

  downloadInvoice(id: number): void {
    this.invoiceService.downloadInvoicePdfByOrderId(id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `CropDeal_Invoice_${id}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
      this.notifService.showToast('info', `Invoice PDF downloaded for Order #${id}`);
    });
  }
}
