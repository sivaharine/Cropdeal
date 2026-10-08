package com.cropdeal.priceservice.startup;

import com.cropdeal.priceservice.config.GovernmentApiConfig;
import com.cropdeal.priceservice.service.PriceService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Synchronizes the latest government mandi prices once after the application
 * has completely started. A sync failure is logged but does not stop the app.
 */
@Component
public class GovernmentPriceStartupSync {

    private final PriceService priceService;
    private final GovernmentApiConfig config;

    public GovernmentPriceStartupSync(PriceService priceService, GovernmentApiConfig config) {
        this.priceService = priceService;
        this.config = config;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void synchronizeOnStartup() {
        if (!config.isSyncOnStartup()) {
            System.out.println("Startup government price sync is disabled via configuration.");
            return;
        }
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                System.out.println("Starting background government price sync from data.gov.in into database...");
                var result = priceService.syncLatestGovernmentPrices();
                System.out.println("Startup government price sync completed: "
                        + result.getMessage()
                        + ", processed=" + result.getProcessed()
                        + ", inserted=" + result.getInserted()
                        + ", updated=" + result.getUpdated()
                        + ", latestDate=" + result.getLatestDate());
            } catch (Exception e) {
                System.err.println("Startup government price sync notice (service continues normally): " + e.getMessage());
            }
        });
    }
}
