package com.cropdeal.chatbotservice;

import com.cropdeal.chatbotservice.controller.ChatbotController;
import com.cropdeal.chatbotservice.dto.ChatRequest;
import com.cropdeal.chatbotservice.dto.ChatResponse;
import com.cropdeal.chatbotservice.service.ChatbotAdvisoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ChatbotController.class)
@AutoConfigureMockMvc(addFilters = false)
class ChatbotControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ChatbotAdvisoryService advisoryService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testAskQuestion_PriceQuery() throws Exception {
        ChatRequest req = ChatRequest.builder().message("What is onion price in Erode?").build();
        ChatResponse res = ChatResponse.builder()
                .query("What is onion price in Erode?")
                .intent("MARKET_PRICE_INQUIRY")
                .answer("Onion price is ₹35/KG")
                .build();

        Mockito.when(advisoryService.processQuery(any(ChatRequest.class))).thenReturn(res);

        mockMvc.perform(post("/api/v1/chatbot/ask")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                
                .andExpect(jsonPath("$.intent").value("MARKET_PRICE_INQUIRY"));
    }

    @Test
    void testAskQuestion_DeliveryQuery() throws Exception {
        ChatRequest req = ChatRequest.builder().message("How much for delivery?").build();
        ChatResponse res = ChatResponse.builder()
                .query("How much for delivery?")
                .intent("DELIVERY_GUIDE")
                .answer("Delivery rate is ₹10/KM")
                .build();

        Mockito.when(advisoryService.processQuery(any(ChatRequest.class))).thenReturn(res);

        mockMvc.perform(post("/api/v1/chatbot/ask")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                
                .andExpect(jsonPath("$.intent").value("DELIVERY_GUIDE"));
    }
}
