package com.cropdeal.review.event;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class ReviewEventProducer {

    private final RabbitTemplate rabbitTemplate;

    public ReviewEventProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishReviewEvent(String eventType, Long reviewId, Long farmerId, Long orderId, Integer rating) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", eventType);
            event.put("reviewId", reviewId);
            event.put("farmerId", farmerId);
            event.put("orderId", orderId);
            event.put("rating", rating);
            rabbitTemplate.convertAndSend("cropdeal.events", "review." + eventType.toLowerCase(), event);
        } catch (Exception e) {
            // Non-blocking event logging
        }
    }
}