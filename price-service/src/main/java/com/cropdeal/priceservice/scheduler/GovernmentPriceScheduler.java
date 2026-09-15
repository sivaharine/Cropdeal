package com.cropdeal.priceservice.scheduler;

import com.cropdeal.priceservice.service.PriceService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class GovernmentPriceScheduler {

    private final PriceService priceService;

    public GovernmentPriceScheduler(PriceService priceService) {
        this.priceService = priceService;
    }

    @Scheduled(cron = "${government.api.sync-cron}", zone = "Asia/Kolkata")
    public void synchronizeGovernmentPrices() {
        try {
            priceService.syncLatestGovernmentPrices();
        } catch (Exception e) {
            System.err.println("Government price synchronization failed: " + e.getMessage());
        }
    }
}
