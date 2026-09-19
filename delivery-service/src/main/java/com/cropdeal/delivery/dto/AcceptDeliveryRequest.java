package com.cropdeal.delivery.dto;

public class AcceptDeliveryRequest {
    private Long deliveryPartnerId;
    private String partnerName;

    public AcceptDeliveryRequest() {}

    public Long getDeliveryPartnerId() { return deliveryPartnerId; }
    public void setDeliveryPartnerId(Long deliveryPartnerId) { this.deliveryPartnerId = deliveryPartnerId; }
    public String getPartnerName() { return partnerName; }
    public void setPartnerName(String partnerName) { this.partnerName = partnerName; }
}