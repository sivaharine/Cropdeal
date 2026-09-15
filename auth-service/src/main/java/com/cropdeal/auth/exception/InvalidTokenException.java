package com.cropdeal.auth.exception;

public class InvalidTokenException
        extends RuntimeException {

    public InvalidTokenException(String message) {
        super(message);
    }
}