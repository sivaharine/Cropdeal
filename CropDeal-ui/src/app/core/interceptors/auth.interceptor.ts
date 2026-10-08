import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const user = this.authService.currentUser;
    if (user?.token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${user.token}`,
          'X-User-Role': user.role,
          'X-User-Id': user.userId.toString()
        }
      });
    }
    return next.handle(request);
  }
}
