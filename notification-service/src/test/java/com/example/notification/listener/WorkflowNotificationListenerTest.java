package com.example.notification.listener;

import com.example.notification.client.AuthUserClient;
import com.example.notification.config.RabbitMQConfig;
import com.example.notification.dto.AuthUserLookupResponse;
import com.example.notification.dto.NegotiationAcceptedEvent;
import com.example.notification.dto.NotificationRequest;
import com.example.notification.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkflowNotificationListenerTest {

    @Mock
    private AuthUserClient authUserClient;

    @Mock
    private NotificationService notificationService;

    @Test
    void negotiationAcceptedEventNotifiesDealerEmail() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        WorkflowNotificationListener listener =
                new WorkflowNotificationListener(objectMapper, authUserClient, notificationService);

        NegotiationAcceptedEvent event = new NegotiationAcceptedEvent(
                10L,
                20L,
                30L,
                40L,
                new BigDecimal("1200.00"),
                "Accepted"
        );

        MessageProperties properties = new MessageProperties();
        properties.setReceivedRoutingKey(RabbitMQConfig.NEGOTIATION_ACCEPTED_ROUTING_KEY);
        Message message = new Message(objectMapper.writeValueAsBytes(event), properties);

        when(authUserClient.findById(30L))
                .thenReturn(new AuthUserLookupResponse(30L, "dealer@example.com", "ROLE_DEALER", "ACTIVE"));

        listener.handleWorkflowNotification(message);

        ArgumentCaptor<NotificationRequest> captor = ArgumentCaptor.forClass(NotificationRequest.class);
        verify(notificationService).sendNotification(captor.capture());

        assertEquals("dealer@example.com", captor.getValue().getRecipient());
        assertEquals("NEGOTIATION_ACCEPTED", captor.getValue().getType());
    }
}
