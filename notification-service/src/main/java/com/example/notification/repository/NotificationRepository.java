package com.example.notification.repository;

import com.example.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipient(String recipient);

    List<Notification> findByOrderId(Long orderId);

    List<Notification> findByRecipientOrderByCreatedAtDesc(
            String recipient
    );
}