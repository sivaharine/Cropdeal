import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  DashboardSummaryResponse,
  OrdersByStatusResponse,
  RevenueSummaryResponse,
  AdminAuditLog,
  CropClientDto,
  OrderClientDto,
  PaymentClientDto
} from '../../../core/models/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardSummaryResponse = {
    totalFarmers: 0,
    totalDealers: 0,
    totalDeliveryPartners: 0,
    totalCrops: 0,
    availableCrops: 0,
    totalOrders: 0,
    completedOrders: 0,
    paidOrders: 0,
    cancelledOrders: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    successfulPayments: 0,
    failedPayments: 0,
    activeAuctions: 0,
    disputesResolved: 99
  };

  ordersByStatus: OrdersByStatusResponse | null = null;
  revenueSummary: RevenueSummaryResponse | null = null;

  recentActivity: any[] = [];
  crops: CropClientDto[] = [];
  orders: OrderClientDto[] = [];
  payments: PaymentClientDto[] = [];
  auditLogs: AdminAuditLog[] = [];

  activeTab: 'overview' | 'crops' | 'orders' | 'payments' | 'audit' = 'overview';
  isLoading = false;

  // Selected order/payment inspection modal
  selectedOrderForModal: OrderClientDto | null = null;
  selectedPaymentForModal: PaymentClientDto | null = null;

  constructor(
    private adminService: AdminService,
    private notifService: NotificationService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAdminData();
  }

  loadAdminData(): void {
    this.isLoading = true;

    // 1. Dashboard summary
    this.adminService.getDashboardSummary().subscribe(s => {
      if (s) this.stats = s;
      this.cdr.markForCheck();
    });

    // 2. Orders by status breakdown
    this.adminService.getOrdersByStatus().subscribe(obs => {
      this.ordersByStatus = obs;
      this.cdr.markForCheck();
    });

    // 3. Revenue summary & payment methods breakdown
    this.adminService.getRevenueSummary().subscribe(rev => {
      this.revenueSummary = rev;
      this.cdr.markForCheck();
    });

    // 4. Recent audit activity
    this.adminService.getRecentActivity().subscribe(a => {
      this.recentActivity = a || [];
      this.isLoading = false;
      this.cdr.markForCheck();
    });

    // 5. Crops catalog
    this.adminService.getAllCrops().subscribe(c => {
      this.crops = c || [];
      this.cdr.markForCheck();
    });

    // 6. Orders governance
    this.adminService.getAllOrders().subscribe(o => {
      this.orders = o || [];
      this.cdr.markForCheck();
    });

    // 7. Payment transactions
    this.adminService.getAllPayments().subscribe(p => {
      this.payments = p || [];
      this.cdr.markForCheck();
    });

    // 8. Audit logs trail
    this.adminService.getAuditLogs().subscribe(l => {
      this.auditLogs = l || [];
      this.cdr.markForCheck();
    });
  }

  removeCropListing(cropId: number): void {
    const reason = prompt('Reason for removing this crop listing:', 'Quality standard violation');
    if (!reason) return;
    const adminEmail = this.authService.currentUser?.email || 'admin@cropdeal.com';
    this.adminService.removeCrop(cropId, reason, adminEmail).subscribe(() => {
      this.crops = this.crops.filter(c => c.id !== cropId);
      this.cdr.markForCheck();
      this.notifService.showToast('warning', `Crop #${cropId} removed from platform catalog.`);
      this.auditLogs = [
        {
          id: Date.now(),
          adminEmail,
          performedBy: adminEmail,
          action: 'CROP_REMOVAL',
          targetEntity: 'CROP',
          entityType: 'CROP',
          targetId: cropId,
          entityId: cropId,
          details: reason,
          reason,
          timestamp: new Date().toISOString(),
          performedAt: new Date().toISOString()
        },
        ...this.auditLogs
      ];
    });
  }

  overrideOrderStatus(order: OrderClientDto, newStatus: string): void {
    const reason = prompt(`Reason for changing Order #${order.id} status to ${newStatus}:`, 'Administrative dispute resolution');
    if (!reason) return;
    const adminEmail = this.authService.currentUser?.email || 'admin@cropdeal.com';
    this.adminService.updateOrderStatus(order.id, newStatus, reason, adminEmail).subscribe(updated => {
      this.orders = this.orders.map(o => (o.id === order.id ? { ...o, status: newStatus } : o));
      this.cdr.markForCheck();
      this.notifService.showToast('success', `Order #${order.id} status updated to ${newStatus}`);
      this.auditLogs = [
        {
          id: Date.now(),
          adminEmail,
          performedBy: adminEmail,
          action: 'ORDER_OVERRIDE',
          targetEntity: 'ORDER',
          entityType: 'ORDER',
          targetId: order.id,
          entityId: order.id,
          details: reason,
          reason,
          timestamp: new Date().toISOString(),
          performedAt: new Date().toISOString()
        },
        ...this.auditLogs
      ];
    });
  }

  inspectOrder(order: OrderClientDto): void {
    this.selectedOrderForModal = order;
    this.cdr.markForCheck();
  }

  inspectPayment(payment: PaymentClientDto): void {
    this.selectedPaymentForModal = payment;
    this.cdr.markForCheck();
  }
}
