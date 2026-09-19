package com.service;

import com.dto.*;

import java.util.List;

public interface PaymentService {

    PaymentResponse makePayment(PaymentRequest request);

    PaymentResponse getPaymentById(Long id);

    PaymentResponse getPaymentByOrderId(Long orderId);

    PaymentResponse refundPaymentByOrderId(Long orderId);

    List<PaymentResponse> getAllPayments();

    PaymentResponse updatePayment(Long id, PaymentRequest request);

    void deletePayment(Long id);

    WalletResponse creditWallet(WalletSettlementRequest request);

    WalletResponse creditWallet(WalletCreditRequest request);

    WalletResponse debitWallet(WalletDebitRequest request);

    WalletResponse topUpWallet(WalletTopUpRequest request);

    WalletResponse getWallet(Long userId);
}
