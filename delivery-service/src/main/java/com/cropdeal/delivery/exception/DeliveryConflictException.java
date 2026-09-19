package com.cropdeal.delivery.exception;

public class DeliveryConflictException extends RuntimeException {
    public DeliveryConflictException(String message) {
        super(message);
    }
}