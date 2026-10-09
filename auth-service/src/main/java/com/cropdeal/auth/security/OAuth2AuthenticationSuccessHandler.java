package com.cropdeal.auth.security;

import com.cropdeal.auth.dto.LoginResponse;
import com.cropdeal.auth.enums.Role;
import com.cropdeal.auth.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;
    private final ObjectMapper objectMapper;

    public OAuth2AuthenticationSuccessHandler(@Lazy AuthService authService, ObjectMapper objectMapper) {
        this.authService = authService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            OAuth2User oAuth2User = oauthToken.getPrincipal();
            Map<String, Object> attributes = oAuth2User.getAttributes();

            String providerId = String.valueOf(attributes.get("id"));
            String name = attributes.containsKey("name") ? String.valueOf(attributes.get("name")) : "Facebook User";
            String email = attributes.containsKey("email") && attributes.get("email") != null
                    ? String.valueOf(attributes.get("email"))
                    : "fb_" + providerId + "@facebook.cropdeal.com";

            LoginResponse loginResponse = authService.processOAuth2User(providerId, email, name, Role.DEALER);

            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_OK);
            objectMapper.writeValue(response.getOutputStream(), loginResponse);
        }
    }
}
