package com.cropdeal.pricealert.service;

import com.cropdeal.pricealert.dto.CreateSubscriptionRequest;
import com.cropdeal.pricealert.dto.SubscriptionResponse;
import com.cropdeal.pricealert.entity.PriceAlertSubscription;
import com.cropdeal.pricealert.enums.PriceCondition;
import com.cropdeal.pricealert.enums.UserRole;
import com.cropdeal.pricealert.repository.PriceAlertNotificationRepository;
import com.cropdeal.pricealert.repository.PriceAlertSubscriptionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PriceSubscriptionServiceTest {

    @Mock
    private PriceAlertSubscriptionRepository subscriptionRepository;

    @Mock
    private PriceAlertNotificationRepository notificationRepository;

    @InjectMocks
    private PriceSubscriptionService subscriptionService;

    @Test
    @DisplayName("Successfully create price subscription")
    void testCreateSubscription() {
        CreateSubscriptionRequest req = CreateSubscriptionRequest.builder()
                .userId(1L)
                .userRole(UserRole.DEALER)
                .cropName("Tomato")
                .targetPrice(new BigDecimal("35.00"))
                .priceCondition(PriceCondition.LESS_THAN_OR_EQUAL)
                .district("Salem")
                .state("Tamil Nadu")
                .unit("kg")
                .build();

        PriceAlertSubscription entity = PriceAlertSubscription.builder()
                .id(10L)
                .userId(1L)
                .userRole(UserRole.DEALER)
                .cropName("tomato")
                .targetPrice(new BigDecimal("35.00"))
                .priceCondition(PriceCondition.LESS_THAN_OR_EQUAL)
                .district("Salem")
                .state("Tamil Nadu")
                .unit("kg")
                .active(true)
                .build();

        when(subscriptionRepository.save(any(PriceAlertSubscription.class))).thenReturn(entity);

        SubscriptionResponse res = subscriptionService.createSubscription(req);

        assertNotNull(res);
        assertEquals(10L, res.getId());
        assertEquals("tomato", res.getCropName());
        assertEquals(new BigDecimal("35.00"), res.getTargetPrice());
        assertTrue(res.getActive());
    }

    @Test
    @DisplayName("Toggle subscription active status")
    void testToggleStatus() {
        PriceAlertSubscription entity = PriceAlertSubscription.builder()
                .id(10L)
                .userId(1L)
                .userRole(UserRole.DEALER)
                .cropName("tomato")
                .targetPrice(new BigDecimal("35.00"))
                .priceCondition(PriceCondition.LESS_THAN_OR_EQUAL)
                .active(true)
                .build();

        when(subscriptionRepository.findById(10L)).thenReturn(Optional.of(entity));
        when(subscriptionRepository.save(any(PriceAlertSubscription.class))).thenAnswer(i -> i.getArgument(0));

        SubscriptionResponse res = subscriptionService.toggleSubscriptionStatus(10L, false);

        assertNotNull(res);
        assertFalse(res.getActive());
    }
}
