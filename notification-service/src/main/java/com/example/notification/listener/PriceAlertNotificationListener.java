package com.example.notification.listener;

import com.example.notification.config.RabbitMQConfig;
import com.example.notification.dto.PriceAlertTriggeredEvent;
import com.example.notification.entity.Notification;
import com.example.notification.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class PriceAlertNotificationListener {

    private static final Logger log = LoggerFactory.getLogger(PriceAlertNotificationListener.class);

    private final NotificationRepository notificationRepository;

    public PriceAlertNotificationListener(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @RabbitListener(queues = RabbitMQConfig.PRICE_ALERT_QUEUE)
    public void handlePriceAlert(PriceAlertTriggeredEvent event) {
        try {
            log.info("Received PriceAlertTriggeredEvent for user: {} (Role: {}), crop: {}, message: {}",
                    event.getUserId(), event.getUserRole(), event.getCropName(), event.getMessage());

            Notification notification = new Notification();
            notification.setRecipient("user-" + event.getUserId());
            notification.setType("PRICE_ALERT");
            notification.setMessage(event.getMessage());
            notification.setStatus("SENT");

            notificationRepository.save(notification);

            System.out.println("=================================================");
            System.out.println(">>> PUSH NOTIFICATION DISPATCHED TO USER " + event.getUserId() + " (" + event.getUserRole() + ")");
            System.out.println(">>> " + event.getMessage());
            System.out.println("=================================================");

        } catch (Exception e) {
            log.error("Failed to process price alert notification: {}", e.getMessage(), e);
        }
    }
}