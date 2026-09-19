package com.cropdeal.user.controller;

import com.cropdeal.user.client.AuthServiceClient;
import com.cropdeal.user.dto.FarmerResponse;
import com.cropdeal.user.dto.MessageResponse;
import com.cropdeal.user.dto.UserStatusUpdateRequest;
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
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminUserController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminUserControllerTest {

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
    private AuthServiceClient authServiceClient;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    @DisplayName("Admin Endpoint 1: GET /api/admin/farmers Returns all farmers")
    void testGetAllFarmers() throws Exception {
        FarmerResponse response = new FarmerResponse(1L, 10L, "Ravi", "9876543210", "Madurai", "Melur", "Bank");
        when(farmerService.getAllFarmers()).thenReturn(List.of(response));

        mockMvc.perform(get("/api/admin/farmers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Ravi"));
    }

    @Test
    @DisplayName("Admin Endpoint 2: GET /api/admin/dealers Returns all dealers")
    void testGetAllDealers() throws Exception {
        when(dealerService.getAllDealers()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/dealers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Admin Endpoint 3: GET /api/admin/delivery-partners Returns all partners")
    void testGetAllDeliveryPartners() throws Exception {
        when(deliveryPartnerService.getAllDeliveryPartners()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/delivery-partners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Admin Endpoint 4 - Case 1: PUT /api/admin/users/{userId}/status Success returns 200")
    void testUpdateUserStatusSuccess() throws Exception {
        UserStatusUpdateRequest request = new UserStatusUpdateRequest("SUSPENDED");
        when(authServiceClient.updateUserStatus(eq(10L), any(UserStatusUpdateRequest.class), any()))
                .thenReturn(ResponseEntity.ok(new MessageResponse("User status updated to SUSPENDED")));

        mockMvc.perform(put("/api/admin/users/10/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User status updated to SUSPENDED"));
    }

    @Test
    @DisplayName("Admin Endpoint 4 - Case 2: PUT /api/admin/users/{userId}/status Blank Status returns 400")
    void testUpdateUserStatusBlankStatus() throws Exception {
        UserStatusUpdateRequest request = new UserStatusUpdateRequest("");

        mockMvc.perform(put("/api/admin/users/10/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
