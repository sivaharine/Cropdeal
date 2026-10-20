package com.cropdeal.pricealert.dto;

import com.cropdeal.pricealert.enums.AlertSourceType;
import com.cropdeal.pricealert.enums.PriceCondition;
import com.cropdeal.pricealert.enums.UserRole;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceAlertTriggeredEvent implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long subscriptionId;
    private Long userId;
    private UserRole userRole;
    private String cropName;
    private BigDecimal targetPrice;
    private BigDecimal matchedPrice;
    private PriceCondition priceCondition;
    private AlertSourceType sourceType;
    private Long sourceId;
    private String district;
    private String state;
    private String unit;
    private String title;
    private String message;
    private LocalDateTime timestamp;
}
