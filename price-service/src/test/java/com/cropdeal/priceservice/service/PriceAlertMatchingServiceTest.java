package com.cropdeal.priceservice.service;

import com.cropdeal.priceservice.dto.CropListingEvent;
import com.cropdeal.priceservice.dto.DealerBuyingRequestEvent;
import com.cropdeal.priceservice.entity.*;
import com.cropdeal.priceservice.repository.PriceAlertNotificationRepository;
import com.cropdeal.priceservice.repository.PriceAlertSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PriceAlertMatchingServiceTest {

    @Mock
    private PriceAlertSubscriptionRepository subscriptionRepository;

    @Mock
    private PriceAlertNotificationRepository notificationRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private PriceAlertMatchingService matchingService;

    private PriceAlertSubscription dealerSub;
    private PriceAlertSubscription farmerSub;

    @BeforeEach
    void setUp() {
        dealerSub = new PriceAlertSubscription();
        dealerSub.setId(101L);
        dealerSub.setUserId(201L);
        dealerSub.setUserRole("DEALER");
        dealerSub.setCropName("Tomato");
        dealerSub.setTargetPrice(BigDecimal.valueOf(30.00));
        dealerSub.setPriceCondition(PriceCondition.LESS_THAN_OR_EQUAL);
        dealerSub.setDistrict("Erode");
        dealerSub.setState("Tamil Nadu");
        dealerSub.setUnit("KG");
        dealerSub.setActive(true);

        farmerSub = new PriceAlertSubscription();
        farmerSub.setId(102L);
        farmerSub.setUserId(301L);
        farmerSub.setUserRole("FARMER");
        farmerSub.setCropName("Tomato");
        farmerSub.setTargetPrice(BigDecimal.valueOf(30.00));
        farmerSub.setPriceCondition(PriceCondition.GREATER_THAN_OR_EQUAL);
        farmerSub.setDistrict("Erode");
        farmerSub.setState("Tamil Nadu");
        farmerSub.setUnit("KG");
        farmerSub.setActive(true);
    }

    @Test
    @DisplayName("Farmer Listing triggers alert for Dealer subscription when price <= target")
    void testFarmerListingMatchesDealerAlert() {
        when(subscriptionRepository.findByActiveTrueAndUserRole("DEALER")).thenReturn(List.of(dealerSub));
        when(notificationRepository.existsBySubscriptionIdAndSourceTypeAndSourceId(eq(101L), anyString(), anyString())).thenReturn(false);

        CropListingEvent event = new CropListingEvent();
        event.setCropId(5001L);
        event.setFarmerId(301L);
        event.setCommodity("tomato");
        event.setDistrict("erode");
        event.setState("Tamil Nadu");
        event.setPricePerKg(BigDecimal.valueOf(28.00));
        event.setQuantity(BigDecimal.valueOf(500));
        event.setUnit("KG");

        matchingService.processFarmerListing(event);

        verify(notificationRepository, times(1)).save(any(PriceAlertNotification.class));
        verify(subscriptionRepository, times(1)).save(dealerSub);
        verify(rabbitTemplate, times(1)).convertAndSend(anyString(), anyString(), any(Object.class));
    }

    @Test
    @DisplayName("Farmer Listing does NOT match Dealer subscription when price > target")
    void testFarmerListingNoMatchWhenPriceHigher() {
        when(subscriptionRepository.findByActiveTrueAndUserRole("DEALER")).thenReturn(List.of(dealerSub));

        CropListingEvent event = new CropListingEvent();
        event.setCropId(5002L);
        event.setCommodity("Tomato");
        event.setDistrict("Erode");
        event.setState("Tamil Nadu");
        event.setPricePerKg(BigDecimal.valueOf(35.00));
        event.setUnit("KG");

        matchingService.processFarmerListing(event);

        verify(notificationRepository, never()).save(any());
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(Object.class));
    }

    @Test
    @DisplayName("Dealer Buying Request triggers alert for Farmer subscription when price >= target")
    void testDealerBuyingRequestMatchesFarmerAlert() {
        when(subscriptionRepository.findByActiveTrueAndUserRole("FARMER")).thenReturn(List.of(farmerSub));
        when(notificationRepository.existsBySubscriptionIdAndSourceTypeAndSourceId(eq(102L), anyString(), anyString())).thenReturn(false);

        DealerBuyingRequestEvent event = new DealerBuyingRequestEvent();
        event.setRequestId(8001L);
        event.setDealerId(201L);
        event.setCropName("TOMATO");
        event.setDistrict("ERODE");
        event.setState("Tamil Nadu");
        event.setBuyingPrice(BigDecimal.valueOf(32.00));
        event.setQuantity(BigDecimal.valueOf(1000));
        event.setUnit("KG");

        matchingService.processDealerBuyingRequest(event);

        verify(notificationRepository, times(1)).save(any(PriceAlertNotification.class));
        verify(subscriptionRepository, times(1)).save(farmerSub);
        verify(rabbitTemplate, times(1)).convertAndSend(anyString(), anyString(), any(Object.class));
    }

    @Test
    @DisplayName("Government Market Price matches subscriptions correctly")
    void testGovernmentMarketPriceMatching() {
        when(subscriptionRepository.findByActiveTrue()).thenReturn(List.of(dealerSub, farmerSub));
        when(notificationRepository.existsBySubscriptionIdAndSourceTypeAndSourceId(anyLong(), anyString(), anyString())).thenReturn(false);

        MarketPrice price = new MarketPrice();
        price.setId(9001L);
        price.setCommodity("Tomato");
        price.setDistrict("Erode");
        price.setState("Tamil Nadu");
        price.setModalPricePerKg(30.00);
        price.setArrivalDate(LocalDate.now());

        matchingService.processGovernmentPrice(price);

        verify(notificationRepository, times(2)).save(any(PriceAlertNotification.class));
        verify(rabbitTemplate, times(2)).convertAndSend(anyString(), anyString(), any(Object.class));
    }

    @Test
    @DisplayName("Duplicate notification is prevented by idempotency check")
    void testDuplicateNotificationPrevention() {
        when(subscriptionRepository.findByActiveTrueAndUserRole("DEALER")).thenReturn(List.of(dealerSub));
        when(notificationRepository.existsBySubscriptionIdAndSourceTypeAndSourceId(eq(101L), eq(SourceType.FARMER_LISTING.name()), eq("5001"))).thenReturn(true);

        CropListingEvent event = new CropListingEvent();
        event.setCropId(5001L);
        event.setCommodity("Tomato");
        event.setDistrict("Erode");
        event.setState("Tamil Nadu");
        event.setPricePerKg(BigDecimal.valueOf(25.00));
        event.setUnit("KG");

        matchingService.processFarmerListing(event);

        verify(notificationRepository, never()).save(any());
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(Object.class));
    }

    @Test
    @DisplayName("Boundary price condition evaluations")
    void testConditionEvaluator() {
        BigDecimal target = BigDecimal.valueOf(30);

        assertTrue(matchingService.evaluatesCondition(BigDecimal.valueOf(30), target, PriceCondition.EQUAL));
        assertTrue(matchingService.evaluatesCondition(BigDecimal.valueOf(30), target, PriceCondition.LESS_THAN_OR_EQUAL));
        assertTrue(matchingService.evaluatesCondition(BigDecimal.valueOf(30), target, PriceCondition.GREATER_THAN_OR_EQUAL));
        assertFalse(matchingService.evaluatesCondition(BigDecimal.valueOf(30), target, PriceCondition.GREATER_THAN));
        assertFalse(matchingService.evaluatesCondition(BigDecimal.valueOf(30), target, PriceCondition.LESS_THAN));

        assertTrue(matchingService.evaluatesCondition(BigDecimal.valueOf(28), target, PriceCondition.LESS_THAN));
        assertTrue(matchingService.evaluatesCondition(BigDecimal.valueOf(32), target, PriceCondition.GREATER_THAN));
    }

    @Test
    @DisplayName("Unit conversion: Quintal to KG")
    void testUnitConversion() {
        BigDecimal quintalPrice = BigDecimal.valueOf(3200);
        BigDecimal perKgPrice = matchingService.normalizePriceToKg(quintalPrice, "QUINTAL");
        assertEquals(0, perKgPrice.compareTo(BigDecimal.valueOf(32)));
    }

    @Test
    @DisplayName("Location filtering: Different district does not match")
    void testDifferentDistrictNoMatch() {
        when(subscriptionRepository.findByActiveTrueAndUserRole("DEALER")).thenReturn(List.of(dealerSub));

        CropListingEvent event = new CropListingEvent();
        event.setCropId(5003L);
        event.setCommodity("Tomato");
        event.setDistrict("Coimbatore");
        event.setState("Tamil Nadu");
        event.setPricePerKg(BigDecimal.valueOf(20.00));
        event.setUnit("KG");

        matchingService.processFarmerListing(event);

        verify(notificationRepository, never()).save(any());
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(Object.class));
    }
}