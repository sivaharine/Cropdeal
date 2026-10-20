package com.cropdeal.user.exception;

public class FarmerNotFoundException extends RuntimeException {

    public FarmerNotFoundException(String message) {
        super(message);
    }

    public FarmerNotFoundException(Long id) {
        super("Farmer not found with id: " + id);
    }
}
