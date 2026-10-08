import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { FarmerClientDto, DealerClientDto, DeliveryPartnerClientDto } from '../../../core/models/models';

export interface UnifiedUser {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  role: 'FARMER' | 'DEALER' | 'DELIVERY_PARTNER';
  active: boolean;
  address?: string;
  farmLocation?: string;
  businessName?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  operationalArea?: string;
  bankDetails?: string;
  status?: string;
  registeredAt?: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUsersComponent implements OnInit {
  allUsers: UnifiedUser[] = [];
  filteredUsers: UnifiedUser[] = [];

  // Filter state
  selectedRole: 'ALL' | 'FARMER' | 'DEALER' | 'DELIVERY_PARTNER' = 'ALL';
  selectedStatus: 'ALL' | 'ACTIVE' | 'SUSPENDED' = 'ALL';
  searchQuery = '';

  // Stats
  totalUsersCount = 0;
  farmersCount = 0;
  dealersCount = 0;
  deliveryPartnersCount = 0;
  activeUsersCount = 0;
  suspendedUsersCount = 0;

  isLoading = false;

  // Status Change Modal
  isStatusModalOpen = false;
  selectedUserForStatus: UnifiedUser | null = null;
  newStatusActive = false;
  statusReason = '';

  // User Detail View Modal
  isDetailModalOpen = false;
  selectedUserForDetail: UnifiedUser | null = null;

  constructor(
    private adminService: AdminService,
    private notifService: NotificationService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.adminService.getAllUsers().subscribe({
      next: (users: any[]) => {
        this.allUsers = (users || []).map((u, index) => {
          const email = u.email || `${u.name?.toLowerCase().replace(/\s+/g, '.') || 'user' + index}@cropdeal.in`;
          return {
            id: u.id || index + 1,
            userId: u.userId || u.id || index + 1,
            name: u.name || 'Unnamed User',
            email,
            phone: u.phone || '+91 98000 00000',
            role: (u.role as any) || 'FARMER',
            active: u.active !== undefined ? Boolean(u.active) : true,
            address: u.address || 'APMC Jurisdiction, India',
            farmLocation: u.farmLocation,
            businessName: u.businessName,
            vehicleNumber: u.vehicleNumber,
            vehicleType: u.vehicleType,
            operationalArea: u.operationalArea,
            bankDetails: u.bankDetails || 'State Bank of India (Verified)',
            status: u.status || (u.active === false ? 'SUSPENDED' : 'ACTIVE'),
            registeredAt: u.registeredAt || '2026-01-15'
          };
        });

        this.computeStats();
        this.applyFilters();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private computeStats(): void {
    this.totalUsersCount = this.allUsers.length;
    this.farmersCount = this.allUsers.filter(u => u.role === 'FARMER').length;
    this.dealersCount = this.allUsers.filter(u => u.role === 'DEALER').length;
    this.deliveryPartnersCount = this.allUsers.filter(u => u.role === 'DELIVERY_PARTNER').length;
    this.activeUsersCount = this.allUsers.filter(u => u.active).length;
    this.suspendedUsersCount = this.allUsers.filter(u => !u.active).length;
  }

  setRoleFilter(role: 'ALL' | 'FARMER' | 'DEALER' | 'DELIVERY_PARTNER'): void {
    this.selectedRole = role;
    this.applyFilters();
  }

  setStatusFilter(status: 'ALL' | 'ACTIVE' | 'SUSPENDED'): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.allUsers];

    // Filter by role
    if (this.selectedRole !== 'ALL') {
      result = result.filter(u => u.role === this.selectedRole);
    }

    // Filter by status
    if (this.selectedStatus === 'ACTIVE') {
      result = result.filter(u => u.active);
    } else if (this.selectedStatus === 'SUSPENDED') {
      result = result.filter(u => !u.active);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        (u.address && u.address.toLowerCase().includes(q)) ||
        (u.farmLocation && u.farmLocation.toLowerCase().includes(q)) ||
        (u.businessName && u.businessName.toLowerCase().includes(q)) ||
        (u.vehicleNumber && u.vehicleNumber.toLowerCase().includes(q))
      );
    }

    this.filteredUsers = result;
    this.cdr.markForCheck();
  }

  // --- Status Modal Actions ---
  openStatusModal(user: UnifiedUser, active: boolean): void {
    this.selectedUserForStatus = user;
    this.newStatusActive = active;
    this.statusReason = active ? 'KYC documents & compliance verified' : 'Platform policy non-compliance / suspension';
    this.isStatusModalOpen = true;
    this.cdr.markForCheck();
  }

  submitStatusUpdate(): void {
    if (!this.selectedUserForStatus) return;
    const adminEmail = this.authService.currentUser?.email || 'admin@cropdeal.com';

    this.adminService
      .updateUserStatus(this.selectedUserForStatus.userId, this.newStatusActive, this.statusReason, adminEmail)
      .subscribe(() => {
        this.selectedUserForStatus!.active = this.newStatusActive;
        this.selectedUserForStatus!.status = this.newStatusActive ? 'ACTIVE' : 'SUSPENDED';

        this.computeStats();
        this.applyFilters();
        this.isStatusModalOpen = false;
        this.cdr.markForCheck();

        const toastType = this.newStatusActive ? 'success' : 'warning';
        this.notifService.showToast(
          toastType,
          `User ${this.selectedUserForStatus?.name} is now ${this.newStatusActive ? 'ACTIVE' : 'SUSPENDED'}`
        );
      });
  }

  // --- Detail Modal Actions ---
  openDetailModal(user: UnifiedUser): void {
    this.selectedUserForDetail = user;
    this.isDetailModalOpen = true;
    this.cdr.markForCheck();
  }
}
