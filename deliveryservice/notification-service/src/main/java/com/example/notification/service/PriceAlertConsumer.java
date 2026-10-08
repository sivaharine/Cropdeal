package com.example.notification.service;

import com.example.notification.config.RabbitMQConfig;
import com.example.notification.dto.PriceAlertTriggeredEvent;
import com.example.notification.entity.Notification;
import com.example.notification.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class PriceAlertConsumer {

    private static final Logger log = LoggerFactory.getLogger(PriceAlertConsumer.class);

    private final NotificationRepository notificationRepository;

    public PriceAlertConsumer(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @RabbitListener(queues = RabbitMQConfig.PRICE_ALERT_QUEUE)
    public void consumePriceAlert(PriceAlertTriggeredEvent event) {
        if (event == null) {
            log.warn("Received null PriceAlertTriggeredEvent");
            return;
        }

        log.info("Received PriceAlertTriggeredEvent: subId={}, userId={}, role={}, crop={}, matchedPrice={}",
                event.getSubscriptionId(), event.getUserId(), event.getUserRole(), event.getCropName(), event.getMatchedPrice());

        try {
            Notification notification = new Notification();
            notification.setRecipient(event.getUserId() != null ? "USER_" + event.getUserId() : "UNKNOWN");
            notification.setType("PRICE_ALERT");
            notification.setMessage(event.getMessage() != null ? event.getMessage() : event.getTitle());
            notification.setStatus("SENT");

            Notification saved = notificationRepository.save(notification);
            log.info("Persisted push notification #{} for user {}", saved.getId(), notification.getRecipient());
        } catch (Exception ex) {
            log.error("Failed to save price alert notification for user {}: {}", event.getUserId(), ex.getMessage(), ex);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE)
    public void consumeGeneralNotification(com.example.notification.dto.NotificationRequest request) {
        if (request == null) {
            log.warn("Received null NotificationRequest from RabbitMQ");
            return;
        }

        log.info("Received NotificationRequest from RabbitMQ: recipient={}, type={}",
                request.getRecipient(), request.getType());

        try {
            Notification notification = new Notification();
            notification.setRecipient(request.getRecipient());
            notification.setType(request.getType() != null ? request.getType() : "SYSTEM");
            notification.setMessage(request.getMessage());
            notification.setOrderId(request.getOrderId());
            notification.setStatus("SENT");

            Notification saved = notificationRepository.save(notification);
            log.info("Persisted general notification #{} for user {}", saved.getId(), saved.getRecipient());
        } catch (Exception ex) {
            log.error("Failed to save general notification from RabbitMQ: {}", ex.getMessage(), ex);
        }
    }
}
