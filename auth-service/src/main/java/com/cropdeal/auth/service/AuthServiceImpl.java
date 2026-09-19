package com.cropdeal.auth.service;

import com.cropdeal.auth.client.UserServiceClient;
import com.cropdeal.auth.dto.*;
import com.cropdeal.auth.entity.User;
import com.cropdeal.auth.enums.Role;
import com.cropdeal.auth.enums.UserStatus;
import com.cropdeal.auth.exception.*;
import com.cropdeal.auth.repository.UserRepository;
import com.cropdeal.auth.security.JwtService;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private static final SecureRandom OTP_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserServiceClient userServiceClient;
    private final JavaMailSender mailSender;

    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            UserServiceClient userServiceClient,
            JavaMailSender mailSender
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userServiceClient = userServiceClient;
        this.mailSender = mailSender;
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

        if (userRepository.existsByEmail(email)) {

            throw new UserAlreadyExistsException(
                    "Email is already registered"
            );
        }

        User user = new User();

        user.setEmail(email);

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

        	CreateProfileRequest profileRequest =
        	        new CreateProfileRequest(
        	                savedUser.getId(),
        	                request.getName(),
        	                email,
        	                request.getPhone(),
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
                    "Unable to create user profile"
            );
        }

        return new MessageResponse(
                "Registration successful"
        );
    }

    @Override
    public LoginResponse login(LoginRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(
                        () -> new InvalidCredentialsException(
                                "Invalid email or password"
                        )
                );

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
                    "Account is " +
                            user.getStatus().name().toLowerCase()
            );
        }

        String token = jwtService.generateToken(user);

        return new LoginResponse(
                user.getId(),
                user.getEmail(),
                "ROLE_" + user.getRole().name(),
                token
        );
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

        User user = userRepository.findByEmail(email)
                .orElseThrow(
                        () -> new UserNotFoundException(
                                "User not found"
                        )
                );

        String resetToken = generateOtp();

        user.setResetToken(resetToken);

        user.setResetTokenExpiry(
                LocalDateTime.now().plusMinutes(15)
        );

        userRepository.save(user);

        sendForgotPasswordOtp(email, resetToken);

        return new MessageResponse(
                "Password reset OTP sent to registered email"
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

    private String generateOtp() {
        return String.format("%06d", OTP_RANDOM.nextInt(1_000_000));
    }

    private void sendForgotPasswordOtp(String email, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("CropDeal Password Reset OTP");
        message.setText("""
                Your CropDeal password reset OTP is: %s

                This OTP is valid for 15 minutes.
                If you did not request a password reset, please ignore this email.
                """.formatted(otp));

        mailSender.send(message);
    }
}
