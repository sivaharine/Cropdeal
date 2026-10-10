import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AlertService } from '../../core/services/alert.service';
import { UserRole } from '../../core/models/user.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  queryParams?: Record<string, any>;
  roles?: UserRole[];
  badge?: string;
  badgeClass?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.minimized]="isMinimized">
      <!-- Sidebar Header with Minimize/Maximize Toggle kept inside sidebar section itself -->
      <div class="brand" [class.brand-minimized]="isMinimized">
        <div class="brand-left" *ngIf="!isMinimized">
          <div class="sidebar-heading">
            <i class="fa-solid fa-layer-group text-emerald me-2"></i>
            <span class="sidebar-title-text">Workspace</span>
          </div>
        </div>
        <div class="brand-actions">
          <!-- Minimize / Maximize toggle button kept inside the sidebar section itself -->
          <button
            type="button"
            class="sidebar-action-btn"
            (click)="toggleMinimize()"
            [title]="isMinimized ? 'Maximize sidebar' : 'Minimize sidebar'">
            <i class="fa-solid" [ngClass]="isMinimized ? 'fa-angles-right' : 'fa-angles-left'"></i>
          </button>
        </div>
      </div>

      <!-- Navigation Section -->
      <nav class="nav-section">
        <ul class="nav-list">
          <ng-container *ngFor="let item of navItems">
            <li *ngIf="canView(item.roles)">
              <a
                [routerLink]="item.route"
                [queryParams]="item.queryParams"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{exact: item.route === '/dashboard'}"
                class="nav-link"
                [title]="isMinimized ? item.label : ''">
                <i [class]="item.icon + ' nav-icon'"></i>
                <span class="nav-label" *ngIf="!isMinimized">{{ item.label }}</span>
                <span
                  *ngIf="item.badge"
                  class="nav-badge"
                  [ngClass]="[item.badgeClass || 'bg-red', isMinimized ? 'badge-mini' : '']">
                  {{ isMinimized ? '' : item.badge }}
                </span>
              </a>
            </li>
          </ng-container>
        </ul>

        <!-- Admin Specific Group -->
        <ng-container *ngIf="isAdmin()">
          <div class="nav-group-title mt-4" *ngIf="!isMinimized">ADMINISTRATOR CONTROL</div>
          <div class="nav-divider" *ngIf="isMinimized"></div>
          <ul class="nav-list">
            <li>
              <a routerLink="/admin/users" routerLinkActive="active" class="nav-link" [title]="isMinimized ? 'User Management' : ''">
                <i class="fa-solid fa-users-gear nav-icon"></i>
                <span class="nav-label" *ngIf="!isMinimized">User Management</span>
              </a>
            </li>
            <li>
              <a routerLink="/admin/crops" routerLinkActive="active" class="nav-link" [title]="isMinimized ? 'Crop Management' : ''">
                <i class="fa-solid fa-wheat-awn nav-icon"></i>
                <span class="nav-label" *ngIf="!isMinimized">Crop Management</span>
              </a>
            </li>
            <li>
              <a routerLink="/admin/biddings" routerLinkActive="active" class="nav-link" [title]="isMinimized ? 'Bidding Management' : ''">
                <i class="fa-solid fa-gavel nav-icon"></i>
                <span class="nav-label" *ngIf="!isMinimized">Bidding Management</span>
              </a>
            </li>
            <li>
              <a routerLink="/orders" routerLinkActive="active" class="nav-link" [title]="isMinimized ? 'Completed Orders' : ''">
                <i class="fa-solid fa-file-invoice-dollar nav-icon"></i>
                <span class="nav-label" *ngIf="!isMinimized">Completed Orders</span>
              </a>
            </li>
            <li>
              <a routerLink="/admin/reviews" routerLinkActive="active" class="nav-link" [title]="isMinimized ? 'Moderation Reviews' : ''">
                <i class="fa-solid fa-star-half-stroke nav-icon"></i>
                <span class="nav-label" *ngIf="!isMinimized">Moderation Reviews</span>
              </a>
            </li>
          </ul>
        </ng-container>
      </nav>

      <!-- Sidebar Footer / APMC Market Info (Non-Admin only, when expanded) -->
      <div class="sidebar-footer" *ngIf="!isAdmin() && !isMinimized">
        <a routerLink="/alerts" class="gov-rate-card-link">
          <div class="gov-rate-card">
            <div class="gov-rate-header">
              <i class="fa-solid fa-bell text-amber"></i>
              <span>APMC Price Alerts</span>
            </div>
            <p class="gov-rate-desc">Set custom market rate triggers. Click to manage alerts.</p>
          </div>
        </a>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      background: #ffffff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      height: calc(100vh - 70px);
      position: sticky;
      top: 70px;
      z-index: 50;
      transition: width 0.25s ease-in-out;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.03);
    }
    .sidebar.minimized {
      width: 72px;
    }
    .brand {
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1rem;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
    }
    .brand.brand-minimized {
      justify-content: center;
      padding: 0;
    }
    .sidebar-heading {
      display: flex;
      align-items: center;
    }
    .sidebar-title-text {
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #334155;
    }
    .text-emerald {
      color: #15803d;
    }
    .brand-actions {
      display: flex;
      align-items: center;
    }
    .sidebar-action-btn {
      width: 32px;
      height: 32px;
      border-radius: 0.375rem;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.15s ease-in-out;
    }
    .sidebar-action-btn:hover {
      background: #f0fdf4;
      color: #15803d;
      border-color: #86efac;
    }
    .nav-section {
      flex: 1;
      padding: 1.25rem 0.65rem;
      overflow-y: auto;
    }
    .sidebar.minimized .nav-section {
      padding: 1.25rem 0.4rem;
    }
    .nav-group-title {
      font-size: 0.65rem;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 0.08em;
      margin-bottom: 0.65rem;
      padding: 0 0.75rem;
      white-space: nowrap;
    }
    .nav-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 0.75rem 0.5rem;
    }
    .mt-4 { margin-top: 1.5rem; }
    .nav-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0;
      margin: 0;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.75rem;
      border-radius: 0.5rem;
      color: #475569;
      font-weight: 600;
      font-size: 0.875rem;
      transition: all 0.15s ease-in-out;
      text-decoration: none;
      white-space: nowrap;
      position: relative;
    }
    .sidebar.minimized .nav-link {
      justify-content: center;
      padding: 0.75rem 0;
    }
    .nav-link:hover {
      background: #f0fdf4;
      color: #15803d;
    }
    .nav-link.active {
      background: #dcfce7;
      color: #166534;
      font-weight: 700;
    }
    .nav-icon {
      font-size: 1.1rem;
      width: 24px;
      text-align: center;
      flex-shrink: 0;
    }
    .nav-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .nav-badge {
      margin-left: auto;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 9999px;
      color: white;
    }
    .badge-mini {
      position: absolute;
      top: 6px;
      right: 12px;
      width: 8px;
      height: 8px;
      padding: 0;
      margin: 0;
    }
    .nav-badge.bg-red { background: #ef4444; }
    .nav-badge.bg-green { background: #16a34a; }
    .nav-badge.bg-amber { background: #f59e0b; }
    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid #f1f5f9;
    }
    .gov-rate-card-link {
      text-decoration: none;
      display: block;
    }
    .gov-rate-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 0.5rem;
      padding: 0.85rem;
      transition: background 0.15s;
    }
    .gov-rate-card:hover {
      background: #dcfce7;
    }
    .gov-rate-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #166534;
      font-weight: 700;
      font-size: 0.8rem;
      margin-bottom: 0.25rem;
    }
    .text-amber { color: #f59e0b; }
    .gov-rate-desc {
      font-size: 0.7rem;
      color: #15803d;
      line-height: 1.35;
      margin: 0;
    }
    @media (max-width: 1024px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        z-index: 1050;
      }
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  isMinimized = false;
  private subs: Subscription[] = [];

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'fa-solid fa-house', route: '/dashboard', roles: ['FARMER', 'DEALER', 'DELIVERY_PARTNER', 'ADMIN'] },
    // Farmer specific items
    { label: 'My Crops', icon: 'fa-solid fa-leaf', route: '/crops', queryParams: { my: 'true' }, roles: ['FARMER'] },
    { label: 'My Biddings', icon: 'fa-solid fa-gavel', route: '/my-biddings', roles: ['FARMER'] },
    // Dealer items
    { label: 'My Biddings', icon: 'fa-solid fa-gavel', route: '/my-biddings', roles: ['DEALER'] },
    // Orders: visible to Farmer and Dealer (Admin views under Administrator Control as Completed Orders)
    { label: 'Orders', icon: 'fa-solid fa-calendar-check', route: '/orders', roles: ['FARMER', 'DEALER'] },
    // Negotiations: strictly Farmer and Dealer only (Excluded for Admin and Delivery Partner)
    { label: 'Negotiations', icon: 'fa-solid fa-comments', route: '/negotiations', roles: ['FARMER', 'DEALER'] },
    // Wallet: Farmer, Dealer, Delivery Partner only (Removed from Admin)
    { label: 'Wallet', icon: 'fa-solid fa-wallet', route: '/wallet', roles: ['FARMER', 'DEALER', 'DELIVERY_PARTNER'] },
    // Deliveries: Delivery Partner ONLY (Dealer checks order status, Admin does not need delivery section)
    { label: 'Deliveries', icon: 'fa-solid fa-truck-fast', route: '/deliveries', roles: ['DELIVERY_PARTNER'] },
    // Universal Reports: Farmer, Dealer, Delivery Partner, Admin
    { label: 'Reports', icon: 'fa-solid fa-chart-line', route: '/reports', roles: ['FARMER', 'DEALER', 'DELIVERY_PARTNER', 'ADMIN'] },
    // Crop Subscriptions: Dealer only
    { label: 'Crop Subscriptions', icon: 'fa-solid fa-bookmark', route: '/crops/subscriptions', roles: ['DEALER'] },
    // Mandi Price Alerts: Farmer and Dealer only (Dynamic alert count badge)
    { label: 'Alerts', icon: 'fa-solid fa-bell', route: '/alerts', roles: ['FARMER', 'DEALER'], badge: '3', badgeClass: 'bg-red' },
  ];

  constructor(
    private authService: AuthService,
    private sidebarService: SidebarService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    // Listen to minimize state
    this.subs.push(
      this.sidebarService.isMinimized$.subscribe(minimized => {
        this.isMinimized = minimized;
      })
    );

    // Dynamically update the alert badge count from AlertService
    this.subs.push(
      this.alertService.alertCount$.subscribe(count => {
        const alertItem = this.navItems.find(i => i.route === '/alerts');
        if (alertItem) {
          alertItem.badge = count > 0 ? String(count) : undefined;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  toggleMinimize(): void {
    this.sidebarService.toggleMinimize();
  }

  closeSidebar(): void {
    this.sidebarService.close();
  }

  canView(roles?: UserRole[]): boolean {
    if (!roles || roles.length === 0) return true;
    return this.authService.hasRole(roles);
  }

  isAdmin(): boolean {
    return this.authService.hasRole(['ADMIN']);
  }
}
