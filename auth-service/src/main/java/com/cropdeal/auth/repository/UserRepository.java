package com.cropdeal.auth.repository;

import com.cropdeal.auth.entity.User;
import com.cropdeal.auth.enums.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    Optional<User> findByResetToken(String resetToken);

    Optional<User> findByAuthProviderAndProviderId(AuthProvider authProvider, String providerId);
}