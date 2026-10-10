# CropDeal Price Service

Java 21 + Spring Boot 4.1.1 microservice for CropDeal mandi prices.

## Business flow

1. Government of India data.gov.in publishes the daily mandi dataset.
2. `GovernmentPriceStartupSync` performs one sync after startup, and `GovernmentPriceScheduler` runs every day at 02:00 IST.
3. The service downloads the dataset from resource `9ef84268-d588-465a-a308-a864a43d0070`.
4. It finds the newest `arrival_date` in the downloaded data.
5. Only that newest daily snapshot is inserted/updated in MySQL.
6. Existing rows are updated using state + district + market + commodity + variety + grade + arrival date.
7. New rows are inserted.
8. Prices are converted to Rs./kg using the unit strategy described below.
9. Crop Service calls `/api/prices/lookup` with commodity, state, district and mandatory grade A, B or C.
10. Lookup tries district first, then state, then state only; there is no cross-state fallback.
11. If multiple markets match the requested area, min and max prices are averaged across the matching markets.

## Government data source

Official dataset:
`Current Daily Price of Various Commodities from Various Markets (Mandi)`

Official resource page:
https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi

Resource ID:
`9ef84268-d588-465a-a308-a864a43d0070`

The government dataset contains state, district, market, commodity, variety, grade, arrival date, min price, max price and modal price. The resource does not expose a unit field in its published API schema.

## Unit strategy

The API response for this resource does not contain a unit column. AGMARKNET documentation states that DMI standard price units are Rs./Quintal or Rs./Number and markets can have local units with conversion formulas.

This project therefore uses a two-level strategy:

### 1. Explicit override

If `commodity_units` contains a matching `commodity + variety`, that rule is used.

Example:

```sql
INSERT INTO commodity_units (commodity, variety, source_unit, kg_per_unit)
VALUES ('Onion', 'Other', 'Rs./Quintal', 100);
```

### 2. Default

If no override exists, the service uses the DMI standard convention `Rs./Quintal` and `1 Quintal = 100 kg`.

So:

`price per kg = price per quintal / 100`

Do not add a fake local conversion. If a particular commodity/variety is known to use a different unit, configure the correct conversion in `commodity_units`.

## Main APIs

### 1. Get crop price

`POST http://localhost:8083/api/prices/lookup`

Request:

```json
{
  "commodity": "Onion",
  "state": "Tamil Nadu",
  "district": "Erode",
  "grade": "A"
}
```

Search order:

```text
commodity + state + district + grade
        ↓ no result
commodity + state + grade
        ↓ no result
commodity + grade
        ↓ no result and grade was supplied
commodity
```

At the selected level, only the newest arrival date is considered.

Example response:

```json
{
  "commodity": "Onion",
  "state": "Tamil Nadu",
  "district": "Erode",
  "grade": "A",
  "priceDate": "2026-09-15",
  "minPricePerKg": 60.20,
  "maxPricePerKg": 65.00
}
```

If district data is unavailable but state data exists, `district` becomes `null` and the response represents the state average.

### 2. Get all latest crop summaries

`GET http://localhost:8083/api/prices/all`

Returns latest-day crop/state/district/grade summaries with only the application-level price information needed by CropDeal.

### 3. Automatic government data synchronization

The service synchronizes the latest government mandi data automatically once after the application is ready and then every day at 02:00 IST. There is no manual `/sync` controller.
