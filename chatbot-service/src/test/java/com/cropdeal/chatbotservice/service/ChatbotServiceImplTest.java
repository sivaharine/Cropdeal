package com.cropdeal.chatbotservice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cropdeal.chatbotservice.client.AuthServiceClient;
import com.cropdeal.chatbotservice.client.CropServiceClient;
import com.cropdeal.chatbotservice.client.DeliveryServiceClient;
import com.cropdeal.chatbotservice.client.OrderServiceClient;
import com.cropdeal.chatbotservice.client.PriceServiceClient;
import com.cropdeal.chatbotservice.client.UserServiceClient;
import com.cropdeal.chatbotservice.config.SarvamConfig;
import com.cropdeal.chatbotservice.dto.ChatRequest;
import com.cropdeal.chatbotservice.dto.ChatResponse;
import com.cropdeal.chatbotservice.dto.CropSearchResponse;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ChatbotServiceImplTest {

    @Mock
    private SarvamClientService sarvamClientService;

    @Mock
    private CropServiceClient cropServiceClient;

    @Mock
    private PriceServiceClient priceServiceClient;

    @Mock
    private OrderServiceClient orderServiceClient;

    @Mock
    private DeliveryServiceClient deliveryServiceClient;

    @Mock
    private AuthServiceClient authServiceClient;

    @Mock
    private UserServiceClient userServiceClient;

    private ChatbotServiceImpl chatbotService;

    @BeforeEach
    void setUp() {
        SarvamConfig config = new SarvamConfig();
        config.setSystemPrompt("You are a test assistant.");
        config.setMaxHistoryMessages(6);
        chatbotService = new ChatbotServiceImpl(
                sarvamClientService,
                config,
                cropServiceClient,
                priceServiceClient,
                orderServiceClient,
                deliveryServiceClient,
                authServiceClient,
                userServiceClient);
    }

    @Test
    void chatAnswersCropQuestionsFromCropService() {
        when(cropServiceClient.search(null, null, null, null)).thenReturn(List.of(
                new CropSearchResponse(1L, "Tomato", "Karnataka", "Bengaluru", "A",
                        BigDecimal.valueOf(100), "kg", BigDecimal.valueOf(25), "AVAILABLE")));

        ChatResponse response = chatbotService.chat(new ChatRequest("session-1", "Which tomato crop is available?"));

        assertThat(response.sessionId()).isEqualTo("session-1");
        assertThat(response.reply()).contains("Matching available crops from CropDeal");
        assertThat(response.reply()).contains("Tomato");
        verify(sarvamClientService, never()).complete(anyList());
    }

    @Test
    void chatFallsBackToSarvamForGeneralQuestions() {
        when(sarvamClientService.complete(anyList())).thenReturn("I can help with CropDeal questions.");

        ChatResponse response = chatbotService.chat(new ChatRequest(null, "Hello"));

        assertThat(response.sessionId()).isNotBlank();
        assertThat(response.reply()).isEqualTo("I can help with CropDeal questions.");
        verify(sarvamClientService).complete(anyList());
    }

    @Test
    void orderQuestionWithoutEmailPromptsForRegisteredEmail() {
        ChatResponse response = chatbotService.chat(new ChatRequest("session-1", "Track my order"));

        assertThat(response.reply()).contains("Please share your registered email id");
        verify(authServiceClient, never()).findByEmail(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void clearSessionRemovesRememberedOrderEmailPromptState() {
        chatbotService.chat(new ChatRequest("session-1", "Track my order"));

        chatbotService.clearSession("session-1");
        ChatResponse response = chatbotService.chat(new ChatRequest("session-1", "Hello"));

        assertThat(response.sessionId()).isEqualTo("session-1");
        verify(sarvamClientService).complete(anyList());
    }
}
