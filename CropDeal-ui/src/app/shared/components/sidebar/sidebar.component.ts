import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CurrentUser } from '../../../core/models/models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
  badgeClass?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit {
  @Input() isCollapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  currentUser: CurrentUser | null = null;
  // FIXED: cached array — only rebuilt when role changes, NOT on every change detection cycle
  navItems: NavItem[] = [];
  private _lastRole = '';

  constructor(public authService: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.currentUser = u;
      const role = u?.role || 'FARMER';
      if (role !== this._lastRole) {
        this._lastRole = role;
        this.navItems = this.buildNavItems(role);
        this.cdr.markForCheck();
      }
    });
  }

  get currentRole(): string {
    return this.currentUser?.role || 'FARMER';
  }

  private buildNavItems(role: string): NavItem[] {
    switch (role) {
      case 'FARMER':
        return [
          { label: 'Dashboard',    icon: 'fa-solid fa-house-chimney-window', route: '/farmer/dashboard' },
          { label: 'My Crops',     icon: 'fa-solid fa-leaf',                 route: '/catalog' },
          { label: 'Auctions',     icon: 'fa-solid fa-gavel',                route: '/bidding' },
          { label: 'Negotiations', icon: 'fa-solid fa-comments-dollar',      route: '/negotiations' },
          { label: 'Orders',       icon: 'fa-solid fa-receipt',              route: '/orders' },
          { label: 'Wallet',       icon: 'fa-solid fa-wallet',               route: '/wallet' },
          { label: 'My Profile',   icon: 'fa-solid fa-user-circle',          route: '/profile' },
          { label: 'Prices',       icon: 'fa-solid fa-chart-line',           route: '/prices' }
        ];
      case 'DEALER':
        return [
          { label: 'Dashboard',    icon: 'fa-solid fa-gauge-high',           route: '/dealer/dashboard' },
          { label: 'Browse Crops', icon: 'fa-solid fa-store',                route: '/catalog' },
          { label: 'Live Auctions',icon: 'fa-solid fa-gavel',                route: '/bidding' },
          { label: 'Negotiations', icon: 'fa-solid fa-comments-dollar',      route: '/negotiations' },
          { label: 'Orders',       icon: 'fa-solid fa-receipt',              route: '/orders' },
          { label: 'Wallet',       icon: 'fa-solid fa-wallet',               route: '/wallet' },
          { label: 'My Profile',   icon: 'fa-solid fa-user-circle',          route: '/profile' },
          { label: 'Prices',       icon: 'fa-solid fa-chart-line',           route: '/prices' }
        ];
      case 'DELIVERY_PARTNER':
        return [
          { label: 'Dashboard',    icon: 'fa-solid fa-truck-ramp-box',       route: '/delivery/dashboard' },
          { label: 'My Deliveries',icon: 'fa-solid fa-box-open',             route: '/delivery/my-deliveries' },
          { label: 'Wallet',       icon: 'fa-solid fa-wallet',               route: '/wallet' },
          { label: 'My Profile',   icon: 'fa-solid fa-user-circle',          route: '/profile' },
          { label: 'Prices',       icon: 'fa-solid fa-chart-line',           route: '/prices' }
        ];
      case 'ADMIN':
        return [
          { label: 'Dashboard',    icon: 'fa-solid fa-shield-halved',        route: '/admin/dashboard' },
          { label: 'Users',        icon: 'fa-solid fa-users',                route: '/admin/users' },
          { label: 'Crops',        icon: 'fa-solid fa-seedling',             route: '/catalog' },
          { label: 'Auctions',     icon: 'fa-solid fa-gavel',                route: '/bidding' },
          { label: 'Orders',       icon: 'fa-solid fa-receipt',              route: '/orders' },
          { label: 'Wallet',       icon: 'fa-solid fa-wallet',               route: '/wallet' },
          { label: 'Reports',      icon: 'fa-solid fa-chart-pie',            route: '/admin/reports' }
        ];
      default:
        return [];
    }
  }
}
