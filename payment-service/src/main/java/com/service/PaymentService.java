package com.service;

import com.dto.*;

import java.util.List;

public interface PaymentService {

    PaymentResponse makePayment(PaymentRequest request);

    List<PaymentResponse> getAllPayments();

    PaymentResponse getPaymentById(Long id);

    PaymentResponse updatePayment(
            Long id,
            UpdatePaymentRequest request);

    void deletePayment(Long id);

    RefundResponse refundPayment(
            Long paymentId,
            RefundRequest request);

    RefundResponse getRefundByPaymentId(
            Long paymentId);

    RefundResponse updateRefund(
            Long paymentId,
            UpdateRefundRequest request);

    RefundResponse cancelRefund(
            Long paymentId);
}