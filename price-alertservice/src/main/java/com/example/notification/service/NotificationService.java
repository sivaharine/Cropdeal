package com.example.notification.service;

import com.example.notification.dto.NotificationRequest;
import com.example.notification.dto.NotificationResponse;

import java.util.List;

public interface NotificationService {

    NotificationResponse sendNotification(
            NotificationRequest request
    );

    NotificationResponse sendOtp(
            String phoneNumber,
            String otp
    );

    NotificationResponse sendDeliveryCompletedNotification(
            String phoneNumber,
            Long orderId
    );

    NotificationResponse getNotification(
            Long notificationId
    );

    List<NotificationResponse> getNotificationsByRecipient(
            String recipient
    );

    List<NotificationResponse> getNotificationsByOrder(
            Long orderId
    );
}