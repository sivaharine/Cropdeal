package com.example.notification.listener;

import com.example.notification.client.AuthUserClient;
import com.example.notification.config.RabbitMQConfig;
import com.example.notification.dto.AuthUserLookupResponse;
import com.example.notification.dto.DeliveryAcceptedEvent;
import com.example.notification.dto.DeliveryCompletedEvent;
import com.example.notification.dto.NegotiationAcceptedEvent;
import com.example.notification.dto.NotificationRequest;
import com.example.notification.dto.PaymentCompletedEvent;
import com.example.notification.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class WorkflowNotificationListener {

    private static final Logger log = LoggerFactory.getLogger(WorkflowNotificationListener.class);

    private final ObjectMapper objectMapper;
    private final AuthUserClient authUserClient;
    private final NotificationService notificationService;

    public WorkflowNotificationListener(
            ObjectMapper objectMapper,
            AuthUserClient authUserClient,
            NotificationService notificationService) {
        this.objectMapper = objectMapper;
        this.authUserClient = authUserClient;
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE)
    public void handleWorkflowNotification(Message message) {
        String routingKey = message.getMessageProperties().getReceivedRoutingKey();
        try {
            switch (routingKey) {
                case RabbitMQConfig.NEGOTIATION_ACCEPTED_ROUTING_KEY ->
                        handleNegotiationAccepted(read(message, NegotiationAcceptedEvent.class));
                case RabbitMQConfig.PAYMENT_COMPLETED_ROUTING_KEY ->
                        handlePaymentCompleted(read(message, PaymentCompletedEvent.class));
                case RabbitMQConfig.DELIVERY_ACCEPTED_ROUTING_KEY ->
                        handleDeliveryAccepted(read(message, DeliveryAcceptedEvent.class));
                case RabbitMQConfig.DELIVERY_COMPLETED_ROUTING_KEY ->
                        handleDeliveryCompleted(read(message, DeliveryCompletedEvent.class));
                default -> log.warn("Ignoring unsupported notification routing key: {}", routingKey);
            }
        } catch (Exception e) {
            log.error("Failed to handle workflow notification with routing key {}: {}", routingKey, e.getMessage(), e);
        }
    }

    private void handleNegotiationAccepted(NegotiationAcceptedEvent event) {
        sendToUser(
                event.dealerId(),
                "NEGOTIATION_ACCEPTED",
                "Your negotiation #" + event.negotiationId()
                        + " was accepted by the farmer for amount Rs." + event.acceptedAmount()
        );
    }

    private void handlePaymentCompleted(PaymentCompletedEvent event) {
        sendToUser(
                event.farmerId(),
                "PAYMENT_COMPLETED",
                "Payment received for order #" + event.orderId()
                        + ". Amount: Rs." + event.amount()
                        + ". Transaction: " + event.transactionReference(),
                event.orderId()
        );
    }

    private void handleDeliveryAccepted(DeliveryAcceptedEvent event) {
        String message = "Delivery accepted for order #" + event.orderId()
                + " by " + event.partnerName()
                + " (agent id: " + event.deliveryPartnerId() + ")"
                + ". Reference: " + event.deliveryReference()
                + ". Pickup: " + event.pickupAddress()
                + ". Delivery: " + event.deliveryAddress();

        sendToUser(event.farmerId(), "DELIVERY_ACCEPTED", message, event.orderId());
        sendToUser(event.dealerId(), "DELIVERY_ACCEPTED", message, event.orderId());
    }

    private void handleDeliveryCompleted(DeliveryCompletedEvent event) {
        String message = "Delivery completed for order #" + event.orderId()
                + ". Delivery reference: " + event.deliveryReference()
                + ". Agent: " + event.partnerName()
                + " (id: " + event.deliveryPartnerId() + ").";

        sendToUser(event.farmerId(), "DELIVERY_COMPLETED", message, event.orderId());
        sendToUser(event.dealerId(), "DELIVERY_COMPLETED", message, event.orderId());
    }

    private void sendToUser(Long userId, String type, String message) {
        sendToUser(userId, type, message, null);
    }

    private void sendToUser(Long userId, String type, String message, Long orderId) {
        AuthUserLookupResponse user = authUserClient.findById(userId);
        NotificationRequest request = new NotificationRequest();
        request.setRecipient(user.email());
        request.setType(type);
        request.setMessage(message);
        request.setOrderId(orderId);
        notificationService.sendNotification(request);
    }

    private <T> T read(Message message, Class<T> eventType) throws Exception {
        return objectMapper.readValue(message.getBody(), eventType);
    }
}
