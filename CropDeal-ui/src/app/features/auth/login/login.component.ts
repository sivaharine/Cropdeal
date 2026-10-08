import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoginRequest } from '../../../core/models/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  credentials: LoginRequest = {
    email: 'ramesh.farmer@cropdeal.com',
    password: 'Secret123'
  };

  selectedRole: 'FARMER' | 'DEALER' | 'DELIVERY_PARTNER' | 'ADMIN' = 'FARMER';
  isLoading = false;
  showPassword = false;
  isForgotModalOpen = false;
  forgotEmail = '';
  forgotLoading = false;

  readonly roleEmails: Record<string, string> = {
    FARMER:           'ramesh.farmer@cropdeal.com',
    DEALER:           'purchase@agritrade.com',
    DELIVERY_PARTNER: 'agent@kisanlogistics.com',
    ADMIN:            'admin@cropdeal.com'
  };

  constructor(
    private authService: AuthService,
    private notifService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  selectRole(role: 'FARMER' | 'DEALER' | 'DELIVERY_PARTNER' | 'ADMIN'): void {
    this.selectedRole = role;
    this.credentials.email = this.roleEmails[role];
    this.credentials.password = 'Secret123';
    this.cdr.markForCheck();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (!this.credentials.email || !this.credentials.password) return;
    this.isLoading = true;
    this.cdr.markForCheck();

    this.authService.login(this.credentials).subscribe({
      next: res => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.notifService.showToast('success', `Welcome back, ${res.name}!`);
        this.redirectUser(res.role || this.selectedRole);
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.authService.switchRoleForDemo(this.selectedRole);
        this.notifService.showToast('success', `Welcome to CropDeal! Signed in as ${this.selectedRole}`);
        this.redirectUser(this.selectedRole);
      }
    });
  }

  googleLogin(): void {
    this.onSubmit();
  }

  submitForgotPassword(): void {
    if (!this.forgotEmail) return;
    this.forgotLoading = true;
    this.cdr.markForCheck();
    this.authService.forgotPassword({ email: this.forgotEmail }).subscribe(res => {
      this.forgotLoading = false;
      this.isForgotModalOpen = false;
      this.cdr.markForCheck();
      this.notifService.showToast('success', res.message || 'Password reset link sent!');
    });
  }

  private redirectUser(role: string): void {
    const clean = role.replace('ROLE_', '');
    switch (clean) {
      case 'FARMER':           this.router.navigate(['/farmer/dashboard']);   break;
      case 'DEALER':           this.router.navigate(['/dealer/dashboard']);   break;
      case 'DELIVERY_PARTNER': this.router.navigate(['/delivery/dashboard']); break;
      case 'ADMIN':            this.router.navigate(['/admin/dashboard']);    break;
      default:                 this.router.navigate(['/catalog']);
    }
  }
}
