package com.cropdeal.auth.controller;

import com.cropdeal.auth.dto.*;
import com.cropdeal.auth.enums.UserStatus;
import com.cropdeal.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication, OAuth2, and User Management Endpoints")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register new Farmer or Dealer")
    public ResponseEntity<MessageResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with Email and Password")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {

        return ResponseEntity.ok(
                authService.login(request)
        );
    }

    @PostMapping("/facebook")
    @Operation(summary = "Login or Register with Facebook OAuth2 Access Token",
               description = "Exchange a Facebook access token for a CropDeal JWT token. Auto-registers the user and creates their profile if new.")
    public ResponseEntity<LoginResponse> loginWithFacebook(
            @Valid @RequestBody FacebookLoginRequest request
    ) {

        return ResponseEntity.ok(
                authService.loginWithFacebook(request)
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(
            @RequestHeader(
                    value = "Authorization",
                    required = false
            ) String authorization
    ) {

        String token = null;

        if (authorization != null
                && authorization.startsWith("Bearer ")) {

            token = authorization.substring(7);
        }

        return ResponseEntity.ok(
                authService.logout(token)
        );
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {

        return ResponseEntity.ok(
                authService.forgotPassword(request)
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {

        return ResponseEntity.ok(
                authService.resetPassword(request)
        );
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify Password Reset OTP")
    public ResponseEntity<MessageResponse> verifyOtp(
            @RequestParam("otp") String otp
    ) {
        return ResponseEntity.ok(
                authService.verifyOtp(otp)
        );
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change Password with Current Password Verification")
    public ResponseEntity<MessageResponse> changePassword(
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        return ResponseEntity.ok(
                authService.changePassword(request)
        );
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<MessageResponse> updateStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UserStatusUpdateRequest request
    ) {

        return ResponseEntity.ok(
                authService.updateUserStatus(
                        userId,
                        request.getStatus()
                )
        );
    }
}