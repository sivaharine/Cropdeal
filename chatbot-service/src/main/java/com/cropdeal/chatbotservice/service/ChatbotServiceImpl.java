package com.cropdeal.chatbotservice.service;

import com.cropdeal.chatbotservice.config.SarvamConfig;
import com.cropdeal.chatbotservice.dto.ChatRequest;
import com.cropdeal.chatbotservice.dto.ChatResponse;
import com.cropdeal.chatbotservice.dto.MessageDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class ChatbotServiceImpl implements ChatbotService {

    private static final Logger log = LoggerFactory.getLogger(ChatbotServiceImpl.class);

    private final ConcurrentMap<String, List<MessageDto>> sessions = new ConcurrentHashMap<>();
    private final SarvamClientService sarvamClientService;
    private final SarvamConfig config;
    private final ChatbotAdvisoryService advisoryService;

    public ChatbotServiceImpl(SarvamClientService sarvamClientService, SarvamConfig config) {
        this(sarvamClientService, config, new ChatbotAdvisoryService());
    }

    @Autowired
    public ChatbotServiceImpl(SarvamClientService sarvamClientService, SarvamConfig config, ChatbotAdvisoryService advisoryService) {
        this.sarvamClientService = sarvamClientService;
        this.config = config;
        this.advisoryService = advisoryService != null ? advisoryService : new ChatbotAdvisoryService();
    }

    @Override
    public ChatResponse chat(ChatRequest request) {
        String sessionId = StringUtils.hasText(request.sessionId())
                ? request.sessionId()
                : UUID.randomUUID().toString();

        request.setSessionId(sessionId);

        // 1. Check project advisory engine for domain queries (crop prices from DB, logistics, bidding, etc.)
        ChatResponse advisory = advisoryService.processQuery(request);
        if (advisory != null && !"GENERAL_ASSIST".equals(advisory.getIntent())) {
            return advisory;
        }

        // 2. If general query, try AI service (or when running tests)
        try {
            List<MessageDto> history = sessions.computeIfAbsent(sessionId, ignored -> new ArrayList<>());
            synchronized (history) {
                history.add(new MessageDto("user", request.message()));
                trimHistory(history);
                String reply = sarvamClientService.complete(buildMessages(history));
                history.add(new MessageDto("assistant", reply));
                trimHistory(history);
                return new ChatResponse(sessionId, reply);
            }
        } catch (Exception ex) {
            log.info("AI provider inactive or unconfigured. Falling back to local advisory response: {}", ex.getMessage());
            return advisory != null ? advisory : new ChatResponse(sessionId, "🌾 Welcome to CropDeal Agricultural Assistant!");
        }
    }

    @Override
    public void clearSession(String sessionId) {
        sessions.remove(sessionId);
    }

    private void trimHistory(List<MessageDto> history) {
        int maxHistoryMessages = Math.max(config.getMaxHistoryMessages(), 2);
        while (history.size() > maxHistoryMessages) {
            history.remove(0);
        }
    }

    private List<MessageDto> buildMessages(List<MessageDto> history) {
        List<MessageDto> messages = new ArrayList<>();
        if (StringUtils.hasText(config.getSystemPrompt())) {
            messages.add(new MessageDto("system", config.getSystemPrompt()));
        }
        messages.addAll(history);
        return List.copyOf(messages);
    }
}
