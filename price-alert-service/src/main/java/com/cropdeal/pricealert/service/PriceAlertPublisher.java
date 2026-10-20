package com.cropdeal.pricealert.service;

import com.cropdeal.pricealert.dto.PriceAlertTriggeredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceAlertPublisher {

    private final RabbitTemplate rabbitTemplate;
    public static final String EXCHANGE = "cropdeal.notification.exchange";
    public static final String ROUTING_KEY = "price.alert";

    public void publishAlert(PriceAlertTriggeredEvent event) {
        try {
            log.info("Publishing PriceAlertTriggeredEvent to RabbitMQ: subId={}, userId={}, crop={}, matchedPrice={}",
                    event.getSubscriptionId(), event.getUserId(), event.getCropName(), event.getMatchedPrice());
            rabbitTemplate.convertAndSend(EXCHANGE, ROUTING_KEY, event);
        } catch (Exception ex) {
            log.error("Failed to publish PriceAlertTriggeredEvent to RabbitMQ: {}", ex.getMessage(), ex);
        }
    }
}
