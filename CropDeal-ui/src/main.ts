import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => {
    console.error('Angular Bootstrap Error:', err);
    // Show visible error on the page so it's not a silent white page
    const root = document.querySelector('app-root');
    if (root) {
      root.innerHTML = `
        <div style="font-family:sans-serif;padding:2rem;background:#fff;color:#333;min-height:100vh;">
          <h2 style="color:#c00;">⚠️ CropDeal App Failed to Load</h2>
          <p>Angular bootstrap error detected. Please check browser Console (F12) for details.</p>
          <pre style="background:#f5f5f5;padding:1rem;border-radius:8px;overflow:auto;font-size:0.85rem;color:#c00;">${err?.message || String(err)}</pre>
          <p style="color:#666;">Common fixes: Clear browser cache (Ctrl+Shift+R), check that all backend services are running.</p>
        </div>`;
    }
  });
