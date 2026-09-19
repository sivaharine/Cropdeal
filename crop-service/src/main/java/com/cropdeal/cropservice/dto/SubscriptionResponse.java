package com.cropdeal.cropservice.dto;

import java.time.LocalDateTime;

public record SubscriptionResponse(Long id, Long subscriberId, String commodity,
                                   String state, String district, String grade,
                                   LocalDateTime subscribedAt) {}
