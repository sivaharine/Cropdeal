import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      const expectedRoles = route.data['roles'] as Array<string>;
      if (expectedRoles && expectedRoles.length > 0) {
        const userRole = this.authService.currentRole;
        if (!expectedRoles.includes(userRole) && userRole !== 'ADMIN') {
          // If not permitted, navigate to their respective dashboard
          this.navigateToUserDashboard(userRole);
          return false;
        }
      }
      return true;
    }

    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  private navigateToUserDashboard(role: string): void {
    switch (role) {
      case 'FARMER':
        this.router.navigate(['/farmer/dashboard']);
        break;
      case 'DEALER':
        this.router.navigate(['/dealer/dashboard']);
        break;
      case 'DELIVERY_PARTNER':
        this.router.navigate(['/delivery/dashboard']);
        break;
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      default:
        this.router.navigate(['/catalog']);
    }
  }
}
