package com.cropdeal.priceservice.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.cropdeal.priceservice.config.GovernmentApiConfig;
import com.cropdeal.priceservice.dto.CropPriceResponse;
import com.cropdeal.priceservice.dto.PriceSearchRequest;
import com.cropdeal.priceservice.entity.MarketPrice;
import com.cropdeal.priceservice.repository.CommodityUnitRepository;
import com.cropdeal.priceservice.repository.MarketPriceRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.client.RestClient;

class PriceServiceTest {

    @Mock
    private MarketPriceRepository repository;

    @Mock
    private CommodityUnitRepository unitRepository;

    @Mock
    private RestClient restClient;

    private PriceService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        GovernmentApiConfig config = new GovernmentApiConfig();
        config.setBaseUrl("https://api.data.gov.in");
        config.setResourceId("9ef84268-d588-465a-a308-a864a43d0070");
        config.setKey("test-key");
        service = new PriceService(repository, unitRepository, restClient, config);
        when(unitRepository.findByCommodityIgnoreCaseAndVarietyIgnoreCase(any(), any()))
                .thenReturn(Optional.empty());
    }

    @Test
    void districtPriceShouldAverageMultipleMarketsForGradeA() {
        MarketPrice first = price("Onion", "Tamil Nadu", "Erode", "Market A", 60.0, 70.0);
        MarketPrice second = price("Onion", "Tamil Nadu", "Erode", "Market B", 50.0, 80.0);

        when(repository.findByCommodityStateAndDistrict("onion", "Tamil Nadu", "Erode"))
                .thenReturn(List.of(first, second));

        PriceSearchRequest request = request("onion", "Tamil Nadu", "Erode", "A");
        CropPriceResponse response = service.getCropPrice(request);

        assertEquals(55.0, response.getMinPricePerKg());
        assertEquals(75.0, response.getMaxPricePerKg());
        assertEquals("Erode", response.getDistrict());
        assertEquals("A", response.getGrade());
    }

    @Test
    void gradeBShouldDiscountTenPercent() {
        MarketPrice first = price("Onion", "Tamil Nadu", "Erode", "Market A", 100.0, 200.0);

        when(repository.findByCommodityStateAndDistrict("onion", "Tamil Nadu", "Erode"))
                .thenReturn(List.of(first));

        PriceSearchRequest request = request("onion", "Tamil Nadu", "Erode", "B");
        CropPriceResponse response = service.getCropPrice(request);

        assertEquals(90.0, response.getMinPricePerKg()); // 100 * 0.9
        assertEquals(180.0, response.getMaxPricePerKg()); // 200 * 0.9
        assertEquals("B", response.getGrade());
    }

    @Test
    void gradeCShouldDiscountTwentyPercent() {
        MarketPrice first = price("Onion", "Tamil Nadu", "Erode", "Market A", 100.0, 200.0);

        when(repository.findByCommodityStateAndDistrict("onion", "Tamil Nadu", "Erode"))
                .thenReturn(List.of(first));

        PriceSearchRequest request = request("onion", "Tamil Nadu", "Erode", "C");
        CropPriceResponse response = service.getCropPrice(request);

        assertEquals(80.0, response.getMinPricePerKg()); // 100 * 0.8
        assertEquals(160.0, response.getMaxPricePerKg()); // 200 * 0.8
        assertEquals("C", response.getGrade());
    }

    @Test
    void shouldAutoCalculatePricePerKgWhenNull() {
        MarketPrice uncalculated = new MarketPrice();
        uncalculated.setCommodity("Onion");
        uncalculated.setState("Tamil Nadu");
        uncalculated.setDistrict("Erode");
        uncalculated.setMarket("Market A");
        uncalculated.setGrade("FAQ");
        uncalculated.setArrivalDate(LocalDate.of(2026, 9, 15));
        uncalculated.setMinPrice(2000.0); // 2000 Rs / 100kg = 20 Rs/kg
        uncalculated.setMaxPrice(3000.0); // 3000 Rs / 100kg = 30 Rs/kg

        when(repository.findByCommodityStateAndDistrict("onion", "Tamil Nadu", "Erode"))
                .thenReturn(List.of(uncalculated));

        PriceSearchRequest request = request("onion", "Tamil Nadu", "Erode", "A");
        CropPriceResponse response = service.getCropPrice(request);

        assertEquals(20.0, response.getMinPricePerKg());
        assertEquals(30.0, response.getMaxPricePerKg());
    }

    @Test
    void shouldFallbackFromDistrictToState() {
        when(repository.findByCommodityStateAndDistrict("onion", "Tamil Nadu", "Erode"))
                .thenReturn(List.of());

        MarketPrice statePrice = price("Onion", "Tamil Nadu", "Coimbatore", "Market A", 40.0, 60.0);
        when(repository.findByCommodityAndState("onion", "Tamil Nadu"))
                .thenReturn(List.of(statePrice));

        CropPriceResponse response = service.getCropPrice(request("onion", "Tamil Nadu", "Erode", "A"));

        assertEquals(40.0, response.getMinPricePerKg());
        assertEquals(60.0, response.getMaxPricePerKg());
        assertEquals("Tamil Nadu", response.getState());
        assertEquals(null, response.getDistrict());
    }

    @Test
    void shouldFailWhenNothingExists() {
        when(repository.findByCommodityStateAndDistrict(any(), any(), any())).thenReturn(List.of());
        when(repository.findByCommodityAndState(any(), any())).thenReturn(List.of());
        when(repository.findByCommodityNormalized(any())).thenReturn(List.of());

        assertThrows(RuntimeException.class,
                () -> service.getCropPrice(request("onion", "Tamil Nadu", "Erode", "A")));
    }

    private MarketPrice price(String commodity, String state, String district, String market, double min, double max) {
        MarketPrice p = new MarketPrice();
        p.setCommodity(commodity);
        p.setState(state);
        p.setDistrict(district);
        p.setMarket(market);
        p.setGrade("FAQ");
        p.setArrivalDate(LocalDate.of(2026, 9, 15));
        p.setMinPricePerKg(min);
        p.setMaxPricePerKg(max);
        return p;
    }

    private PriceSearchRequest request(String commodity, String state, String district, String grade) {
        PriceSearchRequest request = new PriceSearchRequest();
        request.setCommodity(commodity);
        request.setState(state);
        request.setDistrict(district);
        request.setGrade(grade);
        return request;
    }
}
