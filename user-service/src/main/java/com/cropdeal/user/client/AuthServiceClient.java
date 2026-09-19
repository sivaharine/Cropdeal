package com.cropdeal.user.client;

import com.cropdeal.user.dto.MessageResponse;
import com.cropdeal.user.dto.UserStatusUpdateRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "auth-service", url = "${auth-service.url:http://localhost:8081}")
public interface AuthServiceClient {

    @PutMapping("/api/auth/users/{userId}/status")
    ResponseEntity<MessageResponse> updateUserStatus(
            @PathVariable("userId") Long userId,
            @RequestBody UserStatusUpdateRequest request,
            @RequestHeader(value = "Authorization", required = false) String token
    );
}
