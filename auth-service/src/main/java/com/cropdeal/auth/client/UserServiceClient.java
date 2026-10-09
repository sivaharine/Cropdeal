package com.cropdeal.auth.client;

import com.cropdeal.auth.dto.CreateProfileRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@FeignClient(
        name = "user-service",
        url = "${user-service.url:http://localhost:8082}"
)
public interface UserServiceClient {

    @PostMapping("/api/users/internal/profile")
    ResponseEntity<Void> createProfile(
            @RequestBody CreateProfileRequest request
    );

    @DeleteMapping("/api/users/internal/profile/{userId}")
    ResponseEntity<Void> deleteProfile(
            @PathVariable("userId") Long userId
    );
}