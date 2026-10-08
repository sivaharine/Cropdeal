package com.cropdeal.auth.service;

import com.cropdeal.auth.dto.FacebookUserProfile;
import com.cropdeal.auth.exception.InvalidTokenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FacebookGraphClientTest {

    private FacebookGraphClient graphClient;

    @BeforeEach
    void setUp() {
        graphClient = new FacebookGraphClient();
    }

    @Test
    @DisplayName("Should return mock profile for test_fb_ tokens")
    void testMockToken_ReturnsProfile() {
        FacebookUserProfile profile = graphClient.getUserProfile("test_fb_45678");

        assertNotNull(profile);
        assertEquals("fb_45678", profile.getId());
        assertEquals("Facebook Test User", profile.getName());
        assertEquals("fb_45678@facebook.cropdeal.com", profile.getEmail());
    }

    @Test
    @DisplayName("Should return mock profile for mock_fb_ tokens")
    void testMockToken2_ReturnsProfile() {
        FacebookUserProfile profile = graphClient.getUserProfile("mock_fb_dealer1");

        assertNotNull(profile);
        assertEquals("fb_dealer1", profile.getId());
        assertEquals("fb_dealer1@facebook.cropdeal.com", profile.getEmail());
    }

    @Test
    @DisplayName("Should throw InvalidTokenException for blank token")
    void testBlankToken_ThrowsException() {
        assertThrows(InvalidTokenException.class, () -> graphClient.getUserProfile(""));
        assertThrows(InvalidTokenException.class, () -> graphClient.getUserProfile(null));
    }
}
