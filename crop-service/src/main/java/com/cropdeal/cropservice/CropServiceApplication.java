package com.cropdeal.cropservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class CropServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(CropServiceApplication.class, args);
    }
}
