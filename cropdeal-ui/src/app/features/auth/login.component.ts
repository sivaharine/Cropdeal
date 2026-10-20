import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CropService } from '../../core/services/crop.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card shadow-xl">
        <!-- Brand Header -->
        <div class="auth-header">
          <div class="auth-logo">
            <i class="fa-solid fa-seedling"></i>
          </div>
          <h2 class="auth-title">Welcome to Crop<span class="text-emerald">Deal</span></h2>
          <p class="auth-subtitle">Direct Agricultural Marketplace • Fair Prices for All</p>
        </div>

        <!-- Alert messages -->
        <div *ngIf="errorMessage" class="auth-alert alert-error">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>{{ errorMessage }}</span>
        </div>
        <div *ngIf="successMessage" class="auth-alert alert-success">
          <i class="fa-solid fa-circle-check"></i>
          <span>{{ successMessage }}</span>
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="onLogin()" class="auth-form">
          <div class="form-group">
            <label class="form-label">Username or Email</label>
            <div class="input-wrapper">
              <i class="fa-regular fa-user input-icon"></i>
              <input
                type="text"
                [(ngModel)]="username"
                name="username"
                class="form-control"
                placeholder="Enter your username or email"
                autocomplete="off"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <div class="label-row">
              <label class="form-label">Password</label>
              <a href="javascript:void(0)" (click)="openForgotModal()" class="forgot-link">Forgot Password?</a>
            </div>
            <div class="input-wrapper">
              <i class="fa-solid fa-lock input-icon"></i>
              <input
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                class="form-control"
                placeholder="Enter your secret password"
                autocomplete="new-password"
                required
              />
              <button type="button" class="eye-btn" (click)="showPassword = !showPassword">
                <i class="fa-regular" [ngClass]="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            <span *ngIf="!loading">
              <i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Marketplace
            </span>
            <span *ngIf="loading">
              <i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...
            </span>
          </button>

          <!-- Facebook Login Option -->
          <div class="divider-text mt-3"><span>or continue with</span></div>
          <button type="button" class="btn-facebook btn-block mt-2" (click)="loginWithFacebook()">
            <i class="fa-brands fa-facebook-f fb-icon"></i> Continue with Facebook
          </button>
        </form>

        <!-- Quick Credential Helper for Testing -->
        <div class="demo-helpers">
          <span class="helper-title">Quick Demo Login:</span>
          <div class="helper-chips">
            <button type="button" (click)="fillDemo('farmer@gmail.com', 'pass-farmer124', 'FARMER')">🌾 Farmer</button>
            <button type="button" (click)="fillDemo('dealer@gmail.com', 'pass-dealer124', 'DEALER')">💼 Dealer</button>
            <button type="button" (click)="fillDemo('delivery@gmail.com', 'pass-delivery124', 'DELIVERY_PARTNER')">🚚 Delivery Partner</button>
            <button type="button" (click)="fillDemo('admin@gmail.com', 'pass-admin124', 'ADMIN')">🛡️ Admin</button>
          </div>
        </div>

        <!-- Footer -->
        <div class="auth-footer">
          <p>New to CropDeal? <a routerLink="/auth/register" class="register-link">Create an Account</a></p>
        </div>
      </div>

      <!-- Forgot Password Modal (Sends OTP via backend Email Service) -->
      <div *ngIf="showForgotModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3><i class="fa-solid fa-key text-emerald"></i> Reset Password</h3>
            <button class="close-icon" (click)="closeForgotModal()">&times;</button>
          </div>
          <div class="modal-body">
            <p class="modal-desc" *ngIf="forgotStep === 1">
              Enter your registered email address. We will send a 6-digit OTP verification code to reset your password.
            </p>

            <!-- Step 1: Email + Send OTP -->
            <div *ngIf="forgotStep === 1" class="form-group">
              <label class="form-label">Registered Email</label>
              <div class="input-wrapper">
                <i class="fa-regular fa-envelope input-icon"></i>
                <input type="email" [(ngModel)]="resetEmail" class="form-control" placeholder="Enter your registered email address" autocomplete="off" />
              </div>
              <button class="btn btn-primary mt-3 btn-block" (click)="sendOtp()" [disabled]="sendingOtp || !resetEmail">
                <span *ngIf="!sendingOtp"><i class="fa-solid fa-paper-plane"></i> Send OTP Code</span>
                <span *ngIf="sendingOtp"><i class="fa-solid fa-spinner fa-spin"></i> Sending OTP via Email...</span>
              </button>
            </div>

            <!-- Step 2: Verify OTP -->
            <div *ngIf="forgotStep === 2" class="otp-verification-flow">
              <div class="alert-info-box mb-3">
                <i class="fa-solid fa-circle-info"></i> 6-digit OTP sent to <strong>{{ resetEmail }}</strong>.
              </div>
              <div class="form-group">
                <label class="form-label">Enter 6-Digit OTP</label>
                <div class="input-wrapper">
                  <i class="fa-solid fa-shield-halved input-icon"></i>
                  <input type="text" [(ngModel)]="otpCode" class="form-control" placeholder="Enter 6-digit OTP sent to your email" maxlength="6" autocomplete="off" />
                </div>
              </div>
              <div class="d-flex justify-content-between align-center mt-2">
                <span class="subtext-muted">Didn't receive code?</span>
                <button type="button" class="btn-resend-link" (click)="sendOtp()" [disabled]="sendingOtp">Resend OTP</button>
              </div>
              <button class="btn btn-primary mt-3 btn-block" (click)="verifyOtp()" [disabled]="verifyingOtp || !otpCode">
                <span *ngIf="!verifyingOtp"><i class="fa-solid fa-circle-check"></i> Verify OTP Code</span>
                <span *ngIf="verifyingOtp"><i class="fa-solid fa-spinner fa-spin"></i> Verifying...</span>
              </button>
            </div>

            <!-- Step 3: New Password -->
            <div *ngIf="forgotStep === 3" class="otp-verification-flow">
              <div class="alert-success-box mb-3">
                <i class="fa-solid fa-check-double"></i> OTP Verified! Enter your new password below.
              </div>
              <div class="form-group">
                <label class="form-label">New Password</label>
                <div class="input-wrapper">
                  <i class="fa-solid fa-lock input-icon"></i>
                  <input type="password" [(ngModel)]="newPassword" class="form-control" placeholder="Enter new password (min. 6 characters)" autocomplete="new-password" />
                </div>
              </div>
              <div class="form-group mt-2">
                <label class="form-label">Confirm New Password</label>
                <div class="input-wrapper">
                  <i class="fa-solid fa-lock-open input-icon"></i>
                  <input type="password" [(ngModel)]="confirmPassword" class="form-control" placeholder="Re-enter your new password" autocomplete="new-password" />
                </div>
              </div>
              <button class="btn btn-primary mt-3 btn-block" (click)="submitResetPassword()" [disabled]="resetting || !newPassword">
                <span *ngIf="!resetting"><i class="fa-solid fa-key"></i> Update Password & Sign In</span>
                <span *ngIf="resetting"><i class="fa-solid fa-spinner fa-spin"></i> Updating...</span>
              </button>
            </div>
          </div>
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
      padding: 1.5rem;
      position: relative;
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      background: #ffffff;
      border-radius: var(--radius-xl);
      padding: 2.5rem 2rem;
      position: relative;
      z-index: 10;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .auth-logo {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
      color: white;
      font-size: 1.75rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      box-shadow: 0 8px 20px rgba(46, 125, 50, 0.35);
    }
    .auth-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .text-emerald { color: var(--primary-600); }
    .auth-subtitle {
      font-size: 0.825rem;
      color: var(--text-muted);
      margin-top: 0.35rem;
    }
    .auth-alert {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      margin-bottom: 1.25rem;
    }
    .alert-error {
      background: var(--danger-bg);
      color: var(--danger);
      border: 1px solid #fca5a5;
    }
    .alert-success {
      background: var(--success-bg);
      color: var(--success);
      border: 1px solid #86efac;
    }
    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .forgot-link {
      font-size: 0.75rem;
      color: var(--primary-600);
      font-weight: 600;
    }
    .input-wrapper {
      position: relative;
    }
    .input-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-subtle);
    }
    .input-wrapper .form-control {
      padding-left: 2.6rem;
      padding-right: 2.6rem;
    }
    .eye-btn {
      position: absolute;
      right: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-subtle);
      cursor: pointer;
    }
    .btn-block {
      width: 100%;
      padding: 0.8rem;
    }
    .demo-helpers {
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px dashed var(--border-color);
      text-align: center;
    }
    .helper-title {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .helper-chips {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 0.5rem;
    }
    .helper-chips button {
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      cursor: pointer;
      font-weight: 600;
      color: var(--text-main);
      transition: all var(--transition-fast);
    }
    .helper-chips button:hover {
      background: var(--primary-50);
      border-color: var(--primary-300);
      color: var(--primary-700);
    }
    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .register-link {
      font-weight: 700;
      color: var(--primary-600);
    }
    .close-icon {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }
    .btn-facebook {
      background: #1877f2;
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      transition: background var(--transition-fast);
    }
    .btn-facebook:hover { background: #166fe5; }
    .fb-icon { font-size: 1.15rem; }
    .divider-text {
      text-align: center;
      border-bottom: 1px solid var(--border-color);
      line-height: 0.1em;
      margin: 1.25rem 0 0.85rem;
    }
    .divider-text span { background: #fff; padding: 0 0.75rem; color: var(--text-muted); font-size: 0.75rem; }
    .alert-info-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.82rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .alert-success-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.82rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-resend-link {
      background: none;
      border: none;
      color: var(--primary-600);
      font-weight: 700;
      font-size: 0.78rem;
      cursor: pointer;
      text-decoration: underline;
    }
    .subtext-muted { font-size: 0.78rem; color: var(--text-muted); }
    .mb-3 { margin-bottom: 0.85rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.85rem; }
  `]
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Forgot Password Modal
  showForgotModal = false;
  forgotStep = 1;
  resetEmail = '';
  otpSent = false;
  sendingOtp = false;
  otpCode = '';
  verifyingOtp = false;
  newPassword = '';
  confirmPassword = '';
  resetting = false;

  constructor(
    private authService: AuthService,
    private cropService: CropService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['blocked'] === 'true') {
        this.errorMessage = '🚫 Access Denied: User account is blocked by administrator. Please contact support.';
      }
    });
  }

  onLogin(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    const input = this.username.trim();
    // Check if user is blocked in master storage
    try {
      const raw = localStorage.getItem('cropdeal_users_master');
      if (raw) {
        const list = JSON.parse(raw);
        const match = list.find((u: any) =>
          (u.email && u.email.toLowerCase() === input.toLowerCase()) ||
          (u.username && u.username.toLowerCase() === input.toLowerCase())
        );
        if (match && (match.status === 'BLOCKED' || match.isBlocked) && match.role !== 'ADMIN' && match.username?.toLowerCase() !== 'admin') {
          this.errorMessage = '🚫 Access Denied: User account is blocked by administrator. Please contact support.';
          return;
        }
      }
    } catch {}

    const isEmail = input.includes('@');
    this.loading = true;
    this.errorMessage = '';
    this.authService.login({
      username: input,
      email: isEmail ? input : undefined,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        // User rule: "crop alert need to be only use our db and need to query only when login not ervrytime continuously"
        if (res.userId) {
          this.cropService.checkLoginPriceAlerts(res.userId).subscribe({
            next: (alerts) => {
              if (alerts && alerts.length > 0) {
                alerts.forEach(a => {
                  this.notificationService.addClientNotification({
                    id: 'alert-' + Date.now(),
                    userId: res.userId,
                    title: `🌾 Price Alert: ${a.cropName}`,
                    message: a.message || `Current DB APMC market rate ₹${a.currentGovPrice} reached your target!`,
                    type: 'PRICE_ALERT',
                    isRead: false,
                    createdAt: new Date().toISOString()
                  });
                });
              }
            },
            error: () => {}
          });
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || err.error?.error || '';
        if (msg.toLowerCase().includes('block') || msg.toLowerCase().includes('suspend')) {
          this.errorMessage = '🚫 Access Denied: User account is blocked by administrator. Please contact support.';
        } else {
          this.errorMessage = msg || 'Login failed. Please check credentials or use demo accounts.';
        }
      }
    });
  }

  fillDemo(u: string, p: string, role: string): void {
    this.errorMessage = '';
    // Check if demo user is specifically blocked by username or email
    try {
      const raw = localStorage.getItem('cropdeal_users_master');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const match = list.find((item: any) =>
            (item.username && item.username.toLowerCase() === u.toLowerCase()) ||
            (item.email && item.email.toLowerCase() === u.toLowerCase()) ||
            (item.role && item.role.toUpperCase() === role.toUpperCase())
          );
          if (role !== 'ADMIN' && u.toLowerCase() !== 'admin' && match && (match.status === 'BLOCKED' || match.isBlocked)) {
            this.errorMessage = `🚫 Access Denied: User account (${role}) is blocked by administrator. Please contact support.`;
            return;
          }
        }
      }
    } catch {}

    try {
      this.username = u;
      this.password = p;
      this.authService.loginWithDemo(u, role as any);
      this.cropService.checkLoginPriceAlerts(role.toLowerCase() + '-1').subscribe({
        next: () => {},
        error: () => {}
      });
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.toLowerCase().includes('block')) {
        this.errorMessage = '🚫 Access Denied: User account is blocked by administrator. Please contact support.';
      } else {
        this.errorMessage = msg || 'Login failed. Please check credentials.';
      }
    }
  }

  async loginWithFacebook(): Promise<void> {
    const res = await this.authService.loginWithFacebook();
    if (res.success) {
      this.successMessage = `Welcome, ${res.user?.fullName || 'Verified User'}! Signed in with Facebook.`;
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 500);
    } else if (res.error && res.error !== 'Cancelled') {
      this.errorMessage = res.error;
    }
  }

  openForgotModal(): void {
    this.showForgotModal = true;
    this.forgotStep = 1;
    this.otpSent = false;
    this.resetEmail = '';
    this.otpCode = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeForgotModal(): void {
    this.showForgotModal = false;
    this.resetEmail = '';
    this.otpCode = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.forgotStep = 1;
  }

  sendOtp(): void {
    if (!this.resetEmail.trim()) {
      this.errorMessage = 'Please enter your registered email address.';
      return;
    }
    this.sendingOtp = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.authService.sendPasswordResetOtp(this.resetEmail.trim()).subscribe({
      next: () => {
        this.sendingOtp = false;
        this.forgotStep = 2;
        this.otpCode = '';
        this.successMessage = 'A 6-digit verification OTP has been sent to ' + this.resetEmail.trim() + '. Please check your email inbox.';
      },
      error: (err: any) => {
        this.sendingOtp = false;
        this.errorMessage = err.error?.message || err.message || 'Failed to send OTP. Please verify your registered email address.';
      }
    });
  }

  verifyOtp(): void {
    if (!this.otpCode.trim()) {
      this.errorMessage = 'Please enter the 6-digit OTP code.';
      return;
    }
    this.verifyingOtp = true;
    this.errorMessage = '';
    this.authService.verifyResetOtp(this.resetEmail.trim(), this.otpCode.trim()).subscribe({
      next: (isValid) => {
        this.verifyingOtp = false;
        if (isValid) {
          this.forgotStep = 3;
          this.newPassword = '';
          this.confirmPassword = '';
          this.successMessage = 'OTP verified successfully! Please enter your new password.';
        } else {
          this.errorMessage = 'Invalid OTP code. Please enter the OTP sent to your email.';
        }
      },
      error: (err: any) => {
        this.verifyingOtp = false;
        this.errorMessage = err.error?.message || err.message || 'Invalid or expired OTP. Please check the code sent to your email.';
      }
    });
  }

  submitResetPassword(): void {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }
    if (this.confirmPassword && this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }
    this.resetting = true;
    this.errorMessage = '';
    this.authService.resetPasswordWithOtp(this.resetEmail.trim(), this.otpCode.trim(), this.newPassword).subscribe({
      next: () => {
        this.resetting = false;
        this.showForgotModal = false;
        this.successMessage = 'Password reset successfully! Please sign in with your new password.';
        // Leave fields clean and empty with placeholder visible per user requirements
        this.username = '';
        this.password = '';
        this.resetEmail = '';
        this.otpCode = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err: any) => {
        this.resetting = false;
        this.errorMessage = err.error?.message || err.message || 'Failed to reset password. Please check your OTP and try again.';
      }
    });
  }
}
