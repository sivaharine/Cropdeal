package com.cropdeal.user.service;

import com.cropdeal.user.dto.DeliveryPartnerResponse;
import com.cropdeal.user.dto.DeliveryPartnerUpdateRequest;

import java.util.List;

public interface DeliveryPartnerService {

    DeliveryPartnerResponse getDeliveryPartnerById(Long id);

    DeliveryPartnerResponse getDeliveryPartnerByUserId(Long userId);

    List<DeliveryPartnerResponse> getAllDeliveryPartners();

    DeliveryPartnerResponse updateDeliveryPartner(Long id, DeliveryPartnerUpdateRequest request);

    DeliveryPartnerResponse updateDeliveryPartnerByUserId(Long userId, DeliveryPartnerUpdateRequest request);

    DeliveryPartnerResponse createDeliveryPartnerProfile(Long userId, String name, String phone);

    void deleteDeliveryPartnerByUserId(Long userId);
}
