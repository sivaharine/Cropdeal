package com.cropdeal.priceservice.exception;

public class UnauthorizedAlertAccessException extends RuntimeException {
    public UnauthorizedAlertAccessException(String message) {
        super(message);
    }
}