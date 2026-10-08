package com.example.notification.listener;

import com.example.notification.dto.PriceAlertTriggeredEvent;
import com.example.notification.entity.Notification;
import com.example.notification.repository.NotificationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PriceAlertNotificationListenerTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private PriceAlertNotificationListener listener;

    @Test
    @DisplayName("PriceAlertNotificationListener consumes event and saves push notification")
    void testHandlePriceAlert() {
        PriceAlertTriggeredEvent event = new PriceAlertTriggeredEvent();
        event.setSubscriptionId(101L);
        event.setUserId(201L);
        event.setUserRole("DEALER");
        event.setCropName("Tomato");
        event.setDistrict("Erode");
        event.setState("Tamil Nadu");
        event.setTargetPrice(BigDecimal.valueOf(30));
        event.setCurrentPrice(BigDecimal.valueOf(28));
        event.setMessage("Price alert triggered: Tomato listed at â‚¹28/kg");

        listener.handlePriceAlert(event);

        verify(notificationRepository, times(1)).save(any(Notification.class));
    }
}