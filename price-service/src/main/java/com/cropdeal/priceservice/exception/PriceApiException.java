package com.cropdeal.priceservice.exception;

public class PriceApiException extends RuntimeException {

    public PriceApiException(String message) {
        super(message);
    }

    public PriceApiException(String message, Throwable cause) {
        super(message, cause);
    }
}