package com.cropdeal.priceservice.service;

import com.cropdeal.priceservice.dto.PriceAlertSubscriptionRequest;
import com.cropdeal.priceservice.dto.PriceAlertSubscriptionResponse;
import com.cropdeal.priceservice.entity.PriceAlertSubscription;
import com.cropdeal.priceservice.entity.PriceCondition;
import com.cropdeal.priceservice.exception.InvalidSubscriptionException;
import com.cropdeal.priceservice.exception.UnauthorizedAlertAccessException;
import com.cropdeal.priceservice.repository.PriceAlertSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PriceAlertSubscriptionServiceTest {

    @Mock
    private PriceAlertSubscriptionRepository repository;

    @InjectMocks
    private PriceAlertSubscriptionService service;

    private PriceAlertSubscription testSub;

    @BeforeEach
    void setUp() {
        testSub = new PriceAlertSubscription();
        testSub.setId(1L);
        testSub.setUserId(100L);
        testSub.setUserRole("FARMER");
        testSub.setCropName("Wheat");
        testSub.setTargetPrice(BigDecimal.valueOf(25.00));
        testSub.setPriceCondition(PriceCondition.GREATER_THAN_OR_EQUAL);
        testSub.setDistrict("Ludhiana");
        testSub.setState("Punjab");
        testSub.setUnit("KG");
        testSub.setActive(true);
    }

    @Test
    @DisplayName("Create subscription successfully for FARMER")
    void testCreateSubscriptionFarmer() {
        when(repository.save(any(PriceAlertSubscription.class))).thenAnswer(i -> {
            PriceAlertSubscription s = i.getArgument(0);
            s.setId(1L);
            return s;
        });

        PriceAlertSubscriptionRequest req = new PriceAlertSubscriptionRequest();
        req.setCropName("Wheat");
        req.setTargetPrice(BigDecimal.valueOf(25.00));
        req.setPriceCondition(PriceCondition.GREATER_THAN_OR_EQUAL);
        req.setDistrict("Ludhiana");
        req.setState("Punjab");

        PriceAlertSubscriptionResponse res = service.createSubscription(req, 100L, "ROLE_FARMER");
        assertNotNull(res);
        assertEquals("Wheat", res.getCropName());
        assertEquals("FARMER", res.getUserRole());
        assertTrue(res.getActive());
    }

    @Test
    @DisplayName("Invalid role cannot create subscription")
    void testInvalidRoleCannotCreateSubscription() {
        PriceAlertSubscriptionRequest req = new PriceAlertSubscriptionRequest();
        req.setCropName("Wheat");
        req.setTargetPrice(BigDecimal.valueOf(25.00));
        req.setPriceCondition(PriceCondition.GREATER_THAN_OR_EQUAL);

        assertThrows(InvalidSubscriptionException.class, () ->
                service.createSubscription(req, 100L, "ROLE_DELIVERY_AGENT"));
    }

    @Test
    @DisplayName("User cannot modify another user's subscription (403 Forbidden)")
    void testUnauthorizedModification() {
        when(repository.findById(1L)).thenReturn(Optional.of(testSub));

        PriceAlertSubscriptionRequest req = new PriceAlertSubscriptionRequest();
        req.setCropName("Wheat");
        req.setTargetPrice(BigDecimal.valueOf(30.00));
        req.setPriceCondition(PriceCondition.GREATER_THAN_OR_EQUAL);

        assertThrows(UnauthorizedAlertAccessException.class, () ->
                service.updateSubscription(1L, req, 999L, "ROLE_FARMER"));
    }

    @Test
    @DisplayName("Activate and Deactivate subscriptions")
    void testActivateDeactivate() {
        when(repository.findById(1L)).thenReturn(Optional.of(testSub));
        when(repository.save(any(PriceAlertSubscription.class))).thenAnswer(i -> i.getArgument(0));

        PriceAlertSubscriptionResponse deact = service.deactivateSubscription(1L, 100L, "ROLE_FARMER");
        assertFalse(deact.getActive());

        PriceAlertSubscriptionResponse act = service.activateSubscription(1L, 100L, "ROLE_FARMER");
        assertTrue(act.getActive());
    }
}