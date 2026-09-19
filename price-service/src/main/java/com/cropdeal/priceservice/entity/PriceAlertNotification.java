package com.cropdeal.priceservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_alert_notifications", uniqueConstraints = {
        @UniqueConstraint(name = "uk_sub_source", columnNames = {"subscription_id", "source_type", "source_id"})
})
public class PriceAlertNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long subscriptionId;

    @Column(nullable = false, length = 50)
    private String sourceType; // GOVERNMENT_MARKET_PRICE, FARMER_LISTING, DEALER_BUYING_REQUEST

    @Column(nullable = false, length = 100)
    private String sourceId;

    @Column(nullable = false)
    private LocalDateTime notifiedAt;

    public PriceAlertNotification() {}

    public PriceAlertNotification(Long subscriptionId, String sourceType, String sourceId, LocalDateTime notifiedAt) {
        this.subscriptionId = subscriptionId;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.notifiedAt = notifiedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSubscriptionId() { return subscriptionId; }
    public void setSubscriptionId(Long subscriptionId) { this.subscriptionId = subscriptionId; }

    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }

    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }

    public LocalDateTime getNotifiedAt() { return notifiedAt; }
    public void setNotifiedAt(LocalDateTime notifiedAt) { this.notifiedAt = notifiedAt; }
}
