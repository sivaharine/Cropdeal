package com.cropdeal.auth.config;

import com.cropdeal.auth.entity.User;
import com.cropdeal.auth.enums.Role;
import com.cropdeal.auth.enums.UserStatus;
import com.cropdeal.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminDataSeeder {

    @Bean
    CommandLineRunner seedAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {

        return args -> {

            String adminEmail = "admin@cropdeal.com";

            if (!userRepository.existsByEmail(adminEmail)) {

                User admin = new User();

                admin.setEmail(adminEmail);

                admin.setPassword(
                        passwordEncoder.encode(
                                "Admin@123"
                        )
                );

                admin.setRole(Role.ADMIN);

                admin.setStatus(UserStatus.ACTIVE);

                userRepository.save(admin);

                System.out.println(
                        "=========================================="
                );

                System.out.println(
                        "CropDeal Admin created"
                );

                System.out.println(
                        "Email: admin@cropdeal.com"
                );

                System.out.println(
                        "Password: Admin@123"
                );

                System.out.println(
                        "=========================================="
                );
            }
        };
    }
}