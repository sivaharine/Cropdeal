package com.cropdeal.user.service;

import com.cropdeal.user.dto.FarmerResponse;
import com.cropdeal.user.dto.FarmerUpdateRequest;
import com.cropdeal.user.entity.Farmer;
import com.cropdeal.user.exception.FarmerNotFoundException;
import com.cropdeal.user.repository.FarmerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FarmerServiceTest {

    @Mock
    private FarmerRepository farmerRepository;

    @InjectMocks
    private FarmerServiceImpl farmerService;

    private Farmer testFarmer;

    @BeforeEach
    void setUp() {
        testFarmer = new Farmer();
        testFarmer.setId(1L);
        testFarmer.setUserId(10L);
        testFarmer.setName("Ravi Kumar");
        testFarmer.setPhone("9876543210");
        testFarmer.setAddress("Madurai");
        testFarmer.setFarmLocation("Melur, Madurai");
        testFarmer.setBankDetails("SBI AC: 1234567890, IFSC: SBIN0001234");
    }

    @Test
    @DisplayName("Should return FarmerResponse when farmer exists by ID")
    void testGetFarmerByIdSuccess() {
        when(farmerRepository.findById(1L)).thenReturn(Optional.of(testFarmer));

        FarmerResponse response = farmerService.getFarmerById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(10L, response.getUserId());
        assertEquals("Ravi Kumar", response.getName());
        assertEquals("9876543210", response.getPhone());
    }

    @Test
    @DisplayName("Should throw FarmerNotFoundException when farmer does not exist by ID")
    void testGetFarmerByIdNotFound() {
        when(farmerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(FarmerNotFoundException.class, () -> farmerService.getFarmerById(99L));
    }

    @Test
    @DisplayName("Should return FarmerResponse when farmer exists by User ID")
    void testGetFarmerByUserIdSuccess() {
        when(farmerRepository.findByUserId(10L)).thenReturn(Optional.of(testFarmer));

        FarmerResponse response = farmerService.getFarmerByUserId(10L);

        assertNotNull(response);
        assertEquals(10L, response.getUserId());
        assertEquals("Ravi Kumar", response.getName());
    }

    @Test
    @DisplayName("Should return all farmers")
    void testGetAllFarmers() {
        when(farmerRepository.findAll()).thenReturn(List.of(testFarmer));

        List<FarmerResponse> farmers = farmerService.getAllFarmers();

        assertNotNull(farmers);
        assertEquals(1, farmers.size());
        assertEquals("Ravi Kumar", farmers.get(0).getName());
    }

    @Test
    @DisplayName("Should update farmer profile fields")
    void testUpdateFarmerSuccess() {
        FarmerUpdateRequest request = new FarmerUpdateRequest();
        request.setName("Ravi K");
        request.setFarmLocation("Kottampatti, Madurai");
        request.setAddress("New Address, Madurai");

        when(farmerRepository.findById(1L)).thenReturn(Optional.of(testFarmer));
        when(farmerRepository.save(any(Farmer.class))).thenReturn(testFarmer);

        FarmerResponse updated = farmerService.updateFarmer(1L, request);

        assertNotNull(updated);
        assertEquals("Ravi K", testFarmer.getName());
        assertEquals("Kottampatti, Madurai", testFarmer.getFarmLocation());
        verify(farmerRepository).save(testFarmer);
    }

    @Test
    @DisplayName("Should create farmer profile if not exists")
    void testCreateFarmerProfile() {
        when(farmerRepository.existsByUserId(20L)).thenReturn(false);
        Farmer newFarmer = new Farmer();
        newFarmer.setId(2L);
        newFarmer.setUserId(20L);
        newFarmer.setName("Murugan");
        newFarmer.setPhone("9876543219");

        when(farmerRepository.save(any(Farmer.class))).thenReturn(newFarmer);

        FarmerResponse response = farmerService.createFarmerProfile(20L, "Murugan", "9876543219");

        assertNotNull(response);
        assertEquals(20L, response.getUserId());
        assertEquals("Murugan", response.getName());
        verify(farmerRepository).save(any(Farmer.class));
    }

    @Test
    @DisplayName("Should delete farmer profile by User ID")
    void testDeleteFarmerByUserId() {
        when(farmerRepository.findByUserId(10L)).thenReturn(Optional.of(testFarmer));

        farmerService.deleteFarmerByUserId(10L);

        verify(farmerRepository).delete(testFarmer);
    }
}
