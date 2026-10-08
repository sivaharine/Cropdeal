package com.cropdeal.user.controller;

import com.cropdeal.user.dto.FarmerResponse;
import com.cropdeal.user.dto.FarmerUpdateRequest;
import com.cropdeal.user.exception.FarmerNotFoundException;
import com.cropdeal.user.security.JwtAuthenticationFilter;
import com.cropdeal.user.security.JwtService;
import com.cropdeal.user.service.FarmerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FarmerController.class)
@AutoConfigureMockMvc(addFilters = false)
class FarmerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FarmerService farmerService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    @DisplayName("Endpoint 1 - Case 1: GET /api/farmers/{id} Success returns 200")
    void testGetFarmerByIdSuccess() throws Exception {
        FarmerResponse response = new FarmerResponse(
                1L,
                10L,
                "Ravi Kumar",
                "9876543210",
                "Madurai",
                "Melur, Madurai",
                "Bank Details"
        );

        when(farmerService.getFarmerById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/farmers/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.userId").value(10))
                .andExpect(jsonPath("$.name").value("Ravi Kumar"))
                .andExpect(jsonPath("$.phone").value("9876543210"));
    }

    @Test
    @DisplayName("Endpoint 1 - Case 2: GET /api/farmers/{id} Not Found returns 404")
    void testGetFarmerByIdNotFound() throws Exception {
        when(farmerService.getFarmerById(99L))
                .thenThrow(new FarmerNotFoundException("Farmer not found with ID: 99"));

        mockMvc.perform(get("/api/farmers/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Farmer not found with ID: 99"));
    }

    @Test
    @DisplayName("Endpoint 2 - Case 1: PUT /api/farmers/{id} Success returns 200")
    void testUpdateFarmerSuccess() throws Exception {
        FarmerUpdateRequest request = new FarmerUpdateRequest();
        request.setName("Ravi Kumar");
        request.setPhone("9876543210");
        request.setFarmLocation("Melur");

        FarmerResponse response = new FarmerResponse(
                1L,
                10L,
                "Ravi Kumar",
                "9876543210",
                "Madurai",
                "Melur",
                "Bank Details"
        );

        when(farmerService.updateFarmer(eq(1L), any(FarmerUpdateRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/farmers/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Ravi Kumar"))
                .andExpect(jsonPath("$.farmLocation").value("Melur"));
    }

    @Test
    @DisplayName("Endpoint 2 - Case 2: PUT /api/farmers/{id} Validation Error (invalid phone) returns 400")
    void testUpdateFarmerValidationError() throws Exception {
        FarmerUpdateRequest request = new FarmerUpdateRequest();
        request.setPhone("12345"); // Invalid Indian phone number

        mockMvc.perform(put("/api/farmers/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"));
    }

    @Test
    @DisplayName("Endpoint 3 - Case 1: GET /api/farmers Returns list of farmers")
    void testGetAllFarmers() throws Exception {
        FarmerResponse response = new FarmerResponse(
                1L,
                10L,
                "Ravi Kumar",
                "9876543210",
                "Madurai",
                "Melur, Madurai",
                "Bank Details"
        );

        when(farmerService.getAllFarmers()).thenReturn(List.of(response));

        mockMvc.perform(get("/api/farmers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Ravi Kumar"));
    }
}
