package com.service;

import com.client.InvoiceServiceClient;
import com.dto.*;
import com.entity.Payment;
import com.entity.PaymentStatus;
import com.entity.Refund;
import com.entity.RefundStatus;
import com.exception.PaymentNotFoundException;
import com.exception.RefundException;
import com.repository.PaymentRepository;
import com.repository.RefundRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;

    private final RefundRepository refundRepository;

    private final InvoiceServiceClient invoiceServiceClient;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            RefundRepository refundRepository,
            InvoiceServiceClient invoiceServiceClient) {

        this.paymentRepository = paymentRepository;
        this.refundRepository = refundRepository;
        this.invoiceServiceClient = invoiceServiceClient;
    }

    @Override
    public PaymentResponse makePayment(
            PaymentRequest request) {

        Payment existingPayment =
                paymentRepository
                        .findByOrderId(request.getOrderId())
                        .orElse(null);

        if (existingPayment != null &&
                existingPayment.getStatus() == PaymentStatus.SUCCESS) {

            return convertToPaymentResponse(
                    existingPayment);
        }

        Payment payment;

        if (existingPayment != null) {
            payment = existingPayment;
        } else {
            payment = new Payment();
        }

        payment.setOrderId(request.getOrderId());
        payment.setDealerId(request.getDealerId());
        payment.setFarmerId(request.getFarmerId());
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());

        payment.setStatus(PaymentStatus.PENDING);

        Payment savedPayment =
                paymentRepository.save(payment);

        /*
         * Dummy payment processing.
         * In a real application this is where
         * Razorpay/Stripe/etc. would be called.
         */
        savedPayment.setStatus(PaymentStatus.SUCCESS);

        savedPayment.setTransactionReference(
                "TXN-" +
                        UUID.randomUUID()
                                .toString()
                                .substring(0, 8)
                                .toUpperCase());

        savedPayment.setPaidAt(
                LocalDateTime.now());

        savedPayment =
                paymentRepository.save(savedPayment);

        generateInvoice(savedPayment);

        return convertToPaymentResponse(
                savedPayment);
    }

    @Override
    public List<PaymentResponse> getAllPayments() {

        return paymentRepository.findAll()
                .stream()
                .map(this::convertToPaymentResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PaymentResponse getPaymentById(
            Long id) {

        Payment payment =
                paymentRepository.findById(id)
                        .orElseThrow(() ->
                                new PaymentNotFoundException(
                                        "Payment not found with id: "
                                                + id));

        return convertToPaymentResponse(payment);
    }

    @Override
    public PaymentResponse updatePayment(
            Long id,
            UpdatePaymentRequest request) {

        Payment payment =
                paymentRepository.findById(id)
                        .orElseThrow(() ->
                                new PaymentNotFoundException(
                                        "Payment not found with id: "
                                                + id));

        /*
         * A successful payment is a financial record.
         * Do not modify a completed payment.
         */
        if (payment.getStatus() == PaymentStatus.SUCCESS) {

            throw new IllegalStateException(
                    "Successful payment cannot be updated");
        }

        if (request.getDealerId() != null) {
            payment.setDealerId(
                    request.getDealerId());
        }

        if (request.getFarmerId() != null) {
            payment.setFarmerId(
                    request.getFarmerId());
        }

        if (request.getAmount() != null) {
            payment.setAmount(
                    request.getAmount());
        }

        if (request.getPaymentMethod() != null &&
                !request.getPaymentMethod().isBlank()) {

            payment.setPaymentMethod(
                    request.getPaymentMethod());
        }

        return convertToPaymentResponse(
                paymentRepository.save(payment));
    }

    @Override
    public void deletePayment(Long id) {

        Payment payment =
                paymentRepository.findById(id)
                        .orElseThrow(() ->
                                new PaymentNotFoundException(
                                        "Payment not found with id: "
                                                + id));

        if (payment.getStatus() ==
                PaymentStatus.SUCCESS) {

            throw new IllegalStateException(
                    "Successful payment cannot be deleted");
        }

        paymentRepository.delete(payment);
    }

    @Override
    public RefundResponse refundPayment(
            Long paymentId,
            RefundRequest request) {

        Payment payment =
                paymentRepository.findById(paymentId)
                        .orElseThrow(() ->
                                new PaymentNotFoundException(
                                        "Payment not found with id: "
                                                + paymentId));

        if (payment.getStatus() !=
                PaymentStatus.SUCCESS) {

            throw new RefundException(
                    "Only successful payments can be refunded");
        }

        Refund existingRefund =
                refundRepository
                        .findByPaymentIdAndStatus(
                                paymentId,
                                RefundStatus.SUCCESS)
                        .orElse(null);

        if (existingRefund != null) {

            return convertToRefundResponse(
                    existingRefund);
        }

        if (request.getRefundAmount()
                .compareTo(payment.getAmount()) > 0) {

            throw new RefundException(
                    "Refund amount cannot be greater than payment amount");
        }

        Refund refund = new Refund();

        refund.setPaymentId(payment.getId());
        refund.setOrderId(payment.getOrderId());
        refund.setDeliveryId(request.getDeliveryId());
        refund.setRefundAmount(
                request.getRefundAmount());
        refund.setReason(request.getReason());

        refund.setStatus(RefundStatus.PENDING);

        Refund savedRefund =
                refundRepository.save(refund);

        /*
         * Dummy refund processing.
         */
        savedRefund.setStatus(
                RefundStatus.SUCCESS);

        savedRefund.setRefundReference(
                "REF-" +
                        UUID.randomUUID()
                                .toString()
                                .substring(0, 8)
                                .toUpperCase());

        savedRefund.setRefundedAt(
                LocalDateTime.now());

        savedRefund =
                refundRepository.save(savedRefund);

        generateRefundInvoice(
                payment,
                savedRefund);

        return convertToRefundResponse(
                savedRefund);
    }

    @Override
    public RefundResponse getRefundByPaymentId(
            Long paymentId) {

        Refund refund =
                refundRepository
                        .findByPaymentIdAndStatus(
                                paymentId,
                                RefundStatus.SUCCESS)
                        .orElseThrow(() ->
                                new RefundException(
                                        "Refund not found for payment id: "
                                                + paymentId));

        return convertToRefundResponse(refund);
    }

    @Override
    public RefundResponse updateRefund(
            Long paymentId,
            UpdateRefundRequest request) {

        Refund refund =
                refundRepository
                        .findByPaymentIdAndStatus(
                                paymentId,
                                RefundStatus.SUCCESS)
                        .orElseThrow(() ->
                                new RefundException(
                                        "Successful refund not found for payment id: "
                                                + paymentId));

        Payment payment =
                paymentRepository.findById(paymentId)
                        .orElseThrow(() ->
                                new PaymentNotFoundException(
                                        "Payment not found with id: "
                                                + paymentId));

        /*
         * For this college/demo project we allow
         * updating the refund details.
         *
         * In a real payment system, a completed refund
         * normally should not be edited.
         */
        if (request.getDeliveryId() != null) {
            refund.setDeliveryId(
                    request.getDeliveryId());
        }

        if (request.getRefundAmount() != null) {

            if (request.getRefundAmount()
                    .compareTo(payment.getAmount()) > 0) {

                throw new RefundException(
                        "Refund amount cannot be greater than payment amount");
            }

            refund.setRefundAmount(
                    request.getRefundAmount());
        }

        if (request.getReason() != null) {
            refund.setReason(
                    request.getReason());
        }

        return convertToRefundResponse(
                refundRepository.save(refund));
    }

    @Override
    public RefundResponse cancelRefund(
            Long paymentId) {

        Refund refund =
                refundRepository
                        .findByPaymentIdAndStatus(
                                paymentId,
                                RefundStatus.SUCCESS)
                        .orElseThrow(() ->
                                new RefundException(
                                        "Active refund not found for payment id: "
                                                + paymentId));

        /*
         * DELETE refund does not physically delete
         * the financial record.
         *
         * It marks the refund as CANCELLED.
         */
        refund.setStatus(
                RefundStatus.CANCELLED);

        refund.setRefundedAt(null);

        Refund savedRefund =
                refundRepository.save(refund);

        return convertToRefundResponse(
                savedRefund);
    }

    private void generateInvoice(
            Payment payment) {

        try {

            InvoicePaymentRequest invoiceRequest =
                    new InvoicePaymentRequest();

            invoiceRequest.setPaymentId(
                    payment.getId());

            invoiceRequest.setOrderId(
                    payment.getOrderId());

            invoiceRequest.setDealerId(
                    payment.getDealerId());

            invoiceRequest.setFarmerId(
                    payment.getFarmerId());

            invoiceRequest.setAmount(
                    payment.getAmount());

            invoiceRequest.setPaymentStatus(
                    payment.getStatus().name());

            invoiceRequest.setPaymentMethod(
                    payment.getPaymentMethod());

            invoiceRequest.setTransactionReference(
                    payment.getTransactionReference());

            invoiceServiceClient
                    .generateInvoiceFromPayment(
                            invoiceRequest);

        } catch (Exception e) {

            System.out.println(
                    "Invoice Service unavailable: "
                            + e.getMessage());
        }
    }

    private void generateRefundInvoice(
            Payment payment,
            Refund refund) {

        try {

            InvoicePaymentRequest invoiceRequest =
                    new InvoicePaymentRequest();

            invoiceRequest.setPaymentId(
                    payment.getId());

            invoiceRequest.setOrderId(
                    payment.getOrderId());

            invoiceRequest.setDealerId(
                    payment.getDealerId());

            invoiceRequest.setFarmerId(
                    payment.getFarmerId());

            invoiceRequest.setAmount(
                    refund.getRefundAmount());

            invoiceRequest.setPaymentStatus(
                    refund.getStatus().name());

            invoiceRequest.setPaymentMethod(
                    "REFUND");

            invoiceRequest.setTransactionReference(
                    refund.getRefundReference());

            invoiceServiceClient
                    .generateInvoiceFromPayment(
                            invoiceRequest);

        } catch (Exception e) {

            System.out.println(
                    "Invoice Service unavailable while processing refund: "
                            + e.getMessage());
        }
    }

    private PaymentResponse convertToPaymentResponse(
            Payment payment) {

        PaymentResponse response =
                new PaymentResponse();

        response.setId(payment.getId());
        response.setOrderId(payment.getOrderId());
        response.setDealerId(payment.getDealerId());
        response.setFarmerId(payment.getFarmerId());
        response.setAmount(payment.getAmount());
        response.setPaymentMethod(
                payment.getPaymentMethod());

        if (payment.getStatus() != null) {
            response.setStatus(
                    payment.getStatus().name());
        }

        response.setTransactionReference(
                payment.getTransactionReference());

        response.setPaidAt(
                payment.getPaidAt());

        return response;
    }

    private RefundResponse convertToRefundResponse(
            Refund refund) {

        RefundResponse response =
                new RefundResponse();

        response.setId(refund.getId());
        response.setPaymentId(
                refund.getPaymentId());
        response.setOrderId(
                refund.getOrderId());
        response.setDeliveryId(
                refund.getDeliveryId());
        response.setRefundAmount(
                refund.getRefundAmount());
        response.setReason(
                refund.getReason());

        if (refund.getStatus() != null) {
            response.setStatus(
                    refund.getStatus().name());
        }

        response.setRefundReference(
                refund.getRefundReference());

        response.setRefundedAt(
                refund.getRefundedAt());

        return response;
    }
}