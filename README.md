# 🌾 CropDeal — Enterprise Agricultural Marketplace & Supply Chain Platform

[![Java 21](https://img.shields.io/badge/Java-21%2B-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.13-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring Cloud](https://img.shields.io/badge/Spring_Cloud-2023.0.6-6DB33F?style=for-the-badge&logo=spring&logoColor=white)](https://spring.io/projects/spring-cloud)
[![Angular](https://img.shields.io/badge/Angular-18%2B-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Resilience4j](https://img.shields.io/badge/Resilience4j-Circuit_Breaker_%26_Retry-red?style=for-the-badge)](https://resilience4j.readme.io/)
[![CQRS Architecture](https://img.shields.io/badge/Architecture-CQRS_%26_SAGA-blueviolet?style=for-the-badge)](https://martinfowler.com/bliki/CQRS.html)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 📌 Executive Summary

**CropDeal** is an enterprise-grade, distributed B2B AgriTech e-commerce, live auction bidding, direct price negotiation, and supply chain logistics platform engineered with a **microservices architecture** using **Spring Boot 3.3.13**, **Spring Cloud 2023.0.6**, and an **Angular 18+ Standalone** responsive web client.

The platform eliminates exploitative agricultural middlemen by providing a transparent, direct digital corridor between **Farmers (Producers)**, **Dealers (Commercial Buyers)**, **Logistics & Delivery Partners**, and **Platform Administrators**.

Equipped with **live Government of India Mandi price benchmarks (AGMARKNET / data.gov.in)**, **CQRS (Command Query Responsibility Segregation)** in core catalog and bidding domains, **distributed SAGA transaction orchestration**, **RabbitMQ event-driven messaging**, **Resilience4j circuit breakers & retry mechanisms**, **Spring Boot Actuator metrics**, **Cloudinary cloud media storage**, automated Rule 46 CGST tax invoicing, dual-fulfillment logistics with responsive live tracking, and cryptographic OTP verification via SMTP, CropDeal delivers a robust, secure, and production-ready solution for digital agriculture.

---

## 🏛️ System Architecture & Enterprise Design Patterns

CropDeal adheres to the **Database-per-Service** design pattern, ensuring complete domain autonomy, zero schema coupling, horizontal scalability, and resilience across the entire microservice ecosystem.

```mermaid
flowchart TD
    subgraph Client_Layer [Client Layer]
        UI["Angular 18+ Web Application<br/>(Port 4200)<br/>• Role Dashboards • Glassmorphism UI • Indian Geo-Hierarchy<br/>• Cloudinary Image Uploader • 5-Stage Live Tracking"]
    end

    subgraph Gateway_Discovery [Gateway & Service Discovery Mesh]
        EUREKA["Netflix Eureka Server<br/>(Port 8761)<br/>Service Registry & Heartbeat"]
        CONFIG["Spring Cloud Config Server<br/>(Port 8888)<br/>Centralized Native Config"]
        GATEWAY["Spring Cloud API Gateway<br/>(Port 8080)<br/>Reverse Proxy • JWT Filter • CORS Policy"]
    end

    subgraph Event_Broker [Asynchronous Event Bus & Distributed SAGA]
        RABBIT["RabbitMQ Message Broker<br/>(Port 5672 / Management: 15672)<br/>• order.exchange • order.created • order.status<br/>• Price Alerts • Delivery Milestones • Outbid Signals"]
        SAGA["SAGA Orchestrator (order-service)<br/>• Distributed Transaction Coordinator<br/>• Inventory Locks • Payment Holds • Compensating Rollbacks"]
    end

    subgraph Cloud_Media [Cloud Media Infrastructure]
        CLOUDINARY["Cloudinary Media Cloud & CDN<br/>• Free Cloud Image Hosting<br/>• Auto-Transformations • Global CDN Delivery"]
    end

    subgraph Core_Microservices [Domain Microservices Cluster (with Actuator & Resilience4j)]
        AUTH["auth-service (8081)<br/>JWT • BCrypt • SMTP OTP Verification"]
        USER["user-service (8082)<br/>Profiles • KYC • Bank Settlement • Moderation"]
        CROP["crop-service [CQRS] (8083)<br/>Cloudinary Uploader • Produce Catalog"]
        PRICE["price-service (8084)<br/>37,800+ APMC Mandi Records • AGMARKNET"]
        NEG["negotiation-service (8085)<br/>Direct Price Bargaining Engine"]
        BID["bidding-service [CQRS] (8086)<br/>Auction Floor • Cloudinary Upload • Auto-Expiry"]
        WALLET["wallet-service (8087)<br/>Optimistic Lock Escrow Wallet"]
        ORDER["order-service (8088)<br/>SAGA Orchestrator • Resilience4j Circuit Breakers"]
        PAY["payment-service (8089)<br/>Payment Capture & Audit Stamps"]
        INV["invoice-service (8090)<br/>OpenPDF Rule 46 CGST Tax Invoicing"]
        DEL["deliveryservice (8091)<br/>Global Delivery Pool & Milestone Logistics"]
        NOTIF["notification-service (8092)<br/>Event-Driven In-App Alerts"]
        ALERT["price-alert-service (8094)<br/>Target Price Subscriptions"]
        REPORT["report-service (8095)<br/>Platform Analytics & Metrics"]
        CHAT["chatbot-service (8096)<br/>Sarvam AI Agricultural LLM"]
    end

    subgraph External_Integrations [External Data Providers, AI & Mail]
        DATA_GOV["Govt. of India Mandi API<br/>(AGMARKNET / data.gov.in)"]
        SARVAM["Sarvam AI Agricultural LLM"]
        SMTP["Gmail SMTP Server<br/>(Real Email OTP Delivery)"]
    end

    UI -->|REST / JSON / Multipart| GATEWAY
    GATEWAY --> EUREKA
    Core_Microservices --> EUREKA
    GATEWAY --> Core_Microservices

    CROP -->|Upload & Stream Crop Photos| CLOUDINARY
    BID -->|Upload & Stream Auction Photos| CLOUDINARY
    PRICE -->|Fetch Mandi Benchmarks| DATA_GOV
    CHAT -->|Natural Language Advisory| SARVAM
    AUTH -->|Send One-Time Passwords| SMTP

    ORDER -->|Publish Order Events| RABBIT
    ORDER --> SAGA
    SAGA -.->|Coordinate & Compensate| CROP
    SAGA -.->|Coordinate & Compensate| WALLET
    SAGA -.->|Coordinate & Compensate| PAY
    DEL -.->|Publish Status Events| RABBIT
    ALERT -.->|Publish Alert Events| RABBIT

    RABBIT --> NOTIF
    RABBIT --> ALERT
```

---

### 🧠 Core Architectural Pillars

#### 1. Command Query Responsibility Segregation (CQRS)
To handle high transactional throughput and guarantee fast read responsiveness, CropDeal implements the CQRS pattern across critical domains:
- **`crop-service`**:
  - **`CropCommandService`**: Handles write-intensive operations: publishing new crop lots with Cloudinary image upload, validating prices against AGMARKNET mandi rates, updating listings, deducting inventory, and managing soft-delete lifecycles.
  - **`CropQueryService`**: Optimized read models providing high-performance filtering across commodities, Indian states, districts, varieties, and organic tags.
- **`bidding-service`**:
  - **`BiddingCommandService`**: State-mutating auction operations: time-boxed auction initialization with Cloudinary crop imagery, real-time bid validation with minimum increment checks, Feign-based escrow balance reservations, and automatic funds release for outbid dealers.
  - **`BiddingQueryService`**: High-performance auction views with real-time highest bid valuation and auto-expiry filtering (`endTime <= now`).

#### 2. Distributed SAGA Pattern (`OrderSagaOrchestrator`)
The order workflow involves multiple autonomous microservices (`order-service`, `crop-service`, `wallet-service`, and `payment-service`). Rather than relying on rigid two-phase commits (2PC), CropDeal implements an **Orchestration-based SAGA**:
1. **Order Initiation**: Order is created with status `PENDING`.
2. **Inventory Lock**: `crop-service` attempts to verify and deduct the required harvest quantity.
3. **Escrow / Payment Reservation**: `wallet-service` locks buyer funds in escrow or validates payment token.
4. **Order Confirmation**: Upon successful execution of all steps, order transitions to `CONFIRMED` and triggers delivery allocation.
5. **Compensating Rollbacks**: If inventory deduction or payment fails at any point, the orchestrator triggers compensating actions (releases reserved funds, restores inventory stock) and transitions the order to `FAILED` or `CANCELLED`.

#### 3. Resilience4j: Circuit Breakers & Retry Mechanisms
Inter-service HTTP communications via Spring Cloud OpenFeign are protected using **Resilience4j**:
- **Circuit Breakers (`@CircuitBreaker`)**: Monitor downstream service calls (e.g., `order-service` calling `crop-service` or `wallet-service`). When failure rates exceed the configured threshold, the circuit transitions from `CLOSED` to `OPEN`, immediately redirecting traffic to designated fallback handlers without cascading service failures.
- **Retry Mechanisms (`@Retry`)**: Automatically re-attempts transient network and timeout exceptions using exponential backoff before triggering circuit breaker failure limits.

#### 4. Asynchronous Event-Driven Messaging (RabbitMQ)
- **Exchange**: `order.exchange` (Topic Exchange).
- **Queues**: `order.created.queue`, `order.status.queue`, `inventory.deduct.queue`, `notification.queue`.
- **Decoupling**: State changes in orders, auction outbids, price threshold crossings, and delivery progress publish asynchronous events consumed by `notification-service` and `price-alert-service`.

#### 5. Spring Boot Actuator Observability
Every microservice includes Spring Boot Actuator:
- **Health Probes**: `/actuator/health` for Eureka heartbeats, Docker readiness/liveness checks, and database connection validation.
- **Metrics**: `/actuator/metrics` for JVM memory consumption, garbage collection, and HTTP request throughput.
- **Info**: `/actuator/info` for service metadata and build versioning.

#### 6. Cloudinary Cloud Media Infrastructure
- **Free Cloud Storage & CDN**: Integrates Cloudinary API for cloud-hosted images of crops and bidding items.
- **Direct Upload from Machine**: Farmers and dealers can select any image file directly from their local machine when posting crops or auctions.
- **Automatic Optimizations**: Images are uploaded to Cloudinary, transformed into optimized web formats, and served through global CDN URLs (`https://res.cloudinary.com/...`).
- **Resilient Fallback**: If no custom image is selected, the system seamlessly applies high-resolution standardized produce imagery from the curated agricultural library.

---

## 🧩 Microservices Topology & Database Schemas

The platform operates **17 Spring Boot microservices** backed by **15 dedicated MySQL database schemas**, enforcing complete separation of concerns:

| Microservice | Port | Database Schema | Key Features & Responsibilities |
|---|:---:|---|---|
| **`eureka-server`** | `8761` | — | Dynamic service registration, health heartbeats, and cluster discovery. |
| **`config-server`** | `8888` | — | Centralized native configuration management across all microservices. |
| **`api-gateway`** | `8080` | — | Spring Cloud Gateway, JWT authentication filter, CORS handler, reverse proxy routing. |
| **`auth-service`** | `8081` | `cropdeal_auth_db` | User authentication, BCrypt password hashing, JWT token generation, SMTP email OTP dispatch. |
| **`user-service`** | `8082` | `cropdeal_user_db` | Farmer/Dealer profiles, KYC verification, bank settlement accounts, admin user moderation & blocking. |
| **`crop-service`** | `8083` | `cropdeal_crop_db` | **CQRS** catalog engine, **Cloudinary** media upload, mandi benchmark validation, inventory tracking. |
| **`price-service`** | `8084` | `cropdeal_price_db` | **37,800+ AGMARKNET Mandi Price records**, multi-page sync, benchmark median calculations. |
| **`negotiation-service`** | `8085` | `cropdeal_negotiation_db` | Direct buyer-seller bargaining engine, discount ceiling validations, counter-offers. |
| **`bidding-service`** | `8086` | `cropdeal_bidding_db` | **CQRS** live auction floor, **Cloudinary** media upload, dynamic highest bid engine, escrow synchronization, auto-expiry. |
| **`wallet-service`** | `8087` | `cropdeal_wallet_db` | Digital wallet, `@Version` optimistic locking, credit/debit/escrow balance holds. |
| **`order-service`** | `8088` | `cropdeal_order_db` | **SAGA Orchestrator**, **RabbitMQ** event publishing, **Resilience4j** circuit breakers & retry, purchase orders. |
| **`payment-service`** | `8089` | `cropdeal_payment_db` | Payment processing, transaction audit stamps (`paid_at`), gateway webhooks. |
| **`invoice-service`** | `8090` | `cropdeal_invoice_db` | Rule 46 CGST tax invoicing, HSN itemization, OpenPDF on-the-fly streaming. |
| **`deliveryservice`** | `8091` | `cropdeal_delivery_db` | Global Delivery Pool, logistics claiming, milestone progression, timestamp audits. |
| **`notification-service`** | `8092` | `cropdeal_notification_db` | RabbitMQ event consumer, role-scoped notification dispatching. |
| **`price-alert-service`** | `8094` | `cropdeal_price_alert_db` | Target price alert subscriptions, automated login price checks, deduplication. |
| **`report-service`** | `8095` | `cropdeal_report_db` | Aggregated platform turnover, sales volume metrics, commission tracking. |
| **`chatbot-service`** | `8096` | `cropdeal_chatbot_db` | Sarvam AI LLM-powered conversational agricultural advisor. |
| **`cropdeal-ui`** | `4200` | Browser Storage | Angular 18+ standalone client, glassmorphic UI, role-tailored dashboards. |

---

## 🚀 Key Business Capabilities & Engineering Highlights

### 1. ☁️ Cloudinary Cloud Media Storage
- Farmers and Dealers can upload custom images from their local machine when posting crops or creating bidding auctions.
- Supported file types: JPG, PNG, WEBP, GIF.
- Backend services upload files to Cloudinary cloud infrastructure and store permanent, secure CDN URLs in the database.
- Included sample image library of **77 authentic crop photos** located in the `images/` directory for immediate testing and production use.

### 2. ⚡ SAGA Pattern & Resilience4j
- **Distributed Transactions**: Managed via `OrderSagaOrchestrator` ensuring atomic multi-service order completion across `order-service`, `crop-service`, and `wallet-service`.
- **Fault-Tolerant Microservices**: Configured with Resilience4j circuit breakers and exponential backoff retry mechanisms to prevent cascading outages during high-load periods.
- **Actuator Health & Observability**: Real-time health monitoring and metric exposition enabled on all microservices.

### 3. 🇮🇳 Comprehensive Indian Agricultural Geography (36 States & UTs with Real Districts)
- **Hierarchy Utility (`india-locations.util.ts`)**: Embedded comprehensive mapping for all 28 Indian States and 8 Union Territories with official district lists.
- **Dynamic Cascading Search**: Selecting a State (e.g., *Tamil Nadu*) dynamically scopes the District dropdown strictly to that state's 38 official districts (*Chennai, Coimbatore, Madurai, Erode, etc.*).
- **Location-Specific Produce Query**: Filtering crops on the Home or Mandi Price portal filters crops strictly by the chosen State and District.

### 4. 📧 Secure Real Email OTP Verification (SMTP Integration)
- **Production Email Delivery**: Password resets and user verifications trigger genuine 6-digit numeric OTPs dispatched via `JavaMailSender` configured with Google App Password authentication.
- **Zero Mock Bypass**: Hardcoded bypass values (such as `123456`) are strictly disabled; verification succeeds only when the code matches the cryptographic token generated in the database.

### 5. 🧼 Clean, Professional Form Design
- **Empty Initial Form State**: Login, Register, Forgot Password, Reset Password, and Listing forms initialize completely empty with descriptive placeholder text.
- **Zero Ghost Data**: No pre-filled dummy credentials or pre-selected values interfere with user input.

### 6. 🚚 Responsive 5-Stage Live Delivery Tracking Modal
- **5-Stage Interactive Milestone Stepper**:
  $$\text{Placed} \longrightarrow \text{Assigned} \longrightarrow \text{Picked Up} \longrightarrow \text{In Transit} \longrightarrow \text{Delivered}$$
- **Features**: Waybill badge, one-click copy button, real-time milestone ETA, Carrier Fleet card with direct driver phone link, Farm Origin &rarr; Warehouse Drop route card, and async live refresh.

### 7. ⏱️ Active Bidding Window & Auto-Expiry Floor
- Time-bounded auction lots with real-time highest bid resolution.
- Auctions whose timer has expired (`endTime <= now`) are automatically excluded from the active bidding floor.
- Outbid dealers receive automatic instant escrow balance refunds in `wallet-service`.

### 8. 📄 Rule 46 CGST Tax Invoicing
- Automated PDF tax invoice streaming featuring itemized HSN codes, CGST (2.5%), SGST (2.5%), verified dealer GSTIN, and unique invoice serials (`CD-INV-2026-XXXX`).

---

## 🔑 Pre-Seeded Professional Demo Accounts

The database is initialized with **4 clean professional accounts** across all platform personas:

| Persona | Email / Username | Password | Database User ID | Access Role |
| :--- | :--- | :--- | :---: | :--- |
| **🌾 Farmer** | `farmer@gmail.com` | `pass-farmer124` | `1` | `ROLE_FARMER` |
| **💼 Dealer** | `dealer@gmail.com` | `pass-dealer124` | `2` | `ROLE_DEALER` |
| **🚚 Delivery Partner** | `delivery@gmail.com` | `pass-delivery124` | `3` | `ROLE_DELIVERY_PARTNER` |
| **🛡️ Administrator** | `admin@gmail.com` | `pass-admin124` | `4` | `ROLE_ADMIN` |

> [!TIP]
> On the login page, you can use the **Quick Demo Login chips** to autofill and authenticate into any of the 4 roles with a single click.

---

## ⚡ Quick Start & Execution Guide

### 📋 Prerequisites
- **Java 21 (LTS)** (Eclipse Adoptium / OpenJDK)
- **Node.js 18+ or 20+** and **npm**
- **MySQL 8.0** running on `localhost:3306` (Credentials: `naresh` / `vnaresh2004` or configured via `application.properties`)
- **RabbitMQ 3.13+** running on `localhost:5672` (Management on `15672`)
- **Cloudinary Account** (Credentials pre-configured in `application.properties`)

---

### Step 1: Database Initialization
If configuring MySQL for the first time, run [`init.sql`](init.sql) in MySQL CLI or Workbench:
```sql
SOURCE D:/cropdealnaresh/init.sql;
```

---

### Step 2: Build All Microservices
Compile and package all microservices into production JARs using the included Maven wrapper:
```powershell
# In PowerShell (Windows)
.\mvnw.cmd clean package -DskipTests
```
*(On Linux/macOS: `./mvnw clean package -DskipTests`)*

---

### Step 3: Launch the Platform

#### Option A: Background Master Daemon (Recommended for Development)
Launches Eureka, Config Server, all 15 microservices, API Gateway, and the Angular UI with optimized JVM memory footprints (`-Xms32m -Xmx130m`):
```powershell
powershell.exe -ExecutionPolicy Bypass -File .\run-all-services.ps1
```
All service logs are piped cleanly into `D:\cropdealnaresh\logs\`.

#### Option B: Multi-Window Console Launcher
Launches all microservices in separate titled Command Prompt windows:
```powershell
.\start-all.ps1
```
*(Or double-click `start-all.bat` from File Explorer).*

#### Option C: Manual Startup Sequence
If launching services individually, adhere to this initialization order:
1. **Service Discovery**:
   ```powershell
   cd eureka-server; java -jar target\eureka-server-1.0.0.jar
   ```
2. **Configuration Server**:
   ```powershell
   cd config-server; java -jar target\config-server-1.0.0.jar
   ```
3. **Core Domain Services** (Ports 8081–8096):
   `auth-service`, `user-sevice`, `crop-service`, `price-service`, `negotiation-service`, `bidding-service`, `wallet-service`, `order-service`, `payment-service`, `invoice-service`, `deliveryservice`, `notification-service`, `price-alert-service`, `report-service`, `chatbot-service`.
4. **API Gateway**:
   ```powershell
   cd api-gateway; java -jar target\api-gateway-1.0.0.jar
   ```
5. **Angular UI Client**:
   ```powershell
   cd cropdeal-ui; npm start
   ```

---

### Step 4: Access Endpoints & Dashboards

- **Frontend Application**: [http://localhost:4200](http://localhost:4200)
- **API Gateway**: [http://localhost:8080](http://localhost:8080)
- **Eureka Service Registry**: [http://localhost:8761](http://localhost:8761)
- **Swagger / OpenAPI Documentation**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **RabbitMQ Management Dashboard**: [http://localhost:15672](http://localhost:15672) *(guest / guest)*

---

### Step 5: Graceful Shutdown
To terminate all running Java microservices, Node processes, and free all associated ports:
```powershell
powershell.exe -ExecutionPolicy Bypass -File .\stop-all.ps1
```
*(Or double-click `stop-all.bat`).*

---

## 📖 Swagger / OpenAPI Interactive Documentation Directory

Every microservice exposes OpenAPI 3 documentation with interactive Swagger UI endpoints:

- **API Gateway (Unified Docs)**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **Auth Service**: [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)
- **User Service**: [http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html)
- **Crop Service**: [http://localhost:8083/swagger-ui.html](http://localhost:8083/swagger-ui.html)
- **Price Service**: [http://localhost:8084/swagger-ui.html](http://localhost:8084/swagger-ui.html)
- **Negotiation Service**: [http://localhost:8085/swagger-ui.html](http://localhost:8085/swagger-ui.html)
- **Bidding Service**: [http://localhost:8086/swagger-ui.html](http://localhost:8086/swagger-ui.html)
- **Wallet Service**: [http://localhost:8087/swagger-ui.html](http://localhost:8087/swagger-ui.html)
- **Order Service**: [http://localhost:8088/swagger-ui.html](http://localhost:8088/swagger-ui.html)
- **Payment Service**: [http://localhost:8089/swagger-ui.html](http://localhost:8089/swagger-ui.html)
- **Invoice Service**: [http://localhost:8090/swagger-ui.html](http://localhost:8090/swagger-ui.html)
- **Delivery Service**: [http://localhost:8091/swagger-ui.html](http://localhost:8091/swagger-ui.html)
- **Notification Service**: [http://localhost:8092/swagger-ui.html](http://localhost:8092/swagger-ui.html)
- **Price Alert Service**: [http://localhost:8094/swagger-ui.html](http://localhost:8094/swagger-ui.html)
- **Report Service**: [http://localhost:8095/swagger-ui.html](http://localhost:8095/swagger-ui.html)
- **Chatbot Service**: [http://localhost:8096/swagger-ui.html](http://localhost:8096/swagger-ui.html)

---

## 🧪 Postman Automated Test Suite

An automated Postman collection [`CropDeal.postman_collection.json`](CropDeal.postman_collection.json) is included in the project root containing **39+ test scenarios** covering:
- Authentication & JWT validation across all 4 personas
- Mandi benchmark lookups and crop listing creation with Cloudinary uploads
- Direct price bargaining proposals and counter-offers
- Bidding lot creation, bids placement, and escrow balance holds
- Dual-fulfillment flows (Self-Pickup vs. Global Delivery Pool)
- SAGA order placement with inventory lock & compensating transactions
- Rule 46 CGST Tax invoice generation and PDF downloads
- Post-delivery rating submissions and admin moderation actions

---

## 📂 Repository Directory Layout

```plaintext
cropdealnaresh/
├── api-gateway/               # Spring Cloud API Gateway (Port 8080)
├── auth-service/              # JWT & BCrypt Authentication Service (Port 8081)
├── bidding-service/           # CQRS Live Crop Auction & Bidding Floor (Port 8086)
├── chatbot-service/           # Sarvam AI Agricultural LLM Assistant (Port 8096)
├── config-server/             # Centralized Spring Cloud Config Server (Port 8888)
├── crop-service/              # CQRS Crop Catalog & Inventory Management (Port 8083)
├── cropdeal-ui/               # Angular 18+ Standalone Web Client (Port 4200)
├── deliveryservice/           # Global Delivery Pool & Milestone Logistics (Port 8091)
├── eureka-server/             # Netflix Eureka Service Discovery (Port 8761)
├── images/                    # 77 Authentic Indian Agricultural Crop & Produce Photos
├── invoice-service/           # OpenPDF Rule 46 CGST Tax Invoicing (Port 8090)
├── negotiation-service/       # Direct Price Bargaining Engine (Port 8085)
├── notification-service/      # RabbitMQ Event-Driven Notifications (Port 8092)
├── order-service/             # SAGA Orchestrator, RabbitMQ & Resilience4j (Port 8088)
├── payment-service/           # Payment Processing & Gateway Webhooks (Port 8089)
├── price-alert-service/       # Price Subscriptions & Real-Time Matching (Port 8094)
├── price-service/             # 37,800+ AGMARKNET Mandi Price Benchmarks (Port 8084)
├── report-service/            # Platform Analytics & Commission Reports (Port 8095)
├── user-sevice/               # User Profiles, Reviews & Admin Moderation (Port 8082)
├── wallet-service/            # Escrow Wallet with Optimistic Locking (Port 8087)
├── CropDeal.postman_collection.json # Automated 39+ request test suite
├── docker-compose.yml         # Containerized cluster orchestration
├── init.sql                   # MySQL 15-database schema initialization
├── pom.xml                    # Root Maven multi-module parent POM
├── run-all-services.ps1       # Master background daemon launcher
├── start-all.ps1              # Multi-window startup launcher
├── start-all.bat              # Windows batch launcher
├── stop-all.ps1               # Master shutdown script
├── stop-all.bat               # Windows batch shutdown script
└── README.md                  # Comprehensive platform documentation
```

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<p align="center">
  <b>Built with ❤️ for Indian Farmers, Wholesale Buyers, and the AgriTech Ecosystem.</b>
</p>
