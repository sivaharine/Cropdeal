package com.cropdeal.wallet.exception;

public class InsufficientWalletBalanceException extends RuntimeException {
    public InsufficientWalletBalanceException(String message) {
        super(message);
    }
}