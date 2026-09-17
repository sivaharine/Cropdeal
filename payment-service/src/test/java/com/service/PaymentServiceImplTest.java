package com.service;

import com.client.InvoiceServiceClient;
import com.dto.*;
import com.entity.Payment;
import com.entity.PaymentStatus;
import com.entity.Wallet;
import com.entity.WalletTransaction;
import com.exception.PaymentNotFoundException;
import com.repository.PaymentRepository;
import com.repository.WalletRepository;
import com.repository.WalletTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    private WalletRepository walletRepository;

    @Mock
    private WalletTransactionRepository walletTransactionRepository;

    @Mock
    private InvoiceServiceClient invoiceServiceClient;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private Payment payment;

    @BeforeEach
    void setUp() {
        payment = new Payment();
        payment.setId(1L);
        payment.setOrderId(101L);
        payment.setDealerId(201L);
        payment.setFarmerId(301L);
        payment.setAmount(new BigDecimal("2500.00"));
        payment.setPaymentMethod("UPI");
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setTransactionReference("TXN-12345678");
        payment.setPaidAt(LocalDateTime.now());
    }

    @Test
    void testMakePayment() {
        PaymentRequest request = new PaymentRequest();
        request.setOrderId(101L);
        request.setDealerId(201L);
        request.setFarmerId(301L);
        request.setAmount(new BigDecimal("2500.00"));
        request.setPaymentMethod("UPI");

        when(paymentRepository.findByOrderId(101L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.makePayment(request);

        assertNotNull(response);
        assertEquals(101L, response.getOrderId());
        assertEquals("SUCCESS", response.getStatus());
        verify(paymentRepository, atLeastOnce()).save(any(Payment.class));
    }

    @Test
    void testMakePaymentRejectCashOnDelivery() {
        PaymentRequest request = new PaymentRequest();
        request.setOrderId(101L);
        request.setDealerId(201L);
        request.setFarmerId(301L);
        request.setAmount(new BigDecimal("2500.00"));
        request.setPaymentMethod("CASH_ON_DELIVERY");

        assertThrows(IllegalArgumentException.class, () -> paymentService.makePayment(request));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void testCreditWalletIdempotent() {
        WalletSettlementRequest request = new WalletSettlementRequest();
        request.setUserId(501L);
        request.setUserRole("ROLE_DELIVERY_PARTNER");
        request.setAmount(new BigDecimal("150.00"));
        request.setReferenceId("DELIVERY-1001");
        request.setDescription("Delivery settlement");

        Wallet wallet = new Wallet();
        wallet.setId(1L);
        wallet.setUserId(501L);
        wallet.setBalance(new BigDecimal("150.00"));

        WalletTransaction tx = new WalletTransaction();
        tx.setId(1L);
        tx.setReferenceId("DELIVERY-1001");
        tx.setTransactionType("SETTLEMENT");

        when(walletTransactionRepository.findByReferenceIdAndTransactionType("DELIVERY-1001", "SETTLEMENT"))
                .thenReturn(Optional.of(tx));
        when(walletRepository.findByUserId(501L)).thenReturn(Optional.of(wallet));

        WalletResponse response = paymentService.creditWallet(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("150.00"), response.getBalance());
        verify(walletRepository, never()).save(any(Wallet.class));
    }

    @Test
    void testCreditWalletNewSettlement() {
        WalletSettlementRequest request = new WalletSettlementRequest();
        request.setUserId(501L);
        request.setUserRole("ROLE_DELIVERY_PARTNER");
        request.setAmount(new BigDecimal("150.00"));
        request.setReferenceId("DELIVERY-1002");
        request.setDescription("Delivery settlement");

        Wallet wallet = new Wallet();
        wallet.setId(1L);
        wallet.setUserId(501L);
        wallet.setBalance(BigDecimal.ZERO);

        when(walletTransactionRepository.findByReferenceIdAndTransactionType("DELIVERY-1002", "SETTLEMENT"))
                .thenReturn(Optional.empty());
        when(walletRepository.findByUserId(501L)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WalletResponse response = paymentService.creditWallet(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("150.00"), response.getBalance());
        verify(walletTransactionRepository, times(1)).save(any(WalletTransaction.class));
    }

    @Test
    void testWalletTopUp() {
        WalletTopUpRequest request = new WalletTopUpRequest(201L, "ROLE_DEALER", new BigDecimal("5000.00"), "UPI", "TOPUP-1234");

        Wallet wallet = new Wallet();
        wallet.setId(1L);
        wallet.setUserId(201L);
        wallet.setBalance(new BigDecimal("1000.00"));

        when(walletRepository.findByUserId(201L)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WalletResponse response = paymentService.topUpWallet(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("6000.00"), response.getBalance());
        verify(walletTransactionRepository, times(1)).save(any(WalletTransaction.class));
    }

    @Test
    void testDebitWalletSuccess() {
        WalletDebitRequest request = new WalletDebitRequest(201L, "ROLE_DEALER", new BigDecimal("3000.00"), "BID_HOLD_1", "BID_HOLD", "Hold for bid");

        Wallet wallet = new Wallet();
        wallet.setId(1L);
        wallet.setUserId(201L);
        wallet.setBalance(new BigDecimal("5000.00"));

        when(walletRepository.findByUserId(201L)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WalletResponse response = paymentService.debitWallet(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("2000.00"), response.getBalance());
        verify(walletTransactionRepository, times(1)).save(any(WalletTransaction.class));
    }

    @Test
    void testDebitWalletInsufficientBalance() {
        WalletDebitRequest request = new WalletDebitRequest(201L, "ROLE_DEALER", new BigDecimal("6000.00"), "BID_HOLD_1", "BID_HOLD", "Hold for bid");

        Wallet wallet = new Wallet();
        wallet.setId(1L);
        wallet.setUserId(201L);
        wallet.setBalance(new BigDecimal("5000.00"));

        when(walletRepository.findByUserId(201L)).thenReturn(Optional.of(wallet));

        assertThrows(IllegalStateException.class, () -> paymentService.debitWallet(request));
        verify(walletRepository, never()).save(any(Wallet.class));
    }

    @Test
    void testGenericCreditWallet() {
        WalletCreditRequest request = new WalletCreditRequest(201L, "ROLE_DEALER", new BigDecimal("3000.00"), "BID_REFUND_1", "BID_REFUND", "Outbid refund");

        Wallet wallet = new Wallet();
        wallet.setId(1L);
        wallet.setUserId(201L);
        wallet.setBalance(new BigDecimal("2000.00"));

        when(walletTransactionRepository.findByReferenceIdAndTransactionType("BID_REFUND_1", "BID_REFUND"))
                .thenReturn(Optional.empty());
        when(walletRepository.findByUserId(201L)).thenReturn(Optional.of(wallet));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WalletResponse response = paymentService.creditWallet(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("5000.00"), response.getBalance());
        verify(walletTransactionRepository, times(1)).save(any(WalletTransaction.class));
    }
}