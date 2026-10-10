# CropDeal Crop Service

Java 21 + Spring Boot 4.1.1 microservice for farmer crop listings, mandi-price validation, buyer crop subscriptions, and available-quantity management.

## Responsibilities

- Crop Service owns crop listings and available quantity.
- Price Service remains the source of the current mandi price.
- Farmer enters exactly one selling price: `pricePerKg`.
- Before a crop is published or updated, Crop Service calls Price Service `POST /api/prices/lookup`.
- The farmer's `pricePerKg` must be less than or equal to the current mandi `maxPricePerKg`.
- Crop Service does not store or expose mandi min/max prices.
- If the Price Service has no current price or is unavailable, the crop is not saved/updated and HTTP 502 is returned.
- Crop grade is mandatory and must be A, B, or C.
- Quantity and price use `BigDecimal`.
- Unit is currently `KG` because the selling price is per kg.

## Purchase / quantity rule

An Order/Deal Service should confirm the dealer purchase and then call:

`PATCH /api/crops/{cropId}/quantity`

with:

```json
{
  "purchasedQuantity": 200
}
```

The update is conditional and atomic at the database level:

- purchased quantity <= available quantity -> quantity is reduced
- exact remaining quantity purchased -> quantity becomes 0 and status becomes `SOLD_OUT`
- purchase greater than available -> HTTP 409
- sold-out crops cannot be purchased again
- quantity never becomes negative

The Crop record is retained in MySQL with `SOLD_OUT` status for history. Available-crop search only returns `PUBLISHED` crops with quantity > 0, so sold-out crops disappear from normal buyer search.

## Subscription rule

A subscriber subscribes to a **commodity name**, not a crop ID.

Only `subscriberId` and `commodity` are required. `state`, `district`, and `grade` are optional filters.

```json
{
  "subscriberId": 201,
  "commodity": "Onion"
}
```

means all available Onion crops.

```json
{
  "subscriberId": 201,
  "commodity": "Onion",
  "state": "Tamil Nadu",
  "district": "Erode",
  "grade": "A"
}
```

means Grade A Onion crops in Erode, Tamil Nadu.

A missing optional filter means ANY value for that field. When a crop is published, matching subscriber IDs are identified as notification candidates. Actual email/SMS/push delivery belongs to a separate Notification Service; RabbitMQ can be added later.

## Empty-result rule

Where the absence of data represents an error, the service returns an explicit error instead of `[]`, empty strings, or null results:

- crop ID not found -> 404
- farmer has no crops -> 404
- search has no available crops -> 404
- subscriber has no subscriptions -> 404
- mandi price unavailable -> 502
- insufficient purchase quantity -> 409

An empty matching-subscriber list is normal internally because a crop does not need to have subscribers.

## Project structure

```text
crop-service/
├── controller/
│   ├── CropController.java
│   └── SubscriptionController.java
├── dto/
│   ├── CropCreateRequest.java
│   ├── CropUpdateRequest.java
│   ├── CropResponse.java
│   ├── CropSearchResponse.java
│   ├── QuantityUpdateRequest.java
│   ├── PriceSearchRequest.java
│   ├── PriceRangeResponse.java
│   ├── SubscriptionRequest.java
│   └── SubscriptionResponse.java
├── entity/
│   ├── Crop.java
│   └── CropSubscription.java
├── repository/
│   ├── CropRepository.java
│   └── CropSubscriptionRepository.java
├── service/
│   ├── CropService.java
│   └── SubscriptionService.java
├── client/
│   └── PriceServiceClient.java
├── security/
│   └── SecurityConfig.java
├── exception/
│   ├── CropNotFoundException.java
│   ├── PriceNotFoundException.java
│   ├── InvalidCropPriceException.java
│   ├── InsufficientQuantityException.java
│   ├── SubscriptionNotFoundException.java
│   └── GlobalExceptionHandler.java
└── config/
    ├── CropConfig.java
    └── RestClientConfig.java
```

## Database

Create the database once:

```sql
CREATE DATABASE crop_db;
```

Hibernate creates/updates the tables with `spring.jpa.hibernate.ddl-auto=update`.

## Configuration

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.password=YOUR_DB_PASSWORD
crop-service.price-service-url=http://localhost:8083
```

Do not commit real credentials.

## Run

Start Price Service first because crop publishing/update requires the current mandi price.

```bash
mvn spring-boot:run
```

Crop Service runs on port `8082`.

Swagger: `http://localhost:8082/swagger-ui/index.html`

OpenAPI: `http://localhost:8082/v3/api-docs`

## Crop APIs

### Publish

`POST /api/crops`

```json
{
  "farmerId": 101,
  "commodity": "Onion",
  "state": "Tamil Nadu",
  "district": "Erode",
  "grade": "A",
  "quantity": 1000,
  "unit": "KG",
  "pricePerKg": 70,
  "description": "Fresh onion"
}
```

### Update

`PUT /api/crops/{id}`

The current mandi maximum is checked again.

### Get

`GET /api/crops/{id}`

### Farmer crops

`GET /api/crops/farmer/{farmerId}`

### Available search

`GET /api/crops/search?commodity=Onion&state=Tamil%20Nadu&district=Erode&grade=A`

Only `PUBLISHED` and quantity > 0 are returned.

### Purchase quantity reduction

`PATCH /api/crops/{id}/quantity`

```json
{
  "purchasedQuantity": 200
}
```

This endpoint is intended to be called by Order/Deal Service after a purchase is confirmed.

### Delete

`DELETE /api/crops/{id}`

## Subscription APIs

### Subscribe

`POST /api/subscriptions`

```json
{
  "subscriberId": 201,
  "commodity": "Onion",
  "state": "Tamil Nadu",
  "district": "Erode",
  "grade": "A"
}
```

### My subscriptions

`GET /api/subscriptions/subscriber/{subscriberId}`

### Unsubscribe

`DELETE /api/subscriptions/{subscriptionId}?subscriberId=201`

## Business flow

```text
Farmer
  -> Crop Service
  -> Price Service
  -> validate farmer price <= mandi max price
  -> save crop
  -> find matching commodity subscriptions

Dealer
  -> Order/Deal Service
  -> confirmed purchase
  -> Crop Service PATCH quantity
  -> reduce quantity atomically
  -> quantity 0 => SOLD_OUT
  -> sold-out crop disappears from available search
```
