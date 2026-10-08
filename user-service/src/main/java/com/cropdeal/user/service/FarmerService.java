package com.cropdeal.user.service;

import com.cropdeal.user.dto.FarmerResponse;
import com.cropdeal.user.dto.FarmerUpdateRequest;

import java.util.List;

public interface FarmerService {

    FarmerResponse getFarmerById(Long id);

    FarmerResponse getFarmerByUserId(Long userId);

    List<FarmerResponse> getAllFarmers();

    FarmerResponse updateFarmer(Long id, FarmerUpdateRequest request);

    FarmerResponse updateFarmerByUserId(Long userId, FarmerUpdateRequest request);

    FarmerResponse createFarmerProfile(Long userId, String name, String phone);

    void deleteFarmerByUserId(Long userId);
}
