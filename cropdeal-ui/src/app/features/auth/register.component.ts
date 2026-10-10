import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card shadow-xl">
        <div class="auth-header">
          <div class="auth-logo">
            <i class="fa-solid fa-user-plus"></i>
          </div>
          <h2 class="auth-title">Join Crop<span class="text-emerald">Deal</span></h2>
          <p class="auth-subtitle">Empowering direct farmer-to-dealer trade across India</p>
        </div>

        <div *ngIf="errorMessage" class="auth-alert alert-error">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>{{ errorMessage }}</span>
          <a *ngIf="errorMessage.includes('registered') || errorMessage.includes('login')" routerLink="/auth/login" class="login-alert-btn">
            Sign In Now &rarr;
          </a>
        </div>
        <div *ngIf="successMessage" class="auth-alert alert-success">
          <i class="fa-solid fa-circle-check"></i>
          <span>{{ successMessage }}</span>
        </div>

        <form (ngSubmit)="onRegister()" class="auth-form">
          <!-- Role Selection -->
          <div class="form-group">
            <label class="form-label">I want to register as:</label>
            <div class="role-selector">
              <label class="role-option" [class.selected]="role === 'FARMER'">
                <input type="radio" [(ngModel)]="role" name="role" value="FARMER" />
                <i class="fa-solid fa-wheat-awn"></i>
                <span>Farmer</span>
              </label>
              <label class="role-option" [class.selected]="role === 'DEALER'">
                <input type="radio" [(ngModel)]="role" name="role" value="DEALER" />
                <i class="fa-solid fa-briefcase"></i>
                <span>Dealer</span>
              </label>
              <label class="role-option" [class.selected]="role === 'DELIVERY_PARTNER'">
                <input type="radio" [(ngModel)]="role" name="role" value="DELIVERY_PARTNER" />
                <i class="fa-solid fa-truck-fast"></i>
                <span>Logistics</span>
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Username</label>
              <input type="text" [(ngModel)]="username" name="username" class="form-control" placeholder="Enter username" autocomplete="off" required />
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Full Name</label>
              <input type="text" [(ngModel)]="fullName" name="fullName" class="form-control" placeholder="Enter full name" autocomplete="off" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Email Address</label>
              <input type="email" [(ngModel)]="email" name="email" class="form-control" placeholder="Enter email address" autocomplete="off" required />
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Mobile Number (10 digits)</label>
              <input type="tel" [(ngModel)]="phone" name="phone" class="form-control" placeholder="Enter 10-digit mobile number" maxlength="14" autocomplete="off" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Password (Min. 8 characters)</label>
            <input type="password" [(ngModel)]="password" name="password" minlength="8" class="form-control" placeholder="Create password (min. 8 characters)" autocomplete="new-password" required />
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            <span *ngIf="!loading"><i class="fa-solid fa-circle-check"></i> Complete Registration</span>
            <span *ngIf="loading"><i class="fa-solid fa-circle-notch fa-spin"></i> Creating Account...</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/auth/login" class="login-link">Sign In</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0e3b12 0%, #1b5e20 40%, #2e7d32 100%);
      padding: 2rem 1rem;
    }
    .auth-card {
      width: 100%;
      max-width: 520px;
      background: #ffffff;
      border-radius: var(--radius-xl);
      padding: 2.25rem 2rem;
    }
    .auth-header { text-align: center; margin-bottom: 1.5rem; }
    .auth-logo {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
      color: white;
      font-size: 1.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.75rem;
      box-shadow: 0 6px 16px rgba(46, 125, 50, 0.3);
    }
    .auth-title { font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
    .text-emerald { color: var(--primary-600); }
    .auth-subtitle { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; }
    .role-selector {
      display: flex;
      gap: 0.75rem;
    }
    .role-option {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      padding: 0.75rem 0.5rem;
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      transition: all var(--transition-fast);
    }
    .role-option input { display: none; }
    .role-option i { font-size: 1.25rem; }
    .role-option.selected {
      background: var(--primary-50);
      border-color: var(--primary-600);
      color: var(--primary-800);
      box-shadow: 0 2px 6px rgba(46, 125, 50, 0.15);
    }
    .form-row {
      display: flex;
      gap: 1rem;
    }
    .flex-1 { flex: 1; }
    .btn-block { width: 100%; padding: 0.8rem; margin-top: 0.5rem; }
    .auth-footer { text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-muted); }
    .login-link { font-weight: 700; color: var(--primary-600); }
    .auth-alert {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    .alert-error { background: var(--danger-bg); color: var(--danger); }
    .alert-success { background: var(--success-bg); color: var(--success); }
    .login-alert-btn {
      margin-left: auto;
      background: var(--primary-600);
      color: white;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      font-weight: 700;
      font-size: 0.78rem;
      text-decoration: none;
      white-space: nowrap;
    }
    .login-alert-btn:hover { background: var(--primary-700); }
  `]
})
export class RegisterComponent {
  role: UserRole = 'FARMER';
  username = '';
  fullName = '';
  email = '';
  phone = '';
  address = '';
  password = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onRegister(): void {
    if (!this.username.trim() || !this.email.trim() || !this.password) {
      this.errorMessage = 'Please complete all required fields';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      return;
    }

    // Clean phone number: remove non-digits and strip leading +91 / 0
    let cleanPhone = this.phone.replace(/\D/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.substring(2);
    } else if (cleanPhone.length > 10 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    if (cleanPhone.length > 10) {
      cleanPhone = cleanPhone.slice(-10);
    }

    const indianMobileRegex = /^[6-9][0-9]{9}$/;
    if (!indianMobileRegex.test(cleanPhone)) {
      this.errorMessage = 'Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
      return;
    }

    // Pre-check if already registered in master storage
    try {
      const raw = localStorage.getItem('cropdeal_users_master');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const match = list.find((u: any) =>
            (u.email && u.email.toLowerCase() === this.email.trim().toLowerCase()) ||
            (u.username && u.username.toLowerCase() === this.username.trim().toLowerCase())
          );
          if (match) {
            this.errorMessage = 'Already registered, please login';
            return;
          }
        }
      }
    } catch {}

    this.loading = true;
    this.errorMessage = '';

    const displayName = this.fullName.trim() || this.username.trim();

    this.authService.register({
      name: displayName,
      username: this.username.trim(),
      fullName: displayName,
      email: this.email.trim(),
      phone: cleanPhone,
      address: '',
      role: this.role,
      password: this.password
    }).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Registration successful! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      },
      error: (err: any) => {
        this.loading = false;
        const msg = err.error?.message || err.error?.error || '';
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exist') || err.status === 409) {
          this.errorMessage = 'Already registered, please login';
        } else {
          this.errorMessage = msg || 'Registration failed. Please verify your details.';
        }
      }
    });
  }
}
