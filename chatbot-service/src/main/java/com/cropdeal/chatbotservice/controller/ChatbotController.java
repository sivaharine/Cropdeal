package com.cropdeal.chatbotservice.controller;

import com.cropdeal.chatbotservice.dto.ChatRequest;
import com.cropdeal.chatbotservice.dto.ChatResponse;
import com.cropdeal.chatbotservice.service.ChatbotAdvisoryService;
import com.cropdeal.chatbotservice.service.ChatbotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@Tag(name = "Agricultural Assistant", description = "Market Intelligence Advisory & FAQ Chatbot APIs")
public class ChatbotController {

    private final ChatbotAdvisoryService advisoryService;
    private final ChatbotService chatbotService;

    @Autowired
    public ChatbotController(
            @Autowired(required = false) ChatbotAdvisoryService advisoryService,
            @Autowired(required = false) ChatbotService chatbotService) {
        this.advisoryService = advisoryService;
        this.chatbotService = chatbotService;
    }

    @PostMapping({"/api/v1/chatbot/ask", "/api/chatbot/ask"})
    @Operation(summary = "Ask the agricultural advisory assistant a question")
    public ResponseEntity<ChatResponse> askQuestion(@Valid @RequestBody ChatRequest request) {
        if (advisoryService != null) {
            return ResponseEntity.ok(advisoryService.processQuery(request));
        }
        if (chatbotService != null) {
            return ResponseEntity.ok(chatbotService.chat(request));
        }
        return ResponseEntity.ok(new ChatResponse("session", "CropDeal Assistant is ready."));
    }

    @PostMapping({"/api/chat", "/api/chat/ask"})
    @Operation(summary = "Chat with session history")
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        if (chatbotService != null) {
            return ResponseEntity.ok(chatbotService.chat(request));
        }
        if (advisoryService != null) {
            return ResponseEntity.ok(advisoryService.processQuery(request));
        }
        return ResponseEntity.ok(new ChatResponse(request.getSessionId(), "CropDeal Assistant is ready."));
    }

    @DeleteMapping("/api/chat/sessions/{sessionId}")
    @Operation(summary = "Clear conversation session history")
    public ResponseEntity<Void> clearSession(@PathVariable String sessionId) {
        if (chatbotService != null) {
            chatbotService.clearSession(sessionId);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/chat/health")
    @Operation(summary = "Chatbot service health check")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "chatbot-service"));
    }
}
