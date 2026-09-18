package com.cropdeal.priceservice.exception;

public class InvalidSubscriptionException extends RuntimeException {
    public InvalidSubscriptionException(String message) {
        super(message);
    }
}