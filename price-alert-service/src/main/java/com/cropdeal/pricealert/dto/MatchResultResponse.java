package com.cropdeal.pricealert.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchResultResponse {

    private int matchedCount;
    private int notificationsTriggered;
    private String message;
}
