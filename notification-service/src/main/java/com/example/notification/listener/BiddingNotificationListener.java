package com.example.notification.listener;

import com.example.notification.config.RabbitMQConfig;
import com.example.notification.dto.BiddingNotificationEvents.*;
import com.example.notification.dto.NotificationRequest;
import com.example.notification.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class BiddingNotificationListener {

    private static final Logger log = LoggerFactory.getLogger(BiddingNotificationListener.class);

    private final NotificationService notificationService;

    public BiddingNotificationListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = RabbitMQConfig.BIDDING_QUEUE)
    public void handleBiddingEvents(Object event) {
        try {
            log.info("Received bidding event: {}", event);
        } catch (Exception e) {
            log.error("Failed to process bidding notification: {}", e.getMessage());
        }
    }
}