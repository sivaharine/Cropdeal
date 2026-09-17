package com.cropdeal.chatbotservice.service;

import com.cropdeal.chatbotservice.config.SarvamConfig;
import com.cropdeal.chatbotservice.dto.MessageDto;
import com.cropdeal.chatbotservice.exception.ChatbotException;
import java.util.List;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

@Service
public class SarvamClientService {
    private final RestClient sarvamRestClient;
    private final SarvamConfig config;

    public SarvamClientService(RestClient sarvamRestClient, SarvamConfig config) {
        this.sarvamRestClient = sarvamRestClient;
        this.config = config;
    }

    public String complete(List<MessageDto> messages) {
        if (!StringUtils.hasText(config.getSubscriptionKey())) {
            throw new ChatbotException("SARVAM_API_KEY is not configured");
        }

        SarvamChatRequest request = new SarvamChatRequest(config.getModel(), messages);
        SarvamChatResponse response = sarvamRestClient.post()
                .uri("/v1/chat/completions")
                .header("api-subscription-key", config.getSubscriptionKey())
                .body(request)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    throw new ChatbotException("Sarvam API request failed with status " + res.getStatusCode());
                })
                .body(SarvamChatResponse.class);

        if (response == null || response.choices() == null || response.choices().isEmpty()) {
            throw new ChatbotException("Sarvam API returned an empty response");
        }

        SarvamMessage message = response.choices().getFirst().message();
        if (message == null || !StringUtils.hasText(message.content())) {
            throw new ChatbotException("Sarvam API returned no assistant message");
        }

        return message.content();
    }

    private record SarvamChatRequest(String model, List<MessageDto> messages) {
    }

    private record SarvamChatResponse(List<SarvamChoice> choices) {
    }

    private record SarvamChoice(SarvamMessage message) {
    }

    private record SarvamMessage(String role, String content) {
    }
}
