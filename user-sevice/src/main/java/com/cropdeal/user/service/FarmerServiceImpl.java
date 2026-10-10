package com.cropdeal.user.service;

import com.cropdeal.user.dto.FarmerResponse;
import com.cropdeal.user.dto.FarmerUpdateRequest;
import com.cropdeal.user.entity.Farmer;
import com.cropdeal.user.exception.FarmerNotFoundException;
import com.cropdeal.user.repository.FarmerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class FarmerServiceImpl implements FarmerService {

    private final FarmerRepository farmerRepository;

    public FarmerServiceImpl(FarmerRepository farmerRepository) {
        this.farmerRepository = farmerRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public FarmerResponse getFarmerById(Long id) {
        Farmer farmer = farmerRepository.findById(id)
                .orElseThrow(() -> new FarmerNotFoundException("Farmer not found with ID: " + id));
        return mapToResponse(farmer);
    }

    @Override
    @Transactional(readOnly = true)
    public FarmerResponse getFarmerByUserId(Long userId) {
        Farmer farmer = farmerRepository.findByUserId(userId)
                .orElseThrow(() -> new FarmerNotFoundException("Farmer not found for user ID: " + userId));
        return mapToResponse(farmer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FarmerResponse> getAllFarmers() {
        return farmerRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public FarmerResponse updateFarmer(Long id, FarmerUpdateRequest request) {
        Farmer farmer = farmerRepository.findById(id)
                .orElseThrow(() -> new FarmerNotFoundException("Farmer not found with ID: " + id));

        applyUpdate(farmer, request);
        Farmer updatedFarmer = farmerRepository.save(farmer);
        return mapToResponse(updatedFarmer);
    }

    @Override
    public FarmerResponse updateFarmerByUserId(Long userId, FarmerUpdateRequest request) {
        Farmer farmer = farmerRepository.findByUserId(userId)
                .orElseThrow(() -> new FarmerNotFoundException("Farmer not found for user ID: " + userId));

        applyUpdate(farmer, request);
        Farmer updatedFarmer = farmerRepository.save(farmer);
        return mapToResponse(updatedFarmer);
    }

    @Override
    public FarmerResponse createFarmerProfile(Long userId, String name, String phone) {
        if (farmerRepository.existsByUserId(userId)) {
            return getFarmerByUserId(userId);
        }

        Farmer farmer = new Farmer();
        farmer.setUserId(userId);
        farmer.setName(name);
        farmer.setPhone(phone);

        Farmer saved = farmerRepository.save(farmer);
        return mapToResponse(saved);
    }

    @Override
    public void deleteFarmerByUserId(Long userId) {
        farmerRepository.findByUserId(userId).ifPresent(farmerRepository::delete);
    }

    private void applyUpdate(Farmer farmer, FarmerUpdateRequest request) {
        if (request.getName() != null && !request.getName().isBlank()) {
            farmer.setName(request.getName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            farmer.setPhone(request.getPhone().trim());
        }
        if (request.getAddress() != null) {
            farmer.setAddress(request.getAddress().trim());
        }
        if (request.getFarmLocation() != null) {
            farmer.setFarmLocation(request.getFarmLocation().trim());
        }
        if (request.getBankDetails() != null) {
            farmer.setBankDetails(request.getBankDetails().trim());
        }
    }

    private FarmerResponse mapToResponse(Farmer farmer) {
        return new FarmerResponse(
                farmer.getId(),
                farmer.getUserId(),
                farmer.getName(),
                farmer.getPhone(),
                farmer.getAddress(),
                farmer.getFarmLocation(),
                farmer.getBankDetails()
        );
    }
}
