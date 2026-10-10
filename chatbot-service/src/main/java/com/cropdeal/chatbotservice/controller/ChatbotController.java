package com.cropdeal.chatbotservice.controller;

import com.cropdeal.chatbotservice.dto.ChatRequest;
import com.cropdeal.chatbotservice.dto.ChatResponse;
import com.cropdeal.chatbotservice.service.ChatbotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@Tag(name = "Agricultural Assistant", description = "CropDeal Advisory, Crop Finder, Order Tracker & Mandi Rates Chatbot APIs")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping({"/api/v1/chatbot/ask", "/v1/chatbot/ask", "/api/chatbot/ask", "/api/chat", "/api/chat/ask"})
    @Operation(summary = "Ask the CropDeal assistant a question (Crop search, Order tracking, Mandi prices, Platform info)")
    public ResponseEntity<ChatResponse> askQuestion(@Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok(chatbotService.chat(request));
    }

    @DeleteMapping("/api/chat/sessions/{sessionId}")
    @Operation(summary = "Clear conversation session history")
    public ResponseEntity<Void> clearSession(@PathVariable String sessionId) {
        chatbotService.clearSession(sessionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/chat/health")
    @Operation(summary = "Chatbot service health check")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "chatbot-service"));
    }
}
