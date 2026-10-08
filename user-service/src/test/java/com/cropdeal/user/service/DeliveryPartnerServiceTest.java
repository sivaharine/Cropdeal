package com.cropdeal.user.service;

import com.cropdeal.user.dto.DeliveryPartnerResponse;
import com.cropdeal.user.dto.DeliveryPartnerUpdateRequest;
import com.cropdeal.user.entity.DeliveryPartner;
import com.cropdeal.user.enums.DeliveryPartnerStatus;
import com.cropdeal.user.enums.VehicleType;
import com.cropdeal.user.exception.DeliveryPartnerNotFoundException;
import com.cropdeal.user.repository.DeliveryPartnerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeliveryPartnerServiceTest {

    @Mock
    private DeliveryPartnerRepository deliveryPartnerRepository;

    @InjectMocks
    private DeliveryPartnerServiceImpl deliveryPartnerService;

    private DeliveryPartner testPartner;

    @BeforeEach
    void setUp() {
        testPartner = new DeliveryPartner();
        testPartner.setId(1L);
        testPartner.setUserId(40L);
        testPartner.setName("Vikas Express");
        testPartner.setPhone("9876543212");
        testPartner.setAddress("Coimbatore");
        testPartner.setVehicleNumber("TN-38-AB-1234");
        testPartner.setVehicleType(VehicleType.TRUCK);
        testPartner.setDrivingLicenseNumber("DL-TN38-2022001");
        testPartner.setAvailabilityStatus(DeliveryPartnerStatus.AVAILABLE);
        testPartner.setBankDetails("Canara Bank AC: 123456");
    }

    @Test
    @DisplayName("Op 1 - Case 1: Get Delivery Partner By ID Success")
    void testGetDeliveryPartnerByIdSuccess() {
        when(deliveryPartnerRepository.findById(1L)).thenReturn(Optional.of(testPartner));

        DeliveryPartnerResponse response = deliveryPartnerService.getDeliveryPartnerById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Vikas Express", response.getName());
        assertEquals(VehicleType.TRUCK, response.getVehicleType());
    }

    @Test
    @DisplayName("Op 1 - Case 2: Get Delivery Partner By ID Not Found throws Exception")
    void testGetDeliveryPartnerByIdNotFound() {
        when(deliveryPartnerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(DeliveryPartnerNotFoundException.class, () -> deliveryPartnerService.getDeliveryPartnerById(99L));
    }

    @Test
    @DisplayName("Op 2 - Case 1: Get Delivery Partner By User ID Success")
    void testGetDeliveryPartnerByUserIdSuccess() {
        when(deliveryPartnerRepository.findByUserId(40L)).thenReturn(Optional.of(testPartner));

        DeliveryPartnerResponse response = deliveryPartnerService.getDeliveryPartnerByUserId(40L);

        assertNotNull(response);
        assertEquals(40L, response.getUserId());
        assertEquals("Vikas Express", response.getName());
    }

    @Test
    @DisplayName("Op 2 - Case 2: Get Delivery Partner By User ID Not Found throws Exception")
    void testGetDeliveryPartnerByUserIdNotFound() {
        when(deliveryPartnerRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThrows(DeliveryPartnerNotFoundException.class, () -> deliveryPartnerService.getDeliveryPartnerByUserId(99L));
    }

    @Test
    @DisplayName("Op 3 - Case 1: Get All Delivery Partners with Data")
    void testGetAllDeliveryPartnersWithData() {
        when(deliveryPartnerRepository.findAll()).thenReturn(List.of(testPartner));

        List<DeliveryPartnerResponse> partners = deliveryPartnerService.getAllDeliveryPartners();

        assertNotNull(partners);
        assertEquals(1, partners.size());
    }

    @Test
    @DisplayName("Op 3 - Case 2: Get All Delivery Partners Empty List")
    void testGetAllDeliveryPartnersEmpty() {
        when(deliveryPartnerRepository.findAll()).thenReturn(Collections.emptyList());

        List<DeliveryPartnerResponse> partners = deliveryPartnerService.getAllDeliveryPartners();

        assertNotNull(partners);
        assertTrue(partners.isEmpty());
    }

    @Test
    @DisplayName("Op 4 - Case 1: Update Delivery Partner Success")
    void testUpdateDeliveryPartnerSuccess() {
        DeliveryPartnerUpdateRequest request = new DeliveryPartnerUpdateRequest();
        request.setName("Vikas Logistics");
        request.setAvailabilityStatus(DeliveryPartnerStatus.BUSY);

        when(deliveryPartnerRepository.findById(1L)).thenReturn(Optional.of(testPartner));
        when(deliveryPartnerRepository.save(any(DeliveryPartner.class))).thenReturn(testPartner);

        DeliveryPartnerResponse updated = deliveryPartnerService.updateDeliveryPartner(1L, request);

        assertNotNull(updated);
        assertEquals("Vikas Logistics", testPartner.getName());
        assertEquals(DeliveryPartnerStatus.BUSY, testPartner.getAvailabilityStatus());
        verify(deliveryPartnerRepository).save(testPartner);
    }

    @Test
    @DisplayName("Op 4 - Case 2: Update Delivery Partner Not Found throws Exception")
    void testUpdateDeliveryPartnerNotFound() {
        DeliveryPartnerUpdateRequest request = new DeliveryPartnerUpdateRequest();
        when(deliveryPartnerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(DeliveryPartnerNotFoundException.class, () -> deliveryPartnerService.updateDeliveryPartner(99L, request));
    }

    @Test
    @DisplayName("Op 5 - Case 1: Create Delivery Partner Profile Success")
    void testCreateDeliveryPartnerProfileNew() {
        when(deliveryPartnerRepository.existsByUserId(50L)).thenReturn(false);
        DeliveryPartner newPartner = new DeliveryPartner();
        newPartner.setId(2L);
        newPartner.setUserId(50L);
        newPartner.setName("Fast Cargo");
        newPartner.setPhone("9876543213");
        newPartner.setVehicleType(VehicleType.BIKE);
        newPartner.setVehicleNumber("NOT_SET_50");
        newPartner.setDrivingLicenseNumber("NOT_SET_50");
        newPartner.setAvailabilityStatus(DeliveryPartnerStatus.OFFLINE);

        when(deliveryPartnerRepository.save(any(DeliveryPartner.class))).thenReturn(newPartner);

        DeliveryPartnerResponse response = deliveryPartnerService.createDeliveryPartnerProfile(50L, "Fast Cargo", "9876543213");

        assertNotNull(response);
        assertEquals(50L, response.getUserId());
        verify(deliveryPartnerRepository).save(any(DeliveryPartner.class));
    }

    @Test
    @DisplayName("Op 5 - Case 2: Create Delivery Partner Profile when already exists returns existing")
    void testCreateDeliveryPartnerProfileAlreadyExists() {
        when(deliveryPartnerRepository.existsByUserId(40L)).thenReturn(true);
        when(deliveryPartnerRepository.findByUserId(40L)).thenReturn(Optional.of(testPartner));

        DeliveryPartnerResponse response = deliveryPartnerService.createDeliveryPartnerProfile(40L, "Vikas Express", "9876543212");

        assertNotNull(response);
        assertEquals(40L, response.getUserId());
        verify(deliveryPartnerRepository, never()).save(any(DeliveryPartner.class));
    }

    @Test
    @DisplayName("Op 6 - Case 1: Delete Delivery Partner By User ID Success")
    void testDeleteDeliveryPartnerByUserId() {
        when(deliveryPartnerRepository.findByUserId(40L)).thenReturn(Optional.of(testPartner));

        deliveryPartnerService.deleteDeliveryPartnerByUserId(40L);

        verify(deliveryPartnerRepository).delete(testPartner);
    }

    @Test
    @DisplayName("Op 6 - Case 2: Delete Delivery Partner By User ID Not Found is silent")
    void testDeleteDeliveryPartnerByUserIdNotFound() {
        when(deliveryPartnerRepository.findByUserId(99L)).thenReturn(Optional.empty());

        deliveryPartnerService.deleteDeliveryPartnerByUserId(99L);

        verify(deliveryPartnerRepository, never()).delete(any(DeliveryPartner.class));
    }
}
