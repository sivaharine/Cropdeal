import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { CropCatalogComponent } from './features/catalog/crop-catalog/crop-catalog.component';

// Inline route guard — checks role before activating route
const roleGuard = (allowedRoles: string[]) => () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser;

  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }
  if (allowedRoles.includes(user.role)) {
    return true;
  }
  // Redirect to their own dashboard
  switch (user.role) {
    case 'FARMER':           router.navigate(['/farmer/dashboard']);   break;
    case 'DEALER':           router.navigate(['/dealer/dashboard']);   break;
    case 'DELIVERY_PARTNER': router.navigate(['/delivery/dashboard']); break;
    case 'ADMIN':            router.navigate(['/admin/dashboard']);    break;
    default:                 router.navigate(['/catalog']);
  }
  return false;
};

const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.currentUser) {
    router.navigate(['/auth/login']);
    return false;
  }
  return true;
};

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'catalog'
  },
  {
    path: 'catalog',
    component: CropCatalogComponent,
    canActivate: [authGuard]
  },
  {
    path: 'bidding',
    loadComponent: () => import('./features/bidding/bidding-hub/bidding-hub.component').then(m => m.BiddingHubComponent),
    canActivate: [authGuard]
  },
  {
    path: 'prices',
    loadComponent: () => import('./features/prices/price-ticker/price-ticker.component').then(m => m.PriceTickerComponent),
    canActivate: [authGuard]
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/orders/order-list/order-list.component').then(m => m.OrderListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'negotiations',
    loadComponent: () => import('./features/negotiations/negotiation-hub/negotiation-hub.component').then(m => m.NegotiationHubComponent),
    canActivate: [authGuard]
  },
  {
    path: 'wallet',
    loadComponent: () => import('./features/wallet/wallet-dashboard/wallet-dashboard.component').then(m => m.WalletDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'farmer/dashboard',
    loadComponent: () => import('./features/farmer/farmer-dashboard/farmer-dashboard.component').then(m => m.FarmerDashboardComponent),
    canActivate: [roleGuard(['FARMER'])]
  },
  {
    path: 'dealer/dashboard',
    loadComponent: () => import('./features/dealer/dealer-dashboard/dealer-dashboard.component').then(m => m.DealerDashboardComponent),
    canActivate: [roleGuard(['DEALER'])]
  },
  {
    path: 'delivery/dashboard',
    loadComponent: () => import('./features/delivery/delivery-dashboard/delivery-dashboard.component').then(m => m.DeliveryDashboardComponent),
    canActivate: [roleGuard(['DELIVERY_PARTNER'])]
  },
  {
    path: 'delivery/my-deliveries',
    loadComponent: () => import('./features/delivery/my-deliveries/my-deliveries.component').then(m => m.MyDeliveriesComponent),
    canActivate: [roleGuard(['DELIVERY_PARTNER'])]
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [roleGuard(['ADMIN'])]
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./features/admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent),
    canActivate: [roleGuard(['ADMIN'])]
  },
  {
    path: 'admin/reports',
    loadComponent: () => import('./features/admin/admin-reports/admin-reports.component').then(m => m.AdminReportsComponent),
    canActivate: [roleGuard(['ADMIN'])]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/my-profile/my-profile.component').then(m => m.MyProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '**',
    redirectTo: 'catalog'
  }
];
