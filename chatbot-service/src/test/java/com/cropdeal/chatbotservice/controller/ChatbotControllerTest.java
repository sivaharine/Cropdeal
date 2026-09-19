package com.cropdeal.chatbotservice.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cropdeal.chatbotservice.dto.ChatRequest;
import com.cropdeal.chatbotservice.dto.ChatResponse;
import com.cropdeal.chatbotservice.service.ChatbotService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class ChatbotControllerTest {

    @Mock
    private ChatbotService chatbotService;

    @InjectMocks
    private ChatbotController chatbotController;

    @Test
    void chatReturnsServiceResponse() {
        ChatRequest request = new ChatRequest("session-1", "Show available crops");
        ChatResponse serviceResponse = new ChatResponse("session-1", "Available crops in CropDeal");
        when(chatbotService.chat(request)).thenReturn(serviceResponse);

        ResponseEntity<ChatResponse> response = chatbotController.chat(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(serviceResponse);
        verify(chatbotService).chat(request);
    }

    @Test
    void clearSessionReturnsNoContent() {
        ResponseEntity<Void> response = chatbotController.clearSession("session-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(chatbotService).clearSession("session-1");
    }

    @Test
    void healthReturnsServiceStatus() {
        ResponseEntity<String> response = chatbotController.health();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo("chatbot-service is running");
    }
}
