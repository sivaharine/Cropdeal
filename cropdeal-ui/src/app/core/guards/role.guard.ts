import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRoles = route.data?.['roles'] as UserRole[];

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (expectedRoles && expectedRoles.length > 0) {
    if (!authService.hasRole(expectedRoles)) {
      router.navigate(['/dashboard']);
      return false;
    }
  }

  return true;
};
