package com.controller;

import com.dto.*;
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

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<PaymentResponse> makePayment(
            @Valid @RequestBody PaymentRequest request) {

        return new ResponseEntity<>(
                paymentService.makePayment(request),
                HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPaymentById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                paymentService.getPaymentById(id));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<PaymentResponse> getPaymentByOrderId(
            @PathVariable Long orderId) {

        return ResponseEntity.ok(
                paymentService.getPaymentByOrderId(orderId));
    }

    @PostMapping("/order/{orderId}/refund")
    public ResponseEntity<PaymentResponse> refundPaymentByOrderId(
            @PathVariable Long orderId) {

        return ResponseEntity.ok(
                paymentService.refundPaymentByOrderId(orderId));
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getAllPayments() {

        return ResponseEntity.ok(
                paymentService.getAllPayments());
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentResponse> updatePayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentRequest request) {

        return ResponseEntity.ok(
                paymentService.updatePayment(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletePayment(
            @PathVariable Long id) {

        paymentService.deletePayment(id);

        return ResponseEntity.ok("Payment deleted successfully");
    }

    @PostMapping("/wallet/settlement")
    public ResponseEntity<WalletResponse> creditWallet(
            @Valid @RequestBody WalletSettlementRequest request) {

        return ResponseEntity.ok(
                paymentService.creditWallet(request));
    }

    @PostMapping("/wallet/credit")
    public ResponseEntity<WalletResponse> creditWalletGeneric(
            @Valid @RequestBody WalletCreditRequest request) {

        return ResponseEntity.ok(
                paymentService.creditWallet(request));
    }

    @PostMapping("/wallet/debit")
    public ResponseEntity<WalletResponse> debitWallet(
            @Valid @RequestBody WalletDebitRequest request) {

        return ResponseEntity.ok(
                paymentService.debitWallet(request));
    }

    @PostMapping("/wallet/topup")
    public ResponseEntity<WalletResponse> topUpWallet(
            @Valid @RequestBody WalletTopUpRequest request) {

        return ResponseEntity.ok(
                paymentService.topUpWallet(request));
    }

    @GetMapping("/wallet/{userId}")
    public ResponseEntity<WalletResponse> getWallet(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                paymentService.getWallet(userId));
    }
}
