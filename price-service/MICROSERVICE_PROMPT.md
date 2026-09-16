# CropDeal Price Service — Development Prompt

Build and maintain the CropDeal `price-service` microservice using **Java 21 + Spring Boot 4.1.1 + Spring Data JPA + MySQL**.

## 1. Purpose

The service obtains the latest daily mandi prices from the Government of India `data.gov.in` API, stores the daily records in MySQL, converts the source price to ₹/kg using an explicit unit strategy, and exposes only the crop price information required by CropDeal.

## 2. Government source

Dataset: **Current Daily Price of Various Commodities from Various Markets (Mandi)**.

Resource ID: `9ef84268-d588-465a-a308-a864a43d0070`

Base URL: `https://api.data.gov.in`

Published record fields:
- state
- district
- market
- commodity
- variety
- grade
- arrival_date
- min_price
- max_price
- modal_price

The dataset is daily and provides wholesale minimum, maximum and modal prices. The government resource does not expose a unit field in these records. Do not invent a unit field.

## 3. Daily synchronization

- Run synchronization once per day at 02:00 Asia/Kolkata.
- Use pagination.
- Determine the newest `arrival_date` returned by the API.
- Store only records belonging to that newest date.
- Existing records are updated. New records are inserted.
- The identity is state + district + market + commodity + variety + grade + arrival date.
- Government API credentials must come from configuration. Never hard-code secrets.
- Do not expose a manual sync controller; synchronize automatically on startup and daily at 02:00 IST.

## 4. Unit conversion

The API record itself does not provide the unit. Therefore:

1. Look for a configured `commodity + variety` override in `commodity_units`.
2. If an override exists, use its `sourceUnit` and `kgPerUnit`.
3. Otherwise use the configured default DMI standard convention of `Rs./Quintal`, where `1 quintal = 100 kg`.
4. Calculate `pricePerKg = sourcePrice / kgPerUnit`.
5. Never invent a local-market conversion. If a future verified source provides another unit, add it explicitly to `commodity_units`.

## 5. Grade rule — IMPORTANT

CropDeal supports exactly three application grades:

- `A`
- `B`
- `C`

Grade is a **mandatory part of a price lookup**.

Never mix prices between grades.

For example:

- Onion + Erode + Grade A → calculate only from Grade A records.
- Onion + Erode + Grade B → calculate only from Grade B records.
- Onion + Erode + Grade C → calculate only from Grade C records.

Do not assume A is numerically higher than B or C. Use the actual government records for the requested grade.

## 6. Price lookup

The request contains:

- commodity — required
- state — required
- district — optional for fallback support
- grade — required and must be A, B or C

Lookup order:

### Level 1 — District

Search:

`commodity + state + district + grade`

If multiple markets exist in that district for that crop and grade, use the latest arrival date and calculate:

- average of all matching `minPricePerKg` values
- average of all matching `maxPricePerKg` values

### Level 2 — State

If district has no usable data, search:

`commodity + state + grade`

Keep the requested state. The district is returned as `null` because the result represents the state-level fallback.

### No cross-state fallback

Do **not** search all India and do not remove the requested grade. A Grade A request must never return Grade B/C or another state's price merely because the requested district/state has no data.

If there is no usable price at district or state level, return a clear no-price-found error.

## 7. Multiple-market averaging

Example for Onion, Tamil Nadu, Erode, Grade A:

Market 1 → min ₹55/kg, max ₹60/kg
Market 2 → min ₹65/kg, max ₹70/kg
Market 3 → min ₹60/kg, max ₹65/kg

Response:

- min = average(55, 65, 60) = ₹60/kg
- max = average(60, 70, 65) = ₹65/kg

The individual markets must not be returned by the main CropDeal lookup API.

## 8. REST APIs

### Lookup

`POST /api/prices/lookup`

Request:

```json
{
  "commodity": "Onion",
  "state": "Tamil Nadu",
  "district": "Erode",
  "grade": "A"
}
```

Response:

```json
{
  "commodity": "Onion",
  "state": "Tamil Nadu",
  "district": "Erode",
  "grade": "A",
  "priceDate": "2026-09-15",
  "minPricePerKg": 60.0,
  "maxPricePerKg": 65.0
}
```

### All latest crop details

`GET /api/prices/all`

Return latest-day aggregated crop price summaries. Each summary remains separated by commodity + state + district + grade. Never combine Grade A/B/C.

### Automatic synchronization

Government synchronization runs automatically once at application startup and then daily at 02:00 Asia/Kolkata. No manual synchronization endpoint is exposed.
