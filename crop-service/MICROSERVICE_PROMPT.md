# CropDeal Crop Service - Final Implementation Prompt

Build Crop Service for CropDeal using Java 21 and Spring Boot 4.1.1.

## Package structure

```text
crop-service/
├── controller/
│   ├── CropController
│   └── SubscriptionController
├── dto/
│   ├── CropCreateRequest
│   ├── CropUpdateRequest
│   ├── CropResponse
│   ├── CropSearchResponse
│   ├── QuantityUpdateRequest
│   ├── PriceSearchRequest
│   ├── PriceRangeResponse
│   ├── SubscriptionRequest
│   └── SubscriptionResponse
├── entity/
│   ├── Crop
│   └── CropSubscription
├── repository/
│   ├── CropRepository
│   └── CropSubscriptionRepository
├── service/
│   ├── CropService
│   └── SubscriptionService
├── client/
│   └── PriceServiceClient
├── security/
│   └── SecurityConfig
├── exception/
│   ├── CropNotFoundException
│   ├── PriceNotFoundException
│   ├── InvalidCropPriceException
│   ├── InsufficientQuantityException
│   ├── SubscriptionNotFoundException
│   └── GlobalExceptionHandler
└── config/
    ├── CropConfig
    └── RestClientConfig
```

## Farmer price rule

The farmer enters only `pricePerKg`.

Before saving a crop, call Price Service:

`POST http://localhost:8083/api/prices/lookup`

with commodity, state, district and mandatory grade A/B/C.

Use the returned `maxPricePerKg` only for validation. Do not store or expose mandi min/max prices in Crop Service.

Rule:

`farmer pricePerKg <= current mandi maxPricePerKg`

If farmer price is greater, return HTTP 400 and do not save.
If Price Service has no price or is unavailable, return HTTP 502 and do not save.

On update, validate against the current mandi maximum again.

## Crop fields

- id
- farmerId
- commodity
- state
- district
- grade (A/B/C)
- quantity
- unit (KG)
- pricePerKg
- description
- status
- createdAt
- updatedAt

Use `BigDecimal` for price and quantity.

## Quantity / dealer purchase rule

Order/Deal Service owns the purchase/order transaction. Crop Service owns the available crop quantity.

Provide:

`PATCH /api/crops/{cropId}/quantity`

request:

```json
{ "purchasedQuantity": 200 }
```

The database update must be conditional/atomic:

- only `PUBLISHED` crops can be reduced
- purchased quantity must be > 0
- purchased quantity must not exceed available quantity
- never allow quantity below zero
- if quantity becomes exactly zero, set status to `SOLD_OUT`
- retain the SOLD_OUT row in the database for history
- available search must return only `PUBLISHED` rows with quantity > 0
- if the purchase is greater than available, return HTTP 409

This endpoint is an internal integration point for Order/Deal Service after purchase confirmation. Do not implement payment/order logic inside Crop Service.

## Subscription rule

Do NOT subscribe using crop ID.

A subscriber subscribes to a commodity name and may optionally provide:

- state
- district
- grade

Examples:

```json
{ "subscriberId": 201, "commodity": "Onion" }
```

or:

```json
{ "subscriberId": 201, "commodity": "Onion", "state": "Tamil Nadu", "district": "Erode", "grade": "A" }
```

Missing optional filters mean ANY value for that filter.

When a crop is successfully published, find all matching subscriptions:

1. commodity must match
2. if subscription state exists, crop state must match
3. if subscription district exists, crop district must match
4. if subscription grade exists, crop grade must match

Matching subscriber IDs are notification candidates. Actual email/SMS/push delivery belongs to Notification Service; RabbitMQ can be integrated later.

## Empty-result rule

Do not return empty arrays, empty strings, or null values where the absence of data represents an error:

- crop ID not found -> 404
- farmer has no crops -> 404
- search has no available crops -> 404
- subscriber has no subscriptions -> 404
- missing mandi price -> 502
- insufficient quantity -> 409

An empty internal list of matching subscribers is normal and must not fail crop publication.

## Engineering rules

- Controllers must remain thin.
- Business logic belongs in services.
- Use Spring Data JPA repositories.
- Use transactions for writes.
- Use BigDecimal for monetary/quantity values.
- Normalize commodity/state/district comparisons case-insensitively and trim whitespace.
- Grade values are only A, B, C.
- Do not hard-code credentials.
- Keep Price Service as the owner/source of mandi price data.
- Keep Order/Deal Service as the owner of purchase/order transactions.
- Keep Notification Service as the owner of actual notifications.
