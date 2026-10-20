package com.service;

import com.config.RabbitMQConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.Map;

@Component
public class OrderEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);

    @Autowired(required = false)
    private RabbitTemplate rabbitTemplate;

    public void publishOrderPlacedEvent(Long orderId, String cropName, Object totalAmount, Long buyerId, Long farmerId) {
        Map<String, Object> event = Map.of(
                "eventType", "ORDER_PLACED",
                "orderId", orderId,
                "cropName", cropName,
                "totalAmount", String.valueOf(totalAmount),
                "dealerId", buyerId,
                "farmerId", farmerId,
                "timestamp", System.currentTimeMillis()
        );
        publish("cropdeal.order.placed", event);
    }

    public void publishOrderCompletedEvent(Long orderId, String status) {
        Map<String, Object> event = Map.of(
                "eventType", "ORDER_COMPLETED",
                "orderId", orderId,
                "status", status,
                "timestamp", System.currentTimeMillis()
        );
        publish("cropdeal.order.completed", event);
    }

    public void publishOrderCompensatedEvent(Long orderId, String reason) {
        Map<String, Object> event = Map.of(
                "eventType", "ORDER_COMPENSATED",
                "orderId", orderId,
                "reason", reason,
                "timestamp", System.currentTimeMillis()
        );
        publish("cropdeal.order.compensated", event);
    }

    private void publish(String routingKey, Map<String, Object> event) {
        if (rabbitTemplate != null) {
            try {
                rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, routingKey, event);
                log.info("RabbitMQ published event [{}] successfully: {}", routingKey, event);
            } catch (Exception e) {
                log.warn("RabbitMQ broker unavailable. Continuing without async event: {}", e.getMessage());
            }
        } else {
            log.info("RabbitTemplate not initialized. Mock event published: {}", event);
        }
    }
}
