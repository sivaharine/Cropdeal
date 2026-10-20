import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/components/main-layout.component';
import { LandingComponent } from './features/landing/landing.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CropListComponent } from './features/crops/crop-list.component';
import { CropAddComponent } from './features/crops/crop-add.component';
import { CropSubscriptionsComponent } from './features/crops/crop-subscriptions.component';
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
      { path: 'crops/subscriptions', component: CropSubscriptionsComponent, canActivate: [authGuard] }
    ]
  },
  { path: '**', redirectTo: '' }
];
