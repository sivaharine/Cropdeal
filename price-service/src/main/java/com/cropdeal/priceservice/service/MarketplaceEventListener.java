package com.cropdeal.priceservice.service;

import com.cropdeal.priceservice.config.RabbitMQConfig;
import com.cropdeal.priceservice.dto.CropListingEvent;
import com.cropdeal.priceservice.dto.DealerBuyingRequestEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class MarketplaceEventListener {

    private static final Logger log = LoggerFactory.getLogger(MarketplaceEventListener.class);

    private final PriceAlertMatchingService matchingService;

    public MarketplaceEventListener(PriceAlertMatchingService matchingService) {
        this.matchingService = matchingService;
    }

    @RabbitListener(queues = RabbitMQConfig.CROP_LISTING_QUEUE)
    public void onCropListingCreated(CropListingEvent event) {
        try {
            log.info("Received CropListingEvent: cropId={}, commodity={}", event.getCropId(), event.getCommodity());
            matchingService.processFarmerListing(event);
        } catch (Exception e) {
            log.error("Error processing CropListingEvent: {}", e.getMessage(), e);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.BUYING_REQUEST_QUEUE)
    public void onBuyingRequestCreated(DealerBuyingRequestEvent event) {
        try {
            log.info("Received DealerBuyingRequestEvent: requestId={}, cropName={}", event.getRequestId(), event.getCropName());
            matchingService.processDealerBuyingRequest(event);
        } catch (Exception e) {
            log.error("Error processing DealerBuyingRequestEvent: {}", e.getMessage(), e);
        }
    }
}