package com.cropdeal.auth.exception;

public class UserAlreadyExistsException
        extends RuntimeException {

    public UserAlreadyExistsException(String message) {
        super(message);
    }
}