import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeliveryService } from '../../../core/services/delivery.service';
import { OrderService } from '../../../core/services/order.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';
import { DeliveryResponse, DeliveryAgentResponse, OtpNotificationRequest, DeliveryCompletedNotificationRequest } from '../../../core/models/models';

@Component({
  selector: 'app-delivery-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './delivery-dashboard.component.html',
  styleUrls: ['./delivery-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliveryDashboardComponent implements OnInit {
  isAvailable = true;
  myDeliveries: DeliveryResponse[] = [];
  availableDeliveries: DeliveryResponse[] = [];
  activeDelivery: DeliveryResponse | null = null;
  agentProfile: DeliveryAgentResponse | null = null;

  // Cached stats
  completedCount = 0;
  totalEarnings = 0;

  currentLat = 0;
  currentLng = 0;
  inputOtp = '';
  isOtpModalOpen = false;

  // Reject modal
  isRejectModalOpen = false;
  rejectReason = '';
  rejectDeliveryId: number | null = null;

  constructor(
    private deliveryService: DeliveryService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private notifService: NotificationService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const agentId = this.authService.currentUser?.userId || 9;
    this.loadAgentProfile(agentId);
    this.loadDeliveries(agentId);
  }

  loadAgentProfile(agentId: number): void {
    this.deliveryService.getAgentById(agentId).subscribe(agent => {
      if (agent) {
        this.agentProfile = agent;
        this.isAvailable = agent.available;
        this.cdr.markForCheck();
      }
    });
  }

  loadDeliveries(agentId: number): void {
    // Use agent-specific endpoint: GET /api/delivery-agents/{agentId}/deliveries
    this.deliveryService.getAgentDeliveries(agentId).subscribe(list => {
      this.myDeliveries = list || [];
      this.completedCount = this.myDeliveries.filter(d => d.status === 'DELIVERED' || d.status === 'VERIFIED').length;
      this.totalEarnings = this.myDeliveries
        .filter(d => d.status === 'DELIVERED' || d.status === 'VERIFIED')
        .reduce((sum, d) => sum + (Number(d.deliveryCharge) || 250), 0);
      this.activeDelivery = this.myDeliveries.find(d =>
        d.status === 'IN_TRANSIT' || d.status === 'ACCEPTED' || d.status === 'PICKED_UP'
      ) || null;
      this.cdr.markForCheck();
    });
    // Also load open/available deliveries
    this.deliveryService.getAvailableDeliveries().subscribe(list => {
      this.availableDeliveries = list || [];
      this.cdr.markForCheck();
    });
  }

  toggleAvailability(): void {
    const agentId = this.authService.currentUser?.userId || 1;
    this.isAvailable = !this.isAvailable;
    // PUT /api/delivery-agents/{agentId}/availability?available={bool}
    this.deliveryService.updateAgentAvailability(agentId, this.isAvailable).subscribe();
    this.notifService.showToast('info', `Status: ${this.isAvailable ? 'ONLINE — Accepting Deliveries' : 'OFFLINE'}`);
    this.cdr.markForCheck();
  }

  acceptDelivery(id: number): void {
    const agentId = this.authService.currentUser?.userId || 1;
    const agentName = this.authService.currentUser?.name || 'Logistics Partner';
    // Use agent-specific PUT endpoint: PUT /api/delivery-agents/{agentId}/deliveries/{id}/accept
    this.deliveryService.agentAcceptDelivery(agentId, id).subscribe(del => {
      this.availableDeliveries = this.availableDeliveries.filter(d => d.id !== id);
      this.myDeliveries = [del, ...this.myDeliveries];
      this.activeDelivery = del;
      this.cdr.markForCheck();

      this.notifService.showToast('success', `Delivery #${id} accepted. Proceed to pickup location.`);

      this.orderService.getOrderById(del.orderId).subscribe(order => {
        if (order) {
          if (order.farmerId) {
            this.notifService.pushNotification(
              'DELIVERY', '🚚 Delivery Partner Assigned',
              `${agentName} has accepted pickup for Order #${order.id}. Pickup: ${del.pickupAddress || 'Farm Gate'}.`,
              order.farmerId
            );
          }
          if (order.dealerId) {
            this.notifService.pushNotification(
              'DELIVERY', '🚚 Order Assigned to Delivery Partner',
              `${agentName} has accepted your Order #${order.id} for delivery.`,
              order.dealerId
            );
          }
        }
      });
    });
  }

  rejectDelivery(id: number): void {
    this.rejectDeliveryId = id;
    this.rejectReason = '';
    this.isRejectModalOpen = true;
  }

  submitReject(): void {
    if (!this.rejectDeliveryId || !this.rejectReason.trim()) return;
    const agentId = this.authService.currentUser?.userId || 1;
    // PUT /api/delivery-agents/{agentId}/deliveries/{deliveryId}/reject?reason=
    this.deliveryService.agentRejectDelivery(agentId, this.rejectDeliveryId, this.rejectReason).subscribe(() => {
      this.availableDeliveries = this.availableDeliveries.filter(d => d.id !== this.rejectDeliveryId);
      this.isRejectModalOpen = false;
      this.rejectDeliveryId = null;
      this.cdr.markForCheck();
      this.notifService.showToast('info', 'Delivery request rejected.');
    });
  }

  markPickedUp(del: DeliveryResponse): void {
    const agentId = this.authService.currentUser?.userId || 1;
    // PUT /api/delivery-agents/{agentId}/deliveries/{id}/pickup
    this.deliveryService.agentPickupDelivery(agentId, del.id).subscribe(updated => {
      this.myDeliveries = this.myDeliveries.map(d => d.id === updated.id ? updated : d);
      this.activeDelivery = updated;
      this.cdr.markForCheck();

      this.notifService.showToast('info', `Delivery #${del.id} produce confirmed as picked up.`);

      // Also start delivery (in transit) via agent start endpoint
      this.deliveryService.agentStartDelivery(agentId, del.id).subscribe(started => {
        this.myDeliveries = this.myDeliveries.map(d => d.id === started.id ? started : d);
        this.activeDelivery = started;
        this.cdr.markForCheck();

        this.orderService.getOrderById(del.orderId).subscribe(order => {
          if (order?.dealerId) {
            this.notifService.pushNotification(
              'DELIVERY', '🚚 Order In Transit',
              `Your Order #${order.id} is on the way to ${del.deliveryAddress}.`,
              order.dealerId
            );
          }
          if (order?.farmerId) {
            this.notifService.pushNotification(
              'DELIVERY', '🚚 Produce Collected',
              `Produce for Order #${order.id} has been picked up and is in transit.`,
              order.farmerId
            );
          }
        });
      });
    });
  }

  simulateGpsPing(): void {
    const agentId = this.authService.currentUser?.userId || 1;
    this.currentLat += 0.005;
    this.currentLng += 0.004;
    // PUT /api/delivery-agents/{agentId}/location?latitude=&longitude=
    this.deliveryService.updateAgentLocation(agentId, this.currentLat, this.currentLng).subscribe(() => {
      this.notifService.showToast('success', `GPS synced: [${this.currentLat.toFixed(4)}, ${this.currentLng.toFixed(4)}]`);
    });
  }

  openOtpModal(del: DeliveryResponse): void {
    const agentId = this.authService.currentUser?.userId || 1;
    this.activeDelivery = del;
    this.inputOtp = '';
    this.isOtpModalOpen = true;
    // POST /api/delivery-agents/{agentId}/deliveries/{id}/otp (delivery service)
    this.deliveryService.sendDeliveryOtp(agentId, del.id).subscribe(() => {
      this.notifService.showToast('info', `OTP sent to customer. (Demo: ${del.deliveryOtp || '4829'})`);
    });
    // POST /api/notifications/delivery-otp (notification service — sends SMS to customer)
    if (del.customerPhone && del.deliveryOtp) {
      const otpReq: OtpNotificationRequest = {
        phoneNumber: del.customerPhone,
        otp: del.deliveryOtp
      };
      this.notifService.sendDeliveryOtpNotification(otpReq).subscribe();
    }
  }

  submitVerifyOtp(): void {
    if (!this.activeDelivery) return;
    const targetDel = this.activeDelivery;
    const agentId = this.authService.currentUser?.userId || 1;
    const expectedOtp = targetDel.deliveryOtp || '4829';
    if (this.inputOtp.trim() !== expectedOtp) {
      this.notifService.showToast('error', 'Invalid OTP. Please verify with the dealer.');
      return;
    }
    // POST /api/delivery-agents/{agentId}/deliveries/{id}/verify-otp?otp=
    this.deliveryService.verifyDeliveryOtp(agentId, targetDel.id, this.inputOtp).subscribe(del => {
      this.myDeliveries = this.myDeliveries.map(d => d.id === del.id ? del : d);
      this.completedCount++;
      this.totalEarnings += 750;
      this.activeDelivery = null;
      this.isOtpModalOpen = false;
      this.cdr.markForCheck();

      // Credit delivery agent wallet
      this.paymentService.creditWallet({
        userId: agentId,
        amount: 750,
        transactionType: 'CREDIT',
        referenceId: 'EARN-DEL-' + del.id,
        description: `Delivery trip compensation for Order #${targetDel.orderId}`
      }).subscribe();
      this.notifService.showToast('success', `Delivery #${del.id} verified & completed! ₹750 earnings credited.`);

      // POST /api/notifications/delivery-completed — SMS to customer confirming delivery
      if (targetDel.customerPhone) {
        const completedReq: DeliveryCompletedNotificationRequest = {
          phoneNumber: targetDel.customerPhone,
          orderId: targetDel.orderId
        };
        this.notifService.sendDeliveryCompletedNotification(completedReq).subscribe();
      }

      this.orderService.getOrderById(targetDel.orderId).subscribe(order => {
        if (order) {
          if (order.farmerId) {
            this.paymentService.creditWalletSettlement({
              userId: order.farmerId,
              amount: order.totalAmount,
              referenceId: 'SETTLE-ORD-' + order.id,
              description: `Harvest fulfillment payout for Order #${order.id} (Delivered)`
            }).subscribe();
          }
          if (order.dealerId) {
            this.notifService.pushNotification(
              'DELIVERY', '✅ Order Delivered Successfully',
              `Order #${order.id} delivered to ${targetDel.deliveryAddress}. Thank you for using CropDeal!`,
              order.dealerId
            );
          }
          if (order.farmerId) {
            this.notifService.pushNotification(
              'PAYMENT', '💰 Order Completed — Payment Released',
              `Order #${order.id} delivery verified! ₹${order.totalAmount} released to your wallet.`,
              order.farmerId
            );
          }
        }
      });
    });
  }
}
