package com.cropdeal.auth.service;

import com.cropdeal.auth.client.UserServiceClient;
import com.cropdeal.auth.dto.FacebookLoginRequest;
import com.cropdeal.auth.dto.FacebookUserProfile;
import com.cropdeal.auth.dto.LoginResponse;
import com.cropdeal.auth.entity.User;
import com.cropdeal.auth.enums.AuthProvider;
import com.cropdeal.auth.enums.Role;
import com.cropdeal.auth.enums.UserStatus;
import com.cropdeal.auth.exception.InvalidCredentialsException;
import com.cropdeal.auth.exception.InvalidTokenException;
import com.cropdeal.auth.repository.UserRepository;
import com.cropdeal.auth.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceFacebookTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private FacebookGraphClient facebookGraphClient;

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(
                userRepository,
                passwordEncoder,
                jwtService,
                userServiceClient,
                facebookGraphClient
        );
    }

    @Test
    @DisplayName("Should successfully register and login a new user via Facebook token")
    void testLoginWithFacebook_NewUser_Success() {
        String token = "test_fb_123456";
        FacebookLoginRequest request = new FacebookLoginRequest(token, Role.DEALER);
        FacebookUserProfile profile = new FacebookUserProfile("123456", "John Doe", "john@example.com");

        when(facebookGraphClient.getUserProfile(token)).thenReturn(profile);
        when(userRepository.findByAuthProviderAndProviderId(AuthProvider.FACEBOOK, "123456")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("encodedPassword");

        User savedUser = new User();
        savedUser.setId(100L);
        savedUser.setEmail("john@example.com");
        savedUser.setRole(Role.DEALER);
        savedUser.setStatus(UserStatus.ACTIVE);
        savedUser.setAuthProvider(AuthProvider.FACEBOOK);
        savedUser.setProviderId("123456");

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(savedUser)).thenReturn("mock-jwt-token-xyz");

        LoginResponse response = authService.loginWithFacebook(request);

        assertNotNull(response);
        assertEquals(100L, response.getUserId());
        assertEquals("john@example.com", response.getEmail());
        assertEquals("ROLE_DEALER", response.getRole());
        assertEquals("mock-jwt-token-xyz", response.getToken());

        verify(userServiceClient, times(1)).createProfile(any());
    }

    @Test
    @DisplayName("Should login existing Facebook user directly without re-creating profile")
    void testLoginWithFacebook_ExistingUser_Success() {
        String token = "test_fb_88888";
        FacebookLoginRequest request = new FacebookLoginRequest(token, Role.FARMER);
        FacebookUserProfile profile = new FacebookUserProfile("88888", "Existing Farmer", "farmer@cropdeal.com");

        User existingUser = new User();
        existingUser.setId(55L);
        existingUser.setEmail("farmer@cropdeal.com");
        existingUser.setRole(Role.FARMER);
        existingUser.setStatus(UserStatus.ACTIVE);
        existingUser.setAuthProvider(AuthProvider.FACEBOOK);
        existingUser.setProviderId("88888");

        when(facebookGraphClient.getUserProfile(token)).thenReturn(profile);
        when(userRepository.findByAuthProviderAndProviderId(AuthProvider.FACEBOOK, "88888")).thenReturn(Optional.of(existingUser));
        when(jwtService.generateToken(existingUser)).thenReturn("jwt-for-existing-farmer");

        LoginResponse response = authService.loginWithFacebook(request);

        assertNotNull(response);
        assertEquals(55L, response.getUserId());
        assertEquals("farmer@cropdeal.com", response.getEmail());
        assertEquals("ROLE_FARMER", response.getRole());
        assertEquals("jwt-for-existing-farmer", response.getToken());

        verify(userServiceClient, never()).createProfile(any());
    }

    @Test
    @DisplayName("Should link Facebook provider to existing local email account")
    void testLoginWithFacebook_ExistingEmailAccount_LinksProvider() {
        String token = "test_fb_77777";
        FacebookLoginRequest request = new FacebookLoginRequest(token, Role.DEALER);
        FacebookUserProfile profile = new FacebookUserProfile("77777", "Local User", "local@example.com");

        User localUser = new User();
        localUser.setId(30L);
        localUser.setEmail("local@example.com");
        localUser.setRole(Role.DEALER);
        localUser.setStatus(UserStatus.ACTIVE);
        localUser.setAuthProvider(AuthProvider.LOCAL);

        when(facebookGraphClient.getUserProfile(token)).thenReturn(profile);
        when(userRepository.findByAuthProviderAndProviderId(AuthProvider.FACEBOOK, "77777")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("local@example.com")).thenReturn(Optional.of(localUser));
        when(userRepository.save(localUser)).thenReturn(localUser);
        when(jwtService.generateToken(localUser)).thenReturn("jwt-linked");

        LoginResponse response = authService.loginWithFacebook(request);

        assertNotNull(response);
        assertEquals(30L, response.getUserId());
        assertEquals("jwt-linked", response.getToken());
        assertEquals(AuthProvider.FACEBOOK, localUser.getAuthProvider());
        assertEquals("77777", localUser.getProviderId());
    }

    @Test
    @DisplayName("Should reject login if Facebook user account is INACTIVE or SUSPENDED")
    void testLoginWithFacebook_SuspendedAccount_ThrowsException() {
        String token = "test_fb_suspended";
        FacebookLoginRequest request = new FacebookLoginRequest(token, Role.DEALER);
        FacebookUserProfile profile = new FacebookUserProfile("suspended_id", "Suspended User", "suspended@example.com");

        User suspendedUser = new User();
        suspendedUser.setId(99L);
        suspendedUser.setEmail("suspended@example.com");
        suspendedUser.setRole(Role.DEALER);
        suspendedUser.setStatus(UserStatus.SUSPENDED);
        suspendedUser.setAuthProvider(AuthProvider.FACEBOOK);
        suspendedUser.setProviderId("suspended_id");

        when(facebookGraphClient.getUserProfile(token)).thenReturn(profile);
        when(userRepository.findByAuthProviderAndProviderId(AuthProvider.FACEBOOK, "suspended_id")).thenReturn(Optional.of(suspendedUser));

        assertThrows(InvalidCredentialsException.class, () -> authService.loginWithFacebook(request));
    }

    @Test
    @DisplayName("Should reject blank Facebook access token")
    void testLoginWithFacebook_EmptyToken_ThrowsException() {
        FacebookLoginRequest emptyRequest = new FacebookLoginRequest("", Role.DEALER);
        assertThrows(InvalidTokenException.class, () -> authService.loginWithFacebook(emptyRequest));
    }
}
