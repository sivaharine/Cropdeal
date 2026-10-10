import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/components/main-layout.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { LandingComponent } from './features/landing/landing.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CropListComponent } from './features/crops/crop-list.component';
import { CropAddComponent } from './features/crops/crop-add.component';
import { CropSubscriptionsComponent } from './features/crops/crop-subscriptions.component';
import { OrderListComponent } from './features/orders/order-list.component';
import { BiddingComponent } from './features/bidding/bidding.component';
import { NegotiationsComponent } from './features/negotiations/negotiations.component';
import { WalletComponent } from './features/wallet/wallet.component';
import { DeliveriesComponent } from './features/deliveries/deliveries.component';
import { PriceAlertsComponent } from './features/price-alerts/price-alerts.component';
import { AlertsComponent } from './features/alerts/alerts.component';
import { MyBiddingsComponent } from './features/bidding/my-biddings.component';
import { ProfileComponent } from './features/profile/profile.component';
import { AdminUsersComponent } from './features/admin/admin-users.component';
import { AdminCropsComponent } from './features/admin/admin-crops.component';
import { AdminBiddingsComponent } from './features/admin/admin-biddings.component';
import { AdminReportsComponent } from './features/admin/admin-reports.component';
import { AdminReviewsComponent } from './features/admin/admin-reviews.component';
import { ReportsComponent } from './features/reports/reports.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: LandingComponent },
      { path: 'landing', component: LandingComponent },
      { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
      { path: 'crops', component: CropListComponent },
      { path: 'crops/add', component: CropAddComponent, canActivate: [authGuard] },
      { path: 'crops/subscriptions', component: CropSubscriptionsComponent, canActivate: [authGuard] },
      { path: 'price-alerts', component: PriceAlertsComponent },
      { path: 'alerts', component: AlertsComponent, canActivate: [authGuard] },
      { path: 'orders', component: OrderListComponent, canActivate: [authGuard] },
      { path: 'bidding', component: BiddingComponent },
      { path: 'my-biddings', component: MyBiddingsComponent, canActivate: [authGuard] },
      { path: 'negotiations', component: NegotiationsComponent, canActivate: [authGuard] },
      { path: 'wallet', component: WalletComponent, canActivate: [authGuard] },
      { path: 'deliveries', component: DeliveriesComponent, canActivate: [authGuard] },
      { path: 'reports', component: ReportsComponent, canActivate: [authGuard] },
      { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
      {
        path: 'admin',
        canActivate: [authGuard],
        children: [
          { path: 'users', component: AdminUsersComponent },
          { path: 'crops', component: AdminCropsComponent },
          { path: 'biddings', component: AdminBiddingsComponent },
          { path: 'reports', component: ReportsComponent },
          { path: 'reviews', component: AdminReviewsComponent },
          { path: '', redirectTo: 'users', pathMatch: 'full' }
        ]
      }
    ]
  },
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
