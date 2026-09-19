package com.cropdeal.priceservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String PRICE_ALERT_EXCHANGE = "cropdeal.price.alert.exchange";
    public static final String PRICE_ALERT_ROUTING_KEY = "price.alert.triggered";

    public static final String MARKETPLACE_EXCHANGE = "cropdeal.marketplace.exchange";
    public static final String CROP_LISTING_QUEUE = "price.crop.listing.queue";
    public static final String CROP_LISTING_ROUTING_KEY = "crop.listing.created";

    public static final String BUYING_REQUEST_QUEUE = "price.buying.request.queue";
    public static final String BUYING_REQUEST_ROUTING_KEY = "buying.request.created";

    @Bean
    public TopicExchange priceAlertExchange() {
        return new TopicExchange(PRICE_ALERT_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange marketplaceExchange() {
        return new TopicExchange(MARKETPLACE_EXCHANGE, true, false);
    }

    @Bean
    public Queue cropListingQueue() {
        return new Queue(CROP_LISTING_QUEUE, true);
    }

    @Bean
    public Queue buyingRequestQueue() {
        return new Queue(BUYING_REQUEST_QUEUE, true);
    }

    @Bean
    public Binding cropListingBinding(Queue cropListingQueue, TopicExchange marketplaceExchange) {
        return BindingBuilder.bind(cropListingQueue).to(marketplaceExchange).with(CROP_LISTING_ROUTING_KEY);
    }

    @Bean
    public Binding buyingRequestBinding(Queue buyingRequestQueue, TopicExchange marketplaceExchange) {
        return BindingBuilder.bind(buyingRequestQueue).to(marketplaceExchange).with(BUYING_REQUEST_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}