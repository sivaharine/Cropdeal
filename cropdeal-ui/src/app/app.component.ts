import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'cropdeal-ui';

  ngOnInit(): void {
    const CLEAN_KEY = 'cropdeal_zero_seed_clean_v5';
    if (!localStorage.getItem(CLEAN_KEY)) {
      localStorage.removeItem('cropdeal_farmer_reviews');
      localStorage.removeItem('cropdeal_reviews');
      localStorage.removeItem('cropdeal_orders_cache');
      localStorage.removeItem('cropdeal_crops_cache');
      localStorage.removeItem('cropdeal_bidding_auctions');
      localStorage.removeItem('cropdeal_active_deliveries');
      localStorage.removeItem('cropdeal_negotiations');
      localStorage.removeItem('cropdeal_subscriptions');
      localStorage.removeItem('cropdeal_admin_reports');
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (
            k.startsWith('cropdeal_wallet_') ||
            k.startsWith('cropdeal_txns_') ||
            k.startsWith('cropdeal_notifications_') ||
            k.startsWith('cropdeal_subscriptions_')
          )) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch {}
      localStorage.setItem(CLEAN_KEY, 'true');
    }
  }
}
