package com.controller;

import com.dto.PaymentRequest;
import com.dto.PaymentResponse;
import com.dto.RefundRequest;
import com.dto.RefundResponse;
import com.dto.UpdatePaymentRequest;
import com.dto.UpdateRefundRequest;
import com.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(
            PaymentService paymentService) {

        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<PaymentResponse> makePayment(
            @Valid @RequestBody PaymentRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(paymentService.makePayment(request));
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getAllPayments() {

        return ResponseEntity.ok(
                paymentService.getAllPayments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPaymentById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                paymentService.getPaymentById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentResponse> updatePayment(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePaymentRequest request) {

        return ResponseEntity.ok(
                paymentService.updatePayment(
                        id,
                        request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletePayment(
            @PathVariable Long id) {

        paymentService.deletePayment(id);

        return ResponseEntity.ok(
                "Payment deleted successfully");
    }

    @PostMapping("/{paymentId}/refund")
    public ResponseEntity<RefundResponse> refundPayment(
            @PathVariable Long paymentId,
            @Valid @RequestBody RefundRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        paymentService.refundPayment(
                                paymentId,
                                request));
    }

    @GetMapping("/{paymentId}/refund")
    public ResponseEntity<RefundResponse> getRefund(
            @PathVariable Long paymentId) {

        return ResponseEntity.ok(
                paymentService.getRefundByPaymentId(
                        paymentId));
    }

    @PutMapping("/{paymentId}/refund")
    public ResponseEntity<RefundResponse> updateRefund(
            @PathVariable Long paymentId,
            @Valid @RequestBody UpdateRefundRequest request) {

        return ResponseEntity.ok(
                paymentService.updateRefund(
                        paymentId,
                        request));
    }

    @DeleteMapping("/{paymentId}/refund")
    public ResponseEntity<RefundResponse> cancelRefund(
            @PathVariable Long paymentId) {

        return ResponseEntity.ok(
                paymentService.cancelRefund(
                        paymentId));
    }
}