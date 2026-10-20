package com.cropdeal.pricealert.service;

import com.cropdeal.pricealert.dto.MatchCropListingRequest;
import com.cropdeal.pricealert.dto.MatchMarketPriceRequest;
import com.cropdeal.pricealert.dto.PriceAlertTriggeredEvent;
import com.cropdeal.pricealert.entity.DealerBuyingRequest;
import com.cropdeal.pricealert.entity.PriceAlertNotification;
import com.cropdeal.pricealert.entity.PriceAlertSubscription;
import com.cropdeal.pricealert.enums.AlertSourceType;
import com.cropdeal.pricealert.enums.BuyingRequestStatus;
import com.cropdeal.pricealert.enums.PriceCondition;
import com.cropdeal.pricealert.enums.UserRole;
import com.cropdeal.pricealert.repository.PriceAlertNotificationRepository;
import com.cropdeal.pricealert.repository.PriceAlertSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PriceAlertMatchingEngineTest {

    @Mock
    private PriceAlertSubscriptionRepository subscriptionRepository;

    @Mock
    private PriceAlertNotificationRepository notificationRepository;

    @Mock
    private PriceAlertPublisher alertPublisher;

    @InjectMocks
    private PriceAlertMatchingEngine matchingEngine;

    private PriceAlertSubscription dealerSub;
    private PriceAlertSubscription farmerSub;

    @BeforeEach
    void setUp() {
        dealerSub = PriceAlertSubscription.builder()
                .id(1L)
                .userId(10L)
                .userRole(UserRole.DEALER)
                .cropName("tomato")
                .targetPrice(new BigDecimal("30.00"))
                .priceCondition(PriceCondition.LESS_THAN_OR_EQUAL)
                .district("Erode")
                .state("Tamil Nadu")
                .unit("kg")
                .active(true)
                .build();

        farmerSub = PriceAlertSubscription.builder()
                .id(2L)
                .userId(20L)
                .userRole(UserRole.FARMER)
                .cropName("tomato")
                .targetPrice(new BigDecimal("30.00"))
                .priceCondition(PriceCondition.GREATER_THAN_OR_EQUAL)
                .district("Erode")
                .state("Tamil Nadu")
                .unit("kg")
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Evaluate price condition operations accurately")
    void testEvaluatePriceCondition() {
        BigDecimal target = new BigDecimal("30.00");

        // LESS_THAN
        assertTrue(matchingEngine.evaluatePriceCondition(PriceCondition.LESS_THAN, target, new BigDecimal("29.99")));
        assertFalse(matchingEngine.evaluatePriceCondition(PriceCondition.LESS_THAN, target, new BigDecimal("30.00")));

        // LESS_THAN_OR_EQUAL
        assertTrue(matchingEngine.evaluatePriceCondition(PriceCondition.LESS_THAN_OR_EQUAL, target, new BigDecimal("30.00")));
        assertTrue(matchingEngine.evaluatePriceCondition(PriceCondition.LESS_THAN_OR_EQUAL, target, new BigDecimal("25.00")));
        assertFalse(matchingEngine.evaluatePriceCondition(PriceCondition.LESS_THAN_OR_EQUAL, target, new BigDecimal("30.01")));

        // GREATER_THAN
        assertTrue(matchingEngine.evaluatePriceCondition(PriceCondition.GREATER_THAN, target, new BigDecimal("30.01")));
        assertFalse(matchingEngine.evaluatePriceCondition(PriceCondition.GREATER_THAN, target, new BigDecimal("30.00")));

        // GREATER_THAN_OR_EQUAL
        assertTrue(matchingEngine.evaluatePriceCondition(PriceCondition.GREATER_THAN_OR_EQUAL, target, new BigDecimal("30.00")));
        assertTrue(matchingEngine.evaluatePriceCondition(PriceCondition.GREATER_THAN_OR_EQUAL, target, new BigDecimal("35.00")));
        assertFalse(matchingEngine.evaluatePriceCondition(PriceCondition.GREATER_THAN_OR_EQUAL, target, new BigDecimal("29.99")));

        // EQUAL
        assertTrue(matchingEngine.evaluatePriceCondition(PriceCondition.EQUAL, target, new BigDecimal("30.00")));
        assertFalse(matchingEngine.evaluatePriceCondition(PriceCondition.EQUAL, target, new BigDecimal("30.01")));
    }

    @Test
    @DisplayName("Match farmer crop listing against dealer subscription")
    void testMatchCropListing_MatchesDealerSubscription() {
        when(subscriptionRepository.findActiveMatchingSubscriptionsByRole("tomato", UserRole.DEALER, "Erode"))
                .thenReturn(List.of(dealerSub));
        when(notificationRepository.existsBySubscriptionIdAndSourceTypeAndSourceId(1L, AlertSourceType.CROP_LISTING, 101L))
                .thenReturn(false);

        MatchCropListingRequest request = MatchCropListingRequest.builder()
                .listingId(101L)
                .farmerId(20L)
                .farmerName("Ramesh")
                .cropName("Tomato")
                .price(new BigDecimal("28.00"))
                .quantity(100.0)
                .unit("kg")
                .district("Erode")
                .state("Tamil Nadu")
                .build();

        int matched = matchingEngine.matchCropListing(request);

        assertEquals(1, matched);
        verify(notificationRepository, times(1)).save(any(PriceAlertNotification.class));
        verify(subscriptionRepository, times(1)).save(dealerSub);

        ArgumentCaptor<PriceAlertTriggeredEvent> captor = ArgumentCaptor.forClass(PriceAlertTriggeredEvent.class);
        verify(alertPublisher, times(1)).publishAlert(captor.capture());

        PriceAlertTriggeredEvent event = captor.getValue();
        assertEquals(10L, event.getUserId());
        assertEquals(UserRole.DEALER, event.getUserRole());
        assertEquals(new BigDecimal("28.00"), event.getMatchedPrice());
        assertEquals(new BigDecimal("30.00"), event.getTargetPrice());
        assertTrue(event.getMessage().contains("below your target price"));
    }

    @Test
    @DisplayName("Duplicate farmer crop listing is skipped by deduplication")
    void testMatchCropListing_DeduplicationPreventsDuplicateAlert() {
        when(subscriptionRepository.findActiveMatchingSubscriptionsByRole("tomato", UserRole.DEALER, "Erode"))
                .thenReturn(List.of(dealerSub));
        // Already exists in notification table
        when(notificationRepository.existsBySubscriptionIdAndSourceTypeAndSourceId(1L, AlertSourceType.CROP_LISTING, 101L))
                .thenReturn(true);

        MatchCropListingRequest request = MatchCropListingRequest.builder()
                .listingId(101L)
                .cropName("Tomato")
                .price(new BigDecimal("28.00"))
                .district("Erode")
                .build();

        int matched = matchingEngine.matchCropListing(request);

        assertEquals(0, matched);
        verify(notificationRepository, never()).save(any(PriceAlertNotification.class));
        verify(alertPublisher, never()).publishAlert(any());
    }

    @Test
    @DisplayName("Match dealer buying request against farmer subscription")
    void testMatchDealerBuyingRequest_MatchesFarmerSubscription() {
        when(subscriptionRepository.findActiveMatchingSubscriptionsByRole("tomato", UserRole.FARMER, "Erode"))
                .thenReturn(List.of(farmerSub));
        when(notificationRepository.existsBySubscriptionIdAndSourceTypeAndSourceId(2L, AlertSourceType.BUYING_REQUEST, 501L))
                .thenReturn(false);

        DealerBuyingRequest buyingRequest = DealerBuyingRequest.builder()
                .id(501L)
                .dealerId(10L)
                .dealerName("Krishna Traders")
                .cropName("tomato")
                .offeredPrice(new BigDecimal("32.00"))
                .quantityRequired(500.0)
                .unit("kg")
                .district("Erode")
                .state("Tamil Nadu")
                .status(BuyingRequestStatus.OPEN)
                .build();

        int matched = matchingEngine.matchDealerBuyingRequest(buyingRequest);

        assertEquals(1, matched);
        verify(notificationRepository, times(1)).save(any(PriceAlertNotification.class));
        verify(subscriptionRepository, times(1)).save(farmerSub);

        ArgumentCaptor<PriceAlertTriggeredEvent> captor = ArgumentCaptor.forClass(PriceAlertTriggeredEvent.class);
        verify(alertPublisher, times(1)).publishAlert(captor.capture());

        PriceAlertTriggeredEvent event = captor.getValue();
        assertEquals(20L, event.getUserId());
        assertEquals(UserRole.FARMER, event.getUserRole());
        assertEquals(new BigDecimal("32.00"), event.getMatchedPrice());
        assertTrue(event.getMessage().contains("matching your expected price"));
    }

    @Test
    @DisplayName("Match government market price against both dealer and farmer")
    void testMatchMarketPrice_MatchesBothDealerAndFarmer() {
        when(subscriptionRepository.findActiveMatchingSubscriptions("tomato", "Erode"))
                .thenReturn(List.of(dealerSub, farmerSub));
        when(notificationRepository.existsBySubscriptionIdAndSourceTypeAndSourceId(anyLong(), eq(AlertSourceType.MARKET_PRICE), eq(901L)))
                .thenReturn(false);

        MatchMarketPriceRequest request = MatchMarketPriceRequest.builder()
                .priceId(901L)
                .cropName("Tomato")
                .marketPrice(new BigDecimal("30.00"))
                .district("Erode")
                .unit("kg")
                .build();

        int matched = matchingEngine.matchMarketPrice(request);

        // Both condition <= 30.00 and >= 30.00 match 30.00
        assertEquals(2, matched);
        verify(notificationRepository, times(2)).save(any(PriceAlertNotification.class));
        verify(alertPublisher, times(2)).publishAlert(any(PriceAlertTriggeredEvent.class));
    }
}
