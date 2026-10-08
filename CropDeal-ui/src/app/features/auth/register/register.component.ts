import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RegisterRequest } from '../../../core/models/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  user: RegisterRequest = {
    name: '', email: '', phone: '', password: '', role: 'FARMER'
  };
  isLoading = false;

  private readonly roleRoutes: Record<string, string> = {
    FARMER:           '/farmer/dashboard',
    DEALER:           '/dealer/dashboard',
    DELIVERY_PARTNER: '/delivery/dashboard',
    ADMIN:            '/admin/dashboard'
  };

  constructor(
    private authService: AuthService,
    private notifService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    if (!this.user.name || !this.user.email || !this.user.password || !this.user.phone) {
      this.notifService.showToast('warning', 'Please fill in all mandatory fields.');
      return;
    }
    this.isLoading = true;
    this.cdr.markForCheck();

    const doLogin = () => {
      this.isLoading = false;
      this.authService.switchRoleForDemo(this.user.role || 'FARMER');
      const route = this.roleRoutes[this.user.role] || '/catalog';
      this.notifService.showToast('success', `Welcome! Logged in as ${this.user.name} (${this.user.role})`);
      this.router.navigate([route]);
    };

    this.authService.register(this.user).subscribe({
      next: res => {
        this.notifService.showToast('success', res.message || 'Account created!');
        doLogin();
      },
      error: () => doLogin()
    });
  }
}
