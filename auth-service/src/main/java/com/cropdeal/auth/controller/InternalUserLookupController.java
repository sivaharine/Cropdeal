package com.cropdeal.auth.controller;

import com.cropdeal.auth.dto.AuthUserLookupResponse;
import com.cropdeal.auth.entity.User;
import com.cropdeal.auth.exception.UserNotFoundException;
import com.cropdeal.auth.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/internal/users")
public class InternalUserLookupController {
    private final UserRepository userRepository;

    public InternalUserLookupController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/by-email")
    public AuthUserLookupResponse findByEmail(@RequestParam String email) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        return mapToResponse(user);
    }

    @GetMapping("/{userId}")
    public AuthUserLookupResponse findById(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        return mapToResponse(user);
    }

    private AuthUserLookupResponse mapToResponse(User user) {
        return new AuthUserLookupResponse(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getStatus().name()
        );
    }
}
