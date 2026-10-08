package com.cropdeal.wallet.controller;

import com.cropdeal.wallet.dto.*;
import com.cropdeal.wallet.service.WalletService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<WalletResponse> getWallet(@PathVariable Long userId) {
        return ResponseEntity.ok(walletService.getWallet(userId));
    }

    @PostMapping("/credit")
    public ResponseEntity<WalletResponse> creditWallet(@Valid @RequestBody CreditWalletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(walletService.creditWallet(request));
    }

    @PostMapping("/reserve")
    public ResponseEntity<WalletResponse> reserveFunds(@Valid @RequestBody ReserveFundsRequest request) {
        return ResponseEntity.ok(walletService.reserveFunds(request));
    }

    @PostMapping("/release")
    public ResponseEntity<WalletResponse> releaseFunds(@Valid @RequestBody ReleaseFundsRequest request) {
        return ResponseEntity.ok(walletService.releaseFunds(request));
    }

    @PostMapping("/consume")
    public ResponseEntity<WalletResponse> consumeFunds(@Valid @RequestBody ConsumeFundsRequest request) {
        return ResponseEntity.ok(walletService.consumeFunds(request));
    }

    @GetMapping("/transactions/{userId}")
    public ResponseEntity<List<WalletTransactionResponse>> getTransactions(@PathVariable Long userId) {
        return ResponseEntity.ok(walletService.getTransactions(userId));
    }
}