package com.cropdeal.auth.service;

import com.cropdeal.auth.client.UserServiceClient;
import com.cropdeal.auth.dto.*;
import com.cropdeal.auth.entity.User;
import com.cropdeal.auth.enums.Role;
import com.cropdeal.auth.enums.UserStatus;
import com.cropdeal.auth.exception.*;
import com.cropdeal.auth.repository.UserRepository;
import com.cropdeal.auth.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cropdeal.auth.enums.AuthProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserServiceClient userServiceClient;
    private final FacebookGraphClient facebookGraphClient;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.cropdeal.auth.client.PriceAlertServiceClient priceAlertServiceClient;

    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            UserServiceClient userServiceClient,
            FacebookGraphClient facebookGraphClient
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userServiceClient = userServiceClient;
        this.facebookGraphClient = facebookGraphClient;
    }

    @Override
    public MessageResponse register(RegisterRequest request) {

        if (request.getRole() == Role.ADMIN) {

            throw new IllegalArgumentException(
                    "Admin registration is not allowed"
            );
        }

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        String username = (request.getUsername() != null && !request.getUsername().trim().isEmpty())
                ? request.getUsername().trim().toLowerCase()
                : email.split("@")[0];

        if (userRepository.existsByEmail(email)) {
            throw new UserAlreadyExistsException(
                    "Already registered, please login"
            );
        }

        if (userRepository.existsByUsername(username)) {
            throw new UserAlreadyExistsException(
                    "Already registered, please login"
            );
        }

        User user = new User();

        user.setEmail(email);
        user.setUsername(username);

        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        user.setRole(request.getRole());

        user.setStatus(UserStatus.ACTIVE);

        User savedUser = userRepository.save(user);

        /*
         * User Service owns profile information.
         *
         * Auth Service owns identity information.
         */
        try {

            String displayName = request.getName() != null && !request.getName().trim().isEmpty()
                    ? request.getName().trim()
                    : (request.getFullName() != null && !request.getFullName().trim().isEmpty()
                            ? request.getFullName().trim()
                            : username);
            String phoneNum = request.getPhone() != null && !request.getPhone().trim().isEmpty()
                    ? request.getPhone().trim()
                    : (request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : "9876543210");

        	CreateProfileRequest profileRequest =
        	        new CreateProfileRequest(
        	                savedUser.getId(),
        	                displayName,
        	                email,
        	                phoneNum,
        	                request.getRole()
        	        );

        	userServiceClient.createProfile(profileRequest);

        } catch (Exception e) {

            /*
             * If profile creation fails, remove identity
             * created by Auth Service.
             */
            userRepository.delete(savedUser);

            throw new RuntimeException(
                    "Unable to create user profile: " + e.getMessage()
            );
        }

        return new MessageResponse(
                "Registration successful"
        );
    }

    @Override
    public LoginResponse login(LoginRequest request) {

        String identifier = null;
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            identifier = request.getEmail().trim().toLowerCase();
        } else if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            identifier = request.getUsername().trim().toLowerCase();
        }

        if (identifier == null || identifier.isEmpty()) {
            throw new InvalidCredentialsException("Email or username is required");
        }

        final String lookupKey = identifier;
        User user = userRepository.findByEmail(lookupKey)
                .or(() -> userRepository.findByUsername(lookupKey))
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> (u.getUsername() != null && u.getUsername().equalsIgnoreCase(lookupKey))
                                || u.getEmail().toLowerCase().startsWith(lookupKey + "@")
                                || u.getEmail().equalsIgnoreCase(lookupKey))
                        .findFirst()
                        .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password")));

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        )) {

            throw new InvalidCredentialsException(
                    "Invalid email or password"
            );
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new InvalidCredentialsException(
                    "User account is blocked by administrator"
            );
        }

        String token = jwtService.generateToken(user);

        triggerLoginCropAlerts(user.getId());

        return new LoginResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername() != null ? user.getUsername() : user.getEmail().split("@")[0],
                "ROLE_" + user.getRole().name(),
                token
        );
    }

    @Override
    public LoginResponse loginWithFacebook(FacebookLoginRequest request) {
        if (request == null || request.getAccessToken() == null || request.getAccessToken().isBlank()) {
            throw new InvalidTokenException("Facebook access token must not be empty");
        }

        var profile = facebookGraphClient.getUserProfile(request.getAccessToken());
        Role targetRole = request.getRole() != null ? request.getRole() : Role.DEALER;

        return processOAuth2User(
                profile.getId(),
                profile.getEmail(),
                profile.getName(),
                targetRole
        );
    }

    @Override
    public LoginResponse processOAuth2User(String providerId, String email, String name, Role role) {
        if (providerId == null || providerId.isBlank()) {
            throw new InvalidTokenException("OAuth provider ID cannot be empty");
        }

        if (email == null || email.isBlank()) {
            email = "fb_" + providerId + "@facebook.cropdeal.com";
        }
        String normalizedEmail = email.trim().toLowerCase();
        Role userRole = (role != null && role != Role.ADMIN) ? role : Role.DEALER;

        // 1. Check if user already exists with Facebook provider
        User user = userRepository.findByAuthProviderAndProviderId(AuthProvider.FACEBOOK, providerId)
                .orElse(null);

        // 2. If not found, check if user exists with the same email
        if (user == null) {
            user = userRepository.findByEmail(normalizedEmail).orElse(null);
            if (user != null) {
                // Link Facebook provider to existing account
                user.setAuthProvider(AuthProvider.FACEBOOK);
                user.setProviderId(providerId);
                user = userRepository.save(user);
            }
        }

        // 3. If still not found, create new user and profile
        if (user == null) {
            User newUser = new User();
            newUser.setEmail(normalizedEmail);
            newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            newUser.setRole(userRole);
            newUser.setStatus(UserStatus.ACTIVE);
            newUser.setAuthProvider(AuthProvider.FACEBOOK);
            newUser.setProviderId(providerId);

            user = userRepository.save(newUser);

            // Create profile in user-service
            try {
                CreateProfileRequest profileRequest = new CreateProfileRequest(
                        user.getId(),
                        (name != null && !name.isBlank()) ? name : "Facebook User",
                        normalizedEmail,
                        "0000000000",
                        user.getRole()
                );
                userServiceClient.createProfile(profileRequest);
            } catch (Exception ex) {
                log.warn("Could not create user profile in user-service for OAuth user ID {}: {}",
                        user.getId(), ex.getMessage());
            }
        }

        // 4. Validate status
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new InvalidCredentialsException(
                    "Account is " + user.getStatus().name().toLowerCase()
            );
        }

        // 5. Generate and return JWT
        String token = jwtService.generateToken(user);

        triggerLoginCropAlerts(user.getId());

        return new LoginResponse(
                user.getId(),
                user.getEmail(),
                "ROLE_" + user.getRole().name(),
                token
        );
    }

    private void triggerLoginCropAlerts(Long userId) {
        if (priceAlertServiceClient != null && userId != null) {
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    priceAlertServiceClient.checkPriceAlertsOnLogin(userId);
                } catch (Exception ex) {
                    log.debug("Crop alert check on login for user {}: {}", userId, ex.getMessage());
                }
            });
        }
    }

    @Override
    public MessageResponse logout(String token) {

        /*
         * JWT is stateless.
         *
         * In a production system, token revocation can be
         * implemented using Redis / token blacklist.
         *
         * For the current backend phase, logout simply
         * confirms the client can discard the token.
         */

        return new MessageResponse(
                "Logout successful. Please discard the JWT token."
        );
    }

    @Override
    public MessageResponse forgotPassword(
            ForgotPasswordRequest request
    ) {

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        final String lookupEmail = email;
        User user = userRepository.findByEmail(lookupEmail)
                .or(() -> userRepository.findByUsername(lookupEmail))
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> (u.getUsername() != null && u.getUsername().equalsIgnoreCase(lookupEmail))
                                || u.getEmail().toLowerCase().startsWith(lookupEmail + "@")
                                || u.getEmail().equalsIgnoreCase(lookupEmail))
                        .findFirst()
                        .orElseThrow(() -> new UserNotFoundException("User not found with email or username: " + lookupEmail)));

        String resetToken = String.format("%06d", new java.util.Random().nextInt(900000) + 100000);

        user.setResetToken(resetToken);

        user.setResetTokenExpiry(
                LocalDateTime.now().plusMinutes(15)
        );

        userRepository.save(user);

        if (mailSender != null) {
            try {
                org.springframework.mail.SimpleMailMessage mailMessage = new org.springframework.mail.SimpleMailMessage();
                mailMessage.setFrom("mohantest0002@gmail.com");
                mailMessage.setTo(user.getEmail());
                mailMessage.setSubject("CropDeal - Password Reset OTP");
                mailMessage.setText("Hello,\n\n"
                        + "You requested a password reset for your CropDeal account.\n"
                        + "Your One-Time Password (OTP) is:\n\n"
                        + resetToken + "\n\n"
                        + "This OTP will expire in 15 minutes.\n\n"
                        + "Best regards,\nCropDeal Team");
                mailSender.send(mailMessage);
                log.info("Password reset OTP email sent to {}", user.getEmail());
            } catch (Exception e) {
                log.warn("Could not send password reset email to {}: {}", user.getEmail(), e.getMessage());
            }
        }

        return new MessageResponse(
                "Password reset OTP sent to " + user.getEmail() + ": " + resetToken
        );
    }

    @Override
    public MessageResponse resetPassword(
            ResetPasswordRequest request
    ) {

        User user = userRepository
                .findByResetToken(request.getToken())
                .orElseThrow(
                        () -> new InvalidTokenException(
                                "Invalid reset token"
                        )
                );

        if (user.getResetTokenExpiry() == null
                || user.getResetTokenExpiry()
                .isBefore(LocalDateTime.now())) {

            throw new InvalidTokenException(
                    "Reset token has expired"
            );
        }

        user.setPassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );

        user.setResetToken(null);
        user.setResetTokenExpiry(null);

        userRepository.save(user);

        return new MessageResponse(
                "Password reset successful"
        );
    }

    @Override
    public MessageResponse verifyOtp(String otp) {
        if (otp == null || otp.trim().isEmpty()) {
            throw new InvalidTokenException("OTP cannot be empty");
        }
        User user = userRepository.findByResetToken(otp.trim())
                .orElseThrow(() -> new InvalidTokenException("Invalid OTP. Please check the code sent to your email."));

        if (user.getResetTokenExpiry() == null
                || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("OTP has expired. Please request a new one.");
        }

        return new MessageResponse("OTP verified successfully");
    }

    @Override
    public MessageResponse changePassword(ChangePasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .or(() -> userRepository.findByUsername(email))
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Current password is incorrect");
        }

        if (request.getNewPassword() == null || request.getNewPassword().trim().length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        userRepository.save(user);

        return new MessageResponse("Password updated successfully");
    }

    @Override
    public MessageResponse updateUserStatus(
            Long userId,
            UserStatus status
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(
                        () -> new UserNotFoundException(
                                "User not found"
                        )
                );

        user.setStatus(status);

        userRepository.save(user);

        return new MessageResponse(
                "User status updated to "
                        + status.name()
        );
    }
}