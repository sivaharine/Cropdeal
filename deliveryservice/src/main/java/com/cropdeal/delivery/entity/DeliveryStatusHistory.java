package com.cropdeal.delivery.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_status_history")
public class DeliveryStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long deliveryId;

    @Enumerated(EnumType.STRING)
    private DeliveryStatus status;

    private Long updatedByAgentId;

    private String remarks;

    private LocalDateTime changedAt;

    public DeliveryStatusHistory() {
    }

    @PrePersist
    protected void onCreate() {
        changedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getDeliveryId() {
        return deliveryId;
    }

    public void setDeliveryId(Long deliveryId) {
        this.deliveryId = deliveryId;
    }

    public DeliveryStatus getStatus() {
        return status;
    }

    public void setStatus(DeliveryStatus status) {
        this.status = status;
    }

    public Long getUpdatedByAgentId() {
        return updatedByAgentId;
    }

    public void setUpdatedByAgentId(Long updatedByAgentId) {
        this.updatedByAgentId = updatedByAgentId;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }
}