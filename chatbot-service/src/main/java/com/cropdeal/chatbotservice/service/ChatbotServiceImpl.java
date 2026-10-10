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
        String sessionId = StringUtils.hasText(request.getSessionId())
                ? request.getSessionId()
                : UUID.randomUUID().toString();

        request.setSessionId(sessionId);

        // 1. Process query with CropDeal domain engine (handles database queries, greetings, orders, mandi rates, non-agri refusal)
        ChatResponse advisory = advisoryService.processQuery(request);
        if (advisory != null && !"OFF_TOPIC".equals(advisory.getIntent())) {
            advisory.setSessionId(sessionId);
            return advisory;
        }

        // 2. If general question or off-topic, leverage Sarvam AI 105b LLM with system prompt
        try {
            if (config != null && StringUtils.hasText(config.getSubscriptionKey())) {
                List<MessageDto> history = sessions.computeIfAbsent(sessionId, k -> new ArrayList<>());
                history.add(new MessageDto("user", request.getMessage()));
                trimHistory(history);
                List<MessageDto> messages = buildMessages(history);
                String aiReply = sarvamClientService.complete(messages);
                if (StringUtils.hasText(aiReply)) {
                    history.add(new MessageDto("assistant", aiReply));
                    trimHistory(history);
                    return ChatResponse.builder()
                            .sessionId(sessionId)
                            .intent("SARVAM_AI")
                            .answer(aiReply)
                            .reply(aiReply)
                            .suggestedActions(List.of("Check Mandi Prices", "Show Available Crops", "What is CropDeal?"))
                            .build();
                }
            }
        } catch (Exception ex) {
            log.warn("Sarvam AI completion error/fallback: {}", ex.getMessage());
        }

        if (advisory != null) {
            advisory.setSessionId(sessionId);
            return advisory;
        }

        return new ChatResponse(sessionId, "🌾 Welcome to CropDeal! How can I assist you with your farming or crop orders today?");
    }

    @Override
    public void clearSession(String sessionId) {
        sessions.remove(sessionId);
    }

    private void trimHistory(List<MessageDto> history) {
        int maxHistoryMessages = Math.max(config != null ? config.getMaxHistoryMessages() : 20, 2);
        while (history.size() > maxHistoryMessages) {
            history.remove(0);
        }
    }

    private List<MessageDto> buildMessages(List<MessageDto> history) {
        List<MessageDto> messages = new ArrayList<>();
        if (config != null && StringUtils.hasText(config.getSystemPrompt())) {
            messages.add(new MessageDto("system", config.getSystemPrompt()));
        }
        messages.addAll(history);
        return List.copyOf(messages);
    }
}
