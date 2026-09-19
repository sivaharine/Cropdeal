package com.cropdeal.cropservice.exception;

public class InsufficientQuantityException extends RuntimeException {
    public InsufficientQuantityException(String message) { super(message); }
}
