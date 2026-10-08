package com.example.demo.exception;

public class InvalidOfferException extends RuntimeException {

    public InvalidOfferException(String message) {
        super(message);
    }
}
