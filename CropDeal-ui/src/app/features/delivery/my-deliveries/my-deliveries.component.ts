import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeliveryService } from '../../../core/services/delivery.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DeliveryResponse } from '../../../core/models/models';

@Component({
  selector: 'app-my-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './my-deliveries.component.html',
  styleUrls: ['./my-deliveries.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyDeliveriesComponent implements OnInit {
  deliveries: DeliveryResponse[] = [];
  filteredDeliveries: DeliveryResponse[] = [];
  isLoading = false;

  // Filter & Search state
  searchTerm = '';
  statusFilter: 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' = 'ALL';

  // Metrics
  totalCount = 0;
  activeCount = 0;
  completedCount = 0;
  cancelledCount = 0;
  totalEarnings = 0;

  // OTP Verification Modal
  selectedDeliveryForOtp: DeliveryResponse | null = null;
  inputOtp = '';
  isOtpModalOpen = false;

  constructor(
    private deliveryService: DeliveryService,
    public authService: AuthService,
    private notifService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMyDeliveries();
  }

  loadMyDeliveries(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const agentId = this.authService.currentUser?.userId || 9;

    // Use GET /api/delivery-agents/{agentId}/deliveries
    this.deliveryService.getAgentDeliveries(agentId).subscribe({
      next: (list) => {
        this.deliveries = list || [];
        this.updateStats();
        this.applyFilter();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        // Fallback to GET /api/deliveries/my?partnerId={id}
        this.deliveryService.getMyDeliveries(agentId).subscribe({
          next: (list) => {
            this.deliveries = list || [];
            this.updateStats();
            this.applyFilter();
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  private updateStats(): void {
    this.totalCount = this.deliveries.length;
    this.activeCount = this.deliveries.filter(d =>
      d.status === 'ACCEPTED' || d.status === 'IN_TRANSIT' || d.status === 'PICKED_UP'
    ).length;
    this.completedCount = this.deliveries.filter(d =>
      d.status === 'DELIVERED' || d.status === 'VERIFIED'
    ).length;
    this.cancelledCount = this.deliveries.filter(d =>
      d.status === 'CANCELLED' || d.status === 'REJECTED'
    ).length;
    this.totalEarnings = this.deliveries
      .filter(d => d.status === 'DELIVERED' || d.status === 'VERIFIED')
      .reduce((sum, d) => sum + (Number(d.deliveryCharge) || 250), 0);
  }

  setStatusFilter(filter: 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'): void {
    this.statusFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    let result = [...this.deliveries];

    // Status filter
    if (this.statusFilter === 'ACTIVE') {
      result = result.filter(d =>
        d.status === 'ACCEPTED' || d.status === 'IN_TRANSIT' || d.status === 'PICKED_UP'
      );
    } else if (this.statusFilter === 'COMPLETED') {
      result = result.filter(d =>
        d.status === 'DELIVERED' || d.status === 'VERIFIED'
      );
    } else if (this.statusFilter === 'CANCELLED') {
      result = result.filter(d =>
        d.status === 'CANCELLED' || d.status === 'REJECTED'
      );
    }

    // Search query
    const query = this.searchTerm.toLowerCase().trim();
    if (query) {
      result = result.filter(d =>
        (d.deliveryReference || '').toLowerCase().includes(query) ||
        String(d.orderId).includes(query) ||
        String(d.id).includes(query) ||
        (d.pickupAddress || '').toLowerCase().includes(query) ||
        (d.deliveryAddress || '').toLowerCase().includes(query) ||
        (d.customerPhone || '').includes(query)
      );
    }

    this.filteredDeliveries = result;
    this.cdr.markForCheck();
  }

  openOtpModal(del: DeliveryResponse): void {
    const agentId = this.authService.currentUser?.userId || 9;
    this.selectedDeliveryForOtp = del;
    this.inputOtp = '';
    this.isOtpModalOpen = true;
    this.deliveryService.sendDeliveryOtp(agentId, del.id).subscribe();
    this.notifService.showToast('info', `OTP code sent to customer. (Demo: ${del.deliveryOtp || '614604'})`);
    this.cdr.markForCheck();
  }

  submitVerifyOtp(): void {
    if (!this.selectedDeliveryForOtp || !this.inputOtp.trim()) return;
    const agentId = this.authService.currentUser?.userId || 9;
    const deliveryId = this.selectedDeliveryForOtp.id;

    this.deliveryService.verifyDeliveryOtp(agentId, deliveryId, this.inputOtp.trim()).subscribe({
      next: (updated) => {
        this.deliveries = this.deliveries.map(d => d.id === updated.id ? updated : d);
        this.isOtpModalOpen = false;
        this.selectedDeliveryForOtp = null;
        this.updateStats();
        this.applyFilter();
        this.cdr.markForCheck();
        this.notifService.showToast('success', `Delivery #${deliveryId} confirmed and verified successfully!`);
      },
      error: () => {
        this.notifService.showToast('warning', 'Invalid OTP code. Please verify with receiving customer.');
      }
    });
  }
}
