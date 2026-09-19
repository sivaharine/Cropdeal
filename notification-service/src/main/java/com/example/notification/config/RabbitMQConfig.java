package com.example.notification.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "cropdeal.notification.exchange";
    public static final String QUEUE = "cropdeal.notification.queue";
    public static final String ROUTING_KEY = "notification.#";
    public static final String NEGOTIATION_ACCEPTED_ROUTING_KEY = "notification.negotiation.accepted";
    public static final String PAYMENT_COMPLETED_ROUTING_KEY = "notification.payment.completed";
    public static final String DELIVERY_ACCEPTED_ROUTING_KEY = "notification.delivery.accepted";
    public static final String DELIVERY_COMPLETED_ROUTING_KEY = "notification.delivery.completed";

    public static final String PRICE_ALERT_EXCHANGE = "cropdeal.price.alert.exchange";
    public static final String PRICE_ALERT_QUEUE = "cropdeal.price.alert.notification.queue";
    public static final String PRICE_ALERT_ROUTING_KEY = "price.alert.triggered";

    public static final String BIDDING_EXCHANGE = "cropdeal.bidding.exchange";
    public static final String BIDDING_QUEUE = "cropdeal.bidding.notification.queue";
    public static final String BIDDING_ROUTING_KEY = "bidding.#";

    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Queue notificationQueue() {
        return new Queue(QUEUE, true);
    }

    @Bean
    public Binding notificationBinding(Queue notificationQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(notificationQueue).to(notificationExchange).with(ROUTING_KEY);
    }

    @Bean
    public TopicExchange priceAlertExchange() {
        return new TopicExchange(PRICE_ALERT_EXCHANGE, true, false);
    }

    @Bean
    public Queue priceAlertNotificationQueue() {
        return new Queue(PRICE_ALERT_QUEUE, true);
    }

    @Bean
    public Binding priceAlertNotificationBinding(Queue priceAlertNotificationQueue, TopicExchange priceAlertExchange) {
        return BindingBuilder.bind(priceAlertNotificationQueue).to(priceAlertExchange).with(PRICE_ALERT_ROUTING_KEY);
    }

    @Bean
    public TopicExchange biddingExchange() {
        return new TopicExchange(BIDDING_EXCHANGE, true, false);
    }

    @Bean
    public Queue biddingNotificationQueue() {
        return new Queue(BIDDING_QUEUE, true);
    }

    @Bean
    public Binding biddingNotificationBinding(Queue biddingNotificationQueue, TopicExchange biddingExchange) {
        return BindingBuilder.bind(biddingNotificationQueue).to(biddingExchange).with(BIDDING_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
