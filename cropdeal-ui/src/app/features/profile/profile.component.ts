import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService, UserProfileData } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="profile-container">

      <!-- Top Banner (Matches image10.png - image13.png) -->
      <div class="profile-hero-banner shadow-sm">
        <div class="avatar-wrapper">
          <img [src]="profileAvatar || '/assets/images/farmer-avatar.jpg'" alt="Avatar" class="profile-avatar-img" (error)="onAvatarError($event)" />
          <button type="button" class="camera-btn" title="Change Avatar from device" (click)="fileInput.click()">
            <i class="fa-solid fa-camera"></i>
          </button>
          <input #fileInput type="file" accept="image/*" style="display: none;" (change)="onPhotoSelected($event)" />
        </div>

        <div class="profile-header-info">
          <h2 class="profile-user-name">{{ profile.name != null ? profile.name : 'null' }}</h2>
          <span class="profile-user-role">{{ getRoleTitle(profile.role || '') }}</span>
          <div class="verified-pill shadow-xs">
            <i class="fa-solid fa-shield-check text-emerald"></i>
            <strong>Verified {{ profile.role === 'FARMER' ? 'Farmer' : (profile.role === 'DEALER' ? 'Dealer' : 'Partner') }}</strong>
          </div>
          <span class="member-since-text">Member since Sep 2024</span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="profile-nav-tabs">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'personal'"
          (click)="activeTab = 'personal'">
          <i class="fa-solid fa-user"></i>
          <span>Personal Information</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'address'"
          (click)="activeTab = 'address'">
          <i class="fa-solid fa-location-dot"></i>
          <span>Address</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'bank'"
          (click)="activeTab = 'bank'">
          <i class="fa-solid fa-building-columns"></i>
          <span>Bank Details</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab === 'password'"
          (click)="activeTab = 'password'">
          <i class="fa-solid fa-lock"></i>
          <span>Change Password</span>
        </button>
      </div>

      <!-- Notification Alerts -->
      <div *ngIf="successMessage" class="alert alert-success shadow-sm mt-3">
        <i class="fa-solid fa-circle-check"></i>
        <span>{{ successMessage }}</span>
      </div>
      <div *ngIf="errorMessage" class="alert alert-error shadow-sm mt-3">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Main Profile Grid: Left (Forms) & Right (Status & Summary) -->
      <div class="profile-main-grid mt-3">

        <!-- Left Form Card -->
        <div class="card form-panel shadow-sm">

          <!-- TAB 1: PERSONAL INFORMATION (Matches image10.png) -->
          <div *ngIf="activeTab === 'personal'" class="tab-content">
            <div class="panel-heading">
              <i class="fa-solid fa-user text-emerald"></i>
              <h3>Personal Information</h3>
            </div>

            <form (ngSubmit)="saveProfile()" class="form-body">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Full Name</label>
                  <input
                    type="text"
                    [(ngModel)]="profile.name"
                    name="name"
                    class="form-control"
                    placeholder="Ramesh Kumar"
                    required
                  />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Email Address</label>
                  <input
                    type="email"
                    [(ngModel)]="profile.email"
                    name="email"
                    class="form-control"
                    placeholder="ramesh.kumar@gmail.com"
                    required
                  />
                </div>
              </div>

              <div class="form-row mt-2">
                <div class="form-group flex-1">
                  <label class="form-label">Phone Number</label>
                  <input
                    type="text"
                    [(ngModel)]="profile.phone"
                    name="phone"
                    class="form-control"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Date of Birth</label>
                  <div class="input-icon-right">
                    <input
                      type="text"
                      [(ngModel)]="dateOfBirth"
                      name="dob"
                      class="form-control"
                      placeholder="12 Jan 1990"
                    />
                    <i class="fa-regular fa-calendar icon-right"></i>
                  </div>
                </div>
              </div>

              <div class="form-row mt-2">
                <div class="form-group flex-1">
                  <label class="form-label">Gender</label>
                  <select [(ngModel)]="gender" name="gender" class="form-control">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">{{ profile.role === 'FARMER' ? 'Farmer Type' : 'Entity Type' }}</label>
                  <select [(ngModel)]="farmerType" name="farmerType" class="form-control">
                    <option value="Individual Farmer">Individual Farmer</option>
                    <option value="Commercial Buyer">Commercial Buyer</option>
                    <option value="FPO Partner">FPO Partner</option>
                    <option value="Agri Processor">Agri Processor</option>
                  </select>
                </div>
              </div>

              <div class="form-row mt-2">
                <div class="form-group flex-1">
                  <label class="form-label">Aadhaar Number</label>
                  <div class="input-icon-right">
                    <input
                      [type]="showAadhaar ? 'text' : 'password'"
                      [(ngModel)]="aadhaarNumber"
                      name="aadhaar"
                      class="form-control"
                      placeholder="**** **** 1234"
                    />
                    <button type="button" class="btn-toggle-eye" (click)="showAadhaar = !showAadhaar">
                      <i class="fa-solid" [ngClass]="showAadhaar ? 'fa-eye-slash' : 'fa-eye'"></i>
                    </button>
                  </div>
                </div>
                <div class="flex-1"></div>
              </div>

              <div class="form-actions mt-3">
                <button type="submit" class="btn-submit-green">Update Profile</button>
              </div>
            </form>
          </div>

          <!-- TAB 2: ADDRESS (Matches image11.png) -->
          <div *ngIf="activeTab === 'address'" class="tab-content">
            <div class="panel-heading">
              <i class="fa-solid fa-location-dot text-emerald"></i>
              <h3>Address Information</h3>
            </div>

            <form (ngSubmit)="saveAddress()" class="form-body">
              <div class="form-group">
                <label class="form-label">Address Line 1</label>
                <input
                  type="text"
                  [(ngModel)]="addressLine1"
                  name="address1"
                  class="form-control"
                  placeholder="123, North Street"
                  required
                />
              </div>

              <div class="form-group mt-2">
                <label class="form-label">Address Line 2</label>
                <input
                  type="text"
                  [(ngModel)]="addressLine2"
                  name="address2"
                  class="form-control"
                  placeholder="Pallipalayam"
                />
              </div>

              <div class="form-row mt-2">
                <div class="form-group flex-1">
                  <label class="form-label">City / Town</label>
                  <input
                    type="text"
                    [(ngModel)]="city"
                    name="city"
                    class="form-control"
                    placeholder="Erode"
                    required
                  />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">State</label>
                  <select [(ngModel)]="state" name="state" class="form-control">
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Pincode</label>
                  <input
                    type="text"
                    [(ngModel)]="pincode"
                    name="pincode"
                    class="form-control"
                    placeholder="638006"
                    required
                  />
                </div>
              </div>

              <div class="form-actions mt-3">
                <button type="submit" class="btn-submit-green">Update Address</button>
              </div>
            </form>
          </div>

          <!-- TAB 3: BANK DETAILS (Matches image12.png) -->
          <div *ngIf="activeTab === 'bank'" class="tab-content">
            <div class="panel-heading">
              <i class="fa-solid fa-building-columns text-emerald"></i>
              <div>
                <h3>Bank Details</h3>
                <span class="subtext">Your bank account details will be used for receiving payments.</span>
              </div>
            </div>

            <form (ngSubmit)="saveBankDetails()" class="form-body">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Account Holder Name</label>
                  <input
                    type="text"
                    [(ngModel)]="accountHolderName"
                    name="accHolder"
                    class="form-control"
                    placeholder="Ramesh Kumar"
                    required
                  />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Bank Name</label>
                  <select [(ngModel)]="bankName" name="bankName" class="form-control">
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Punjab National Bank">Punjab National Bank</option>
                    <option value="Bank of Baroda">Bank of Baroda</option>
                  </select>
                </div>
              </div>

              <div class="form-row mt-2">
                <div class="form-group flex-1">
                  <label class="form-label">Account Number</label>
                  <div class="input-icon-right">
                    <input
                      [type]="showAccountNum ? 'text' : 'password'"
                      [(ngModel)]="accountNumber"
                      name="accNum"
                      class="form-control"
                      placeholder="**** **** **** 1234"
                      required
                    />
                    <button type="button" class="btn-toggle-eye" (click)="showAccountNum = !showAccountNum">
                      <i class="fa-solid" [ngClass]="showAccountNum ? 'fa-eye-slash' : 'fa-eye'"></i>
                    </button>
                  </div>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">IFSC Code</label>
                  <input
                    type="text"
                    [(ngModel)]="ifscCode"
                    name="ifsc"
                    class="form-control"
                    placeholder="SBIN0001234"
                    required
                  />
                </div>
              </div>

              <div class="form-row mt-2">
                <div class="form-group flex-1">
                  <label class="form-label">Account Type</label>
                  <select [(ngModel)]="accountType" name="accType" class="form-control">
                    <option value="Savings Account">Savings Account</option>
                    <option value="Current Account">Current Account</option>
                  </select>
                </div>
                <div class="flex-1"></div>
              </div>

              <div class="form-actions mt-3">
                <button type="submit" class="btn-submit-green">Update Bank Details</button>
              </div>
            </form>
          </div>

          <!-- TAB 4: CHANGE PASSWORD (Matches image13.png) -->
          <div *ngIf="activeTab === 'password'" class="tab-content">
            <div class="panel-heading">
              <i class="fa-solid fa-lock text-emerald"></i>
              <div>
                <h3>Change Password</h3>
                <span class="subtext">Update your password to keep your account secure.</span>
              </div>
            </div>

            <div class="password-layout mt-3">
              <form (ngSubmit)="savePassword()" class="pwd-form flex-1">
                <div class="form-group">
                  <label class="form-label">Current Password</label>
                  <div class="input-icon-right">
                    <input
                      [type]="showCurrentPwd ? 'text' : 'password'"
                      [(ngModel)]="currentPassword"
                      name="currPwd"
                      class="form-control"
                      placeholder="Enter current password"
                      autocomplete="current-password"
                      required
                    />
                    <button type="button" class="btn-toggle-eye" (click)="showCurrentPwd = !showCurrentPwd">
                      <i class="fa-solid" [ngClass]="showCurrentPwd ? 'fa-eye-slash' : 'fa-eye'"></i>
                    </button>
                  </div>
                </div>

                <div class="form-group mt-2">
                  <label class="form-label">New Password</label>
                  <div class="input-icon-right">
                    <input
                      [type]="showNewPwd ? 'text' : 'password'"
                      [(ngModel)]="newPassword"
                      name="newPwd"
                      class="form-control"
                      placeholder="Enter new password (min. 6 characters)"
                      autocomplete="new-password"
                      required
                    />
                    <button type="button" class="btn-toggle-eye" (click)="showNewPwd = !showNewPwd">
                      <i class="fa-solid" [ngClass]="showNewPwd ? 'fa-eye-slash' : 'fa-eye'"></i>
                    </button>
                  </div>
                </div>

                <div class="form-group mt-2">
                  <label class="form-label">Confirm New Password</label>
                  <div class="input-icon-right">
                    <input
                      [type]="showConfirmPwd ? 'text' : 'password'"
                      [(ngModel)]="confirmPassword"
                      name="confPwd"
                      class="form-control"
                      placeholder="Confirm new password"
                      autocomplete="new-password"
                      required
                    />
                    <button type="button" class="btn-toggle-eye" (click)="showConfirmPwd = !showConfirmPwd">
                      <i class="fa-solid" [ngClass]="showConfirmPwd ? 'fa-eye-slash' : 'fa-eye'"></i>
                    </button>
                  </div>
                </div>

                <div class="form-actions mt-3">
                  <button type="submit" class="btn-submit-green">Update Password</button>
                </div>
              </form>

              <!-- Password Requirements Box -->
              <div class="pwd-requirements-box">
                <div class="req-header">
                  <i class="fa-solid fa-shield-check text-emerald"></i>
                  <strong>Password Requirements</strong>
                </div>
                <ul class="req-list">
                  <li><i class="fa-solid fa-check text-emerald"></i> At least 8 characters long</li>
                  <li><i class="fa-solid fa-check text-emerald"></i> Contains at least one uppercase letter</li>
                  <li><i class="fa-solid fa-check text-emerald"></i> Contains at least one lowercase letter</li>
                  <li><i class="fa-solid fa-check text-emerald"></i> Contains at least one number</li>
                  <li><i class="fa-solid fa-check text-emerald"></i> Contains at least one special character (e.g. ! &#64; # $ % ^ & *)</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        <!-- Right Side: Account Status & Account Summary Cards -->
        <div class="profile-side-column">
          <!-- Card 1: Account Status -->
          <div class="card status-panel shadow-sm">
            <div class="panel-subhead">
              <i class="fa-solid fa-shield-check text-emerald"></i>
              <strong>Account Status</strong>
            </div>
            <div class="status-badge-hero mt-3">
              <div class="large-shield-circle">
                <i class="fa-solid fa-check"></i>
              </div>
              <h4 class="status-hero-title">Verified Farmer</h4>
              <p class="status-hero-sub">Your account is verified and active.</p>
            </div>
          </div>

          <!-- Card 2: Account Summary -->
          <div class="card summary-panel shadow-sm mt-3">
            <div class="panel-subhead">
              <i class="fa-solid fa-chart-simple text-emerald"></i>
              <strong>Account Summary</strong>
            </div>

            <div class="summary-items-list mt-3">
              <div class="summary-row">
                <div class="d-flex align-center gap-2">
                  <i class="fa-solid fa-seedling text-emerald"></i>
                  <span>Total Crops Listed</span>
                </div>
                <strong class="text-emerald">12</strong>
              </div>

              <div class="summary-row">
                <div class="d-flex align-center gap-2">
                  <i class="fa-solid fa-box text-primary"></i>
                  <span>Total Orders</span>
                </div>
                <strong class="text-primary">18</strong>
              </div>

              <div class="summary-row">
                <div class="d-flex align-center gap-2">
                  <i class="fa-solid fa-comments text-amber"></i>
                  <span>Total Negotiations</span>
                </div>
                <strong class="text-amber">25</strong>
              </div>

              <div class="summary-row">
                <div class="d-flex align-center gap-2">
                  <i class="fa-regular fa-calendar text-purple"></i>
                  <span>Member Since</span>
                </div>
                <strong class="text-purple">Sep 2024</strong>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .profile-container { display: flex; flex-direction: column; gap: 1rem; }

    /* Top Hero Banner (Matching image10.png) */
    .profile-hero-banner {
      background: linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('/assets/images/sunset-banner.jpg') center/cover no-repeat;
      border-radius: 14px;
      padding: 1.8rem 2.5rem;
      color: white;
      display: flex;
      align-items: center;
      gap: 2rem;
      min-height: 160px;
    }
    .avatar-wrapper { position: relative; width: 100px; height: 100px; }
    .profile-avatar-img {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      object-fit: cover;
    }
    .camera-btn {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #16a34a;
      color: white;
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      cursor: pointer;
    }

    .profile-header-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .profile-user-name { font-size: 1.8rem; font-weight: 800; color: #fff; margin: 0; }
    .profile-user-role { font-size: 0.95rem; color: #f1f5f9; }
    .verified-pill {
      background: #ffffff;
      color: #0f172a;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      width: fit-content;
      margin-top: 0.2rem;
    }
    .member-since-text { font-size: 0.78rem; color: #e2e8f0; margin-top: 0.2rem; }

    /* Navigation Tabs */
    .profile-nav-tabs {
      display: flex;
      border-bottom: 2px solid #e2e8f0;
      gap: 1.5rem;
      margin-top: 0.5rem;
    }
    .tab-btn {
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      padding: 0.75rem 0.5rem;
      font-size: 0.92rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.15s ease;
      margin-bottom: -2px;
    }
    .tab-btn.active {
      color: #16a34a;
      border-bottom-color: #16a34a;
      font-weight: 700;
    }

    /* Main Grid */
    .profile-main-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 1.25rem;
    }
    .form-panel { padding: 1.75rem 2rem; border-radius: 12px; }
    .panel-heading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.85rem;
      margin-bottom: 1.25rem;
    }
    .panel-heading i { font-size: 1.25rem; }
    .panel-heading h3 { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0; }
    .subtext { font-size: 0.8rem; color: #64748b; }

    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-label { font-size: 0.82rem; font-weight: 700; color: #334155; }
    .form-control {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.65rem 0.85rem;
      font-size: 0.88rem;
      color: #0f172a;
      background: #f8fafc;
      outline: none;
      transition: border 0.15s;
    }
    .form-control:focus { border-color: #16a34a; background: #fff; }

    .input-icon-right { position: relative; }
    .input-icon-right .form-control { width: 100%; padding-right: 2.4rem; }
    .icon-right {
      position: absolute;
      right: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      pointer-events: none;
    }
    .btn-toggle-eye {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
    }

    .form-actions { display: flex; justify-content: flex-end; }
    .btn-submit-green {
      background: #16a34a;
      color: white;
      font-weight: 700;
      font-size: 0.9rem;
      padding: 0.7rem 1.6rem;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-submit-green:hover { background: #15803d; }

    /* Change Password Tab Layout */
    .password-layout { display: flex; gap: 1.5rem; }
    .pwd-requirements-box {
      width: 280px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 1.1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .req-header { display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; color: #166534; }
    .req-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .req-list li { font-size: 0.78rem; color: #1e293b; display: flex; align-items: center; gap: 0.5rem; }

    /* Right Side Panels */
    .status-panel, .summary-panel { padding: 1.25rem 1.4rem; border-radius: 12px; }
    .panel-subhead { display: flex; align-items: center; gap: 0.5rem; font-size: 0.92rem; color: #0f172a; }
    .status-badge-hero {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .large-shield-circle {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: #16a34a;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .status-hero-title { font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0 0 0.2rem 0; }
    .status-hero-sub { font-size: 0.78rem; color: #64748b; margin: 0; }

    .summary-items-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .summary-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.85rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .mt-2 { margin-top: 0.6rem; }
    .mt-3 { margin-top: 1rem; }
    .text-emerald { color: #16a34a; }
    .text-primary { color: #2563eb; }
    .text-amber { color: #f59e0b; }
    .text-purple { color: #9333ea; }
    .d-flex { display: flex; }
    .align-center { align-items: center; }
    .gap-2 { gap: 0.5rem; }

    @media (max-width: 900px) {
      .profile-main-grid { grid-template-columns: 1fr; }
      .password-layout { flex-direction: column; }
      .pwd-requirements-box { width: 100%; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  activeTab: 'personal' | 'address' | 'bank' | 'password' = 'personal';

  profile: UserProfileData = {
    userId: null as any,
    name: null as any,
    email: null as any,
    phone: null as any,
    role: null as any,
    address: null as any
  };

  // Personal
  dateOfBirth: string | null = null;
  gender: string | null = null;
  farmerType: string | null = null;
  aadhaarNumber: string | null = null;
  showAadhaar = false;

  // Address
  addressLine1: string | null = null;
  addressLine2: string | null = null;
  city: string | null = null;
  state: string | null = null;
  pincode: string | null = null;

  // Bank
  accountHolderName: string | null = null;
  bankName: string | null = null;
  accountNumber: string | null = null;
  ifscCode: string | null = null;
  accountType: string | null = null;
  showAccountNum = false;

  // Password
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrentPwd = false;
  showNewPwd = false;
  showConfirmPwd = false;

  profileAvatar = '';
  successMessage = '';
  errorMessage = '';

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((u: User | null) => {
      if (u) {
        if (u.avatar) this.profileAvatar = u.avatar;
        this.profile.name = u.fullName || u.username || null as any;
        this.profile.email = u.email || null as any;
        this.profile.phone = u.phone || null as any;
        this.profile.role = u.role || null as any;
        this.profile.address = u.address || null as any;
        this.addressLine1 = u.address || null;

        const uid = u.id || u.userId || 'default-user';
        const savedExtra = localStorage.getItem('cropdeal_profile_extra_' + uid);
        if (savedExtra) {
          try {
            const data = JSON.parse(savedExtra);
            if (data.aadhaarNumber != null) this.aadhaarNumber = data.aadhaarNumber;
            if (data.dateOfBirth != null) this.dateOfBirth = data.dateOfBirth;
            if (data.gender != null) this.gender = data.gender;
            if (data.farmerType != null) this.farmerType = data.farmerType;
            if (data.addressLine1 != null) this.addressLine1 = data.addressLine1;
            if (data.addressLine2 != null) this.addressLine2 = data.addressLine2;
            if (data.city != null) this.city = data.city;
            if (data.state != null) this.state = data.state;
            if (data.pincode != null) this.pincode = data.pincode;
            if (data.accountHolderName != null) this.accountHolderName = data.accountHolderName;
            if (data.bankName != null) this.bankName = data.bankName;
            if (data.accountNumber != null) this.accountNumber = data.accountNumber;
            if (data.ifscCode != null) this.ifscCode = data.ifscCode;
            if (data.accountType != null) this.accountType = data.accountType;
          } catch (e) {
            console.error('Error parsing profile extras:', e);
          }
        }
      }
    });
  }

  private persistExtras(): void {
    const user = this.authService.currentUserValue;
    const uid = user?.id || user?.userId || 'default-user';
    const extras = {
      aadhaarNumber: this.aadhaarNumber,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      farmerType: this.farmerType,
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
      city: this.city,
      state: this.state,
      pincode: this.pincode,
      accountHolderName: this.accountHolderName,
      bankName: this.bankName,
      accountNumber: this.accountNumber,
      ifscCode: this.ifscCode,
      accountType: this.accountType
    };
    localStorage.setItem('cropdeal_profile_extra_' + uid, JSON.stringify(extras));
  }

  saveProfile(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      const updatedUser: User = {
        ...user,
        fullName: this.profile.name || user.fullName,
        email: this.profile.email || user.email || '',
        phone: this.profile.phone || user.phone
      };
      this.authService.updateStoredUser(updatedUser);
      this.userService.updateMasterUser({
        id: user.id,
        role: user.role,
        fullName: this.profile.name || undefined,
        email: this.profile.email || undefined,
        phone: this.profile.phone || undefined
      });

      this.userService.updateProfile(user.role, {
        userId: user.id,
        name: this.profile.name,
        email: this.profile.email,
        phone: this.profile.phone,
        address: this.profile.address || this.addressLine1,
        role: user.role,
        farmLocation: this.profile.address || this.addressLine1,
        businessName: this.profile.name,
        bankDetails: `${this.bankName} - A/C: ${this.accountNumber} - IFSC: ${this.ifscCode}`
      }).subscribe();
    }
    this.persistExtras();
    this.successMessage = 'Profile information updated and saved in database!';
    setTimeout(() => this.successMessage = '', 4000);
  }

  saveAddress(): void {
    const fullAddr = `${this.addressLine1}, ${this.addressLine2}, ${this.city}, ${this.state} - ${this.pincode}`;
    this.profile.address = fullAddr;
    const user = this.authService.currentUserValue;
    if (user) {
      const updatedUser: User = {
        ...user,
        address: fullAddr
      };
      this.authService.updateStoredUser(updatedUser);
      this.userService.updateMasterUser({
        id: user.id,
        role: user.role,
        address: fullAddr
      });

      this.userService.updateProfile(user.role, {
        userId: user.id,
        name: this.profile.name || user.fullName,
        email: this.profile.email || user.email,
        phone: this.profile.phone || user.phone,
        address: fullAddr,
        role: user.role,
        farmLocation: fullAddr,
        businessName: this.profile.name || user.fullName,
        bankDetails: `${this.bankName} - A/C: ${this.accountNumber} - IFSC: ${this.ifscCode}`
      }).subscribe();
    }
    this.persistExtras();
    this.successMessage = 'Address updated and saved in database!';
    setTimeout(() => this.successMessage = '', 4000);
  }

  saveBankDetails(): void {
    const bankStr = `${this.bankName} - A/C: ${this.accountNumber} - IFSC: ${this.ifscCode}`;
    const user = this.authService.currentUserValue;
    if (user) {
      this.userService.updateProfile(user.role, {
        userId: user.id,
        name: this.profile.name || user.fullName,
        email: this.profile.email || user.email,
        phone: this.profile.phone || user.phone,
        address: this.profile.address || user.address,
        role: user.role,
        farmLocation: this.profile.address || user.address,
        businessName: this.profile.name || user.fullName,
        bankDetails: bankStr
      }).subscribe();
    }
    this.persistExtras();
    this.successMessage = 'Bank settlement details updated and saved in database!';
    setTimeout(() => this.successMessage = '', 4000);
  }

  savePassword(): void {
    if (!this.currentPassword) {
      this.errorMessage = 'Please enter your current password.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }
    if (!this.newPassword || this.newPassword.length < 6) {
      this.errorMessage = 'New password must be at least 6 characters.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'New password and confirmation password do not match.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }

    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: (res: any) => {
        this.successMessage = res?.message || 'Password updated successfully in database!';
        this.errorMessage = '';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err: any) => {
        this.errorMessage = err?.error?.message || err?.message || 'Failed to update password. Please check your current password.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file (PNG, JPG, JPEG).';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'File size exceeds 5MB limit. Please choose a smaller photo.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.profileAvatar = dataUrl;
      this.authService.updateUserAvatar(dataUrl);
      this.successMessage = 'Profile photo updated successfully from your device!';
      setTimeout(() => this.successMessage = '', 4000);
    };
    reader.readAsDataURL(file);
  }

  onAvatarError(event: any): void {
    event.target.src = '/assets/images/farmer-avatar.jpg';
  }

  getRoleTitle(role: string): string {
    switch (role) {
      case 'FARMER': return 'Farmer';
      case 'DEALER': return 'Commercial Dealer';
      case 'DELIVERY_PARTNER': case 'DELIVERY': return 'Logistics Delivery Partner';
      case 'ADMIN': return 'Administrator';
      default: return role;
    }
  }
}
