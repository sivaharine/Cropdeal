import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token;

  // Skip auto-injection if the request already has an Authorization header
  // (e.g. logout sends it manually with the pre-cleared token).
  const alreadyHasAuth = req.headers.has('Authorization');

  if (token && req.url.includes('/api/') && !alreadyHasAuth) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};
