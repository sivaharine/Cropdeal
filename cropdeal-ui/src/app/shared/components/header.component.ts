import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { NotificationService } from '../../core/services/notification.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AppNotification } from '../../core/models/notification.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <div class="header-left">
        <!-- Brand Logo Header -->
        <a routerLink="/" class="hdr-brand">
          <span class="brand-leaf">🌱</span>
          <span class="brand-title">Crop<span class="brand-accent">Deal</span></span>
        </a>
      </div>

      <!-- Center Links: Top 3 sections common for all users, plus Dashboard for authenticated users -->
      <div class="header-center-links">
        <a routerLink="/" class="hdr-nav-link" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
          <i class="fa-solid fa-house"></i> Home
        </a>
        <a routerLink="/price-alerts" class="hdr-nav-link" routerLinkActive="active">
          <i class="fa-solid fa-chart-line"></i> Mandhi Price
        </a>
        <a routerLink="/bidding" class="hdr-nav-link" routerLinkActive="active">
          <i class="fa-solid fa-gavel"></i> Live Bidding
        </a>
        <button
          *ngIf="currentUser"
          type="button"
          (click)="onDashboardClick()"
          class="hdr-nav-link hdr-dashboard-btn"
          [class.active]="isDashboardActive()">
          <i class="fa-solid fa-gauge-high"></i> Dashboard
        </button>
      </div>

      <div class="header-right">
        <!-- In-app Notification Bell -->
        <div class="notification-wrapper" *ngIf="currentUser">
          <button class="icon-btn" (click)="toggleNotifications()" title="In-App Notifications">
            <i class="fa-regular fa-bell"></i>
            <span *ngIf="(unreadCount$ | async) as count" class="notification-badge">{{ count }}</span>
          </button>

          <!-- Notification Dropdown -->
          <div *ngIf="showNotifications" class="notification-dropdown shadow-lg">
            <div class="dropdown-header">
              <div>
                <span class="dropdown-title">In-App Notifications</span>
                <span class="badge badge-primary ms-2">{{ (unreadCount$ | async) || 0 }} new</span>
              </div>
              <div class="notif-header-actions">
                <button
                  type="button"
                  class="notif-action-btn"
                  (click)="markAllAsRead()"
                  title="Mark all notifications as read">
                  <i class="fa-solid fa-check-double"></i> Mark Read
                </button>
                <button
                  type="button"
                  class="notif-action-btn text-danger"
                  (click)="clearAllNotifications()"
                  title="Clear all notifications permanently">
                  <i class="fa-solid fa-trash-can"></i> Clear All
                </button>
              </div>
            </div>
            <div class="dropdown-list">
              <div *ngIf="(notifications$ | async)?.length === 0" class="empty-state">
                <i class="fa-solid fa-bell-slash"></i>
                <p>No new notifications</p>
              </div>
              <div *ngFor="let notif of (notifications$ | async)"
                   class="dropdown-item"
                   [class.unread]="!notif.isRead"
                   (click)="markAsRead(notif.id)">
                <div class="notif-icon" [ngClass]="notif.type.toLowerCase()">
                  <i class="fa-solid" [ngClass]="getNotifIcon(notif.type)"></i>
                </div>
                <div class="notif-info">
                  <p class="notif-title">{{ notif.title }}</p>
                  <p class="notif-desc">{{ notif.message }}</p>
                  <span class="notif-time">{{ notif.createdAt | date:'shortTime' }}</span>
                </div>
                <!-- Individual permanent delete button -->
                <button
                  type="button"
                  class="btn-trash-notif"
                  (click)="$event.stopPropagation(); deleteNotification(notif.id)"
                  title="Delete permanently">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- User Profile Dropdown (Strictly Profile and Logout) -->
        <div class="user-profile-menu" *ngIf="currentUser" (click)="toggleUserMenu()">
          <div class="avatar-wrap">
            <img [src]="currentUser.avatar || '/assets/images/farmer-avatar.jpg'" alt="User" class="avatar-img" (error)="onAvatarError($event)" />
          </div>
          <div class="user-details">
            <span class="username">{{ currentUser.fullName || currentUser.username }}</span>
            <span class="user-role">{{ currentUser.role }}</span>
          </div>
          <i class="fa-solid fa-angle-down menu-chevron"></i>

          <!-- User Dropdown Menu: STRICTLY Profile and Logout only as requested -->
          <div class="user-dropdown shadow-lg" *ngIf="showUserMenu">
            <a routerLink="/profile" class="dropdown-entry">
              <i class="fa-regular fa-user"></i> Profile
            </a>
            <a href="javascript:void(0)" class="dropdown-entry text-danger" (click)="logout()">
              <i class="fa-solid fa-arrow-right-from-bracket"></i> Logout
            </a>
          </div>
        </div>

        <!-- Unauthenticated Guest Sign In Button -->
        <div class="user-profile" *ngIf="!currentUser">
          <button class="btn-guest-login" (click)="openAuthModal()">
            <i class="fa-regular fa-user"></i> Login
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      height: 70px;
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      width: 100%;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-shrink: 0;
    }
    .hdr-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .brand-leaf {
      font-size: 1.45rem;
    }
    .brand-accent {
      color: #15803d;
    }

    /* Center Nav Links */
    .header-center-links {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .hdr-nav-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.88rem;
      font-weight: 600;
      color: #475569;
      text-decoration: none;
      padding: 0.45rem 0.85rem;
      border-radius: 0.45rem;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .hdr-nav-link:hover {
      color: #15803d;
      background: #f0fdf4;
    }
    .hdr-nav-link.active {
      color: #15803d;
      font-weight: 700;
      background: #dcfce7;
    }
    .hdr-dashboard-btn {
      background: #f0fdf4;
      color: #15803d !important;
      border: 1.5px solid #86efac;
      font-weight: 700 !important;
    }
    .hdr-dashboard-btn:hover, .hdr-dashboard-btn.active {
      background: #15803d !important;
      color: white !important;
      border-color: #15803d !important;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .notification-wrapper {
      position: relative;
    }
    .icon-btn {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: var(--bg-subtle, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      color: var(--text-muted, #64748b);
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
    }
    .icon-btn:hover {
      background: #f0fdf4;
      color: #15803d;
      border-color: #86efac;
    }
    .notification-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: #ef4444;
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #fff;
    }

    .notification-dropdown {
      position: absolute;
      top: 50px;
      right: 0;
      width: 360px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      z-index: 1100;
      overflow: hidden;
      animation: fadeInDown 0.2s ease-out;
    }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .dropdown-header {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
    }
    .dropdown-title {
      font-weight: 700;
      font-size: 0.875rem;
      color: #0f172a;
    }
    .badge-primary {
      background: #dcfce7;
      color: #15803d;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .notif-header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .notif-action-btn {
      background: none;
      border: none;
      font-size: 0.75rem;
      color: #64748b;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
      transition: background 0.15s;
    }
    .notif-action-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .notif-action-btn.text-danger:hover {
      background: #fee2e2;
      color: #b91c1c;
    }

    .dropdown-list {
      max-height: 380px;
      overflow-y: auto;
    }
    .empty-state {
      padding: 2.5rem 1rem;
      text-align: center;
      color: #94a3b8;
    }
    .empty-state i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    .empty-state p {
      margin: 0;
      font-size: 0.85rem;
    }
    .dropdown-item {
      padding: 0.85rem 1rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      border-bottom: 1px solid #f8fafc;
      cursor: pointer;
      transition: background 0.15s;
      position: relative;
    }
    .dropdown-item:hover {
      background: #f8fafc;
    }
    .dropdown-item.unread {
      background: #f0fdf4;
    }
    .notif-icon {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      flex-shrink: 0;
    }
    .notif-icon.order { background: #dbeafe; color: #1d4ed8; }
    .notif-icon.price_alert { background: #fef3c7; color: #b45309; }
    .notif-icon.negotiation { background: #f3e8ff; color: #7e22ce; }
    .notif-icon.bid { background: #dcfce7; color: #15803d; }
    .notif-icon.wallet { background: #ccfbf1; color: #0f766e; }
    .notif-icon.system { background: #f1f5f9; color: #475569; }

    .notif-info {
      flex: 1;
      min-width: 0;
    }
    .notif-title {
      font-size: 0.825rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.15rem;
    }
    .notif-desc {
      font-size: 0.775rem;
      color: #475569;
      margin: 0 0 0.25rem;
      line-height: 1.35;
      word-break: break-word;
    }
    .notif-time {
      font-size: 0.7rem;
      color: #94a3b8;
    }
    .btn-trash-notif {
      background: none;
      border: none;
      color: #94a3b8;
      padding: 0.35rem 0.45rem;
      border-radius: 0.35rem;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.15s;
      flex-shrink: 0;
    }
    .btn-trash-notif:hover {
      color: #ef4444;
      background: #fee2e2;
    }

    /* User Profile Menu */
    .user-profile-menu {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      cursor: pointer;
      position: relative;
      padding: 0.35rem 0.65rem;
      border-radius: 0.5rem;
      transition: background 0.15s;
    }
    .user-profile-menu:hover {
      background: #f8fafc;
    }
    .avatar-wrap {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid #86efac;
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .user-details {
      display: flex;
      flex-direction: column;
      text-align: left;
    }
    .username {
      font-size: 0.85rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }
    .user-role {
      font-size: 0.7rem;
      font-weight: 600;
      color: #15803d;
      text-transform: capitalize;
    }
    .menu-chevron {
      font-size: 0.75rem;
      color: #64748b;
    }

    .user-dropdown {
      position: absolute;
      top: 52px;
      right: 0;
      width: 180px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      z-index: 1100;
      overflow: hidden;
      animation: fadeInDown 0.15s ease-out;
    }
    .dropdown-entry {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      text-decoration: none;
      transition: background 0.15s;
      cursor: pointer;
    }
    .dropdown-entry:hover {
      background: #f1f5f9;
      color: #15803d;
    }
    .dropdown-entry.text-danger {
      color: #dc2626;
      border-top: 1px solid #f1f5f9;
    }
    .dropdown-entry.text-danger:hover {
      background: #fee2e2;
      color: #b91c1c;
    }

    .btn-guest-login {
      background: transparent;
      border: 1.5px solid #15803d;
      color: #15803d;
      font-weight: 700;
      padding: 0.45rem 1.15rem;
      border-radius: 0.5rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      transition: all 0.2s;
    }
    .btn-guest-login:hover {
      background: #15803d;
      color: white;
    }

    @media (max-width: 900px) {
      .header-center-links { display: none; }
    }
    @media (max-width: 768px) {
      .header { padding: 0 1rem; }
      .mobile-toggle { display: block; }
      .user-details { display: none; }
    }
  `]
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;
  showNotifications = false;
  showUserMenu = false;
  unreadCount$ = this.notificationService.unreadCount$;
  notifications$ = this.notificationService.notifications$;

  constructor(
    private authService: AuthService,
    private authModalService: AuthModalService,
    private notificationService: NotificationService,
    private sidebarService: SidebarService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
      if (user && (user.id || user.userId || user.role)) {
        const uid = user.id || user.userId || user.role;
        this.notificationService.getUserNotifications(uid).subscribe();
      } else {
        this.notificationService.clearStream();
      }
    });
  }

  openAuthModal(): void {
    this.authModalService.open();
  }

  onDashboardClick(): void {
    this.sidebarService.open();
    this.router.navigate(['/dashboard']);
  }

  isDashboardActive(): boolean {
    return this.router.url.startsWith('/dashboard');
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  markAsRead(id: string): void {
    const uid = this.currentUser?.id || this.currentUser?.userId;
    this.notificationService.markAsRead(id, uid).subscribe();
  }

  markAllAsRead(): void {
    const uid = this.currentUser?.id || this.currentUser?.userId;
    this.notificationService.markAllAsRead(uid);
  }

  deleteNotification(id: string): void {
    const uid = this.currentUser?.id || this.currentUser?.userId;
    this.notificationService.deleteNotification(id, uid).subscribe();
  }

  clearAllNotifications(): void {
    const uid = this.currentUser?.id || this.currentUser?.userId;
    this.notificationService.clearAllNotifications(uid);
  }

  logout(): void {
    this.notificationService.clearStream();
    this.authService.logout();
    this.sidebarService.close();
    this.router.navigate(['/']);
  }

  onAvatarError(event: any): void {
    event.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.currentUser?.fullName || this.currentUser?.username || 'User') + '&background=16a34a&color=fff';
  }

  getNotifIcon(type: string): string {
    switch (type) {
      case 'ORDER': return 'fa-box';
      case 'PRICE_ALERT': return 'fa-chart-line';
      case 'NEGOTIATION': return 'fa-handshake';
      case 'BID': return 'fa-gavel';
      case 'WALLET': return 'fa-wallet';
      default: return 'fa-bell';
    }
  }
}
