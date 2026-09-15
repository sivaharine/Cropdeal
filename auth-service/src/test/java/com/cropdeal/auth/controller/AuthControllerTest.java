package com.cropdeal.auth.controller;

import com.cropdeal.auth.dto.*;
import com.cropdeal.auth.enums.Role;
import com.cropdeal.auth.enums.UserStatus;
import com.cropdeal.auth.exception.InvalidCredentialsException;
import com.cropdeal.auth.security.JwtAuthenticationFilter;
import com.cropdeal.auth.security.JwtService;
import com.cropdeal.auth.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    // -------------------------------------------------------------
    // Register Endpoint Tests (2 test cases)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Endpoint 1 - Case 1: POST /api/auth/register Success returns 201")
    void testRegisterSuccess() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("Suresh Raina");
        request.setEmail("suresh@cropdeal.com");
        request.setPassword("Suresh@123");
        request.setPhone("9876543210");
        request.setRole(Role.DEALER);

        when(authService.register(any(RegisterRequest.class)))
                .thenReturn(new MessageResponse("Registration successful"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Registration successful"));
    }

    @Test
    @DisplayName("Endpoint 1 - Case 2: POST /api/auth/register Validation Failure returns 400")
    void testRegisterValidationError() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName(""); // Blank name
        request.setEmail("invalid-email"); // Invalid format
        request.setPassword("short"); // Less than 8 chars
        request.setPhone("123"); // Invalid phone
        // Role is null

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------
    // Login Endpoint Tests (2 test cases)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Endpoint 2 - Case 1: POST /api/auth/login Success returns 200 with JWT")
    void testLoginSuccess() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("suresh@cropdeal.com");
        request.setPassword("Suresh@123");

        LoginResponse response = new LoginResponse(
                1L,
                "suresh@cropdeal.com",
                "ROLE_DEALER",
                "mocked.jwt.token"
        );

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.email").value("suresh@cropdeal.com"))
                .andExpect(jsonPath("$.role").value("ROLE_DEALER"))
                .andExpect(jsonPath("$.token").value("mocked.jwt.token"));
    }

    @Test
    @DisplayName("Endpoint 2 - Case 2: POST /api/auth/login Invalid Credentials returns 401")
    void testLoginInvalidCredentials() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("suresh@cropdeal.com");
        request.setPassword("WrongPassword");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new InvalidCredentialsException("Invalid email or password"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------
    // Forgot Password Endpoint Tests (2 test cases)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Endpoint 3 - Case 1: POST /api/auth/forgot-password Success returns 200")
    void testForgotPasswordSuccess() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("suresh@cropdeal.com");

        when(authService.forgotPassword(any(ForgotPasswordRequest.class)))
                .thenReturn(new MessageResponse("Password reset token generated: test-token"));

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset token generated: test-token"));
    }

    @Test
    @DisplayName("Endpoint 3 - Case 2: POST /api/auth/forgot-password Invalid Email returns 400")
    void testForgotPasswordInvalidEmail() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("not-an-email");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------
    // Reset Password Endpoint Tests (2 test cases)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Endpoint 4 - Case 1: POST /api/auth/reset-password Success returns 200")
    void testResetPasswordSuccess() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("test-token");
        request.setNewPassword("NewSecure@123");

        when(authService.resetPassword(any(ResetPasswordRequest.class)))
                .thenReturn(new MessageResponse("Password reset successful"));

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successful"));
    }

    @Test
    @DisplayName("Endpoint 4 - Case 2: POST /api/auth/reset-password Blank Token returns 400")
    void testResetPasswordBlankToken() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("");
        request.setNewPassword("NewSecure@123");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------
    // Logout Endpoint Tests (2 test cases)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Endpoint 5 - Case 1: POST /api/auth/logout With Bearer Token returns 200")
    void testLogoutWithToken() throws Exception {
        when(authService.logout(any()))
                .thenReturn(new MessageResponse("Logout successful. Please discard the JWT token."));

        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer mocked.jwt.token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logout successful. Please discard the JWT token."));
    }

    @Test
    @DisplayName("Endpoint 5 - Case 2: POST /api/auth/logout Without Token returns 200")
    void testLogoutWithoutToken() throws Exception {
        when(authService.logout(any()))
                .thenReturn(new MessageResponse("Logout successful. Please discard the JWT token."));

        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logout successful. Please discard the JWT token."));
    }

    // -------------------------------------------------------------
    // Update Status Endpoint Tests (2 test cases)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Endpoint 6 - Case 1: PUT /api/auth/users/{userId}/status Success returns 200")
    void testUpdateUserStatusSuccess() throws Exception {
        UserStatusUpdateRequest request = new UserStatusUpdateRequest();
        request.setStatus(UserStatus.SUSPENDED);

        when(authService.updateUserStatus(eq(1L), eq(UserStatus.SUSPENDED)))
                .thenReturn(new MessageResponse("User status updated to SUSPENDED"));

        mockMvc.perform(put("/api/auth/users/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User status updated to SUSPENDED"));
    }

    @Test
    @DisplayName("Endpoint 6 - Case 2: PUT /api/auth/users/{userId}/status Null Status returns 400")
    void testUpdateUserStatusNullStatus() throws Exception {
        UserStatusUpdateRequest request = new UserStatusUpdateRequest();
        request.setStatus(null);

        mockMvc.perform(put("/api/auth/users/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
