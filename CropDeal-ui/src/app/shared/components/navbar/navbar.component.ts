import { Component, OnInit, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CurrentUser, NotificationResponse, WalletResponse } from '../../../core/models/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  currentUser: CurrentUser | null = null;
  wallet: WalletResponse | null = null;
  notifications: NotificationResponse[] = [];

  // Cached computed values — NOT getters that recompute every cycle
  unreadNotifCount = 0;
  dashboardRoute = '/catalog';

  // Dropdown states
  isMarketDropdownOpen = false;
  isRoleDropdownOpen = false;
  isUserDropdownOpen = false;
  isNotifDropdownOpen = false;
  isTopUpModalOpen = false;

  topUpAmount: number = 5000;
  topUpMethod: string = 'UPI';

  constructor(
    public authService: AuthService,
    private paymentService: PaymentService,
    private notifService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.dashboardRoute = this.getDashboardRoute(user?.role);
      if (user) {
        this.loadWallet(user.userId);
        // Init per-user notifications (loads from localStorage + backend)
        this.notifService.initForUser(user.userId, user.email);
      } else {
        this.notifService.clearForUser();
        this.notifications = [];
        this.unreadNotifCount = 0;
      }
      this.cdr.markForCheck();
    });

    // Subscribe to live notification stream
    this.notifService.notifications$.subscribe(notifs => {
      this.notifications = notifs;
      this.unreadNotifCount = notifs.filter(n => !n.read).length;
      this.cdr.markForCheck();
    });

    // Subscribe to wallet changes across the app
    this.paymentService.walletUpdated$.subscribe(userId => {
      if (this.currentUser && this.currentUser.userId === userId) {
        this.loadWallet(userId);
      }
    });
  }

  private getDashboardRoute(role?: string): string {
    switch (role) {
      case 'FARMER':           return '/farmer/dashboard';
      case 'DEALER':           return '/dealer/dashboard';
      case 'DELIVERY_PARTNER': return '/delivery/dashboard';
      case 'ADMIN':            return '/admin/dashboard';
      default:                 return '/catalog';
    }
  }

  loadWallet(userId: number): void {
    this.paymentService.getWallet(userId).subscribe(w => {
      this.wallet = w;
      this.cdr.markForCheck();
    });
  }

  markAllRead(): void {
    this.notifService.markAllAsRead();
  }

  deleteNotif(id: number, event: Event): void {
    event.stopPropagation();
    this.notifService.deleteNotification(id);
  }

  markNotifRead(id: number): void {
    this.notifService.markAsRead(id);
  }

  clearAllNotifs(): void {
    this.notifService.clearAllNotifications();
  }

  switchRole(role: 'FARMER' | 'DEALER' | 'DELIVERY_PARTNER' | 'ADMIN'): void {
    this.authService.switchRoleForDemo(role);
    this.isRoleDropdownOpen = false;
    this.notifService.showToast('info', `Switched demo role to ${role}`);
    switch (role) {
      case 'FARMER':           this.router.navigate(['/farmer/dashboard']);   break;
      case 'DEALER':           this.router.navigate(['/dealer/dashboard']);   break;
      case 'DELIVERY_PARTNER': this.router.navigate(['/delivery/dashboard']); break;
      case 'ADMIN':            this.router.navigate(['/admin/dashboard']);     break;
    }
  }

  submitTopUp(): void {
    if (!this.currentUser || this.topUpAmount <= 0) return;
    this.paymentService.topUpWallet({
      userId: this.currentUser.userId,
      amount: Number(this.topUpAmount),
      paymentMethod: this.topUpMethod
    }).subscribe(w => {
      this.wallet = w;
      this.isTopUpModalOpen = false;
      this.cdr.markForCheck();
      this.notifService.showToast('success', `₹${this.topUpAmount} added to wallet successfully!`);
    });
  }

  navigateToWallet(): void {
    this.router.navigate(['/wallet']);
  }

  openTopUp(event: Event): void {
    event.stopPropagation();
    this.isTopUpModalOpen = true;
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
      this.notifService.showToast('info', 'Logged out successfully');
    });
  }

  closeAllDropdowns(): void {
    this.isMarketDropdownOpen = false;
    this.isRoleDropdownOpen = false;
    this.isUserDropdownOpen = false;
    this.isNotifDropdownOpen = false;
  }
}
