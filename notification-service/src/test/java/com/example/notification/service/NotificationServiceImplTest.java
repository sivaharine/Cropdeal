package com.example.notification.service;

import com.example.notification.dto.NotificationRequest;
import com.example.notification.entity.Notification;
import com.example.notification.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private TemplateService templateService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    @Test
    void sendNotificationSendsEmailWhenRecipientIsEmail() {
        NotificationRequest request = new NotificationRequest();
        request.setRecipient("dealer@example.com");
        request.setType("NEGOTIATION_ACCEPTED");
        request.setMessage("Accepted");
        request.setOrderId(101L);

        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = notificationService.sendNotification(request);

        assertNotNull(response);
        assertEquals("dealer@example.com", response.getRecipient());
        verify(emailService, times(1)).sendEmail(
                eq("dealer@example.com"),
                eq("CropDeal - NEGOTIATION ACCEPTED"),
                eq("Accepted")
        );
    }
}
