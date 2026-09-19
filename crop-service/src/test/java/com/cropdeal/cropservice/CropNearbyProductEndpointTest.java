package com.cropdeal.cropservice;

import com.cropdeal.cropservice.entity.Crop;
import com.cropdeal.cropservice.repository.CropRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.cloud.config.enabled=false",
        "eureka.client.enabled=false",
        "spring.rabbitmq.listener.simple.auto-startup=false"
})
class CropNearbyProductEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CropRepository cropRepository;

    @BeforeEach
    void setUp() {
        cropRepository.deleteAll();

        cropRepository.save(crop("Tomato", "Tamil Nadu", "Erode", "A", "125.000", Crop.PUBLISHED));
        cropRepository.save(crop("Tomato", "Tamil Nadu", "Salem", "A", "80.000", Crop.PUBLISHED));
        cropRepository.save(crop("Tomato", "Kerala", "Kochi", "A", "70.000", Crop.PUBLISHED));
        cropRepository.save(crop("Onion", "Tamil Nadu", "Erode", "A", "0.000", Crop.SOLD_OUT));
    }

    @Test
    void nearbyProductsFindsAvailableProductsByDistrictAndCommodity() throws Exception {
        mockMvc.perform(get("/api/crops/nearby")
                        .param("state", "Tamil Nadu")
                        .param("district", "Erode")
                        .param("commodity", "Tomato"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].commodity", is("Tomato")))
                .andExpect(jsonPath("$[0].district", is("Erode")))
                .andExpect(jsonPath("$[0].status", is(Crop.PUBLISHED)));
    }

    @Test
    void nearbyProductsAliasWorksForProductUrl() throws Exception {
        mockMvc.perform(get("/api/crops/products/nearby")
                        .param("state", "Tamil Nadu")
                        .param("grade", "A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].state", is("Tamil Nadu")))
                .andExpect(jsonPath("$[1].state", is("Tamil Nadu")));
    }

    private Crop crop(
            String commodity,
            String state,
            String district,
            String grade,
            String quantity,
            String status) {

        Crop crop = new Crop();
        crop.setFarmerId(101L);
        crop.setCommodity(commodity);
        crop.setState(state);
        crop.setDistrict(district);
        crop.setGrade(grade);
        crop.setQuantity(new BigDecimal(quantity));
        crop.setUnit("KG");
        crop.setPricePerKg(new BigDecimal("25.50"));
        crop.setDescription("Test product");
        crop.setStatus(status);
        return crop;
    }
}
