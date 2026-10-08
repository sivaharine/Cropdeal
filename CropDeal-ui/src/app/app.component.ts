import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ChatbotComponent } from './shared/components/chatbot/chatbot.component';
import { NotificationService, ToastMessage } from './core/services/notification.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    ChatbotComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  isSidebarCollapsed = false;
  isSidebarMobileOpen = false;
  toasts: ToastMessage[] = [];

  constructor(
    private notifService: NotificationService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.notifService.toasts$.subscribe(t => {
      this.toasts = t;
      this.cdr.markForCheck();
    });
  }

  toggleSidebar(): void {
    if (window.innerWidth <= 900) {
      this.isSidebarMobileOpen = !this.isSidebarMobileOpen;
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  closeMobileSidebar(): void {
    this.isSidebarMobileOpen = false;
  }

  removeToast(id: number): void {
    this.notifService.removeToast(id);
  }
}
