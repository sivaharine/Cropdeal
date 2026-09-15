package com.service;

import com.client.InvoiceServiceClient;
import com.dto.PaymentRequest;
import com.dto.PaymentResponse;
import com.dto.RefundRequest;
import com.dto.RefundResponse;
import com.dto.UpdatePaymentRequest;
import com.dto.UpdateRefundRequest;
import com.entity.Payment;
import com.entity.PaymentStatus;
import com.entity.Refund;
import com.entity.RefundStatus;
import com.exception.PaymentNotFoundException;
import com.exception.RefundException;
import com.repository.PaymentRepository;
import com.repository.RefundRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private RefundRepository refundRepository;

    @Mock
    private InvoiceServiceClient invoiceServiceClient;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private Payment payment;

    private Refund refund;

    @BeforeEach
    void setUp() {

        payment = new Payment();

        payment.setId(1L);
        payment.setOrderId(101L);
        payment.setDealerId(201L);
        payment.setFarmerId(301L);
        payment.setAmount(
                new BigDecimal("2500.00"));
        payment.setPaymentMethod("UPI");
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setTransactionReference(
                "TXN-12345678");
        payment.setPaidAt(
                LocalDateTime.now());

        refund = new Refund();

        refund.setId(1L);
        refund.setPaymentId(1L);
        refund.setOrderId(101L);
        refund.setDeliveryId(401L);
        refund.setRefundAmount(
                new BigDecimal("1500.00"));
        refund.setReason(
                "Damaged crop delivery");
        refund.setStatus(
                RefundStatus.SUCCESS);
        refund.setRefundReference(
                "REF-12345678");
        refund.setRefundedAt(
                LocalDateTime.now());
    }

    // =========================================================
    // MAKE PAYMENT
    // =========================================================

    @Test
    void testMakePayment() {

        PaymentRequest request =
                new PaymentRequest();

        request.setOrderId(101L);
        request.setDealerId(201L);
        request.setFarmerId(301L);
        request.setAmount(
                new BigDecimal("2500.00"));
        request.setPaymentMethod("UPI");

        when(paymentRepository.findByOrderId(101L))
                .thenReturn(Optional.empty());

        when(paymentRepository.save(any(Payment.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        PaymentResponse response =
                paymentService.makePayment(request);

        assertNotNull(response);

        assertEquals(
                101L,
                response.getOrderId());

        assertEquals(
                201L,
                response.getDealerId());

        assertEquals(
                301L,
                response.getFarmerId());

        assertEquals(
                new BigDecimal("2500.00"),
                response.getAmount());

        assertEquals(
                "UPI",
                response.getPaymentMethod());

        assertEquals(
                "SUCCESS",
                response.getStatus());

        assertNotNull(
                response.getTransactionReference());

        assertTrue(
                response.getTransactionReference()
                        .startsWith("TXN-"));

        assertNotNull(response.getPaidAt());

        verify(paymentRepository, atLeastOnce())
                .save(any(Payment.class));

        verify(invoiceServiceClient, times(1))
                .generateInvoiceFromPayment(any());
    }

    // =========================================================
    // MAKE PAYMENT - EXISTING SUCCESSFUL PAYMENT
    // =========================================================

    @Test
    void testMakePaymentExistingSuccessfulPayment() {

        PaymentRequest request =
                new PaymentRequest();

        request.setOrderId(101L);
        request.setDealerId(201L);
        request.setFarmerId(301L);
        request.setAmount(
                new BigDecimal("2500.00"));
        request.setPaymentMethod("UPI");

        when(paymentRepository.findByOrderId(101L))
                .thenReturn(Optional.of(payment));

        PaymentResponse response =
                paymentService.makePayment(request);

        assertNotNull(response);

        assertEquals(
                1L,
                response.getId());

        assertEquals(
                "SUCCESS",
                response.getStatus());

        /*
         * Existing successful payment should be returned.
         * No new payment should be saved.
         */
        verify(paymentRepository, never())
                .save(any(Payment.class));

        verify(invoiceServiceClient, never())
                .generateInvoiceFromPayment(any());
    }

    // =========================================================
    // GET ALL PAYMENTS
    // =========================================================

    @Test
    void testGetAllPayments() {

        Payment payment2 = new Payment();

        payment2.setId(2L);
        payment2.setOrderId(102L);
        payment2.setDealerId(202L);
        payment2.setFarmerId(302L);
        payment2.setAmount(
                new BigDecimal("3000.00"));
        payment2.setPaymentMethod("CARD");
        payment2.setStatus(
                PaymentStatus.SUCCESS);
        payment2.setTransactionReference(
                "TXN-87654321");
        payment2.setPaidAt(
                LocalDateTime.now());

        when(paymentRepository.findAll())
                .thenReturn(
                        Arrays.asList(
                                payment,
                                payment2));

        List<PaymentResponse> responses =
                paymentService.getAllPayments();

        assertNotNull(responses);

        assertEquals(2, responses.size());

        assertEquals(
                1L,
                responses.get(0).getId());

        assertEquals(
                2L,
                responses.get(1).getId());

        verify(paymentRepository, times(1))
                .findAll();
    }

    // =========================================================
    // GET ALL PAYMENTS - EMPTY
    // =========================================================

    @Test
    void testGetAllPaymentsWhenEmpty() {

        when(paymentRepository.findAll())
                .thenReturn(
                        Collections.emptyList());

        List<PaymentResponse> responses =
                paymentService.getAllPayments();

        assertNotNull(responses);

        assertTrue(responses.isEmpty());

        verify(paymentRepository, times(1))
                .findAll();
    }

    // =========================================================
    // GET PAYMENT BY ID
    // =========================================================

    @Test
    void testGetPaymentById() {

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));

        PaymentResponse response =
                paymentService.getPaymentById(1L);

        assertNotNull(response);

        assertEquals(
                1L,
                response.getId());

        assertEquals(
                101L,
                response.getOrderId());

        assertEquals(
                "SUCCESS",
                response.getStatus());

        assertEquals(
                "UPI",
                response.getPaymentMethod());

        verify(paymentRepository, times(1))
                .findById(1L);
    }

    // =========================================================
    // GET PAYMENT BY ID - NOT FOUND
    // =========================================================

    @Test
    void testGetPaymentByIdNotFound() {

        when(paymentRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                PaymentNotFoundException.class,
                () ->
                        paymentService.getPaymentById(999L));

        verify(paymentRepository, times(1))
                .findById(999L);
    }

    // =========================================================
    // UPDATE PAYMENT
    // =========================================================

    @Test
    void testUpdatePayment() {

        /*
         * Successful payments cannot be updated.
         * Therefore use a PENDING payment.
         */
        payment.setStatus(
                PaymentStatus.PENDING);

        UpdatePaymentRequest request =
                new UpdatePaymentRequest();

        request.setDealerId(999L);
        request.setFarmerId(888L);
        request.setAmount(
                new BigDecimal("3000.00"));
        request.setPaymentMethod("CARD");

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));

        when(paymentRepository.save(any(Payment.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        PaymentResponse response =
                paymentService.updatePayment(
                        1L,
                        request);

        assertNotNull(response);

        assertEquals(
                999L,
                response.getDealerId());

        assertEquals(
                888L,
                response.getFarmerId());

        assertEquals(
                new BigDecimal("3000.00"),
                response.getAmount());

        assertEquals(
                "CARD",
                response.getPaymentMethod());

        assertEquals(
                "PENDING",
                response.getStatus());

        verify(paymentRepository, times(1))
                .findById(1L);

        verify(paymentRepository, times(1))
                .save(any(Payment.class));
    }

    // =========================================================
    // UPDATE PAYMENT - PARTIAL UPDATE
    // =========================================================

    @Test
    void testUpdatePaymentPartialUpdate() {

        payment.setStatus(
                PaymentStatus.PENDING);

        UpdatePaymentRequest request =
                new UpdatePaymentRequest();

        request.setPaymentMethod("NET_BANKING");

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));

        when(paymentRepository.save(any(Payment.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        PaymentResponse response =
                paymentService.updatePayment(
                        1L,
                        request);

        assertEquals(
                "NET_BANKING",
                response.getPaymentMethod());

        /*
         * Other existing values remain unchanged.
         */
        assertEquals(
                201L,
                response.getDealerId());

        assertEquals(
                301L,
                response.getFarmerId());

        assertEquals(
                new BigDecimal("2500.00"),
                response.getAmount());
    }

    // =========================================================
    // UPDATE PAYMENT - NOT FOUND
    // =========================================================

    @Test
    void testUpdatePaymentNotFound() {

        UpdatePaymentRequest request =
                new UpdatePaymentRequest();

        request.setPaymentMethod("CARD");

        when(paymentRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                PaymentNotFoundException.class,
                () ->
                        paymentService.updatePayment(
                                999L,
                                request));

        verify(paymentRepository, never())
                .save(any(Payment.class));
    }

    // =========================================================
    // UPDATE SUCCESSFUL PAYMENT - SHOULD FAIL
    // =========================================================

    @Test
    void testUpdateSuccessfulPaymentShouldFail() {

        payment.setStatus(
                PaymentStatus.SUCCESS);

        UpdatePaymentRequest request =
                new UpdatePaymentRequest();

        request.setPaymentMethod("CARD");

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));

        assertThrows(
                IllegalStateException.class,
                () ->
                        paymentService.updatePayment(
                                1L,
                                request));

        verify(paymentRepository, never())
                .save(any(Payment.class));
    }

    // =========================================================
    // DELETE PAYMENT
    // =========================================================

    @Test
    void testDeletePayment() {

        payment.setStatus(
                PaymentStatus.PENDING);

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));

        doNothing()
                .when(paymentRepository)
                .delete(payment);

        assertDoesNotThrow(
                () ->
                        paymentService.deletePayment(1L));

        verify(paymentRepository, times(1))
                .findById(1L);

        verify(paymentRepository, times(1))
                .delete(payment);
    }

    // =========================================================
    // DELETE PAYMENT - NOT FOUND
    // =========================================================

    @Test
    void testDeletePaymentNotFound() {

        when(paymentRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                PaymentNotFoundException.class,
                () ->
                        paymentService.deletePayment(999L));

        verify(paymentRepository, never())
                .delete(any(Payment.class));
    }

    // =========================================================
    // DELETE SUCCESSFUL PAYMENT - SHOULD FAIL
    // =========================================================

    @Test
    void testDeleteSuccessfulPaymentShouldFail() {

        payment.setStatus(
                PaymentStatus.SUCCESS);

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));

        assertThrows(
                IllegalStateException.class,
                () ->
                        paymentService.deletePayment(1L));

        verify(paymentRepository, never())
                .delete(any(Payment.class));
    }

    // =========================================================
    // CREATE REFUND
    // =========================================================

    @Test
    void testRefundPayment() {

        RefundRequest request =
                new RefundRequest();

        request.setDeliveryId(401L);
        request.setRefundAmount(
                new BigDecimal("1500.00"));
        request.setReason(
                "Damaged crop delivery");

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));

        when(refundRepository
                .findByPaymentIdAndStatus(
                        1L,
                        RefundStatus.SUCCESS))
                .thenReturn(Optional.empty());

        when(refundRepository.save(any(Refund.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        RefundResponse response =
                paymentService.refundPayment(
                        1L,
                        request);

        assertNotNull(response);

        assertEquals(
                1L,
                response.getPaymentId());

        assertEquals(
                101L,
                response.getOrderId());

        assertEquals(
                401L,
                response.getDeliveryId());

        assertEquals(
                new BigDecimal("1500.00"),
                response.getRefundAmount());

        assertEquals(
                "Damaged crop delivery",
                response.getReason());

        assertEquals(
                "SUCCESS",
                response.getStatus());

        assertNotNull(
                response.getRefundReference());

        assertTrue(
                response.getRefundReference()
                        .startsWith("REF-"));

        assertNotNull(
                response.getRefundedAt());

        verify(refundRepository, atLeastOnce())
                .save(any(Refund.class));

        verify(invoiceServiceClient, times(1))
                .generateInvoiceFromPayment(any());
    }

    // =========================================================
    // REFUND - PAYMENT NOT FOUND
    // =========================================================

    @Test
    void testRefundPaymentPaymentNotFound() {

        RefundRequest request =
                new RefundRequest();

        request.setDeliveryId(401L);
        request.setRefundAmount(
                new BigDecimal("1000.00"));
        request.setReason("Damaged");

        when(paymentRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                PaymentNotFoundException.class,
                () ->
                        paymentService.refundPayment(
                                999L,
                                request));

        verify(refundRepository, never())
                .save(any(Refund.class));
    }

    // =========================================================
    // REFUND - PAYMENT NOT SUCCESSFUL
    // =========================================================

    @Test
    void testRefundPaymentFailedPayment() {

        payment.setStatus(
                PaymentStatus.PENDING);

        RefundRequest request =
                new RefundRequest();

        request.setDeliveryId(401L);
        request.setRefundAmount(
                new BigDecimal("1000.00"));
        request.setReason("Damaged");

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));

        assertThrows(
                RefundException.class,
                () ->
                        paymentService.refundPayment(
                                1L,
                                request));

        verify(refundRepository, never())
                .save(any(Refund.class));
    }

    // =========================================================
    // REFUND - AMOUNT GREATER THAN PAYMENT
    // =========================================================

    @Test
    void testRefundAmountGreaterThanPayment() {

        RefundRequest request =
                new RefundRequest();

        request.setDeliveryId(401L);
        request.setRefundAmount(
                new BigDecimal("3000.00"));
        request.setReason("Full refund");

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));

        when(refundRepository
                .findByPaymentIdAndStatus(
                        1L,
                        RefundStatus.SUCCESS))
                .thenReturn(Optional.empty());

        assertThrows(
                RefundException.class,
                () ->
                        paymentService.refundPayment(
                                1L,
                                request));

        verify(refundRepository, never())
                .save(any(Refund.class));
    }

    // =========================================================
    // EXISTING SUCCESSFUL REFUND
    // =========================================================

    @Test
    void testRefundPaymentExistingSuccessfulRefund() {

        RefundRequest request =
                new RefundRequest();

        request.setDeliveryId(401L);
        request.setRefundAmount(
                new BigDecimal("1500.00"));
        request.setReason("Damaged");

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));

        when(refundRepository
                .findByPaymentIdAndStatus(
                        1L,
                        RefundStatus.SUCCESS))
                .thenReturn(Optional.of(refund));

        RefundResponse response =
                paymentService.refundPayment(
                        1L,
                        request);

        assertNotNull(response);

        assertEquals(
                1L,
                response.getId());

        assertEquals(
                "SUCCESS",
                response.getStatus());

        /*
         * Existing refund is returned.
         */
        verify(refundRepository, never())
                .save(any(Refund.class));

        verify(invoiceServiceClient, never())
                .generateInvoiceFromPayment(any());
    }

    // =========================================================
    // GET REFUND
    // =========================================================

    @Test
    void testGetRefundByPaymentId() {

        when(refundRepository
                .findByPaymentIdAndStatus(
                        1L,
                        RefundStatus.SUCCESS))
                .thenReturn(Optional.of(refund));

        RefundResponse response =
                paymentService.getRefundByPaymentId(1L);

        assertNotNull(response);

        assertEquals(
                1L,
                response.getId());

        assertEquals(
                1L,
                response.getPaymentId());

        assertEquals(
                101L,
                response.getOrderId());

        assertEquals(
                "SUCCESS",
                response.getStatus());

        assertEquals(
                new BigDecimal("1500.00"),
                response.getRefundAmount());

        verify(refundRepository, times(1))
                .findByPaymentIdAndStatus(
                        1L,
                        RefundStatus.SUCCESS);
    }

    // =========================================================
    // GET REFUND - NOT FOUND
    // =========================================================

    @Test
    void testGetRefundByPaymentIdNotFound() {

        when(refundRepository
                .findByPaymentIdAndStatus(
                        999L,
                        RefundStatus.SUCCESS))
                .thenReturn(Optional.empty());

        assertThrows(
                RefundException.class,
                () ->
                        paymentService
                                .getRefundByPaymentId(999L));

        verify(refundRepository, times(1))
                .findByPaymentIdAndStatus(
                        999L,
                        RefundStatus.SUCCESS);
    }

    // =========================================================
    // UPDATE REFUND
    // =========================================================

    @Test
    void testUpdateRefund() {

        UpdateRefundRequest request =
                new UpdateRefundRequest();

        request.setDeliveryId(555L);
        request.setRefundAmount(
                new BigDecimal("1200.00"));
        request.setReason(
                "Updated refund reason");

        when(refundRepository
                .findByPaymentIdAndStatus(
                        1L,
                        RefundStatus.SUCCESS))
                .thenReturn(Optional.of(refund));

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));

        when(refundRepository.save(any(Refund.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        RefundResponse response =
                paymentService.updateRefund(
                        1L,
                        request);

        assertNotNull(response);

        assertEquals(
                555L,
                response.getDeliveryId());

        assertEquals(
                new BigDecimal("1200.00"),
                response.getRefundAmount());

        assertEquals(
                "Updated refund reason",
                response.getReason());

        assertEquals(
                "SUCCESS",
                response.getStatus());

        verify(refundRepository, times(1))
                .save(any(Refund.class));
    }

    // =========================================================
    // UPDATE REFUND - PARTIAL UPDATE
    // =========================================================

    @Test
    void testUpdateRefundPartialUpdate() {

        UpdateRefundRequest request =
                new UpdateRefundRequest();

        request.setReason(
                "Updated reason only");

        when(refundRepository
                .findByPaymentIdAndStatus(
                        1L,
                        RefundStatus.SUCCESS))
                .thenReturn(Optional.of(refund));

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));

        when(refundRepository.save(any(Refund.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        RefundResponse response =
                paymentService.updateRefund(
                        1L,
                        request);

        assertEquals(
                "Updated reason only",
                response.getReason());

        /*
         * Existing values remain unchanged.
         */
        assertEquals(
                401L,
                response.getDeliveryId());

        assertEquals(
                new BigDecimal("1500.00"),
                response.getRefundAmount());
    }

    // =========================================================
    // UPDATE REFUND - NOT FOUND
    // =========================================================

    @Test
    void testUpdateRefundNotFound() {

        UpdateRefundRequest request =
                new UpdateRefundRequest();

        request.setReason(
                "Updated reason");

        when(refundRepository
                .findByPaymentIdAndStatus(
                        999L,
                        RefundStatus.SUCCESS))
                .thenReturn(Optional.empty());

        assertThrows(
                RefundException.class,
                () ->
                        paymentService.updateRefund(
                                999L,
                                request));

        verify(refundRepository, never())
                .save(any(Refund.class));
    }

    // =========================================================
    // UPDATE REFUND - PAYMENT NOT FOUND
    // =========================================================

    @Test
    void testUpdateRefundPaymentNotFound() {

        UpdateRefundRequest request =
                new UpdateRefundRequest();

        request.setReason(
                "Updated reason");

        when(refundRepository
                .findByPaymentIdAndStatus(
                        1L,
                        RefundStatus.SUCCESS))
                .thenReturn(Optional.of(refund));

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(
                PaymentNotFoundException.class,
                () ->
                        paymentService.updateRefund(
                                1L,
                                request));

        verify(refundRepository, never())
                .save(any(Refund.class));
    }

    // =========================================================
    // UPDATE REFUND - AMOUNT GREATER THAN PAYMENT
    // =========================================================

    @Test
    void testUpdateRefundAmountGreaterThanPayment() {

        UpdateRefundRequest request =
                new UpdateRefundRequest();

        request.setRefundAmount(
                new BigDecimal("3000.00"));

        when(refundRepository
                .findByPaymentIdAndStatus(
                        1L,
                        RefundStatus.SUCCESS))
                .thenReturn(Optional.of(refund));

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));

        assertThrows(
                RefundException.class,
                () ->
                        paymentService.updateRefund(
                                1L,
                                request));

        verify(refundRepository, never())
                .save(any(Refund.class));
    }

    // =========================================================
    // CANCEL REFUND
    // =========================================================

    @Test
    void testCancelRefund() {

        when(refundRepository
                .findByPaymentIdAndStatus(
                        1L,
                        RefundStatus.SUCCESS))
                .thenReturn(Optional.of(refund));

        when(refundRepository.save(any(Refund.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        RefundResponse response =
                paymentService.cancelRefund(1L);

        assertNotNull(response);

        assertEquals(
                "CANCELLED",
                response.getStatus());

        assertEquals(
                RefundStatus.CANCELLED,
                refund.getStatus());

        assertNull(
                response.getRefundedAt());

        verify(refundRepository, times(1))
                .save(any(Refund.class));
    }

    // =========================================================
    // CANCEL REFUND - NOT FOUND
    // =========================================================

    @Test
    void testCancelRefundNotFound() {

        when(refundRepository
                .findByPaymentIdAndStatus(
                        999L,
                        RefundStatus.SUCCESS))
                .thenReturn(Optional.empty());

        assertThrows(
                RefundException.class,
                () ->
                        paymentService.cancelRefund(999L));

        verify(refundRepository, never())
                .save(any(Refund.class));
    }

    // =========================================================
    // CONVERT PAYMENT RESPONSE CHECK
    // =========================================================

    @Test
    void testPaymentResponseContainsAllDetails() {

        when(paymentRepository.findById(1L))
                .thenReturn(Optional.of(payment));

        PaymentResponse response =
                paymentService.getPaymentById(1L);

        assertEquals(
                payment.getId(),
                response.getId());

        assertEquals(
                payment.getOrderId(),
                response.getOrderId());

        assertEquals(
                payment.getDealerId(),
                response.getDealerId());

        assertEquals(
                payment.getFarmerId(),
                response.getFarmerId());

        assertEquals(
                payment.getAmount(),
                response.getAmount());

        assertEquals(
                payment.getPaymentMethod(),
                response.getPaymentMethod());

        assertEquals(
                payment.getStatus().name(),
                response.getStatus());

        assertEquals(
                payment.getTransactionReference(),
                response.getTransactionReference());

        assertEquals(
                payment.getPaidAt(),
                response.getPaidAt());
    }

    // =========================================================
    // CONVERT REFUND RESPONSE CHECK
    // =========================================================

    @Test
    void testRefundResponseContainsAllDetails() {

        when(refundRepository
                .findByPaymentIdAndStatus(
                        1L,
                        RefundStatus.SUCCESS))
                .thenReturn(Optional.of(refund));

        RefundResponse response =
                paymentService.getRefundByPaymentId(1L);

        assertEquals(
                refund.getId(),
                response.getId());

        assertEquals(
                refund.getPaymentId(),
                response.getPaymentId());

        assertEquals(
                refund.getOrderId(),
                response.getOrderId());

        assertEquals(
                refund.getDeliveryId(),
                response.getDeliveryId());

        assertEquals(
                refund.getRefundAmount(),
                response.getRefundAmount());

        assertEquals(
                refund.getReason(),
                response.getReason());

        assertEquals(
                refund.getStatus().name(),
                response.getStatus());

        assertEquals(
                refund.getRefundReference(),
                response.getRefundReference());

        assertEquals(
                refund.getRefundedAt(),
                response.getRefundedAt());
    }
}