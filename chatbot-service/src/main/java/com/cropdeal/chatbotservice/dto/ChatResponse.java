package com.cropdeal.chatbotservice.dto;

import java.util.ArrayList;
import java.util.List;

public class ChatResponse {
    private String sessionId;
    private String query;
    private String answer;
    private String reply;
    private String intent;
    private List<String> suggestedActions = new ArrayList<>();
    private String apiReference;

    public ChatResponse() {
    }

    public ChatResponse(String sessionId, String query, String answer, String reply, String intent, List<String> suggestedActions, String apiReference) {
        this.sessionId = sessionId;
        this.query = query;
        this.answer = answer;
        this.reply = reply != null ? reply : answer;
        this.intent = intent;
        this.suggestedActions = suggestedActions != null ? new ArrayList<>(suggestedActions) : new ArrayList<>();
        this.apiReference = apiReference;
    }

    public ChatResponse(String sessionId, String answer) {
        this.sessionId = sessionId;
        this.query = sessionId;
        this.answer = answer;
        this.reply = answer;
        this.intent = "GENERAL_ASSIST";
        this.suggestedActions = new ArrayList<>();
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String sessionId;
        private String query;
        private String answer;
        private String reply;
        private String intent;
        private List<String> suggestedActions = new ArrayList<>();
        private String apiReference;

        public Builder sessionId(String sessionId) {
            this.sessionId = sessionId;
            return this;
        }

        public Builder query(String query) {
            this.query = query;
            return this;
        }

        public Builder answer(String answer) {
            this.answer = answer;
            if (this.reply == null) {
                this.reply = answer;
            }
            return this;
        }

        public Builder reply(String reply) {
            this.reply = reply;
            if (this.answer == null) {
                this.answer = reply;
            }
            return this;
        }

        public Builder intent(String intent) {
            this.intent = intent;
            return this;
        }

        public Builder suggestedActions(List<String> suggestedActions) {
            this.suggestedActions = suggestedActions != null ? new ArrayList<>(suggestedActions) : new ArrayList<>();
            return this;
        }

        public Builder apiReference(String apiReference) {
            this.apiReference = apiReference;
            return this;
        }

        public ChatResponse build() {
            return new ChatResponse(sessionId, query, answer, reply, intent, suggestedActions, apiReference);
        }
    }

    public String getSessionId() {
        return sessionId != null ? sessionId : query;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getAnswer() {
        return answer != null ? answer : reply;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
        if (this.reply == null) {
            this.reply = answer;
        }
    }

    public String getReply() {
        return reply != null ? reply : answer;
    }

    public void setReply(String reply) {
        this.reply = reply;
        if (this.answer == null) {
            this.answer = reply;
        }
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public List<String> getSuggestedActions() {
        return suggestedActions;
    }

    public void setSuggestedActions(List<String> suggestedActions) {
        this.suggestedActions = suggestedActions;
    }

    public String getApiReference() {
        return apiReference;
    }

    public void setApiReference(String apiReference) {
        this.apiReference = apiReference;
    }

    public String sessionId() {
        return getSessionId();
    }

    public String reply() {
        return getReply();
    }
}
