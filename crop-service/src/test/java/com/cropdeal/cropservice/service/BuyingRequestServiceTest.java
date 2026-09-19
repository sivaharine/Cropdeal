package com.cropdeal.cropservice.service;

import com.cropdeal.cropservice.dto.BuyingRequestCreateDto;
import com.cropdeal.cropservice.dto.BuyingRequestResponseDto;
import com.cropdeal.cropservice.entity.BuyingRequest;
import com.cropdeal.cropservice.repository.BuyingRequestRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BuyingRequestServiceTest {

    @Mock
    private BuyingRequestRepository repository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private BuyingRequestService service;

    @Test
    @DisplayName("Create Buying Request and publish RabbitMQ event")
    void testCreateBuyingRequest() {
        when(repository.save(any(BuyingRequest.class))).thenAnswer(i -> {
            BuyingRequest b = i.getArgument(0);
            b.setId(10L);
            return b;
        });

        BuyingRequestCreateDto dto = new BuyingRequestCreateDto();
        dto.setDealerId(501L);
        dto.setCropName("Tomato");
        dto.setQuantity(BigDecimal.valueOf(1000));
        dto.setBuyingPrice(BigDecimal.valueOf(32.00));
        dto.setDistrict("Erode");
        dto.setState("Tamil Nadu");

        BuyingRequestResponseDto response = service.createBuyingRequest(dto, 501L);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Tomato", response.getCropName());
        assertEquals(BuyingRequest.ACTIVE, response.getStatus());

        verify(rabbitTemplate, times(1)).convertAndSend(anyString(), anyString(), any(Object.class));
    }
}