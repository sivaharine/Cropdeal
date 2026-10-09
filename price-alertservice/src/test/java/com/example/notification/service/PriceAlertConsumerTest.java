package com.example.notification.service;

import com.example.notification.dto.PriceAlertTriggeredEvent;
import com.example.notification.entity.Notification;
import com.example.notification.repository.NotificationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PriceAlertConsumerTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private PriceAlertConsumer priceAlertConsumer;

    @Test
    @DisplayName("Successfully consumes PriceAlertTriggeredEvent and persists notification")
    void testConsumePriceAlert() {
        PriceAlertTriggeredEvent event = new PriceAlertTriggeredEvent();
        event.setSubscriptionId(10L);
        event.setUserId(5L);
        event.setUserRole("DEALER");
        event.setCropName("Tomato");
        event.setTargetPrice(new BigDecimal("30.00"));
        event.setMatchedPrice(new BigDecimal("28.00"));
        event.setPriceCondition("LESS_THAN_OR_EQUAL");
        event.setDistrict("Erode");
        event.setTitle("Price Alert: Tomato Available at ₹28.00/kg");
        event.setMessage("Tomato is now available at ₹28.00/kg in Erode, below your target price of ₹30.00/kg.");
        event.setTimestamp(LocalDateTime.now());

        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> {
            Notification n = i.getArgument(0);
            return n;
        });

        priceAlertConsumer.consumePriceAlert(event);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(1)).save(captor.capture());

        Notification saved = captor.getValue();
        assertEquals("USER_5", saved.getRecipient());
        assertEquals("PRICE_ALERT", saved.getType());
        assertEquals("SENT", saved.getStatus());
        assertTrue(saved.getMessage().contains("below your target price"));
    }

    @Test
    @DisplayName("Gracefully handles null event without exception")
    void testConsumeNullEvent() {
        assertDoesNotThrow(() -> priceAlertConsumer.consumePriceAlert(null));
        verify(notificationRepository, never()).save(any());
    }
}
