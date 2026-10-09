package com.cropdeal.bidding.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String BIDDING_EXCHANGE = "cropdeal.bidding.exchange";
    public static final String BID_PLACED_ROUTING_KEY = "bidding.bid.placed";
    public static final String BID_OUTBID_ROUTING_KEY = "bidding.bid.outbid";
    public static final String BID_WON_ROUTING_KEY = "bidding.bid.won";

    @Bean
    public TopicExchange biddingExchange() {
        return new TopicExchange(BIDDING_EXCHANGE, true, false);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}