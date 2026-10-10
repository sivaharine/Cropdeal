import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUserValue;
  if (currentUser && (currentUser.status === 'BLOCKED' || (currentUser as any).isBlocked) && currentUser.role !== 'ADMIN') {
    authService.logout();
    router.navigate(['/auth/login'], { queryParams: { blocked: 'true' } });
    return false;
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
