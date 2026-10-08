package com.cropdeal.delivery.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_assignments")
public class DeliveryAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long deliveryId;

    private Long deliveryAgentId;

    @Enumerated(EnumType.STRING)
    private AssignmentStatus status;

    private String rejectionReason;

    private LocalDateTime assignedAt;

    private LocalDateTime acceptedAt;

    private LocalDateTime rejectedAt;

    public DeliveryAssignment() {
    }

    @PrePersist
    protected void onCreate() {
        assignedAt = LocalDateTime.now();

        if (status == null) {
            status = AssignmentStatus.ASSIGNED;
        }
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

    public Long getDeliveryAgentId() {
        return deliveryAgentId;
    }

    public void setDeliveryAgentId(Long deliveryAgentId) {
        this.deliveryAgentId = deliveryAgentId;
    }

    public AssignmentStatus getStatus() {
        return status;
    }

    public void setStatus(AssignmentStatus status) {
        this.status = status;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public LocalDateTime getRejectedAt() {
        return rejectedAt;
    }

    public void setRejectedAt(LocalDateTime rejectedAt) {
        this.rejectedAt = rejectedAt;
    }
}