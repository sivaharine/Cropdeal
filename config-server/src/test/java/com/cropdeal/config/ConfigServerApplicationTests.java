package com.cropdeal.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.cloud.config.server.native.search-locations=classpath:/config",
        "eureka.client.enabled=false"
})
class ConfigServerApplicationTests {

    @Test
    void contextLoads() {
    }
}
