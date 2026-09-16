package com.cropdeal.chatbotservice.service;

import com.cropdeal.chatbotservice.config.SarvamConfig;
import com.cropdeal.chatbotservice.dto.ChatRequest;
import com.cropdeal.chatbotservice.dto.ChatResponse;
import com.cropdeal.chatbotservice.dto.MessageDto;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ChatbotServiceImpl implements ChatbotService {
    private final ConcurrentMap<String, List<MessageDto>> sessions = new ConcurrentHashMap<>();
    private final SarvamClientService sarvamClientService;
    private final SarvamConfig config;

    public ChatbotServiceImpl(SarvamClientService sarvamClientService, SarvamConfig config) {
        this.sarvamClientService = sarvamClientService;
        this.config = config;
    }

    @Override
    public ChatResponse chat(ChatRequest request) {
        String sessionId = StringUtils.hasText(request.sessionId())
                ? request.sessionId()
                : UUID.randomUUID().toString();

        List<MessageDto> history = sessions.computeIfAbsent(sessionId, ignored -> new ArrayList<>());

        String reply;
        synchronized (history) {
            history.add(new MessageDto("user", request.message()));
            trimHistory(history);
            reply = sarvamClientService.complete(buildMessages(history));
            history.add(new MessageDto("assistant", reply));
            trimHistory(history);
        }

        return new ChatResponse(sessionId, reply);
    }

    @Override
    public void clearSession(String sessionId) {
        sessions.remove(sessionId);
    }

    private void trimHistory(List<MessageDto> history) {
        int maxHistoryMessages = Math.max(config.getMaxHistoryMessages(), 2);
        while (history.size() > maxHistoryMessages) {
            history.removeFirst();
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
