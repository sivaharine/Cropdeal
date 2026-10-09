import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  // Sidebar starts hidden; only exposed when user clicks Dashboard or is on dashboard routes
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  public isOpen$ = this.isOpenSubject.asObservable();

  // Sidebar minimize state (slim icon-only mode vs full expanded mode)
  private isMinimizedSubject = new BehaviorSubject<boolean>(false);
  public isMinimized$ = this.isMinimizedSubject.asObservable();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Listen to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url || '';
      const isAuthenticated = this.authService.isAuthenticated();

      if (!isAuthenticated) {
        // Unauthenticated users NEVER have sidebar open
        this.isOpenSubject.next(false);
      } else {
        // Common public sections: Home, Mandhi Price, Live Bidding -> HIDE sidebar
        const isCommonPage = url === '/' ||
          url === '/landing' ||
          url.startsWith('/landing') ||
          url.startsWith('/price-alerts') ||
          (url.startsWith('/bidding') && !url.startsWith('/my-biddings'));

        // Dashboard & management sections -> ALWAYS SHOW sidebar
        const isDashboardPage = url.startsWith('/dashboard') ||
          url.startsWith('/orders') ||
          url.startsWith('/wallet') ||
          url.startsWith('/deliveries') ||
          url.startsWith('/reports') ||
          url.startsWith('/negotiations') ||
          url.startsWith('/crops') ||
          url.startsWith('/admin') ||
          url.startsWith('/profile') ||
          url.startsWith('/alerts') ||
          url.startsWith('/my-biddings');

        if (isCommonPage) {
          this.isOpenSubject.next(false);
        } else if (isDashboardPage) {
          this.isOpenSubject.next(true);
        }
      }
    });

    // Initial check on initialization
    try {
      const initUrl = window.location.pathname || '';
      if (this.authService.isAuthenticated()) {
        if (initUrl === '/' || initUrl === '/landing' || initUrl.startsWith('/price-alerts') || (initUrl.startsWith('/bidding') && !initUrl.startsWith('/my-biddings'))) {
          this.isOpenSubject.next(false);
        } else if (initUrl.startsWith('/dashboard') || initUrl.startsWith('/orders') || initUrl.startsWith('/wallet') || initUrl.startsWith('/deliveries') || initUrl.startsWith('/reports') || initUrl.startsWith('/negotiations') || initUrl.startsWith('/crops') || initUrl.startsWith('/admin') || initUrl.startsWith('/profile') || initUrl.startsWith('/alerts') || initUrl.startsWith('/my-biddings')) {
          this.isOpenSubject.next(true);
        }
      }
    } catch {}

    // Listen to authentication changes
    this.authService.currentUser$.subscribe(user => {
      if (!user) {
        this.isOpenSubject.next(false);
      }
    });
  }

  get isOpen(): boolean {
    return this.isOpenSubject.value;
  }

  get isMinimized(): boolean {
    return this.isMinimizedSubject.value;
  }

  open(): void {
    if (this.authService.isAuthenticated()) {
      this.isOpenSubject.next(true);
    }
  }

  close(): void {
    this.isOpenSubject.next(false);
  }

  toggle(): void {
    if (this.authService.isAuthenticated()) {
      this.isOpenSubject.next(!this.isOpenSubject.value);
    }
  }

  toggleMinimize(): void {
    this.isMinimizedSubject.next(!this.isMinimizedSubject.value);
  }

  setMinimized(minimized: boolean): void {
    this.isMinimizedSubject.next(minimized);
  }
}
