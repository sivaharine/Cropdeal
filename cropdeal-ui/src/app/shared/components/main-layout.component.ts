import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './header.component';
import { SidebarComponent } from './sidebar.component';
import { ChatbotComponent } from './chatbot.component';
import { AuthModalComponent } from './auth-modal.component';
import { SidebarService } from '../../core/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent, ChatbotComponent, AuthModalComponent],
  template: `
    <div class="app-layout">
      <!-- Fixed Top Navbar: Spans 100% width across all pages, logo never overlapped -->
      <app-header></app-header>

      <div class="layout-body" [class.has-sidebar]="isSidebarVisible">
        <!-- Sidebar: ONLY exposed when authenticated AND explicitly on dashboard / management routes -->
        <app-sidebar *ngIf="isSidebarVisible"></app-sidebar>

        <main class="main-content" [class.no-sidebar]="!isSidebarVisible">
          <div class="content-wrapper" [class.landing-mode]="isLandingPage" [class.full-bleed]="!isSidebarVisible">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <app-chatbot></app-chatbot>
      <app-auth-modal></app-auth-modal>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background-color: var(--bg-page, #f8fafc);
      width: 100%;
    }
    .layout-body {
      margin-top: 70px;
      display: flex;
      flex: 1;
      min-height: calc(100vh - 70px);
      width: 100%;
      position: relative;
    }
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow-x: hidden;
      transition: all 0.2s ease-in-out;
      background: var(--bg-page, #f8fafc);
    }
    .main-content.no-sidebar {
      width: 100%;
      flex: 1 1 100%;
    }
    .content-wrapper {
      flex: 1;
      padding: 1.5rem 2rem;
      max-width: 1440px;
      margin: 0 auto;
      width: 100%;
    }
    .content-wrapper.full-bleed {
      max-width: 100%;
      padding: 1.5rem 2.5rem;
    }
    .content-wrapper.landing-mode {
      padding: 0 !important;
      max-width: 100% !important;
      margin: 0 !important;
    }
    @media (max-width: 768px) {
      .content-wrapper, .content-wrapper.full-bleed {
        padding: 1rem;
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  isSidebarVisible = false;
  isLandingPage = false;
  private subs: Subscription[] = [];

  constructor(
    private sidebarService: SidebarService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check initial route for landing page full-width mode
    this.updateLandingState(this.router.url);

    // Track route changes for landing mode
    this.subs.push(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        this.updateLandingState(event.urlAfterRedirects || event.url);
      })
    );

    // Sidebar should ONLY be visible when user is authenticated AND sidebar is opened
    this.subs.push(
      combineLatest([
        this.sidebarService.isOpen$,
        this.authService.currentUser$
      ]).subscribe(([isOpen, user]) => {
        this.isSidebarVisible = isOpen && !!user;
      })
    );
  }

  private updateLandingState(url: string): void {
    const cleanUrl = url ? url.split('?')[0] : '';
    this.isLandingPage = cleanUrl === '' || cleanUrl === '/' || cleanUrl === '/landing';
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
