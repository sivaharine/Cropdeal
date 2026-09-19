package com.cropdeal.priceservice.startup;

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

    public GovernmentPriceStartupSync(PriceService priceService) {
        this.priceService = priceService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void synchronizeOnStartup() {
        try {
            var result = priceService.syncLatestGovernmentPrices();
            System.out.println("Startup government price sync completed: "
                    + result.getMessage()
                    + ", processed=" + result.getProcessed()
                    + ", inserted=" + result.getInserted()
                    + ", updated=" + result.getUpdated()
                    + ", latestDate=" + result.getLatestDate());
        } catch (Exception e) {
            System.err.println("Startup government price sync failed: " + e.getMessage());
        }
    }
}
