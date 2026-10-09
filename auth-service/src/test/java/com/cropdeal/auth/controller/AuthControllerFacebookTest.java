package com.cropdeal.auth.controller;

import com.cropdeal.auth.dto.FacebookLoginRequest;
import com.cropdeal.auth.dto.LoginResponse;
import com.cropdeal.auth.enums.Role;
import com.cropdeal.auth.security.JwtAuthenticationFilter;
import com.cropdeal.auth.security.JwtService;
import com.cropdeal.auth.security.OAuth2AuthenticationSuccessHandler;
import com.cropdeal.auth.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerFacebookTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Test
    @DisplayName("POST /api/auth/facebook - successfully returns JWT login response")
    void testLoginWithFacebook_Endpoint_Success() throws Exception {
        FacebookLoginRequest request = new FacebookLoginRequest("test_fb_token_123", Role.DEALER);
        LoginResponse mockResponse = new LoginResponse(
                42L,
                "dealer@cropdeal.com",
                "ROLE_DEALER",
                "sample.jwt.token"
        );

        when(authService.loginWithFacebook(any(FacebookLoginRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/auth/facebook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(42))
                .andExpect(jsonPath("$.email").value("dealer@cropdeal.com"))
                .andExpect(jsonPath("$.role").value("ROLE_DEALER"))
                .andExpect(jsonPath("$.token").value("sample.jwt.token"));
    }

    @Test
    @DisplayName("POST /api/auth/facebook - returns 400 Bad Request if accessToken is empty")
    void testLoginWithFacebook_Endpoint_ValidationError() throws Exception {
        FacebookLoginRequest request = new FacebookLoginRequest("", Role.DEALER);

        mockMvc.perform(post("/api/auth/facebook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
