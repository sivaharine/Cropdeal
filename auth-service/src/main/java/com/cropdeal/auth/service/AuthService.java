package com.cropdeal.auth.service;

import com.cropdeal.auth.dto.*;
import com.cropdeal.auth.enums.UserStatus;

public interface AuthService {

    MessageResponse register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    MessageResponse logout(String token);

    MessageResponse forgotPassword(ForgotPasswordRequest request);

    MessageResponse resetPassword(ResetPasswordRequest request);

    MessageResponse updateUserStatus(
            Long userId,
            UserStatus status
    );
}