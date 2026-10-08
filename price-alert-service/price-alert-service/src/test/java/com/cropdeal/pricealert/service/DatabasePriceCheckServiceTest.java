package com.cropdeal.pricealert.service;

import com.cropdeal.pricealert.client.PriceServiceClient;
import com.cropdeal.pricealert.dto.DatabasePriceDto;
import com.cropdeal.pricealert.dto.MatchMarketPriceRequest;
import com.cropdeal.pricealert.dto.MatchResultResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DatabasePriceCheckServiceTest {

    @Mock
    private PriceServiceClient priceServiceClient;

    @Mock
    private PriceAlertMatchingEngine matchingEngine;

    @InjectMocks
    private DatabasePriceCheckService priceCheckService;

    @Test
    @DisplayName("Should evaluate stored database prices against active subscriptions without calling external government API")
    void testCheckActiveSubscriptionsAgainstDatabasePrices_Success() {
        DatabasePriceDto tomatoPrice = DatabasePriceDto.builder()
                .commodity("Tomato")
                .state("Tamil Nadu")
                .district("Erode")
                .grade("A")
                .priceDate(LocalDate.now())
                .minPricePerKg(25.0)
                .maxPricePerKg(35.0)
                .modalPricePerKg(28.0)
                .build();

        DatabasePriceDto onionPrice = DatabasePriceDto.builder()
                .commodity("Onion")
                .state("Maharashtra")
                .district("Nashik")
                .grade("B")
                .priceDate(LocalDate.now())
                .minPricePerKg(20.0)
                .maxPricePerKg(30.0)
                .modalPricePerKg(22.0)
                .build();

        when(priceServiceClient.getLatestStoredPricesFromDb()).thenReturn(List.of(tomatoPrice, onionPrice));
        when(matchingEngine.matchMarketPrice(any(MatchMarketPriceRequest.class))).thenReturn(1);

        MatchResultResponse response = priceCheckService.checkActiveSubscriptionsAgainstDatabasePrices();

        assertNotNull(response);
        assertEquals(2, response.getMatchedCount());
        assertEquals(2, response.getNotificationsTriggered());
        assertTrue(response.getMessage().contains("Evaluated 2 database crop prices"));

        verify(matchingEngine, times(2)).matchMarketPrice(any(MatchMarketPriceRequest.class));
    }

    @Test
    @DisplayName("Should handle empty database prices gracefully")
    void testCheckActiveSubscriptionsAgainstDatabasePrices_EmptyDb() {
        when(priceServiceClient.getLatestStoredPricesFromDb()).thenReturn(Collections.emptyList());

        MatchResultResponse response = priceCheckService.checkActiveSubscriptionsAgainstDatabasePrices();

        assertNotNull(response);
        assertEquals(0, response.getMatchedCount());
        assertEquals(0, response.getNotificationsTriggered());
        verify(matchingEngine, never()).matchMarketPrice(any());
    }

    @Test
    @DisplayName("Should evaluate user subscriptions on login from local database prices")
    void testCheckUserSubscriptionsOnLogin_Success() {
        DatabasePriceDto tomatoPrice = DatabasePriceDto.builder()
                .commodity("Tomato")
                .state("Tamil Nadu")
                .district("Erode")
                .modalPricePerKg(28.0)
                .build();

        when(priceServiceClient.getLatestStoredPricesFromDb()).thenReturn(List.of(tomatoPrice));
        when(matchingEngine.matchUserSubscriptionsAgainstMarketPrice(eq(101L), any(MatchMarketPriceRequest.class))).thenReturn(1);

        MatchResultResponse response = priceCheckService.checkUserSubscriptionsOnLogin(101L);

        assertNotNull(response);
        assertEquals(1, response.getMatchedCount());
        assertEquals(1, response.getNotificationsTriggered());
        assertTrue(response.getMessage().contains("user 101 on login"));

        verify(matchingEngine, times(1)).matchUserSubscriptionsAgainstMarketPrice(eq(101L), any(MatchMarketPriceRequest.class));
    }

    @Test
    @DisplayName("Login check with null user ID returns safe default")
    void testCheckUserSubscriptionsOnLogin_NullUserId() {
        MatchResultResponse response = priceCheckService.checkUserSubscriptionsOnLogin(null);
        assertNotNull(response);
        assertEquals(0, response.getMatchedCount());
        assertEquals(0, response.getNotificationsTriggered());
    }
}
