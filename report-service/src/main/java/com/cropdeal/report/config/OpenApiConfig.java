package com.cropdeal.report.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI reportServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CropDeal Report Service API")
                        .description("REST API for Admin Reports: Payments, Dealers, Farmers, Delivery Partners, and Crops")
                        .version("1.0.0")
                        .contact(new Contact().name("CropDeal Core Team").email("support@cropdeal.com"))
                        .license(new License().name("Apache 2.0")));
    }
}
