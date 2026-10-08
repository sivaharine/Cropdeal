import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CropService } from '../../../core/services/crop.service';
import {
  FarmerResponse, FarmerUpdateRequest,
  DealerResponse, DealerUpdateRequest,
  DeliveryPartnerResponse, DeliveryPartnerUpdateRequest,
  CropSearchResponse
} from '../../../core/models/models';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyProfileComponent implements OnInit {
  // Current user info from AuthService
  role = '';
  isLoading = true;
  isSaving = false;
  isEditMode = false;
  isDeleteModalOpen = false;
  activeTab: 'profile' | 'nearby' = 'profile';

  // Role-specific profiles
  farmer: FarmerResponse | null = null;
  dealer: DealerResponse | null = null;
  agent: DeliveryPartnerResponse | null = null;

  // Edit forms — one per role
  farmerForm: FarmerUpdateRequest = {};
  dealerForm: DealerUpdateRequest = {};
  agentForm: DeliveryPartnerUpdateRequest = {};

  // Nearby crops
  nearbyCrops: CropSearchResponse[] = [];
  isLoadingNearby = false;
  nearbySearchTerm = '';

  readonly vehicleTypes = ['TRUCK', 'VAN', 'CAR', 'BIKE'];
  readonly availabilityOptions = ['AVAILABLE', 'BUSY', 'OFFLINE', 'SUSPENDED'];

  constructor(
    public authService: AuthService,
    private userService: UserService,
    private notifService: NotificationService,
    private cropService: CropService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.role = this.authService.currentUser?.role || '';
    this.loadProfile();
  }

  // ─── Profile helpers ──────────────────────────────────────────────────────
  get displayName(): string {
    if (this.farmer) return this.farmer.name || 'Farmer';
    if (this.dealer) return this.dealer.name || 'Dealer';
    if (this.agent) return this.agent.name || 'Agent';
    return this.authService.currentUser?.name || 'User';
  }

  get displayAddress(): string {
    if (this.farmer) return this.farmer.address || this.farmer.farmLocation || '';
    if (this.dealer) return this.dealer.address || '';
    if (this.agent) return this.agent.address || '';
    return '';
  }

  // Parse state/district from address like "Amritsar, Punjab"
  get parsedState(): string {
    const addr = this.displayAddress;
    const parts = addr.split(',').map(p => p.trim());
    return parts.length >= 2 ? parts[parts.length - 1] : '';
  }

  get parsedDistrict(): string {
    const addr = this.displayAddress;
    const parts = addr.split(',').map(p => p.trim());
    return parts.length >= 2 ? parts[0] : '';
  }

  // ─── Load profile ─────────────────────────────────────────────────────────
  loadProfile(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    if (this.role === 'FARMER') {
      this.userService.getFarmerMe().subscribe({
        next: f => { this.farmer = f; this.initFarmerForm(f); this.isLoading = false; this.cdr.markForCheck(); this.loadNearbyCrops(); },
        error: () => { this.isLoading = false; this.cdr.markForCheck(); }
      });
    } else if (this.role === 'DEALER') {
      this.userService.getDealerMe().subscribe({
        next: d => { this.dealer = d; this.initDealerForm(d); this.isLoading = false; this.cdr.markForCheck(); this.loadNearbyCrops(); },
        error: () => { this.isLoading = false; this.cdr.markForCheck(); }
      });
    } else if (this.role === 'DELIVERY_PARTNER') {
      this.userService.getDeliveryPartnerMe().subscribe({
        next: a => { this.agent = a; this.initAgentForm(a); this.isLoading = false; this.cdr.markForCheck(); this.loadNearbyCrops(); },
        error: () => { this.isLoading = false; this.cdr.markForCheck(); }
      });
    } else {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  private initFarmerForm(f: FarmerResponse): void {
    this.farmerForm = { name: f.name, phone: f.phone, address: f.address, farmLocation: f.farmLocation, bankDetails: f.bankDetails };
  }

  private initDealerForm(d: DealerResponse): void {
    this.dealerForm = { name: d.name, phone: d.phone, businessName: d.businessName, address: d.address, bankDetails: d.bankDetails };
  }

  private initAgentForm(a: DeliveryPartnerResponse): void {
    this.agentForm = {
      name: a.name, phone: a.phone, address: a.address,
      vehicleNumber: a.vehicleNumber, vehicleType: a.vehicleType,
      drivingLicenseNumber: a.drivingLicenseNumber || a.licenseNumber,
      availabilityStatus: a.availabilityStatus, bankDetails: a.bankDetails
    };
  }

  // ─── Save ─────────────────────────────────────────────────────────────────
  saveProfile(): void {
    this.isSaving = true;
    this.cdr.markForCheck();

    if (this.role === 'FARMER') {
      this.userService.updateFarmerMe(this.farmerForm).subscribe({
        next: updated => {
          this.farmer = updated; this.isEditMode = false; this.isSaving = false;
          this.cdr.markForCheck();
          this.notifService.showToast('success', 'Profile updated successfully!');
          this.loadNearbyCrops();
        },
        error: () => { this.isSaving = false; this.cdr.markForCheck(); }
      });
    } else if (this.role === 'DEALER') {
      this.userService.updateDealerMe(this.dealerForm).subscribe({
        next: updated => {
          this.dealer = updated; this.isEditMode = false; this.isSaving = false;
          this.cdr.markForCheck();
          this.notifService.showToast('success', 'Profile updated successfully!');
          this.loadNearbyCrops();
        },
        error: () => { this.isSaving = false; this.cdr.markForCheck(); }
      });
    } else if (this.role === 'DELIVERY_PARTNER') {
      this.userService.updateDeliveryPartnerMe(this.agentForm).subscribe({
        next: updated => {
          this.agent = updated; this.isEditMode = false; this.isSaving = false;
          this.cdr.markForCheck();
          this.notifService.showToast('success', 'Profile updated successfully!');
          this.loadNearbyCrops();
        },
        error: () => { this.isSaving = false; this.cdr.markForCheck(); }
      });
    }
  }

  cancelEdit(): void {
    this.isEditMode = false;
    if (this.farmer) this.initFarmerForm(this.farmer);
    if (this.dealer) this.initDealerForm(this.dealer);
    if (this.agent) this.initAgentForm(this.agent);
    this.cdr.markForCheck();
  }

  // ─── Delete / Deactivate Profile ──────────────────────────────────────────
  confirmDeactivate(): void {
    const action$ = this.role === 'FARMER'
      ? this.userService.deleteFarmerMe()
      : this.role === 'DEALER'
        ? this.userService.deleteDealerMe()
        : this.role === 'DELIVERY_PARTNER'
          ? this.userService.deleteDeliveryPartnerMe()
          : of(void 0);

    action$.subscribe({
      next: () => {
        this.notifService.showToast('info', 'Your profile has been deleted. Logging out...');
        this.isDeleteModalOpen = false;
        this.authService.logout();
        this.cdr.markForCheck();
      },
      error: () => {
        this.notifService.showToast('info', 'Your profile has been deleted. Logging out...');
        this.isDeleteModalOpen = false;
        this.authService.logout();
        this.cdr.markForCheck();
      }
    });
  }

  // ─── Nearby Crops (GET /api/crops/nearby) ────────────────────────────────
  loadNearbyCrops(): void {
    const state = this.parsedState;
    const district = this.parsedDistrict;
    if (!state && !district) return;

    this.isLoadingNearby = true;
    this.cdr.markForCheck();

    this.cropService.getNearbyProducts(state, district).subscribe({
      next: crops => {
        this.nearbyCrops = crops || [];
        this.isLoadingNearby = false;
        this.cdr.markForCheck();
      },
      error: () => { this.isLoadingNearby = false; this.cdr.markForCheck(); }
    });
  }

  get filteredNearbyCrops(): CropSearchResponse[] {
    if (!this.nearbySearchTerm.trim()) return this.nearbyCrops;
    const q = this.nearbySearchTerm.toLowerCase();
    return this.nearbyCrops.filter(c =>
      (c.commodity || '').toLowerCase().includes(q) ||
      (c.state || '').toLowerCase().includes(q) ||
      (c.district || '').toLowerCase().includes(q)
    );
  }
}
