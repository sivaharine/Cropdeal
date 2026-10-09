package com.cropdeal.bidding.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CropDeal Bidding & Auction Service API")
                        .version("1.0.0")
                        .description("Microservice managing live crop auctions with wallet-only bidding validation, fund escrow/refunds, and winner settlement.")
                        .contact(new Contact().name("CropDeal Core Team")));
    }
}