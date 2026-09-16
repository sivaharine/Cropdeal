package com.example.notification.service;

import com.example.notification.dto.NotificationRequest;
import com.example.notification.dto.NotificationResponse;
import com.example.notification.entity.Notification;
import com.example.notification.exception.NotificationException;
import com.example.notification.repository.NotificationRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationServiceImpl
        implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final TemplateService templateService;
    private final EmailService emailService;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            TemplateService templateService,
            EmailService emailService) {

        this.notificationRepository = notificationRepository;
        this.templateService = templateService;
        this.emailService = emailService;
    }

    @Override
    public NotificationResponse sendNotification(
            NotificationRequest request) {

        try {
            Notification notification =
                    new Notification();

            notification.setRecipient(
                    request.getRecipient()
            );

            notification.setType(
                    request.getType()
            );

            notification.setMessage(
                    request.getMessage()
            );

            notification.setOrderId(
                    request.getOrderId()
            );

            notification.setStatus("SENT");

            Notification saved =
                    notificationRepository.save(notification);

            return mapToResponse(saved);

        } catch (Exception e) {

            throw new NotificationException(
                    "Failed to send notification"
            );
        }
    }

    @Override
    public NotificationResponse sendOtp(
            String phoneNumber,
            String otp) {

        String message =
                templateService.generateOtpMessage(otp);

        /*
         * Replace this with actual SMS provider later.
         */
        System.out.println(
                "SMS TO " + phoneNumber + ": " + message
        );

        Notification notification =
                new Notification();

        notification.setRecipient(phoneNumber);
        notification.setType("DELIVERY_OTP");
        notification.setMessage(message);
        notification.setStatus("SENT");

        Notification saved =
                notificationRepository.save(notification);

        return mapToResponse(saved);
    }

    @Override
    public NotificationResponse
    sendDeliveryCompletedNotification(
            String phoneNumber,
            Long orderId) {

        String message =
                templateService
                        .generateDeliveryCompletedMessage(
                                orderId
                        );

        System.out.println(
                "SMS TO " + phoneNumber + ": " + message
        );

        Notification notification =
                new Notification();

        notification.setRecipient(phoneNumber);
        notification.setType("DELIVERY_COMPLETED");
        notification.setMessage(message);
        notification.setOrderId(orderId);
        notification.setStatus("SENT");

        Notification saved =
                notificationRepository.save(notification);

        return mapToResponse(saved);
    }

    @Override
    public NotificationResponse getNotification(
            Long notificationId) {

        Notification notification =
                notificationRepository.findById(notificationId)
                        .orElseThrow(
                                () -> new NotificationException(
                                        "Notification not found"
                                )
                        );

        return mapToResponse(notification);
    }

    @Override
    public List<NotificationResponse>
    getNotificationsByRecipient(
            String recipient) {

        return notificationRepository
                .findByRecipientOrderByCreatedAtDesc(
                        recipient
                )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<NotificationResponse>
    getNotificationsByOrder(Long orderId) {

        return notificationRepository
                .findByOrderId(orderId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private NotificationResponse mapToResponse(
            Notification notification) {

        NotificationResponse response =
                new NotificationResponse();

        response.setId(
                notification.getId()
        );

        response.setRecipient(
                notification.getRecipient()
        );

        response.setType(
                notification.getType()
        );

        response.setMessage(
                notification.getMessage()
        );

        response.setStatus(
                notification.getStatus()
        );

        response.setOrderId(
                notification.getOrderId()
        );

        response.setCreatedAt(
                notification.getCreatedAt()
        );

        return response;
    }
}