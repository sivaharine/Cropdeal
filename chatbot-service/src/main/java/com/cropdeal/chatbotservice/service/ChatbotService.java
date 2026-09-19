package com.cropdeal.chatbotservice.service;

import com.cropdeal.chatbotservice.dto.ChatRequest;
import com.cropdeal.chatbotservice.dto.ChatResponse;

public interface ChatbotService {
    ChatResponse chat(ChatRequest request);

    void clearSession(String sessionId);
}
