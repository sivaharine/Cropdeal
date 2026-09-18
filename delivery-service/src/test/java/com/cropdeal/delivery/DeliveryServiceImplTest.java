package com.cropdeal.delivery;

import com.cropdeal.delivery.client.PaymentServiceClient;
import com.cropdeal.delivery.dto.*;
import com.cropdeal.delivery.entity.Delivery;
import com.cropdeal.delivery.entity.DeliveryOption;
import com.cropdeal.delivery.entity.DeliveryStatus;
import com.cropdeal.delivery.exception.DeliveryConflictException;
import com.cropdeal.delivery.exception.UnauthorizedDeliveryAccessException;
import com.cropdeal.delivery.repository.DeliveryRepository;
import com.cropdeal.delivery.service.DeliveryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
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
class DeliveryServiceImplTest {

    @Mock
    private DeliveryRepository deliveryRepository;

    @Mock
    private PaymentServiceClient paymentServiceClient;

    @InjectMocks
    private DeliveryServiceImpl deliveryService;

    private Delivery delivery;

    @BeforeEach
    void setUp() {
        delivery = new Delivery();
        delivery.setId(1L);
        delivery.setOrderId(101L);
        delivery.setDeliveryOption(DeliveryOption.DELIVERY_AGENT);
        delivery.setStatus(DeliveryStatus.AVAILABLE);
        delivery.setDeliveryCharge(new BigDecimal("150.00"));
        delivery.setDeliveryOtp("123456");
        delivery.setReceiptId("REC-12345");
        delivery.setCustomerPhone("9876543210");
        delivery.setPickupAddress("Farm A");
        delivery.setDeliveryAddress("Dealer B");
    }

    @Test
    void testCreateSelfPickupDelivery() {
        DeliveryAssignmentRequest request = new DeliveryAssignmentRequest();
        request.setOrderId(101L);
        request.setDeliveryOption("SELF_PICKUP");
        request.setCustomerPhone("9876543210");

        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(i -> {
            Delivery d = i.getArgument(0);
            d.setId(1L);
            return d;
        });

        DeliveryResponse response = deliveryService.createDelivery(request);

        assertNotNull(response);
        assertEquals("SELF_PICKUP", response.getDeliveryOption());
        assertEquals(BigDecimal.ZERO, response.getDeliveryCharge());
        assertEquals("AVAILABLE", response.getStatus());
        assertNull(response.getDeliveryPartnerId());
    }

    @Test
    void testCreateDeliveryAgentDelivery() {
        DeliveryAssignmentRequest request = new DeliveryAssignmentRequest();
        request.setOrderId(101L);
        request.setDeliveryOption("DELIVERY_AGENT");
        request.setDeliveryCharge(new BigDecimal("150.00"));
        request.setPaymentCompleted(true);

        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(i -> {
            Delivery d = i.getArgument(0);
            d.setId(1L);
            return d;
        });

        DeliveryResponse response = deliveryService.createDelivery(request);

        assertNotNull(response);
        assertEquals("DELIVERY_AGENT", response.getDeliveryOption());
        assertEquals(new BigDecimal("150.00"), response.getDeliveryCharge());
        assertEquals("AVAILABLE", response.getStatus());
    }

    @Test
    void testCreateDeliveryRejectCashOnDelivery() {
        DeliveryAssignmentRequest request = new DeliveryAssignmentRequest();
        request.setOrderId(101L);
        request.setDeliveryOption("DELIVERY_AGENT");
        request.setPaymentMethod("CASH_ON_DELIVERY");

        assertThrows(IllegalArgumentException.class, () -> deliveryService.createDelivery(request));
        verify(deliveryRepository, never()).save(any(Delivery.class));
    }

    @Test
    void testGetAvailableDeliveries() {
        when(deliveryRepository.findByStatus(DeliveryStatus.AVAILABLE)).thenReturn(List.of(delivery));

        List<DeliveryResponse> responses = deliveryService.getAvailableDeliveries();

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("AVAILABLE", responses.get(0).getStatus());
    }

    @Test
    void testAcceptDeliveryFirstComeFirstServed() {
        AcceptDeliveryRequest request = new AcceptDeliveryRequest();
        request.setDeliveryPartnerId(501L);
        request.setPartnerName("John Delivery");

        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(delivery));
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(i -> i.getArgument(0));

        DeliveryResponse response = deliveryService.acceptDelivery(1L, request);

        assertNotNull(response);
        assertEquals("ASSIGNED", response.getStatus());
        assertEquals(501L, response.getDeliveryPartnerId());
        assertEquals("John Delivery", response.getAcceptedBy());
        assertNotNull(response.getAcceptedAt());
    }

    @Test
    void testAcceptDeliveryConflictWhenAlreadyAssigned() {
        delivery.setStatus(DeliveryStatus.ASSIGNED);
        delivery.setDeliveryPartnerId(501L);

        AcceptDeliveryRequest request = new AcceptDeliveryRequest();
        request.setDeliveryPartnerId(502L);
        request.setPartnerName("Second Partner");

        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(delivery));

        assertThrows(DeliveryConflictException.class, () -> deliveryService.acceptDelivery(1L, request));
        verify(deliveryRepository, never()).save(any(Delivery.class));
    }

    @Test
    void testGetMyDeliveries() {
        delivery.setStatus(DeliveryStatus.ASSIGNED);
        delivery.setDeliveryPartnerId(501L);

        when(deliveryRepository.findByDeliveryPartnerId(501L)).thenReturn(List.of(delivery));

        List<DeliveryResponse> responses = deliveryService.getMyDeliveries(501L);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(501L, responses.get(0).getDeliveryPartnerId());
    }

    @Test
    void testGetDeliveryUnauthorizedOtherPartner() {
        delivery.setStatus(DeliveryStatus.ASSIGNED);
        delivery.setDeliveryPartnerId(501L);

        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(delivery));

        assertThrows(UnauthorizedDeliveryAccessException.class, () -> deliveryService.getDeliveryById(1L, 502L));
    }

    @Test
    void testVerifyDeliveryTriggersWalletSettlement() {
        delivery.setStatus(DeliveryStatus.DELIVERED);
        delivery.setDeliveryPartnerId(501L);

        VerifyDeliveryRequest request = new VerifyDeliveryRequest();
        request.setVerificationCode("123456");
        request.setDeliveryPartnerId(501L);

        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(delivery));
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(i -> i.getArgument(0));

        DeliveryResponse response = deliveryService.verifyDelivery(1L, request, 501L);

        assertNotNull(response);
        assertEquals("VERIFIED", response.getStatus());
        assertTrue(response.isOtpVerified());
        assertNotNull(response.getCompletedAt());
        verify(paymentServiceClient, times(1)).creditWallet(any(WalletSettlementRequest.class));
    }

    @Test
    void testVerifyDeliveryUnauthorizedOtherPartner() {
        delivery.setStatus(DeliveryStatus.DELIVERED);
        delivery.setDeliveryPartnerId(501L);

        VerifyDeliveryRequest request = new VerifyDeliveryRequest();
        when(deliveryRepository.findById(1L)).thenReturn(Optional.of(delivery));

        assertThrows(UnauthorizedDeliveryAccessException.class, () -> deliveryService.verifyDelivery(1L, request, 502L));
        verify(paymentServiceClient, never()).creditWallet(any());
    }
}