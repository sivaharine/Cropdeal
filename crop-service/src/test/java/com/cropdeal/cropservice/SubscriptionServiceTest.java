package com.cropdeal.cropservice;

import com.cropdeal.cropservice.dto.SubscriptionRequest;
import com.cropdeal.cropservice.entity.Crop;
import com.cropdeal.cropservice.entity.CropSubscription;
import com.cropdeal.cropservice.repository.CropSubscriptionRepository;
import com.cropdeal.cropservice.service.SubscriptionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {
    @Mock CropSubscriptionRepository repository;
    @InjectMocks SubscriptionService service;

    @Test
    void subscribeAllowsOnlyCommodityWithOptionalFilters() {
        SubscriptionRequest request = new SubscriptionRequest();
        request.setSubscriberId(201L);
        request.setCommodity("Onion");

        when(repository.findExactSubscription("Onion", null, null, null)).thenReturn(List.of());
        when(repository.save(any(CropSubscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.subscribe(request);

        assertEquals(201L, response.subscriberId());
        assertEquals("Onion", response.commodity());
        assertNull(response.state());
        assertNull(response.district());
        assertNull(response.grade());
    }

    @Test
    void matchingSubscriptionWithNullFiltersMatchesAnyCropLocationAndGrade() {
        CropSubscription subscription = new CropSubscription();
        subscription.setSubscriberId(201L);
        subscription.setCommodity("Onion");
        subscription.setState(null);
        subscription.setDistrict(null);
        subscription.setGrade(null);

        Crop crop = new Crop();
        crop.setCommodity("Onion");
        crop.setState("Tamil Nadu");
        crop.setDistrict("Erode");
        crop.setGrade("A");

        when(repository.findMatchingSubscriptions("Onion", "Tamil Nadu", "Erode", "A"))
                .thenReturn(List.of(subscription));

        assertEquals(1, service.findMatchingSubscriptions(crop).size());
    }
}
