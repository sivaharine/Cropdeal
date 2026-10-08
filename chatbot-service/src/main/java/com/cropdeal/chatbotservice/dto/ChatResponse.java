package com.cropdeal.chatbotservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private String sessionId;
    private String query;
    private String answer;
    private String reply;
    private String intent;

    @Builder.Default
    private List<String> suggestedActions = new ArrayList<>();
    private String apiReference;

    public ChatResponse(String sessionId, String answer) {
        this.sessionId = sessionId;
        this.query = sessionId;
        this.answer = answer;
        this.reply = answer;
        this.intent = "GENERAL_ASSIST";
        this.suggestedActions = new ArrayList<>();
    }

    public String sessionId() {
        return this.sessionId != null ? this.sessionId : this.query;
    }

    public String reply() {
        return this.reply != null ? this.reply : this.answer;
    }

    public String getSessionId() {
        return this.sessionId != null ? this.sessionId : this.query;
    }

    public String getReply() {
        return this.reply != null ? this.reply : this.answer;
    }
}
