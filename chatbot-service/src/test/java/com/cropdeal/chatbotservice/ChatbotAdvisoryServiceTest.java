package com.cropdeal.chatbotservice;

import com.cropdeal.chatbotservice.dto.ChatRequest;
import com.cropdeal.chatbotservice.dto.ChatResponse;
import com.cropdeal.chatbotservice.service.ChatbotAdvisoryService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class ChatbotAdvisoryServiceTest {
    @Test
    void privateAccountQuestionsAreNotAnsweredWithBusinessData() {
        ChatbotAdvisoryService service = new ChatbotAdvisoryService();

        ChatResponse result = service.processQuery(ChatRequest.builder()
                .message("What is my wallet balance?").build());

        assertEquals("PRIVATE_DATA_UNAVAILABLE", result.getIntent());
        assertFalse(result.getAnswer().contains("₹"));
    }

    @Test
    void priceQuestionWithoutCommodityAsksForClarification() {
        ChatbotAdvisoryService service = new ChatbotAdvisoryService();

        ChatResponse result = service.processQuery(ChatRequest.builder()
                .message("What are mandi prices today?").build());

        assertEquals("PRICE_CLARIFICATION", result.getIntent());
    }

    @Test
    void unavailablePriceServiceDoesNotReturnAnInventedPrice() {
        ChatbotAdvisoryService service = new ChatbotAdvisoryService();
        ReflectionTestUtils.setField(service, "priceServiceUrl", "http://127.0.0.1:1");

        ChatResponse result = service.processQuery(ChatRequest.builder()
                .message("What is tomato price?").build());

        assertEquals("PRICE_SERVICE_UNAVAILABLE", result.getIntent());
        assertFalse(result.getAnswer().contains("24.00"));
    }
}
