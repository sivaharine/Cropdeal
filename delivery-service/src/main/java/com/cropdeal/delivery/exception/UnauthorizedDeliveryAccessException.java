package com.cropdeal.delivery.exception;

public class UnauthorizedDeliveryAccessException extends RuntimeException {
    public UnauthorizedDeliveryAccessException(String message) {
        super(message);
    }
}