package com.example.notification.controller;

import com.example.notification.dto.DeliveryCompletedRequest;
import com.example.notification.dto.NotificationRequest;
import com.example.notification.dto.NotificationResponse;
import com.example.notification.dto.OtpNotificationRequest;
import com.example.notification.service.NotificationService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(
            NotificationService notificationService) {

        this.notificationService =
                notificationService;
    }

    // ---------------------------------------------------------
    // GENERAL NOTIFICATION
    // ---------------------------------------------------------

    // POST /api/notifications
    @PostMapping
    public ResponseEntity<NotificationResponse>
    sendNotification(
            @Valid @RequestBody NotificationRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        notificationService.sendNotification(
                                request
                        )
                );
    }

    // ---------------------------------------------------------
    // DELIVERY OTP
    // ---------------------------------------------------------

    // POST /api/notifications/delivery-otp
    @PostMapping("/delivery-otp")
    public ResponseEntity<NotificationResponse>
    sendDeliveryOtp(
            @Valid @RequestBody OtpNotificationRequest request) {

        return ResponseEntity.ok(
                notificationService.sendOtp(
                        request.getPhoneNumber(),
                        request.getOtp()
                )
        );
    }

    // ---------------------------------------------------------
    // DELIVERY COMPLETED
    // ---------------------------------------------------------

    // POST /api/notifications/delivery-completed
    @PostMapping("/delivery-completed")
    public ResponseEntity<NotificationResponse>
    sendDeliveryCompleted(
            @Valid
            @RequestBody DeliveryCompletedRequest request) {

        return ResponseEntity.ok(
                notificationService
                        .sendDeliveryCompletedNotification(
                                request.getPhoneNumber(),
                                request.getOrderId()
                        )
        );
    }

    // ---------------------------------------------------------
    // GET NOTIFICATION
    // ---------------------------------------------------------

    // GET /api/notifications/{notificationId}
    @GetMapping("/{notificationId}")
    public ResponseEntity<NotificationResponse>
    getNotification(
            @PathVariable Long notificationId) {

        return ResponseEntity.ok(
                notificationService.getNotification(
                        notificationId
                )
        );
    }

    // ---------------------------------------------------------
    // GET BY RECIPIENT
    // ---------------------------------------------------------

    // GET /api/notifications/recipient/{recipient}
    @GetMapping("/recipient/{recipient}")
    public ResponseEntity<List<NotificationResponse>>
    getByRecipient(
            @PathVariable String recipient) {

        return ResponseEntity.ok(
                notificationService
                        .getNotificationsByRecipient(
                                recipient
                        )
        );
    }

    // ---------------------------------------------------------
    // GET BY ORDER
    // ---------------------------------------------------------

    // GET /api/notifications/order/{orderId}
    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<NotificationResponse>>
    getByOrder(
            @PathVariable Long orderId) {

        return ResponseEntity.ok(
                notificationService
                        .getNotificationsByOrder(orderId)
        );
    }
}