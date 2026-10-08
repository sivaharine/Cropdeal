package com.cropdeal.user.controller;

import com.cropdeal.user.dto.CreateProfileRequest;
import com.cropdeal.user.enums.Role;
import com.cropdeal.user.security.JwtAuthenticationFilter;
import com.cropdeal.user.security.JwtService;
import com.cropdeal.user.service.DealerService;
import com.cropdeal.user.service.DeliveryPartnerService;
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

import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InternalProfileController.class)
@AutoConfigureMockMvc(addFilters = false)
class InternalProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FarmerService farmerService;

    @MockBean
    private DealerService dealerService;

    @MockBean
    private DeliveryPartnerService deliveryPartnerService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    @DisplayName("Internal Endpoint 1 - Case 1: POST /api/users/internal/profile FARMER Success")
    void testCreateFarmerProfileInternal() throws Exception {
        CreateProfileRequest request = new CreateProfileRequest(
                100L,
                "Karthik",
                "karthik@gmail.com",
                "9876543210",
                Role.FARMER
        );

        mockMvc.perform(post("/api/users/internal/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        verify(farmerService).createFarmerProfile(100L, "Karthik", "9876543210");
    }

    @Test
    @DisplayName("Internal Endpoint 1 - Case 2: POST /api/users/internal/profile DEALER Success")
    void testCreateDealerProfileInternal() throws Exception {
        CreateProfileRequest request = new CreateProfileRequest(
                101L,
                "Arun",
                "arun@gmail.com",
                "9876543211",
                Role.DEALER
        );

        mockMvc.perform(post("/api/users/internal/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        verify(dealerService).createDealerProfile(101L, "Arun", "9876543211");
    }

    @Test
    @DisplayName("Internal Endpoint 1 - Case 3: POST /api/users/internal/profile DELIVERY_PARTNER Success")
    void testCreateDeliveryPartnerProfileInternal() throws Exception {
        CreateProfileRequest request = new CreateProfileRequest(
                102L,
                "Vikas",
                "vikas@gmail.com",
                "9876543212",
                Role.DELIVERY_PARTNER
        );

        mockMvc.perform(post("/api/users/internal/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        verify(deliveryPartnerService).createDeliveryPartnerProfile(102L, "Vikas", "9876543212");
    }

    @Test
    @DisplayName("Internal Endpoint 1 - Case 4: POST /api/users/internal/profile Invalid Request returns 400")
    void testCreateProfileValidationFailure() throws Exception {
        CreateProfileRequest request = new CreateProfileRequest();
        // Missing required fields

        mockMvc.perform(post("/api/users/internal/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Internal Endpoint 2: DELETE /api/users/internal/profile/{userId} Success")
    void testDeleteProfileInternal() throws Exception {
        mockMvc.perform(delete("/api/users/internal/profile/100"))
                .andExpect(status().isNoContent());

        verify(farmerService).deleteFarmerByUserId(100L);
        verify(dealerService).deleteDealerByUserId(100L);
        verify(deliveryPartnerService).deleteDeliveryPartnerByUserId(100L);
    }
}
