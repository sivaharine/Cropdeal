package com.example.notification.client;

import com.example.notification.dto.AuthUserLookupResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "auth-service")
public interface AuthUserClient {

    @GetMapping("/api/auth/internal/users/{userId}")
    AuthUserLookupResponse findById(@PathVariable Long userId);
}
