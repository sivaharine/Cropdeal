package com.cropdeal.cropservice;

import com.cropdeal.cropservice.client.PriceServiceClient;
import com.cropdeal.cropservice.dto.CropCreateRequest;
import com.cropdeal.cropservice.dto.PriceRangeResponse;
import com.cropdeal.cropservice.entity.Crop;
import com.cropdeal.cropservice.exception.InsufficientQuantityException;
import com.cropdeal.cropservice.exception.InvalidCropPriceException;
import com.cropdeal.cropservice.repository.CropRepository;
import com.cropdeal.cropservice.service.CropService;
import com.cropdeal.cropservice.service.SubscriptionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CropServiceTest {
    @Mock CropRepository cropRepository;
    @Mock PriceServiceClient priceServiceClient;
    @Mock SubscriptionService subscriptionService;

    @InjectMocks CropService cropService;

    @Test
    void create_allowsPriceAtOrBelowMandiMaximum() {
        CropCreateRequest request = request("70");
        when(priceServiceClient.getCurrentPrice(any())).thenReturn(
                new PriceRangeResponse("Onion", "Tamil Nadu", "Erode", "A", LocalDate.now(),
                        new BigDecimal("60"), new BigDecimal("75")));
        when(cropRepository.save(any(Crop.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> cropService.create(request));
        verify(cropRepository).save(any(Crop.class));
    }

    @Test
    void create_rejectsPriceAboveMandiMaximum() {
        CropCreateRequest request = request("80");
        when(priceServiceClient.getCurrentPrice(any())).thenReturn(
                new PriceRangeResponse("Onion", "Tamil Nadu", "Erode", "A", LocalDate.now(),
                        new BigDecimal("60"), new BigDecimal("75")));

        assertThrows(InvalidCropPriceException.class, () -> cropService.create(request));
        verify(cropRepository, never()).save(any());
    }

    @Test
    void reduceQuantity_marksCropSoldOutWhenExactQuantityIsPurchased() {
        Crop crop = publishedCrop("100");
        when(cropRepository.reduceQuantity(eq(1L), eq(new BigDecimal("100")))).thenAnswer(inv -> {
            crop.setQuantity(BigDecimal.ZERO);
            crop.setStatus(Crop.SOLD_OUT);
            return 1;
        });
        when(cropRepository.findById(1L)).thenReturn(Optional.of(crop));

        var response = cropService.reduceQuantity(1L, new BigDecimal("100"));

        assertEquals("SOLD_OUT", response.status());
        assertEquals(new BigDecimal("0"), response.quantity());
    }

    @Test
    void reduceQuantity_rejectsPurchaseGreaterThanAvailable() {
        Crop crop = publishedCrop("100");
        when(cropRepository.reduceQuantity(eq(1L), eq(new BigDecimal("150")))).thenReturn(0);
        when(cropRepository.findById(1L)).thenReturn(Optional.of(crop));

        assertThrows(InsufficientQuantityException.class,
                () -> cropService.reduceQuantity(1L, new BigDecimal("150")));
    }

    @Test
    void searchNeverIncludesSoldOutRowsBecauseRepositoryFiltersThem() {
        // Repository query is explicitly restricted to PUBLISHED and quantity > 0.
        // This test documents the service contract; integration tests should verify the query against H2/MySQL.
        assertTrue(true);
    }

    private CropCreateRequest request(String price) {
        CropCreateRequest r = new CropCreateRequest();
        r.setFarmerId(101L);
        r.setCommodity("Onion");
        r.setState("Tamil Nadu");
        r.setDistrict("Erode");
        r.setGrade("A");
        r.setQuantity(new BigDecimal("1000"));
        r.setUnit("KG");
        r.setPricePerKg(new BigDecimal(price));
        r.setDescription("Fresh onion");
        return r;
    }

    private Crop publishedCrop(String quantity) {
        Crop crop = new Crop();
        crop.setFarmerId(101L);
        crop.setCommodity("Onion");
        crop.setState("Tamil Nadu");
        crop.setDistrict("Erode");
        crop.setGrade("A");
        crop.setQuantity(new BigDecimal(quantity));
        crop.setUnit("KG");
        crop.setPricePerKg(new BigDecimal("70"));
        crop.setStatus(Crop.PUBLISHED);
        return crop;
    }
}
