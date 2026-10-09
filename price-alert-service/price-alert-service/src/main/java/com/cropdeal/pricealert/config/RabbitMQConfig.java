package com.cropdeal.pricealert.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${cropdeal.rabbitmq.exchange:cropdeal.notification.exchange}")
    private String exchangeName;

    public static final String PRICE_ALERT_QUEUE = "cropdeal.price-alert.queue";

    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(exchangeName);
    }

    @Bean
    public Queue priceAlertQueue() {
        return new Queue(PRICE_ALERT_QUEUE, true);
    }

    @Bean
    public Binding priceAlertBinding(Queue priceAlertQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(priceAlertQueue).to(notificationExchange).with("price.#");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
