import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeliveryService } from '../../core/services/delivery.service';
import { WalletService } from '../../core/services/wallet.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { OrderService } from '../../core/services/order.service';
import { Delivery } from '../../core/models/delivery.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="deliveries-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">
            <i class="fa-solid fa-truck-ramp-box text-emerald"></i>
            {{ isPartner ? 'Delivery Partner Logistics Dashboard' : 'Agricultural Logistics & Dispatch Tracking' }}
          </h2>
          <p class="page-subtitle">
            {{ isPartner
                ? 'Claim available farm pickups, update transit milestones, and earn ₹10/km credited to your wallet upon delivery'
                : 'Track farm-gate pickups, transit status, and delivery fulfillment for verified escrow release' }}
          </p>
        </div>
        <div class="header-badges">
          <span class="badge badge-success"><i class="fa-solid fa-route"></i> ₹10 / km Standard Payout</span>
          <span *ngIf="isPartner" class="badge badge-primary">
            <i class="fa-solid fa-wallet"></i> Wallet: ₹{{ walletBalance | number:'1.2-2' }}
          </span>
        </div>
      </div>

      <!-- Notification Toast -->
      <div *ngIf="alertMessage" class="toast-alert shadow-lg">
        <i class="fa-solid fa-circle-check"></i>
        <span>{{ alertMessage }}</span>
      </div>

      <!-- DELIVERY PARTNER DASHBOARD VIEW -->
      <ng-container *ngIf="isPartner">
        <!-- Partner Stats Grid -->
        <div class="grid grid-cols-4 mt-2">
          <div class="card stat-card">
            <div class="stat-top">
              <span class="stat-lbl">Available in Pool</span>
              <i class="fa-solid fa-boxes-stacked text-amber"></i>
            </div>
            <h2 class="stat-val text-amber">{{ poolDeliveries.length }}</h2>
            <span class="stat-sub">Ready to claim & pickup</span>
          </div>

          <div class="card stat-card">
            <div class="stat-top">
              <span class="stat-lbl">My Active Trips</span>
              <i class="fa-solid fa-truck-moving text-info"></i>
            </div>
            <h2 class="stat-val text-info">{{ myActiveDeliveries.length }}</h2>
            <span class="stat-sub">Assigned / In-transit</span>
          </div>

          <div class="card stat-card">
            <div class="stat-top">
              <span class="stat-lbl">Completed Trips</span>
              <i class="fa-solid fa-circle-check text-emerald"></i>
            </div>
            <h2 class="stat-val text-emerald">{{ completedDeliveries.length }}</h2>
            <span class="stat-sub">Total fulfilled orders</span>
          </div>

          <div class="card stat-card earnings-card">
            <div class="stat-top">
              <span class="stat-lbl">Wallet Earnings</span>
              <i class="fa-solid fa-wallet text-emerald"></i>
            </div>
            <h2 class="stat-val text-emerald">₹{{ walletBalance | number:'1.2-2' }}</h2>
            <a routerLink="/wallet" class="stat-link">View Passbook & Withdraw &rarr;</a>
          </div>
        </div>

        <!-- Dashboard Tabs -->
        <div class="tabs-nav mt-4">
          <button
            class="tab-btn"
            [class.active]="activeTab === 'POOL'"
            (click)="activeTab = 'POOL'">
            <i class="fa-solid fa-boxes-packing"></i> Available Orders in Pool ({{ poolDeliveries.length }})
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab === 'ACTIVE'"
            (click)="activeTab = 'ACTIVE'">
            <i class="fa-solid fa-truck-fast"></i> My Active Trips ({{ myActiveDeliveries.length }})
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab === 'HISTORY'"
            (click)="activeTab = 'HISTORY'">
            <i class="fa-solid fa-clock-rotate-left"></i> Completed History ({{ completedDeliveries.length }})
          </button>
        </div>

        <!-- TAB 1: AVAILABLE POOL ORDERS (Claim & Take Orders) -->
        <div *ngIf="activeTab === 'POOL'" class="mt-4">
          <div *ngIf="poolDeliveries.length === 0" class="card empty-card">
            <i class="fa-solid fa-box-open empty-icon"></i>
            <h3>No Unassigned Orders in Pool</h3>
            <p>All current orders have been claimed. Check back as dealers place new orders!</p>
          </div>

          <div class="grid grid-cols-2">
            <div *ngFor="let item of poolDeliveries" class="card order-claim-card">
              <div class="claim-header">
                <div>
                  <span class="tracking-tag"><i class="fa-solid fa-barcode"></i> {{ item.trackingNumber }}</span>
                  <h4 class="crop-title">{{ item.cropName }} ({{ item.cropQuantity }} {{ item.cropUnit }})</h4>
                  <span class="order-ref">Order Ref: #{{ item.orderId }}</span>
                </div>
                <div class="payout-badge">
                  <span class="payout-lbl">Guaranteed Payout</span>
                  <h3 class="payout-amount text-emerald">₹{{ item.deliveryFee }}</h3>
                  <small>{{ item.distanceKm }} km &#64; ₹10/km</small>
                </div>
              </div>

              <!-- Pickup & Drop Locations with Contact Details -->
              <div class="route-details-box mt-3">
                <div class="route-party">
                  <div class="party-icon farmer-icon"><i class="fa-solid fa-wheat-awn"></i></div>
                  <div class="party-text">
                    <span class="party-role">Pickup Origin (Farmer)</span>
                    <strong>{{ item.farmerName != null ? item.farmerName : 'null' }}</strong>
                    <a *ngIf="item.farmerPhone" href="tel:{{ item.farmerPhone }}" class="phone-link"><i class="fa-solid fa-phone"></i> {{ item.farmerPhone }}</a>
                    <span *ngIf="!item.farmerPhone" class="phone-link text-muted"><i class="fa-solid fa-phone"></i> null</span>
                    <p class="address-text"><i class="fa-solid fa-location-dot"></i> {{ item.pickupAddress != null ? item.pickupAddress : 'null' }}</p>
                  </div>
                </div>

                <div class="route-line-v"></div>

                <div class="route-party">
                  <div class="party-icon dealer-icon"><i class="fa-solid fa-warehouse"></i></div>
                  <div class="party-text">
                    <span class="party-role">Drop Destination (Dealer)</span>
                    <strong>{{ item.dealerName != null ? item.dealerName : 'null' }}</strong>
                    <a *ngIf="item.dealerPhone" href="tel:{{ item.dealerPhone }}" class="phone-link"><i class="fa-solid fa-phone"></i> {{ item.dealerPhone }}</a>
                    <span *ngIf="!item.dealerPhone" class="phone-link text-muted"><i class="fa-solid fa-phone"></i> null</span>
                    <p class="address-text"><i class="fa-solid fa-location-crosshairs"></i> {{ item.dropAddress != null ? item.dropAddress : 'null' }}</p>
                  </div>
                </div>
              </div>

              <div class="claim-footer mt-3">
                <div class="meta-sub">
                  <i class="fa-solid fa-road"></i> Distance: <strong>{{ item.distanceKm }} km</strong>
                </div>
                <button class="btn btn-primary" (click)="takeOrder(item)">
                  <i class="fa-solid fa-truck-pickup"></i> Accept / Take Order
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: MY ACTIVE TRIPS (Status Updates & Wallet Release) -->
        <div *ngIf="activeTab === 'ACTIVE'" class="mt-4">
          <div *ngIf="myActiveDeliveries.length === 0" class="card empty-card">
            <i class="fa-solid fa-truck-loading empty-icon"></i>
            <h3>No Active Trips Currently</h3>
            <p>You have no pending deliveries assigned. Click "Available Orders in Pool" to accept a new delivery.</p>
          </div>

          <div class="grid grid-cols-2">
            <div *ngFor="let item of myActiveDeliveries" class="card delivery-card active-delivery-card">
              <div class="del-header">
                <div>
                  <span class="tracking-code"><i class="fa-solid fa-barcode"></i> {{ item.trackingNumber }}</span>
                  <span class="order-ref">Order: #{{ item.orderId }} &bull; {{ item.cropName }} ({{ item.cropQuantity }} {{ item.cropUnit }})</span>
                </div>
                <div class="del-status-group">
                  <span class="badge" [ngClass]="getBadgeClass(item.status)">{{ item.status }}</span>
                  <span class="fee-pill">₹{{ item.deliveryFee }} payout</span>
                </div>
              </div>

              <!-- Stepper -->
              <div class="stepper mt-4">
                <div class="step" [class.completed]="isStepCompleted(item.status, 1)">
                  <div class="step-circle"><i class="fa-solid fa-clipboard-check"></i></div>
                  <span class="step-lbl">Assigned</span>
                </div>
                <div class="step-line" [class.completed]="isStepCompleted(item.status, 2)"></div>
                <div class="step" [class.completed]="isStepCompleted(item.status, 2)">
                  <div class="step-circle"><i class="fa-solid fa-truck-pickup"></i></div>
                  <span class="step-lbl">Picked Up</span>
                </div>
                <div class="step-line" [class.completed]="isStepCompleted(item.status, 3)"></div>
                <div class="step" [class.completed]="isStepCompleted(item.status, 3)">
                  <div class="step-circle"><i class="fa-solid fa-road"></i></div>
                  <span class="step-lbl">In Transit</span>
                </div>
                <div class="step-line" [class.completed]="isStepCompleted(item.status, 4)"></div>
                <div class="step" [class.completed]="isStepCompleted(item.status, 4)">
                  <div class="step-circle"><i class="fa-solid fa-warehouse"></i></div>
                  <span class="step-lbl">Delivered</span>
                </div>
              </div>

              <!-- Route Box with Contact Details -->
              <div class="route-details-box mt-4">
                <div class="route-party">
                  <div class="party-icon farmer-icon"><i class="fa-solid fa-wheat-awn"></i></div>
                  <div class="party-text">
                    <span class="party-role">Pickup Origin (Farmer)</span>
                    <strong>{{ item.farmerName != null ? item.farmerName : 'null' }}</strong>
                    <a *ngIf="item.farmerPhone" href="tel:{{ item.farmerPhone }}" class="phone-link"><i class="fa-solid fa-phone"></i> {{ item.farmerPhone }}</a>
                    <span *ngIf="!item.farmerPhone" class="phone-link text-muted"><i class="fa-solid fa-phone"></i> null</span>
                    <p class="address-text">{{ item.pickupAddress != null ? item.pickupAddress : 'null' }}</p>
                  </div>
                </div>

                <div class="route-line-v"></div>

                <div class="route-party">
                  <div class="party-icon dealer-icon"><i class="fa-solid fa-warehouse"></i></div>
                  <div class="party-text">
                    <span class="party-role">Drop Destination (Dealer)</span>
                    <strong>{{ item.dealerName != null ? item.dealerName : 'null' }}</strong>
                    <a *ngIf="item.dealerPhone" href="tel:{{ item.dealerPhone }}" class="phone-link"><i class="fa-solid fa-phone"></i> {{ item.dealerPhone }}</a>
                    <span *ngIf="!item.dealerPhone" class="phone-link text-muted"><i class="fa-solid fa-phone"></i> null</span>
                    <p class="address-text">{{ item.dropAddress != null ? item.dropAddress : 'null' }}</p>
                  </div>
                </div>
              </div>

              <!-- Action Status Progression Buttons -->
              <div class="status-action-bar mt-4">
                <span class="action-hint">Next Action Milestone:</span>
                <div class="action-buttons">
                  <button
                    *ngIf="item.status === 'ASSIGNED'"
                    class="btn btn-warning btn-sm"
                    (click)="advanceStatus(item, 'PICKED_UP')">
                    <i class="fa-solid fa-box-archive"></i> Mark Picked Up from Farmer
                  </button>

                  <button
                    *ngIf="item.status === 'PICKED_UP'"
                    class="btn btn-info btn-sm"
                    (click)="advanceStatus(item, 'IN_TRANSIT')">
                    <i class="fa-solid fa-truck-fast"></i> Start Transit to Mandi
                  </button>

                  <button
                    *ngIf="item.status === 'IN_TRANSIT'"
                    class="btn btn-success btn-sm complete-btn"
                    (click)="advanceStatus(item, 'DELIVERED')">
                    <i class="fa-solid fa-circle-check"></i> Complete Delivery (Credit ₹{{ item.deliveryFee }} to Wallet)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: COMPLETED DELIVERIES HISTORY -->
        <div *ngIf="activeTab === 'HISTORY'" class="mt-4">
          <div *ngIf="completedDeliveries.length === 0" class="card empty-card">
            <i class="fa-solid fa-clipboard-check empty-icon"></i>
            <h3>No Completed Trips Yet</h3>
            <p>Completed deliveries with wallet payouts will appear here.</p>
          </div>

          <div class="grid grid-cols-2">
            <div *ngFor="let item of completedDeliveries" class="card delivery-card completed-card">
              <div class="del-header">
                <div>
                  <span class="tracking-code"><i class="fa-solid fa-circle-check text-emerald"></i> {{ item.trackingNumber }}</span>
                  <span class="order-ref">Order: #{{ item.orderId }} &bull; {{ item.cropName }}</span>
                </div>
                <div class="payout-credited-badge">
                  <i class="fa-solid fa-wallet"></i> +₹{{ item.deliveryFee }} Credited
                </div>
              </div>

              <div class="meta-row mt-3">
                <span>Farmer: <strong>{{ item.farmerName != null ? item.farmerName : 'null' }}</strong> ({{ item.farmerPhone != null ? item.farmerPhone : 'null' }})</span>
                <span>Dealer: <strong>{{ item.dealerName != null ? item.dealerName : 'null' }}</strong> ({{ item.dealerPhone != null ? item.dealerPhone : 'null' }})</span>
              </div>
              <div class="meta-row mt-2">
                <span>Route: {{ item.pickupAddress != null ? item.pickupAddress : 'null' }} &rarr; {{ item.dropAddress != null ? item.dropAddress : 'null' }}</span>
                <span>Distance: <strong>{{ item.distanceKm }} km</strong></span>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- GENERAL / FARMER / DEALER TRACKING VIEW -->
      <ng-container *ngIf="!isPartner">
        <!-- Farmer Guidance View -->
        <div *ngIf="currentUser?.role === 'FARMER'" class="card p-5 text-center mt-4">
          <div class="empty-icon-wrap mb-3">
            <i class="fa-solid fa-wheat-awn text-emerald" style="font-size: 3rem;"></i>
          </div>
          <h3 class="mb-2">Farmer Harvest & Sales Portal</h3>
          <p class="text-muted" style="max-width: 600px; margin: 0 auto; line-height: 1.6;">
            Logistics, fleet dispatch, and transit tracking are coordinated directly between commercial buyers and delivery fleet partners. As a farmer, you can monitor your crop sale orders, payment escrow releases, and tax invoices in your Orders section.
          </p>
          <div class="mt-4">
            <a routerLink="/orders" class="btn btn-primary">
              <i class="fa-solid fa-file-invoice-dollar"></i> View My Crop Orders & Invoices
            </a>
          </div>
        </div>

        <!-- ADMIN VIEW: Full Platform Logistics & Status of all Delivery Persons -->
        <div *ngIf="currentUser?.role === 'ADMIN'">
          <div class="card p-3 mb-3 bg-emerald-light border-emerald">
            <div class="d-flex align-center justify-between flex-wrap gap-2">
              <div>
                <strong><i class="fa-solid fa-truck-ramp-box text-emerald"></i> Platform Fleet & Delivery Partner Logistics</strong>
                <p class="m-0 text-muted" style="font-size: 0.85rem;">Live status of all upcoming farm pickups, in-transit fleet carriers, and completed deliveries of delivery personnel.</p>
              </div>
              <div class="stats-pills">
                <span class="badge badge-primary">{{ allDeliveries.length }} Total Trips</span>
                <span class="badge badge-success">{{ adminCompletedDeliveries.length }} Completed</span>
              </div>
            </div>
          </div>

          <!-- Admin Delivery Tabs -->
          <div class="tabs-nav mt-3">
            <button class="tab-btn" [class.active]="adminTab === 'ALL'" (click)="adminTab = 'ALL'">
              <i class="fa-solid fa-layer-group"></i> All Deliveries ({{ allDeliveries.length }})
            </button>
            <button class="tab-btn" [class.active]="adminTab === 'UPCOMING'" (click)="adminTab = 'UPCOMING'">
              <i class="fa-regular fa-clock"></i> Upcoming & Scheduled ({{ adminUpcomingDeliveries.length }})
            </button>
            <button class="tab-btn" [class.active]="adminTab === 'ACTIVE'" (click)="adminTab = 'ACTIVE'">
              <i class="fa-solid fa-truck-fast"></i> In-Transit ({{ adminActiveDeliveries.length }})
            </button>
            <button class="tab-btn" [class.active]="adminTab === 'COMPLETED'" (click)="adminTab = 'COMPLETED'">
              <i class="fa-solid fa-circle-check"></i> Completed Deliveries ({{ adminCompletedDeliveries.length }})
            </button>
          </div>

          <!-- Admin Deliveries Grid -->
          <div class="grid grid-cols-2 mt-4" *ngIf="adminDeliveries.length > 0">
            <div *ngFor="let item of adminDeliveries" class="card delivery-card" [class.completed-card]="item.status === 'DELIVERED'">
              <div class="del-header">
                <div>
                  <span class="tracking-code"><i class="fa-solid fa-barcode"></i> {{ item.trackingNumber }}</span>
                  <span class="order-ref">Order: #{{ item.orderId }} &bull; {{ item.cropName || 'Harvest Commodity' }}</span>
                </div>
                <div class="badges-row">
                  <span class="badge badge-primary"><i class="fa-solid fa-id-card"></i> Driver: {{ item.partnerName || 'Assigned Driver' }}</span>
                  <span class="badge" [ngClass]="getBadgeClass(item.status)">{{ item.status }}</span>
                </div>
              </div>

              <!-- Progress Stepper -->
              <div class="stepper mt-4">
                <div class="step" [class.completed]="isStepCompleted(item.status, 1)">
                  <div class="step-circle"><i class="fa-solid fa-check"></i></div>
                  <span class="step-lbl">Scheduled</span>
                </div>
                <div class="step-line" [class.completed]="isStepCompleted(item.status, 2)"></div>
                <div class="step" [class.completed]="isStepCompleted(item.status, 2)">
                  <div class="step-circle"><i class="fa-solid fa-truck-pickup"></i></div>
                  <span class="step-lbl">Picked Up</span>
                </div>
                <div class="step-line" [class.completed]="isStepCompleted(item.status, 3)"></div>
                <div class="step" [class.completed]="isStepCompleted(item.status, 3)">
                  <div class="step-circle"><i class="fa-solid fa-road"></i></div>
                  <span class="step-lbl">In Transit</span>
                </div>
                <div class="step-line" [class.completed]="isStepCompleted(item.status, 4)"></div>
                <div class="step" [class.completed]="isStepCompleted(item.status, 4)">
                  <div class="step-circle"><i class="fa-solid fa-warehouse"></i></div>
                  <span class="step-lbl">Delivered</span>
                </div>
              </div>

              <!-- Route Info -->
              <div class="route-box mt-4">
                <div class="route-point">
                  <i class="fa-solid fa-circle-dot text-emerald"></i>
                  <div>
                    <span class="point-lbl">Farm-Gate Pickup ({{ item.farmerName != null ? item.farmerName : 'null' }})</span>
                    <p>{{ item.pickupAddress != null ? item.pickupAddress : 'null' }}</p>
                    <span class="subtext"><i class="fa-solid fa-phone"></i> {{ item.farmerPhone != null ? item.farmerPhone : 'null' }}</span>
                  </div>
                </div>
                <div class="route-line-v"></div>
                <div class="route-point">
                  <i class="fa-solid fa-location-dot text-danger"></i>
                  <div>
                    <span class="point-lbl">Delivery Destination ({{ item.dealerName != null ? item.dealerName : 'null' }})</span>
                    <p>{{ item.dropAddress != null ? item.dropAddress : 'null' }}</p>
                    <span class="subtext"><i class="fa-solid fa-phone"></i> {{ item.dealerPhone != null ? item.dealerPhone : 'null' }}</span>
                  </div>
                </div>
              </div>

              <div class="partner-meta mt-3">
                <span>
                  <i class="fa-solid fa-truck-moving"></i> Logistics Partner:
                  <strong>{{ item.partnerName || 'Kisan Express Agro Logistics' }}</strong>
                </span>
                <span class="fee-pill">Fee: ₹{{ item.deliveryFee }} ({{ item.distanceKm }} km)</span>
              </div>
            </div>
          </div>

          <div *ngIf="adminDeliveries.length === 0" class="card empty-card mt-4">
            <i class="fa-solid fa-truck-ramp-box empty-icon"></i>
            <h3>No Deliveries in this Status</h3>
            <p>No platform shipments currently match "{{ adminTab }}".</p>
          </div>
        </div>

        <!-- Dealer Orders Delivery Tracking -->
        <div *ngIf="currentUser?.role === 'DEALER'">
          <div class="card p-3 mb-3 bg-emerald-light border-emerald">
            <div class="d-flex align-center justify-between flex-wrap gap-2">
              <div>
                <strong><i class="fa-solid fa-warehouse text-emerald"></i> Commercial Dealer Order Shipments</strong>
                <p class="m-0 text-muted" style="font-size: 0.85rem;">Displaying real-time delivery and transit data for orders placed by your dealership.</p>
              </div>
              <span class="badge badge-success">{{ dealerDeliveries.length }} Active Shipments</span>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="dealerDeliveries.length === 0" class="card empty-card mt-4">
            <i class="fa-solid fa-truck-ramp-box empty-icon"></i>
            <h3>No Active Delivery Partner Shipments</h3>
            <p>You currently have no orders scheduled for Delivery Partner dispatch. Only orders where you selected Delivery Partner fulfillment appear in this tracking view.</p>
            <div class="mt-3">
              <a routerLink="/crops" class="btn btn-primary">
                <i class="fa-solid fa-store"></i> Browse Crops & Buy
              </a>
            </div>
          </div>

          <div class="grid grid-cols-2 mt-4" *ngIf="dealerDeliveries.length > 0">
            <div *ngFor="let item of dealerDeliveries" class="card delivery-card">
              <div class="del-header">
                <div>
                  <span class="tracking-code"><i class="fa-solid fa-barcode"></i> {{ item.trackingNumber }}</span>
                  <span class="order-ref">Order: #{{ item.orderId }} &bull; {{ item.cropName || 'Harvest Commodity' }}</span>
                </div>
                <div class="badges-row">
                  <span class="badge" [ngClass]="item.fulfillmentType === 'SELF_PICKUP' ? 'badge-success' : 'badge-primary'">
                    {{ item.fulfillmentType === 'SELF_PICKUP' ? 'Self Pickup (₹0)' : 'Delivery Partner (₹' + item.deliveryFee + ')' }}
                  </span>
                  <span class="badge" [ngClass]="getBadgeClass(item.status)">{{ item.status }}</span>
                </div>
              </div>

            <!-- Progress Stepper -->
            <div class="stepper mt-4">
              <div class="step" [class.completed]="isStepCompleted(item.status, 1)">
                <div class="step-circle"><i class="fa-solid fa-check"></i></div>
                <span class="step-lbl">Assigned</span>
              </div>
              <div class="step-line" [class.completed]="isStepCompleted(item.status, 2)"></div>
              <div class="step" [class.completed]="isStepCompleted(item.status, 2)">
                <div class="step-circle"><i class="fa-solid fa-truck-pickup"></i></div>
                <span class="step-lbl">Picked Up</span>
              </div>
              <div class="step-line" [class.completed]="isStepCompleted(item.status, 3)"></div>
              <div class="step" [class.completed]="isStepCompleted(item.status, 3)">
                <div class="step-circle"><i class="fa-solid fa-road"></i></div>
                <span class="step-lbl">In Transit</span>
              </div>
              <div class="step-line" [class.completed]="isStepCompleted(item.status, 4)"></div>
              <div class="step" [class.completed]="isStepCompleted(item.status, 4)">
                <div class="step-circle"><i class="fa-solid fa-warehouse"></i></div>
                <span class="step-lbl">Delivered</span>
              </div>
            </div>

            <!-- Route Info -->
            <div class="route-box mt-4">
              <div class="route-point">
                <i class="fa-solid fa-circle-dot text-emerald"></i>
                <div>
                  <span class="point-lbl">Farm / Mandi Pickup ({{ item.farmerName != null ? item.farmerName : 'null' }})</span>
                  <p>{{ item.pickupAddress != null ? item.pickupAddress : 'null' }}</p>
                  <span class="subtext"><i class="fa-solid fa-phone"></i> {{ item.farmerPhone != null ? item.farmerPhone : 'null' }}</span>
                </div>
              </div>
              <div class="route-line-v"></div>
              <div class="route-point">
                <i class="fa-solid fa-location-dot text-danger"></i>
                <div>
                  <span class="point-lbl">Commercial Delivery Mandi ({{ item.dealerName != null ? item.dealerName : 'null' }})</span>
                  <p>{{ item.dropAddress != null ? item.dropAddress : 'null' }}</p>
                  <span class="subtext"><i class="fa-solid fa-phone"></i> {{ item.dealerPhone != null ? item.dealerPhone : 'null' }}</span>
                </div>
              </div>
            </div>

            <div class="partner-meta mt-3">
              <span>
                <i class="fa-solid fa-user-shield"></i> Carrier:
                <strong>{{ item.partnerName || 'Kisan Express Agro Logistics' }}</strong>
              </span>
              <span><i class="fa-solid fa-clock"></i> Updated: {{ item.updatedAt | date:'shortTime' }}</span>
            </div>
          </div>
        </div>
      </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .deliveries-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.5rem; font-weight: 800; }
    .text-emerald { color: var(--primary-600); }
    .text-danger { color: var(--danger); }
    .text-info { color: #0284c7; }
    .text-amber { color: var(--accent-amber); }
    .page-subtitle { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem; }
    .header-badges { display: flex; gap: 0.5rem; align-items: center; }
    .stat-card {
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .earnings-card {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
    }
    .stat-top {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .stat-val { font-size: 1.85rem; font-weight: 800; margin: 0.35rem 0; text-align: center; }
    .stat-sub { font-size: 0.725rem; color: var(--text-subtle); text-align: center; }
    .stat-link { font-size: 0.725rem; font-weight: 700; color: var(--primary-700); text-decoration: none; text-align: center; }
    .stat-link:hover { text-decoration: underline; }
    .tabs-nav {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    .tab-btn {
      padding: 0.6rem 1.25rem;
      background: none;
      border: none;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all var(--transition-fast);
    }
    .tab-btn:hover {
      background: var(--bg-subtle);
      color: var(--primary-700);
    }
    .tab-btn.active {
      background: var(--primary-600);
      color: white;
      box-shadow: 0 4px 12px rgba(46, 125, 50, 0.25);
    }
    .order-claim-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      border-left: 4px solid var(--accent-amber);
    }
    .claim-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .tracking-tag {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      display: block;
    }
    .crop-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0.2rem 0;
    }
    .payout-badge {
      background: #f0fdf4;
      border: 1px solid #86efac;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      text-align: right;
    }
    .payout-lbl { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: #166534; display: block; }
    .payout-amount { font-size: 1.35rem; font-weight: 800; margin: 0; }
    .payout-badge small { font-size: 0.7rem; color: #15803d; }
    .route-details-box {
      background: var(--bg-subtle);
      border-radius: var(--radius-md);
      padding: 1rem;
      position: relative;
    }
    .route-party {
      display: flex;
      gap: 0.85rem;
      align-items: flex-start;
    }
    .party-icon {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      flex-shrink: 0;
    }
    .farmer-icon { background: #dcfce7; color: #166534; }
    .dealer-icon { background: #e0f2fe; color: #0369a1; }
    .party-text { font-size: 0.8rem; flex: 1; }
    .party-role {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      color: var(--text-subtle);
      display: block;
    }
    .phone-link {
      font-size: 0.75rem;
      color: var(--primary-700);
      font-weight: 700;
      margin-left: 0.5rem;
      text-decoration: none;
    }
    .phone-link:hover { text-decoration: underline; }
    .address-text { font-size: 0.775rem; color: var(--text-muted); margin: 0.2rem 0 0; line-height: 1.35; }
    .route-line-v { width: 2px; height: 18px; background: var(--border-color); margin: 0.35rem 0 0.35rem 1rem; }
    .claim-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-light);
      padding-top: 1rem;
    }
    .meta-sub { font-size: 0.8rem; color: var(--text-muted); }
    .active-delivery-card {
      border-left: 4px solid var(--primary-600);
    }
    .status-action-bar {
      background: #f0fdf4;
      border: 1px dashed #86efac;
      padding: 0.85rem 1rem;
      border-radius: var(--radius-md);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .action-hint { font-size: 0.775rem; font-weight: 700; color: #166534; }
    .complete-btn {
      background: linear-gradient(135deg, #16a34a, #15803d);
      font-weight: 800;
    }
    .completed-card {
      border-left: 4px solid #16a34a;
      opacity: 0.95;
    }
    .payout-credited-badge {
      background: #dcfce7;
      color: #166534;
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 800;
    }
    .meta-row { display: flex; justify-content: space-between; font-size: 0.775rem; color: var(--text-muted); }
    .empty-card {
      text-align: center;
      padding: 3rem 2rem;
      color: var(--text-muted);
    }
    .empty-icon { font-size: 3rem; color: var(--text-subtle); margin-bottom: 1rem; }
    .fee-pill {
      background: #fef3c7;
      color: #92400e;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-sm);
    }
    .del-status-group { display: flex; align-items: center; gap: 0.5rem; }
    .toast-alert {
      background: #166534;
      color: white;
      padding: 0.85rem 1.25rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      font-size: 0.875rem;
    }
    .badges-row { display: flex; gap: 0.35rem; }
    .delivery-card { padding: 1.5rem; display: flex; flex-direction: column; }
    .del-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .tracking-code { font-size: 0.95rem; font-weight: 800; color: var(--text-main); display: block; }
    .order-ref { font-size: 0.75rem; color: var(--text-muted); }
    .stepper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }
    .step { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; z-index: 2; }
    .step-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--bg-subtle);
      border: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      color: var(--text-subtle);
      transition: all var(--transition-fast);
    }
    .step.completed .step-circle {
      background: var(--primary-600);
      border-color: var(--primary-600);
      color: white;
    }
    .step-lbl { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); }
    .step.completed .step-lbl { color: var(--primary-800); }
    .step-line {
      flex: 1;
      height: 2px;
      background: var(--border-color);
      margin: 0 0.25rem 1rem;
    }
    .step-line.completed { background: var(--primary-500); }
    .route-box {
      background: var(--bg-subtle);
      border-radius: var(--radius-md);
      padding: 1rem;
      position: relative;
    }
    .route-point { display: flex; gap: 0.75rem; align-items: flex-start; }
    .point-lbl { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; color: var(--text-subtle); display: block; }
    .route-point p { font-size: 0.8rem; font-weight: 600; color: var(--text-main); margin: 0.15rem 0 0; }
    .partner-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border-light);
      padding-top: 0.75rem;
    }
    .subtext { font-size: 0.725rem; color: var(--text-muted); }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }
    @media (max-width: 900px) {
      .grid-cols-4 { grid-template-columns: 1fr 1fr; }
      .grid-cols-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class DeliveriesComponent implements OnInit {
  currentUser: User | null = null;
  allDeliveries: Delivery[] = [];
  activeTab: 'POOL' | 'ACTIVE' | 'HISTORY' = 'POOL';
  adminTab: 'ALL' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' = 'ALL';
  walletBalance = 0;
  alertMessage = '';

  constructor(
    private deliveryService: DeliveryService,
    private walletService: WalletService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((u: User | null) => {
      this.currentUser = u;
      const uid = u?.id || u?.userId || 'delivery_partner-1';
      this.walletBalance = this.walletService.getStoredBalance(uid);
      this.loadDeliveries();
    });
  }

  loadDeliveries(): void {
    this.deliveryService.deliveries$.subscribe((list: Delivery[]) => {
      this.allDeliveries = list;
    });
  }

  get isPartner(): boolean {
    return this.currentUser?.role === 'DELIVERY_PARTNER';
  }

  get poolDeliveries(): Delivery[] {
    return this.allDeliveries.filter(d => d.status === 'PENDING_ASSIGNMENT' && d.fulfillmentType !== 'SELF_PICKUP');
  }

  get myActiveDeliveries(): Delivery[] {
    const partnerId = this.currentUser?.id || this.currentUser?.userId || 'delivery_partner-1';
    return this.allDeliveries.filter(d =>
      d.status !== 'PENDING_ASSIGNMENT' &&
      d.status !== 'DELIVERED' &&
      (d.partnerId === partnerId || !d.partnerId)
    );
  }

  get completedDeliveries(): Delivery[] {
    return this.allDeliveries.filter(d => d.status === 'DELIVERED');
  }

  get dealerDeliveries(): Delivery[] {
    const currentId = this.currentUser?.id || this.currentUser?.userId;
    const dealerName = (this.currentUser?.fullName || this.currentUser?.username || '').trim().toLowerCase();
    const dealerPhone = (this.currentUser?.phone || '').trim();

    return this.allDeliveries.filter(d => {
      // Must be delivery pickup (not self pickup)
      const isDeliveryPickup = d.fulfillmentType !== 'SELF_PICKUP';

      // Must belong to this dealer
      const isMyOrder = Boolean(
        (currentId && d.dealerId && d.dealerId === currentId) ||
        (dealerName && d.dealerName && (d.dealerName.toLowerCase().includes(dealerName) || dealerName.includes(d.dealerName.toLowerCase()))) ||
        (dealerPhone && d.dealerPhone && d.dealerPhone.includes(dealerPhone))
      );

      return isDeliveryPickup && isMyOrder;
    });
  }

  get adminDeliveries(): Delivery[] {
    if (this.adminTab === 'UPCOMING') return this.adminUpcomingDeliveries;
    if (this.adminTab === 'ACTIVE') return this.adminActiveDeliveries;
    if (this.adminTab === 'COMPLETED') return this.adminCompletedDeliveries;
    return this.allDeliveries;
  }

  get adminUpcomingDeliveries(): Delivery[] {
    return this.allDeliveries.filter(d => d.status === 'PENDING_ASSIGNMENT' || d.status === 'ASSIGNED');
  }

  get adminActiveDeliveries(): Delivery[] {
    return this.allDeliveries.filter(d => d.status === 'PICKED_UP' || d.status === 'IN_TRANSIT');
  }

  get adminCompletedDeliveries(): Delivery[] {
    return this.allDeliveries.filter(d => d.status === 'DELIVERED');
  }

  takeOrder(item: Delivery): void {
    const partnerId = this.currentUser?.id || this.currentUser?.userId || 'delivery_partner-1';
    const partnerName = this.currentUser?.fullName || 'Kisan Express Agro Logistics';

    this.deliveryService.claimDelivery(item.id, partnerId, partnerName).subscribe(() => {
      this.activeTab = 'ACTIVE';
      this.showAlert(`Order #${item.orderId} accepted! Assigned to your trip. Ready for pickup at ${item.pickupAddress}.`);
      this.orderService.updateOrderStatus(item.orderId, 'ASSIGNED').subscribe();

      // Notify dealer
      const dealerId = item.dealerId || 'dealer-1';
      this.notificationService.sendNotification(
        dealerId,
        '🚚 Carrier Assigned',
        `Logistics carrier ${partnerName} has accepted pickup for order #${item.orderId} (${item.cropName}).`,
        'DELIVERY'
      );
    });
  }

  advanceStatus(item: Delivery, nextStatus: 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED'): void {
    this.deliveryService.updateDeliveryStatus(item.id, nextStatus).subscribe(() => {
      const dealerId = item.dealerId || 'dealer-1';

      if (nextStatus === 'DELIVERED') {
        const partnerId = this.currentUser?.id || this.currentUser?.userId || 'delivery_partner-1';
        const fee = item.deliveryFee || (item.distanceKm ? item.distanceKm * 10 : 250);

        // Credit fee to delivery partner's wallet
        this.walletService.creditWallet(
          partnerId,
          fee,
          `Delivery Payout for ${item.cropName} (Order #${item.orderId})`
        ).subscribe(() => {
          this.walletBalance = this.walletService.getStoredBalance(partnerId);
          this.showAlert(`🎉 Delivery Completed! Payout of ₹${fee} has been credited to your Digital Wallet.`);
        });

        // Update corresponding order status to DELIVERED so receipt download is unlocked
        this.orderService.updateOrderStatus(item.orderId, 'DELIVERED').subscribe();

        // Send real-time notifications to dealer
        this.notificationService.sendNotification(
          dealerId,
          '✅ Order Delivered Successfully',
          `Your order #${item.orderId} (${item.cropName}) has been delivered! Official GST tax invoice receipt is ready for download in Orders.`,
          'DELIVERY'
        );
      } else if (nextStatus === 'PICKED_UP') {
        this.showAlert(`Order #${item.orderId} marked as PICKED UP from farmer.`);
        this.orderService.updateOrderStatus(item.orderId, 'PICKED_UP').subscribe();

        this.notificationService.sendNotification(
          dealerId,
          '🚚 Produce Picked Up from Farm Gate',
          `Your order #${item.orderId} (${item.cropName}) has been picked up from farmer ${item.farmerName != null ? item.farmerName : 'null'}.`,
          'DELIVERY'
        );
      } else if (nextStatus === 'IN_TRANSIT') {
        this.showAlert(`Order #${item.orderId} is now IN TRANSIT to commercial warehouse.`);
        this.orderService.updateOrderStatus(item.orderId, 'IN_TRANSIT').subscribe();

        this.notificationService.sendNotification(
          dealerId,
          '🚚 Shipment In Transit',
          `Your order #${item.orderId} (${item.cropName}) is on the road heading to your warehouse drop location.`,
          'DELIVERY'
        );
      }
    });
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'DELIVERED': return 'badge-success';
      case 'IN_TRANSIT': return 'badge-info';
      case 'PICKED_UP': return 'badge-warning';
      case 'ASSIGNED': return 'badge-primary';
      default: return 'badge-primary';
    }
  }

  isStepCompleted(status: string, stepIndex: number): boolean {
    const order = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
    const currentIndex = order.indexOf(status) + 1;
    return currentIndex >= stepIndex;
  }

  private showAlert(msg: string): void {
    this.alertMessage = msg;
    setTimeout(() => this.alertMessage = '', 6000);
  }
}
