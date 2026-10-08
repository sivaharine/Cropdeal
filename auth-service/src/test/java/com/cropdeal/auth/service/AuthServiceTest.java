package com.cropdeal.auth.service;

import com.cropdeal.auth.client.UserServiceClient;
import com.cropdeal.auth.dto.*;
import com.cropdeal.auth.entity.User;
import com.cropdeal.auth.enums.Role;
import com.cropdeal.auth.enums.UserStatus;
import com.cropdeal.auth.exception.InvalidCredentialsException;
import com.cropdeal.auth.exception.InvalidTokenException;
import com.cropdeal.auth.exception.UserAlreadyExistsException;
import com.cropdeal.auth.exception.UserNotFoundException;
import com.cropdeal.auth.repository.UserRepository;
import com.cropdeal.auth.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private UserServiceClient userServiceClient;

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequest farmerRegisterRequest;
    private RegisterRequest dealerRegisterRequest;
    private RegisterRequest deliveryPartnerRegisterRequest;
    private LoginRequest loginRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        farmerRegisterRequest = new RegisterRequest();
        farmerRegisterRequest.setName("Ramesh Patel");
        farmerRegisterRequest.setEmail("ramesh@cropdeal.com");
        farmerRegisterRequest.setPassword("Ramesh@123");
        farmerRegisterRequest.setPhone("9876543210");
        farmerRegisterRequest.setRole(Role.FARMER);

        dealerRegisterRequest = new RegisterRequest();
        dealerRegisterRequest.setName("Arun Traders");
        dealerRegisterRequest.setEmail("arun@cropdeal.com");
        dealerRegisterRequest.setPassword("Arun@123");
        dealerRegisterRequest.setPhone("9876543211");
        dealerRegisterRequest.setRole(Role.DEALER);

        deliveryPartnerRegisterRequest = new RegisterRequest();
        deliveryPartnerRegisterRequest.setName("Vikas Express");
        deliveryPartnerRegisterRequest.setEmail("vikas@cropdeal.com");
        deliveryPartnerRegisterRequest.setPassword("Vikas@123");
        deliveryPartnerRegisterRequest.setPhone("9876543212");
        deliveryPartnerRegisterRequest.setRole(Role.DELIVERY_PARTNER);

        loginRequest = new LoginRequest();
        loginRequest.setEmail("ramesh@cropdeal.com");
        loginRequest.setPassword("Ramesh@123");

        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("ramesh@cropdeal.com");
        testUser.setPassword("encodedPassword");
        testUser.setRole(Role.FARMER);
        testUser.setStatus(UserStatus.ACTIVE);
    }

    // -------------------------------------------------------------
    // Operation 1: Register Farmer (2 test cases)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Op 1 - Case 1: Register Farmer Success")
    void testRegisterFarmerSuccess() {
        when(userRepository.existsByEmail("ramesh@cropdeal.com")).thenReturn(false);
        when(passwordEncoder.encode("Ramesh@123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(userServiceClient.createProfile(any(CreateProfileRequest.class))).thenReturn(ResponseEntity.ok().build());

        MessageResponse response = authService.register(farmerRegisterRequest);

        assertNotNull(response);
        assertEquals("Registration successful", response.getMessage());
        verify(userRepository, times(1)).save(any(User.class));
        verify(userServiceClient, times(1)).createProfile(any(CreateProfileRequest.class));
    }

    @Test
    @DisplayName("Op 1 - Case 2: Register Farmer Duplicate Email Rejection")
    void testRegisterDuplicateEmail() {
        when(userRepository.existsByEmail("ramesh@cropdeal.com")).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(farmerRegisterRequest));
        verify(userRepository, never()).save(any(User.class));
        verify(userServiceClient, never()).createProfile(any(CreateProfileRequest.class));
    }

    // -------------------------------------------------------------
    // Operation 2: Register Dealer (2 test cases)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Op 2 - Case 1: Register Dealer Success")
    void testRegisterDealerSuccess() {
        User dealerUser = new User("arun@cropdeal.com", "encodedPassword", Role.DEALER, UserStatus.ACTIVE);
        dealerUser.setId(2L);

        when(userRepository.existsByEmail("arun@cropdeal.com")).thenReturn(false);
        when(passwordEncoder.encode("Arun@123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(dealerUser);
        when(userServiceClient.createProfile(any(CreateProfileRequest.class))).thenReturn(ResponseEntity.ok().build());

        MessageResponse response = authService.register(dealerRegisterRequest);

        assertNotNull(response);
        assertEquals("Registration successful", response.getMessage());
        verify(userServiceClient, times(1)).createProfile(any(CreateProfileRequest.class));
    }

    @Test
    @DisplayName("Op 2 - Case 2: Register Dealer Profile Creation Failure Rolls Back User")
    void testRegisterDealerProfileFailureRollback() {
        User dealerUser = new User("arun@cropdeal.com", "encodedPassword", Role.DEALER, UserStatus.ACTIVE);
        dealerUser.setId(2L);

        when(userRepository.existsByEmail("arun@cropdeal.com")).thenReturn(false);
        when(passwordEncoder.encode("Arun@123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(dealerUser);
        when(userServiceClient.createProfile(any(CreateProfileRequest.class)))
                .thenThrow(new RuntimeException("User Service Unreachable"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.register(dealerRegisterRequest));
        assertTrue(ex.getMessage().contains("Unable to create user profile"));
        verify(userRepository, times(1)).delete(dealerUser);
    }

    // -------------------------------------------------------------
    // Operation 3: Register Delivery Partner & Role Check (2 test cases)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Op 3 - Case 1: Register Delivery Partner Success")
    void testRegisterDeliveryPartnerSuccess() {
        User partnerUser = new User("vikas@cropdeal.com", "encodedPassword", Role.DELIVERY_PARTNER, UserStatus.ACTIVE);
        partnerUser.setId(3L);

        when(userRepository.existsByEmail("vikas@cropdeal.com")).thenReturn(false);
        when(passwordEncoder.encode("Vikas@123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(partnerUser);
        when(userServiceClient.createProfile(any(CreateProfileRequest.class))).thenReturn(ResponseEntity.ok().build());

        MessageResponse response = authService.register(deliveryPartnerRegisterRequest);

        assertNotNull(response);
        assertEquals("Registration successful", response.getMessage());
    }

    @Test
    @DisplayName("Op 3 - Case 2: Register ADMIN via public endpoint Rejected")
    void testRegisterAdminRejected() {
        farmerRegisterRequest.setRole(Role.ADMIN);

        assertThrows(IllegalArgumentException.class, () -> authService.register(farmerRegisterRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    // -------------------------------------------------------------
    // Operation 4: Login (2 test cases)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Op 4 - Case 1: Login Success returns JWT token")
    void testLoginSuccess() {
        when(userRepository.findByEmail("ramesh@cropdeal.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("Ramesh@123", "encodedPassword")).thenReturn(true);
        when(jwtService.generateToken(testUser)).thenReturn("mockJwtToken");

        LoginResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals(1L, response.getUserId());
        assertEquals("ramesh@cropdeal.com", response.getEmail());
        assertEquals("ROLE_FARMER", response.getRole());
        assertEquals("mockJwtToken", response.getToken());
    }

    @Test
    @DisplayName("Op 4 - Case 2: Login Wrong Password Rejection")
    void testLoginWrongPassword() {
        when(userRepository.findByEmail("ramesh@cropdeal.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("Ramesh@123", "encodedPassword")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> authService.login(loginRequest));
    }

    // -------------------------------------------------------------
    // Operation 5: Account Status Check during Login (2 test cases)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Op 5 - Case 1: Login Inactive Account Rejected")
    void testLoginInactiveUser() {
        testUser.setStatus(UserStatus.INACTIVE);
        when(userRepository.findByEmail("ramesh@cropdeal.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("Ramesh@123", "encodedPassword")).thenReturn(true);

        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class, () -> authService.login(loginRequest));
        assertTrue(ex.getMessage().contains("inactive"));
    }

    @Test
    @DisplayName("Op 5 - Case 2: Login Suspended Account Rejected")
    void testLoginSuspendedUser() {
        testUser.setStatus(UserStatus.SUSPENDED);
        when(userRepository.findByEmail("ramesh@cropdeal.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("Ramesh@123", "encodedPassword")).thenReturn(true);

        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class, () -> authService.login(loginRequest));
        assertTrue(ex.getMessage().contains("suspended"));
    }

    // -------------------------------------------------------------
    // Operation 6: Logout (2 test cases)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Op 6 - Case 1: Logout With Token Success")
    void testLogoutWithToken() {
        MessageResponse response = authService.logout("mock-bearer-token");
        assertNotNull(response);
        assertTrue(response.getMessage().contains("Logout successful"));
    }

    @Test
    @DisplayName("Op 6 - Case 2: Logout Without Token Success")
    void testLogoutWithoutToken() {
        MessageResponse response = authService.logout(null);
        assertNotNull(response);
        assertTrue(response.getMessage().contains("Logout successful"));
    }

    // -------------------------------------------------------------
    // Operation 7: Forgot Password (2 test cases)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Op 7 - Case 1: Forgot Password Success generates reset token")
    void testForgotPasswordSuccess() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("ramesh@cropdeal.com");

        when(userRepository.findByEmail("ramesh@cropdeal.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        MessageResponse response = authService.forgotPassword(request);

        assertNotNull(response);
        assertTrue(response.getMessage().contains("Password reset token generated"));
        assertNotNull(testUser.getResetToken());
        assertNotNull(testUser.getResetTokenExpiry());
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Op 7 - Case 2: Forgot Password Non-existent User Rejection")
    void testForgotPasswordUserNotFound() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("unknown@cropdeal.com");

        when(userRepository.findByEmail("unknown@cropdeal.com")).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> authService.forgotPassword(request));
    }

    // -------------------------------------------------------------
    // Operation 8: Reset Password (2 test cases)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Op 8 - Case 1: Reset Password Success with valid token")
    void testResetPasswordSuccess() {
        testUser.setResetToken("valid-token");
        testUser.setResetTokenExpiry(LocalDateTime.now().plusMinutes(10));

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("valid-token");
        request.setNewPassword("NewPass@123");

        when(userRepository.findByResetToken("valid-token")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode("NewPass@123")).thenReturn("newEncodedPass");

        MessageResponse response = authService.resetPassword(request);

        assertNotNull(response);
        assertEquals("Password reset successful", response.getMessage());
        assertNull(testUser.getResetToken());
        assertNull(testUser.getResetTokenExpiry());
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Op 8 - Case 2: Reset Password Expired Token Rejection")
    void testResetPasswordExpiredToken() {
        testUser.setResetToken("expired-token");
        testUser.setResetTokenExpiry(LocalDateTime.now().minusMinutes(5));

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("expired-token");
        request.setNewPassword("NewPass@123");

        when(userRepository.findByResetToken("expired-token")).thenReturn(Optional.of(testUser));

        InvalidTokenException ex = assertThrows(InvalidTokenException.class, () -> authService.resetPassword(request));
        assertTrue(ex.getMessage().contains("expired"));
    }

    // -------------------------------------------------------------
    // Operation 9: Update User Status (2 test cases)
    // -------------------------------------------------------------
    @Test
    @DisplayName("Op 9 - Case 1: Update User Status Success")
    void testUpdateUserStatusSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        MessageResponse response = authService.updateUserStatus(1L, UserStatus.SUSPENDED);

        assertNotNull(response);
        assertEquals("User status updated to SUSPENDED", response.getMessage());
        assertEquals(UserStatus.SUSPENDED, testUser.getStatus());
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Op 9 - Case 2: Update User Status Non-existent User Rejection")
    void testUpdateUserStatusNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> authService.updateUserStatus(99L, UserStatus.INACTIVE));
    }
}
