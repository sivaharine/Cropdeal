package com.cropdeal.user.service;

import com.cropdeal.user.dto.DeliveryPartnerResponse;
import com.cropdeal.user.dto.DeliveryPartnerUpdateRequest;
import com.cropdeal.user.entity.DeliveryPartner;
import com.cropdeal.user.enums.DeliveryPartnerStatus;
import com.cropdeal.user.enums.Role;
import com.cropdeal.user.exception.DeliveryPartnerNotFoundException;
import com.cropdeal.user.repository.DeliveryPartnerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DeliveryPartnerServiceImpl implements DeliveryPartnerService {

    private final DeliveryPartnerRepository deliveryPartnerRepository;

    public DeliveryPartnerServiceImpl(DeliveryPartnerRepository deliveryPartnerRepository) {
        this.deliveryPartnerRepository = deliveryPartnerRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryPartnerResponse getDeliveryPartnerById(Long id) {
        DeliveryPartner partner = deliveryPartnerRepository.findById(id)
                .orElseThrow(() -> new DeliveryPartnerNotFoundException("Delivery partner not found with ID: " + id));
        return mapToResponse(partner);
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryPartnerResponse getDeliveryPartnerByUserId(Long userId) {
        DeliveryPartner partner = deliveryPartnerRepository.findByUserId(userId)
                .orElseThrow(() -> new DeliveryPartnerNotFoundException("Delivery partner not found for user ID: " + userId));
        return mapToResponse(partner);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeliveryPartnerResponse> getAllDeliveryPartners() {
        return deliveryPartnerRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public DeliveryPartnerResponse updateDeliveryPartner(Long id, DeliveryPartnerUpdateRequest request) {
        DeliveryPartner partner = deliveryPartnerRepository.findById(id)
                .orElseThrow(() -> new DeliveryPartnerNotFoundException("Delivery partner not found with ID: " + id));

        applyUpdate(partner, request);
        DeliveryPartner updated = deliveryPartnerRepository.save(partner);
        return mapToResponse(updated);
    }

    @Override
    public DeliveryPartnerResponse updateDeliveryPartnerByUserId(Long userId, DeliveryPartnerUpdateRequest request) {
        DeliveryPartner partner = deliveryPartnerRepository.findByUserId(userId)
                .orElseThrow(() -> new DeliveryPartnerNotFoundException("Delivery partner not found for user ID: " + userId));

        applyUpdate(partner, request);
        DeliveryPartner updated = deliveryPartnerRepository.save(partner);
        return mapToResponse(updated);
    }

    @Override
    public DeliveryPartnerResponse createDeliveryPartnerProfile(Long userId, String name, String email, String phone, Role role) {
        if (deliveryPartnerRepository.existsByUserId(userId)) {
            return getDeliveryPartnerByUserId(userId);
        }

        DeliveryPartner partner = new DeliveryPartner();
        partner.setUserId(userId);
        partner.setName(name);
        partner.setEmail(normalizeEmail(email));
        partner.setPhone(phone);
        partner.setRole(role);
        partner.setAvailabilityStatus(DeliveryPartnerStatus.OFFLINE);

        DeliveryPartner saved = deliveryPartnerRepository.save(partner);
        return mapToResponse(saved);
    }

    @Override
    public void deleteDeliveryPartnerByUserId(Long userId) {
        deliveryPartnerRepository.findByUserId(userId).ifPresent(deliveryPartnerRepository::delete);
    }

    private void applyUpdate(DeliveryPartner partner, DeliveryPartnerUpdateRequest request) {
        if (request.getName() != null && !request.getName().isBlank()) {
            partner.setName(request.getName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            partner.setPhone(request.getPhone().trim());
        }
        if (request.getAddress() != null) {
            partner.setAddress(request.getAddress().trim());
        }
        if (request.getVehicleNumber() != null && !request.getVehicleNumber().isBlank()) {
            partner.setVehicleNumber(request.getVehicleNumber().trim());
        }
        if (request.getVehicleType() != null) {
            partner.setVehicleType(request.getVehicleType());
        }
        if (request.getDrivingLicenseNumber() != null && !request.getDrivingLicenseNumber().isBlank()) {
            partner.setDrivingLicenseNumber(request.getDrivingLicenseNumber().trim());
        }
        if (request.getAvailabilityStatus() != null) {
            partner.setAvailabilityStatus(request.getAvailabilityStatus());
        }
        if (request.getBankDetails() != null) {
            partner.setBankDetails(request.getBankDetails().trim());
        }
    }

    private DeliveryPartnerResponse mapToResponse(DeliveryPartner partner) {
        return new DeliveryPartnerResponse(
                partner.getId(),
                partner.getUserId(),
                partner.getName(),
                partner.getPhone(),
                partner.getEmail(),
                partner.getRole(),
                partner.getAddress(),
                partner.getVehicleNumber(),
                partner.getVehicleType(),
                partner.getDrivingLicenseNumber(),
                partner.getAvailabilityStatus(),
                partner.getBankDetails()
        );
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
