package com.cropdeal.delivery.service;

import com.cropdeal.delivery.dto.DeliveryAssignmentRequest;
import com.cropdeal.delivery.dto.DeliveryResponse;
import com.cropdeal.delivery.entity.Delivery;
import com.cropdeal.delivery.entity.DeliveryStatus;
import com.cropdeal.delivery.repository.DeliveryAssignmentRepository;
import com.cropdeal.delivery.repository.DeliveryRepository;
import com.cropdeal.delivery.repository.DeliveryStatusHistoryRepository;
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
class DeliveryServiceTest {

    @Mock
    private DeliveryRepository deliveryRepository;

    @Mock
    private DeliveryAssignmentRepository assignmentRepository;

    @Mock
    private DeliveryStatusHistoryRepository statusHistoryRepository;

    @InjectMocks
    private DeliveryServiceImpl deliveryService;

    @Test
    @DisplayName("Create delivery adds to Global Pool with ₹100 fee")
    void testCreateDelivery_GlobalPool() {
        DeliveryAssignmentRequest req = new DeliveryAssignmentRequest();
        req.setOrderId(101L);
        req.setPickupAddress("Farm A");
        req.setDeliveryAddress("Market B");

        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(i -> {
            Delivery d = i.getArgument(0);
            d.setId(1L);
            return d;
        });

        DeliveryResponse res = deliveryService.createDelivery(req);

        assertNotNull(res);
        assertEquals(DeliveryStatus.AVAILABLE_FOR_PICKUP.name(), res.getStatus());
        assertEquals(BigDecimal.valueOf(100), res.getDeliveryFee());
        assertEquals("DELIVERY_PARTNER", res.getFulfillmentType());
    }

    @Test
    @DisplayName("Create self-pickup sets ₹0 fee and SELF_PICKUP status")
    void testCreateSelfPickup() {
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(i -> {
            Delivery d = i.getArgument(0);
            d.setId(2L);
            return d;
        });

        DeliveryResponse res = deliveryService.createSelfPickup(102L, "Farmer Warehouse");

        assertNotNull(res);
        assertEquals(DeliveryStatus.SELF_PICKUP.name(), res.getStatus());
        assertEquals(BigDecimal.ZERO, res.getDeliveryFee());
        assertEquals("SELF_PICKUP", res.getFulfillmentType());
    }

    @Test
    @DisplayName("Claim delivery assigns agent from global pool")
    void testClaimDelivery() {
        Delivery delivery = new Delivery();
        delivery.setId(1L);
        delivery.setStatus(DeliveryStatus.AVAILABLE_FOR_PICKUP);
        delivery.setDeliveryFee(BigDecimal.valueOf(100));

        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(delivery));
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(i -> i.getArgument(0));

        DeliveryResponse res = deliveryService.claimDelivery(1L, 99L);

        assertNotNull(res);
        assertEquals(DeliveryStatus.ASSIGNED.name(), res.getStatus());
        assertEquals(99L, res.getDeliveryAgentId());
        verify(assignmentRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Claiming already claimed delivery throws IllegalStateException")
    void testClaimAlreadyClaimedThrows() {
        Delivery delivery = new Delivery();
        delivery.setId(1L);
        delivery.setStatus(DeliveryStatus.ASSIGNED);

        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(delivery));

        assertThrows(IllegalStateException.class, () -> deliveryService.claimDelivery(1L, 99L));
    }
}
