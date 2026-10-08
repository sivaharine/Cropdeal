package com.cropdeal.chatbotservice.service;

import com.cropdeal.chatbotservice.config.SarvamConfig;
import com.cropdeal.chatbotservice.dto.ChatRequest;
import com.cropdeal.chatbotservice.dto.ChatResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatbotServiceImplTest {

    @Mock
    private SarvamClientService sarvamClientService;

    private SarvamConfig config;
    private ChatbotServiceImpl chatbotService;

    @BeforeEach
    void setUp() {
        config = new SarvamConfig();
        config.setSystemPrompt("You are helpful assistant.");
        config.setMaxHistoryMessages(10);
        chatbotService = new ChatbotServiceImpl(sarvamClientService, config);
    }

    @Test
    void chat_withSessionId_returnsAssistantReply() {
        when(sarvamClientService.complete(anyList())).thenReturn("Hello! How can I help with crops?");

        ChatRequest request = new ChatRequest("session-123", "Hello");
        ChatResponse response = chatbotService.chat(request);

        assertThat(response).isNotNull();
        assertThat(response.sessionId()).isEqualTo("session-123");
        assertThat(response.reply()).isEqualTo("Hello! How can I help with crops?");
    }

    @Test
    void chat_withoutSessionId_generatesSessionId() {
        when(sarvamClientService.complete(anyList())).thenReturn("Sure, here is market info.");

        ChatRequest request = new ChatRequest(null, "Market info");
        ChatResponse response = chatbotService.chat(request);

        assertThat(response).isNotNull();
        assertThat(response.sessionId()).isNotBlank();
        assertThat(response.reply()).isEqualTo("Sure, here is market info.");
    }

    @Test
    void clearSession_removesSessionHistory() {
        chatbotService.clearSession("session-123");
    }
}
