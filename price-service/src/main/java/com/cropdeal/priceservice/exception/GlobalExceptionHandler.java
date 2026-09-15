package com.cropdeal.priceservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PriceApiException.class)
    public ResponseEntity<Map<String, Object>> handlePriceApiException(
            PriceApiException exception) {

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.BAD_GATEWAY.value());
        response.put("error", "Government Price API Error");
        response.put("message", exception.getMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_GATEWAY)
                .body(response);
    }


    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(
            IllegalArgumentException exception) {

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("error", "Bad Request");
        response.put("message", exception.getMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }


    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(
            Exception exception) {

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        response.put("error", "Internal Server Error");
        response.put("message", exception.getMessage());

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }
}