package com.cropdeal.user.service;

import com.cropdeal.user.dto.DealerResponse;
import com.cropdeal.user.dto.DealerUpdateRequest;
import com.cropdeal.user.entity.Dealer;
import com.cropdeal.user.exception.DealerNotFoundException;
import com.cropdeal.user.repository.DealerRepository;
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
class DealerServiceTest {

    @Mock
    private DealerRepository dealerRepository;

    @InjectMocks
    private DealerServiceImpl dealerService;

    private Dealer testDealer;

    @BeforeEach
    void setUp() {
        testDealer = new Dealer();
        testDealer.setId(1L);
        testDealer.setUserId(20L);
        testDealer.setName("Arun Traders");
        testDealer.setPhone("9876543211");
        testDealer.setBusinessName("Arun Agro Corp");
        testDealer.setAddress("Chennai");
        testDealer.setBankDetails("HDFC AC: 987654321, IFSC: HDFC0001234");
    }

    @Test
    @DisplayName("Op 1 - Case 1: Get Dealer By ID Success")
    void testGetDealerByIdSuccess() {
        when(dealerRepository.findById(1L)).thenReturn(Optional.of(testDealer));

        DealerResponse response = dealerService.getDealerById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Arun Traders", response.getName());
        assertEquals("Arun Agro Corp", response.getBusinessName());
    }

    @Test
    @DisplayName("Op 1 - Case 2: Get Dealer By ID Not Found throws Exception")
    void testGetDealerByIdNotFound() {
        when(dealerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(DealerNotFoundException.class, () -> dealerService.getDealerById(99L));
    }

    @Test
    @DisplayName("Op 2 - Case 1: Get Dealer By User ID Success")
    void testGetDealerByUserIdSuccess() {
        when(dealerRepository.findByUserId(20L)).thenReturn(Optional.of(testDealer));

        DealerResponse response = dealerService.getDealerByUserId(20L);

        assertNotNull(response);
        assertEquals(20L, response.getUserId());
        assertEquals("Arun Traders", response.getName());
    }

    @Test
    @DisplayName("Op 2 - Case 2: Get Dealer By User ID Not Found throws Exception")
    void testGetDealerByUserIdNotFound() {
        when(dealerRepository.findByUserId(99L)).thenReturn(Optional.empty());

        assertThrows(DealerNotFoundException.class, () -> dealerService.getDealerByUserId(99L));
    }

    @Test
    @DisplayName("Op 3 - Case 1: Get All Dealers with records")
    void testGetAllDealersWithData() {
        when(dealerRepository.findAll()).thenReturn(List.of(testDealer));

        List<DealerResponse> dealers = dealerService.getAllDealers();

        assertNotNull(dealers);
        assertEquals(1, dealers.size());
    }

    @Test
    @DisplayName("Op 3 - Case 2: Get All Dealers Empty List")
    void testGetAllDealersEmpty() {
        when(dealerRepository.findAll()).thenReturn(Collections.emptyList());

        List<DealerResponse> dealers = dealerService.getAllDealers();

        assertNotNull(dealers);
        assertTrue(dealers.isEmpty());
    }

    @Test
    @DisplayName("Op 4 - Case 1: Update Dealer By ID Success")
    void testUpdateDealerSuccess() {
        DealerUpdateRequest request = new DealerUpdateRequest();
        request.setName("Arun Modern Traders");
        request.setBusinessName("Arun Global");

        when(dealerRepository.findById(1L)).thenReturn(Optional.of(testDealer));
        when(dealerRepository.save(any(Dealer.class))).thenReturn(testDealer);

        DealerResponse updated = dealerService.updateDealer(1L, request);

        assertNotNull(updated);
        assertEquals("Arun Modern Traders", testDealer.getName());
        assertEquals("Arun Global", testDealer.getBusinessName());
        verify(dealerRepository).save(testDealer);
    }

    @Test
    @DisplayName("Op 4 - Case 2: Update Dealer By ID Not Found throws Exception")
    void testUpdateDealerNotFound() {
        DealerUpdateRequest request = new DealerUpdateRequest();
        when(dealerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(DealerNotFoundException.class, () -> dealerService.updateDealer(99L, request));
    }

    @Test
    @DisplayName("Op 5 - Case 1: Create Dealer Profile Success")
    void testCreateDealerProfileNew() {
        when(dealerRepository.existsByUserId(30L)).thenReturn(false);
        Dealer newDealer = new Dealer();
        newDealer.setId(2L);
        newDealer.setUserId(30L);
        newDealer.setName("Prakash Traders");
        newDealer.setPhone("9876543215");

        when(dealerRepository.save(any(Dealer.class))).thenReturn(newDealer);

        DealerResponse response = dealerService.createDealerProfile(30L, "Prakash Traders", "9876543215");

        assertNotNull(response);
        assertEquals(30L, response.getUserId());
        verify(dealerRepository).save(any(Dealer.class));
    }

    @Test
    @DisplayName("Op 5 - Case 2: Create Dealer Profile when already exists returns existing")
    void testCreateDealerProfileAlreadyExists() {
        when(dealerRepository.existsByUserId(20L)).thenReturn(true);
        when(dealerRepository.findByUserId(20L)).thenReturn(Optional.of(testDealer));

        DealerResponse response = dealerService.createDealerProfile(20L, "Arun Traders", "9876543211");

        assertNotNull(response);
        assertEquals(20L, response.getUserId());
        verify(dealerRepository, never()).save(any(Dealer.class));
    }

    @Test
    @DisplayName("Op 6 - Case 1: Delete Dealer By User ID Success")
    void testDeleteDealerByUserId() {
        when(dealerRepository.findByUserId(20L)).thenReturn(Optional.of(testDealer));

        dealerService.deleteDealerByUserId(20L);

        verify(dealerRepository).delete(testDealer);
    }

    @Test
    @DisplayName("Op 6 - Case 2: Delete Dealer By User ID Not Found is silent")
    void testDeleteDealerByUserIdNotFound() {
        when(dealerRepository.findByUserId(99L)).thenReturn(Optional.empty());

        dealerService.deleteDealerByUserId(99L);

        verify(dealerRepository, never()).delete(any(Dealer.class));
    }
}
