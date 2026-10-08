package com.cropdeal.chatbotservice;

import com.cropdeal.chatbotservice.service.SarvamClientService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest(properties = {
    "eureka.client.enabled=false"
})
class ChatbotServiceApplicationTests {

    @MockBean
    private SarvamClientService sarvamClientService;

    @Test
    void contextLoads() {
    }
}
