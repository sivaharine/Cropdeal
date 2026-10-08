package com.cropdeal.user.controller;

import com.cropdeal.user.dto.DeliveryPartnerResponse;
import com.cropdeal.user.dto.DeliveryPartnerUpdateRequest;
import com.cropdeal.user.enums.DeliveryPartnerStatus;
import com.cropdeal.user.enums.VehicleType;
import com.cropdeal.user.exception.DeliveryPartnerNotFoundException;
import com.cropdeal.user.security.JwtAuthenticationFilter;
import com.cropdeal.user.security.JwtService;
import com.cropdeal.user.service.DeliveryPartnerService;
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

@WebMvcTest(DeliveryPartnerController.class)
@AutoConfigureMockMvc(addFilters = false)
class DeliveryPartnerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DeliveryPartnerService deliveryPartnerService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    @DisplayName("Endpoint 1 - Case 1: GET /api/delivery-partners/{id} Success returns 200")
    void testGetDeliveryPartnerByIdSuccess() throws Exception {
        DeliveryPartnerResponse response = new DeliveryPartnerResponse(
                1L,
                40L,
                "Vikas Express",
                "9876543212",
                "Coimbatore",
                "TN-38-AB-1234",
                VehicleType.TRUCK,
                "DL-TN38-2022001",
                DeliveryPartnerStatus.AVAILABLE,
                "Canara Bank AC: 123456"
        );

        when(deliveryPartnerService.getDeliveryPartnerById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/delivery-partners/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.userId").value(40))
                .andExpect(jsonPath("$.name").value("Vikas Express"))
                .andExpect(jsonPath("$.vehicleNumber").value("TN-38-AB-1234"));
    }

    @Test
    @DisplayName("Endpoint 1 - Case 2: GET /api/delivery-partners/{id} Not Found returns 404")
    void testGetDeliveryPartnerByIdNotFound() throws Exception {
        when(deliveryPartnerService.getDeliveryPartnerById(99L))
                .thenThrow(new DeliveryPartnerNotFoundException("Delivery partner not found with ID: 99"));

        mockMvc.perform(get("/api/delivery-partners/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Delivery partner not found with ID: 99"));
    }

    @Test
    @DisplayName("Endpoint 2 - Case 1: PUT /api/delivery-partners/{id} Success returns 200")
    void testUpdateDeliveryPartnerSuccess() throws Exception {
        DeliveryPartnerUpdateRequest request = new DeliveryPartnerUpdateRequest();
        request.setName("Vikas Express");
        request.setPhone("9876543212");
        request.setVehicleNumber("TN-38-AB-1234");
        request.setAvailabilityStatus(DeliveryPartnerStatus.BUSY);

        DeliveryPartnerResponse response = new DeliveryPartnerResponse(
                1L,
                40L,
                "Vikas Express",
                "9876543212",
                "Coimbatore",
                "TN-38-AB-1234",
                VehicleType.TRUCK,
                "DL-TN38-2022001",
                DeliveryPartnerStatus.BUSY,
                "Bank Details"
        );

        when(deliveryPartnerService.updateDeliveryPartner(eq(1L), any(DeliveryPartnerUpdateRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/delivery-partners/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availabilityStatus").value("BUSY"));
    }

    @Test
    @DisplayName("Endpoint 2 - Case 2: PUT /api/delivery-partners/{id} Validation Error (invalid phone) returns 400")
    void testUpdateDeliveryPartnerValidationError() throws Exception {
        DeliveryPartnerUpdateRequest request = new DeliveryPartnerUpdateRequest();
        request.setPhone("123"); // Invalid Indian phone

        mockMvc.perform(put("/api/delivery-partners/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"));
    }

    @Test
    @DisplayName("Endpoint 3 - Case 1: GET /api/delivery-partners Returns list")
    void testGetAllDeliveryPartners() throws Exception {
        DeliveryPartnerResponse response = new DeliveryPartnerResponse(
                1L,
                40L,
                "Vikas Express",
                "9876543212",
                "Coimbatore",
                "TN-38-AB-1234",
                VehicleType.TRUCK,
                "DL-TN38-2022001",
                DeliveryPartnerStatus.AVAILABLE,
                "Bank Details"
        );

        when(deliveryPartnerService.getAllDeliveryPartners()).thenReturn(List.of(response));

        mockMvc.perform(get("/api/delivery-partners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Vikas Express"));
    }
}
