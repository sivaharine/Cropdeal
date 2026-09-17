package com.cropdeal.cropservice.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String MARKETPLACE_EXCHANGE = "cropdeal.marketplace.exchange";
    public static final String CROP_LISTING_ROUTING_KEY = "crop.listing.created";
    public static final String BUYING_REQUEST_ROUTING_KEY = "buying.request.created";

    @Bean
    public TopicExchange marketplaceExchange() {
        return new TopicExchange(MARKETPLACE_EXCHANGE, true, false);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}