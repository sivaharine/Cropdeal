package com.cropdeal.cropservice.controller;

import com.cropdeal.cropservice.dto.SubscriptionRequest;
import com.cropdeal.cropservice.dto.SubscriptionResponse;
import com.cropdeal.cropservice.service.SubscriptionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
@Validated
public class SubscriptionController {
    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SubscriptionResponse subscribe(@Valid @RequestBody SubscriptionRequest request) {
        return subscriptionService.subscribe(request);
    }

    @DeleteMapping("/{subscriptionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsubscribe(@PathVariable @Positive Long subscriptionId,
                            @RequestParam @Positive Long subscriberId) {
        subscriptionService.unsubscribe(subscriptionId, subscriberId);
    }

    @GetMapping("/subscriber/{subscriberId}")
    public List<SubscriptionResponse> bySubscriber(@PathVariable @Positive Long subscriberId) {
        return subscriptionService.bySubscriber(subscriberId);
    }
}
