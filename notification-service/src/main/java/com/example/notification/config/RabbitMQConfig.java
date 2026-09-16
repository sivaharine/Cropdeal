package com.example.notification.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE =
            "cropdeal.notification.exchange";

    public static final String QUEUE =
            "cropdeal.notification.queue";

    public static final String ROUTING_KEY =
            "notification";

    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Queue notificationQueue() {
        return new Queue(
                QUEUE,
                true
        );
    }

    @Bean
    public Binding notificationBinding(
            Queue notificationQueue,
            TopicExchange notificationExchange) {

        return BindingBuilder
                .bind(notificationQueue)
                .to(notificationExchange)
                .with(ROUTING_KEY);
    }
}