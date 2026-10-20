package com.cropdeal.pricealert.entity;

import com.cropdeal.pricealert.enums.AlertSourceType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_alert_notifications", uniqueConstraints = {
        @UniqueConstraint(name = "uk_sub_source", columnNames = {"subscription_id", "source_type", "source_id"})
}, indexes = {
        @Index(name = "idx_alert_sub", columnList = "subscription_id"),
        @Index(name = "idx_alert_user", columnList = "user_id"),
        @Index(name = "idx_alert_created", columnList = "triggered_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceAlertNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "subscription_id", nullable = false)
    private Long subscriptionId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 30)
    private AlertSourceType sourceType;

    @Column(name = "source_id", nullable = false)
    private Long sourceId;

    @Column(name = "crop_name", nullable = false, length = 100)
    private String cropName;

    @Column(name = "target_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal targetPrice;

    @Column(name = "matched_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal matchedPrice;

    @Column(name = "message", length = 1000)
    private String message;

    @Column(name = "notification_sent", nullable = false)
    @Builder.Default
    private Boolean notificationSent = true;

    @Column(name = "triggered_at", nullable = false, updatable = false)
    private LocalDateTime triggeredAt;

    @PrePersist
    public void prePersist() {
        if (this.triggeredAt == null) {
            this.triggeredAt = LocalDateTime.now();
        }
    }
}
