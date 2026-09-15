package com.cropdeal.user.controller;

import com.cropdeal.user.dto.DealerResponse;
import com.cropdeal.user.dto.DealerUpdateRequest;
import com.cropdeal.user.exception.DealerNotFoundException;
import com.cropdeal.user.security.JwtAuthenticationFilter;
import com.cropdeal.user.security.JwtService;
import com.cropdeal.user.service.DealerService;
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

@WebMvcTest(DealerController.class)
@AutoConfigureMockMvc(addFilters = false)
class DealerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DealerService dealerService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    @DisplayName("Endpoint 1 - Case 1: GET /api/dealers/{id} Success returns 200")
    void testGetDealerByIdSuccess() throws Exception {
        DealerResponse response = new DealerResponse(
                1L,
                11L,
                "Arun Traders",
                "9876543211",
                "Arun Agro",
                "Chennai",
                "Bank Details"
        );

        when(dealerService.getDealerById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/dealers/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.userId").value(11))
                .andExpect(jsonPath("$.businessName").value("Arun Agro"));
    }

    @Test
    @DisplayName("Endpoint 1 - Case 2: GET /api/dealers/{id} Not Found returns 404")
    void testGetDealerByIdNotFound() throws Exception {
        when(dealerService.getDealerById(99L))
                .thenThrow(new DealerNotFoundException("Dealer not found with ID: 99"));

        mockMvc.perform(get("/api/dealers/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Dealer not found with ID: 99"));
    }

    @Test
    @DisplayName("Endpoint 2 - Case 1: PUT /api/dealers/{id} Success returns 200")
    void testUpdateDealerSuccess() throws Exception {
        DealerUpdateRequest request = new DealerUpdateRequest();
        request.setName("Arun Traders");
        request.setPhone("9876543211");
        request.setBusinessName("Arun Global Agro");

        DealerResponse response = new DealerResponse(
                1L,
                11L,
                "Arun Traders",
                "9876543211",
                "Arun Global Agro",
                "Chennai",
                "Bank Details"
        );

        when(dealerService.updateDealer(eq(1L), any(DealerUpdateRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/dealers/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.businessName").value("Arun Global Agro"));
    }

    @Test
    @DisplayName("Endpoint 2 - Case 2: PUT /api/dealers/{id} Validation Error (invalid phone) returns 400")
    void testUpdateDealerValidationError() throws Exception {
        DealerUpdateRequest request = new DealerUpdateRequest();
        request.setPhone("0000"); // Invalid Indian phone

        mockMvc.perform(put("/api/dealers/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"));
    }

    @Test
    @DisplayName("Endpoint 3 - Case 1: GET /api/dealers Returns list of dealers")
    void testGetAllDealers() throws Exception {
        DealerResponse response = new DealerResponse(
                1L,
                11L,
                "Arun Traders",
                "9876543211",
                "Arun Agro",
                "Chennai",
                "Bank Details"
        );

        when(dealerService.getAllDealers()).thenReturn(List.of(response));

        mockMvc.perform(get("/api/dealers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Arun Traders"));
    }
}
