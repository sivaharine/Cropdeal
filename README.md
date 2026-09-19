# 🌾 CropDeal – Agricultural Marketplace Microservices Platform

> **CropDeal** is a Spring Boot and Spring Cloud based **microservices marketplace platform** that connects **farmers, dealers, delivery partners, and administrators** in a single digital ecosystem.

The platform manages the complete agricultural commerce lifecycle — from **farmer registration and crop listing to bidding, negotiation, ordering, payment, delivery, invoice generation, notifications, and reviews**.

It also includes **JWT-based security, service discovery, centralized configuration, API Gateway, RabbitMQ messaging, Resilience4j fault tolerance, Docker containerization, and an AI-powered chatbot**.

---

## 📌 Table of Contents

* [About the Project](#-about-the-project)
* [Key Features](#-key-features)
* [System Architecture](#-system-architecture)
* [Microservices](#-microservices)
* [Business Workflow](#-business-workflow)
* [Technology Stack](#-technology-stack)
* [Communication Between Services](#-communication-between-services)
* [Security](#-security)
* [Database Architecture](#-database-architecture)
* [Project Structure](#-project-structure)
* [API Overview](#-api-overview)
* [Getting Started](#-getting-started)
* [Docker Setup](#-docker-setup)
* [Testing with Postman](#-testing-with-postman)
* [Monitoring](#-monitoring)
* [Environment Variables](#-environment-variables)
* [Important Docker Commands](#-important-docker-commands)
* [Future Enhancements](#-future-enhancements)
* [Contributors](#-contributors)

---

# 🌱 About the Project

CropDeal is designed to solve common problems in the agricultural supply chain by providing a centralized platform where:

### 👨‍🌾 Farmers can

* Register and manage their profiles
* List crops for sale
* Manage crop quantities
* Search market prices
* Create bidding sessions
* Negotiate with dealers
* Track orders
* Receive payments
* Manage deliveries
* View reviews

### 🏪 Dealers can

* Register and manage profiles
* Search available crops
* Place bids
* Negotiate prices with farmers
* Purchase crops
* Make payments
* Track orders
* Review farmers and crops

### 🚚 Delivery Partners can

* View available deliveries
* Accept delivery assignments
* Update delivery status
* Manage availability
* Verify delivery using OTP
* Track delivery operations

### 👨‍💼 Administrators can

* Manage users
* Manage crops
* Manage orders
* Monitor payments
* View analytics
* Generate reports
* View audit information
* Manage platform operations

---

# 🚀 Key Features

| Feature                  | Description                                        |
| ------------------------ | -------------------------------------------------- |
| 🔐 Authentication        | JWT-based registration and login                   |
| 👥 User Management       | Farmer, Dealer and Delivery Partner management     |
| 🌾 Crop Management       | Create, update, search and manage crops            |
| 💰 Market Prices         | Market/mandi price information and alerts          |
| 🏆 Bidding               | Dealers can participate in crop bidding            |
| 🤝 Negotiation           | Farmers and dealers can negotiate prices           |
| 🛒 Orders                | Complete order lifecycle management                |
| 💳 Payments              | Payments, refunds and wallet operations            |
| 🚚 Delivery              | Delivery assignment, tracking and OTP verification |
| 🔔 Notifications         | Application and delivery notifications             |
| 🧾 Invoices              | Invoice generation and PDF download                |
| ⭐ Reviews                | Reviews for farmers, dealers, crops and orders     |
| 📊 Admin Dashboard       | Management, analytics and reports                  |
| 🤖 AI Chatbot            | AI-powered CropDeal assistance                     |
| ⚡ Resilience             | Circuit breaker and retry mechanisms               |
| 🐇 Messaging             | RabbitMQ asynchronous communication                |
| 🔎 Service Discovery     | Eureka-based service registration                  |
| ⚙️ Central Configuration | Spring Cloud Config                                |
| 🌐 API Gateway           | Centralized request routing                        |
| 🐳 Docker                | Containerized deployment                           |

---

# 🏗️ System Architecture

```text
                         ┌─────────────────────┐
                         │       Client        │
                         │ Postman / Frontend  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    API Gateway      │
                         │       :8080         │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
       │    Eureka    │     │ Config Server│     │  RabbitMQ    │
       │    :8761     │     │    :8888     │     │    :5672     │
       └──────────────┘     └──────────────┘     └──────┬───────┘
                                                        │
                                                        ▼
              ┌─────────────────────────────────────────────────┐
              │              CropDeal Services                  │
              │                                                 │
              │ Auth │ User │ Crop │ Price │ Order │ Payment   │
              │ Delivery │ Bidding │ Negotiation │ Review      │
              │ Invoice │ Notification │ Admin │ Chatbot       │
              └──────────────────────┬──────────────────────────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │    MySQL    │
                              │  Databases  │
                              └─────────────┘
```

---

# 🧩 Microservices

## Infrastructure Services

| Service           |   Port | Responsibility                              |
| ----------------- | -----: | ------------------------------------------- |
| **Eureka Server** | `8761` | Service discovery                           |
| **Config Server** | `8888` | Centralized configuration                   |
| **API Gateway**   | `8080` | Request routing and centralized entry point |

## Business Services

| Service                    |   Port | Responsibility                                 |
| -------------------------- | -----: | ---------------------------------------------- |
| **Auth Service**           | `8081` | Registration, login, JWT authentication        |
| **User Service**           | `8082` | Farmer, dealer and delivery partner management |
| **Price Service**          | `8083` | Market prices and price alerts                 |
| **Order Service**          | `8085` | Order creation and lifecycle                   |
| **Payment Service**        | `8086` | Payments, refunds and wallet                   |
| **Crop Service**           | `8087` | Crop listing and management                    |
| **Chatbot Service**        | `8088` | AI-powered CropDeal assistant                  |
| **Invoice Service**        | `8089` | Invoice generation and PDF                     |
| **Delivery Service**       | `8090` | Delivery assignment and tracking               |
| **Negotiation Service**    | `8091` | Farmer/dealer negotiation                      |
| **Admin & Report Service** | `8092` | Administration, analytics and reports          |
| **Notification Service**   | `8093` | Notifications and delivery messages            |
| **Review Service**         | `8094` | Reviews and ratings                            |
| **Bidding Service**        | `8095` | Bidding sessions and bids                      |

---

# 🔄 Business Workflow

The major CropDeal transaction follows this flow:

```text
                 Farmer
                   │
                   ▼
             Register / Login
                   │
                   ▼
            Authentication
                   │
                   ▼
              Create Crop
                   │
                   ▼
          Crop becomes available
                   │
          ┌────────┴────────┐
          ▼                 ▼
       Bidding          Negotiation
          │                 │
          └────────┬────────┘
                   ▼
             Create Order
                   │
                   ▼
              Payment
                   │
                   ▼
        Delivery Assignment
                   │
                   ▼
           Delivery Partner
                   │
                   ▼
             OTP Verification
                   │
                   ▼
          Delivery Completed
                   │
          ┌────────┴────────┐
          ▼                 ▼
       Invoice          Notification
          │                 │
          └────────┬────────┘
                   ▼
                 Review
```

---

# 🔐 Authentication Flow

CropDeal uses **Spring Security + JWT** for authentication.

```text
User
 │
 ▼
Login
 │
 ▼
Auth Service
 │
 ├── Validate credentials
 │
 └── Generate JWT
        │
        ▼
     Client
        │
        │ Authorization: Bearer <token>
        ▼
   API Gateway
        │
        ▼
 Protected Microservice
        │
        ▼
 JWT Validation
        │
        ▼
 Authorized Request
```

### Supported roles

```text
FARMER
DEALER
DELIVERY_PARTNER
ADMIN
```

---

# 💬 Communication Between Services

CropDeal uses both **synchronous** and **asynchronous** communication.

## OpenFeign – Synchronous Communication

OpenFeign is used when a service requires an immediate response from another service.

Example:

```text
Order Service
      │
      │ OpenFeign
      ▼
Payment Service
      │
      ▼
Response
```

---

## RabbitMQ – Asynchronous Communication

RabbitMQ is used for event-driven communication.

Example:

```text
Order Service
      │
      │ Publish Event
      ▼
   RabbitMQ
      │
      ├──────────────► Notification Service
      │
      └──────────────► Other Consumers
```

This reduces direct coupling between services.

---

# ⚡ Resilience and Fault Tolerance

CropDeal uses **Resilience4j** to improve reliability.

### Circuit Breaker

```text
Service Available
       │
       ▼
Requests Allowed
       │
       ▼
Service Failures
       │
       ▼
Circuit Opens
       │
       ▼
Requests Temporarily Blocked
       │
       ▼
Recovery Check
       │
       ▼
Circuit Closes
```

### Retry

Temporary failures can be retried automatically.

This helps prevent failures in one service from unnecessarily affecting the complete application.

---

# 💾 Database Architecture

CropDeal follows the **Database-per-Service** approach.

Each major business service maintains its own database.

```text
                    MySQL
                      │
       ┌──────────────┼──────────────┐
       │              │              │
       ▼              ▼              ▼
 auth_db         user_db        crop_db
       │              │              │
       ▼              ▼              ▼
 order_db       payment_db     delivery_db
       │              │              │
       ▼              ▼              ▼
 bidding_db   negotiation_db   review_db
       │              │              │
       └──────────────┼──────────────┘
                      ▼
              Other Service DBs
```

Example databases:

```text
cropdeal_auth_db
cropdeal_user_db
cropdeal_marketprice
cropdeal_crop_db
cropdeal_order_db
cropdeal_payment_db
cropdeal_delivery_db
crop_negotiation_db
cropdeal_invoice_db
cropdeal_notification
cropdeal_admin_db
cropdeal_review_db
cropdeal_bidding_db
```

---

# ⚙️ Centralized Configuration

The project uses **Spring Cloud Config Server**.

```text
Config Server
     │
     ├── auth-service.properties
     ├── user-service.properties
     ├── crop-service.properties
     ├── order-service.properties
     ├── payment-service.properties
     ├── delivery-service.properties
     └── ...
```

Config Server:

```text
http://localhost:8888
```

This allows service configurations to be managed centrally.

---

# 🔎 Service Discovery

CropDeal uses **Netflix Eureka**.

Eureka Server:

```text
http://localhost:8761
```

Services register themselves with Eureka:

```text
Auth Service
User Service
Crop Service
Order Service
Payment Service
Delivery Service
...
        │
        ▼
   Eureka Server
```

The API Gateway can then route requests using service names:

```text
lb://auth-service
lb://user-service
lb://crop-service
lb://order-service
```

---

# 🌐 API Gateway

All client requests can be routed through:

```text
http://localhost:8080
```

Example gateway routes:

```text
/api/auth/**               → Auth Service
/api/farmers/**            → User Service
/api/dealers/**            → User Service
/api/crops/**              → Crop Service
/api/prices/**             → Price Service
/api/orders/**             → Order Service
/api/payments/**           → Payment Service
/api/deliveries/**         → Delivery Service
/api/negotiations/**       → Negotiation Service
/api/bidding/**            → Bidding Service
/api/notifications/**      → Notification Service
/api/invoices/**           → Invoice Service
/api/reviews/**            → Review Service
/api/admin/**              → Admin Service
/api/chat/**               → Chatbot Service
```

---

# 🤖 AI Chatbot

CropDeal includes an AI-powered chatbot using the **Sarvam AI REST API**.

The chatbot can assist users with:

* Crop information
* Crop availability
* Market prices
* Order information
* Payment information
* Delivery tracking
* Profile-related assistance
* General CropDeal guidance

Example:

```http
POST /api/chat
```

Request:

```json
{
  "sessionId": "session-001",
  "message": "Show available tomato crops"
}
```

---

# 🧾 Invoice Management

The Invoice Service manages invoice generation.

Features:

* Create invoice
* Search invoice
* Find invoice by order
* List invoices
* Update invoice
* Delete invoice
* Generate invoice PDF

PDF generation is implemented using **OpenPDF**.

---

# ⭐ Review System

The Review Service supports reviews for:

* Farmers
* Dealers
* Crops
* Orders

Example operations:

```text
Create Review
      ↓
View Review
      ↓
Update Review
      ↓
Delete Review
```

---

# 📊 Admin Dashboard & Reports

The Admin/Report Service provides administrative operations.

### User Management

```text
View Farmers
View Dealers
View Delivery Partners
Update User Status
```

### Crop Management

```text
View Crops
Delete Crops
```

### Order Management

```text
View Orders
View Order Details
Update Order Status
```

### Payment Management

```text
View Payments
View Payment Details
```

### Reports

```text
Farmer Reports
Dealer Reports
Crop Reports
Order Reports
Payment Reports
CSV Reports
```

---

# 🛠️ Technology Stack

| Category          | Technology                  |
| ----------------- | --------------------------- |
| Language          | Java 21                     |
| Framework         | Spring Boot 3.5.4           |
| Cloud             | Spring Cloud 2025.0.0       |
| Security          | Spring Security + JWT       |
| Database          | MySQL 8                     |
| ORM               | Spring Data JPA / Hibernate |
| Service Discovery | Netflix Eureka              |
| API Gateway       | Spring Cloud Gateway        |
| Configuration     | Spring Cloud Config         |
| Communication     | OpenFeign                   |
| Messaging         | RabbitMQ                    |
| Fault Tolerance   | Resilience4j                |
| API Documentation | Springdoc OpenAPI / Swagger |
| Monitoring        | Spring Boot Actuator        |
| Email             | Spring Mail                 |
| PDF               | OpenPDF                     |
| AI                | Sarvam AI                   |
| Build Tool        | Maven                       |
| Containerization  | Docker                      |
| Orchestration     | Docker Compose              |
| API Testing       | Postman                     |

---

# 📁 Project Structure

```text
CropDeal_Team-main/
│
├── api-gateway/
│
├── auth-service/
├── user-service/
├── price-service/
├── crop-service/
├── order-service/
├── payment-service/
├── delivery-service/
├── negotiation-service/
├── bidding-service/
├── notification-service/
├── invoice-service/
├── review-service/
├── chatbot-service/
├── admin-dashboard-report-service/
│
├── config-server/
├── eureka-server/
│
├── init_databases.sql
├── docker-compose.yml
├── CropDeal_Postman_Collection.json
├── pom.xml
└── README.md
```

Typical service structure:

```text
src/main/java/
└── com.cropdeal.<service>/
    │
    ├── controller/
    ├── service/
    ├── repository/
    ├── entity/
    ├── dto/
    ├── exception/
    ├── config/
    ├── security/
    └── client/
```

---

# 📡 API Overview

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

## Crops

```http
POST   /api/crops
GET    /api/crops/{id}
GET    /api/crops/search
GET    /api/crops/nearby
PUT    /api/crops/{id}
DELETE /api/crops/{id}
```

## Orders

```http
POST   /api/orders
GET    /api/orders
GET    /api/orders/{id}
PUT    /api/orders/{id}/status
PUT    /api/orders/{id}/pay
DELETE /api/orders/{id}
```

## Payments

```http
POST /api/payments
GET  /api/payments/{id}
GET  /api/payments/order/{orderId}
POST /api/payments/order/{orderId}/refund
POST /api/payments/wallet/topup
POST /api/payments/wallet/credit
POST /api/payments/wallet/debit
```

## Delivery

```http
POST /api/deliveries
GET  /api/deliveries/{deliveryId}
GET  /api/deliveries/order/{orderId}
PUT  /api/deliveries/{deliveryId}/status
POST /api/deliveries/{deliveryId}/accept
POST /api/deliveries/{deliveryId}/verify
```

## Bidding

```http
POST /api/bidding/sessions
GET  /api/bidding/sessions/active
GET  /api/bidding/sessions/{id}
POST /api/bidding/sessions/{id}/bids
GET  /api/bidding/sessions/{id}/bids
POST /api/bidding/sessions/{id}/close
```

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

* Java 21
* Maven 3.9+
* Docker Desktop
* Docker Compose
* Git
* Postman

For the Docker setup, MySQL and RabbitMQ are provided through Docker Compose.

---

# 🐳 Docker Setup

Clone the repository:

```bash
git clone <repository-url>
```

Navigate to the project:

```bash
cd CropDeal_Team-main
```

Build and start all services:

```bash
docker compose up --build
```

Or run in background:

```bash
docker compose up --build -d
```

Check containers:

```bash
docker compose ps
```

---

# 🔌 Important Ports

| Component            |    Port |
| -------------------- | ------: |
| API Gateway          |  `8080` |
| Auth Service         |  `8081` |
| User Service         |  `8082` |
| Price Service        |  `8083` |
| Order Service        |  `8085` |
| Payment Service      |  `8086` |
| Crop Service         |  `8087` |
| Chatbot Service      |  `8088` |
| Invoice Service      |  `8089` |
| Delivery Service     |  `8090` |
| Negotiation Service  |  `8091` |
| Admin/Reports        |  `8092` |
| Notification Service |  `8093` |
| Review Service       |  `8094` |
| Bidding Service      |  `8095` |
| Eureka Server        |  `8761` |
| Config Server        |  `8888` |
| MySQL                |  `3307` |
| RabbitMQ             |  `5672` |
| RabbitMQ Management  | `15672` |

---

# 🐇 RabbitMQ Management

RabbitMQ Management UI:

```text
http://localhost:15672
```

Development credentials:

```text
Username: guest
Password: guest
```

> These credentials are intended only for local development.

---

# 🧪 Testing with Postman

The repository contains:

```text
CropDeal_Postman_Collection.json
```

Import it into Postman.

Recommended testing order:

```text
1. Register user
2. Login
3. Obtain JWT
4. Create/Update profile
5. Create crop
6. Search crop
7. Check market price
8. Create bidding/negotiation
9. Create order
10. Process payment
11. Assign delivery
12. Verify delivery OTP
13. Generate invoice
14. Create review
15. Check notifications
16. Test admin APIs
17. Test chatbot
```

For secured endpoints:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# ❤️ Health & Monitoring

Spring Boot Actuator is enabled for health monitoring.

Example:

```text
http://localhost:<port>/actuator/health
```

Eureka Dashboard:

```text
http://localhost:8761
```

RabbitMQ Dashboard:

```text
http://localhost:15672
```

---

# 📖 Swagger / OpenAPI

Services using Springdoc OpenAPI expose API documentation.

Typical endpoints:

```text
http://localhost:<service-port>/swagger-ui.html
```

or:

```text
http://localhost:<service-port>/swagger-ui/index.html
```

OpenAPI specification:

```text
http://localhost:<service-port>/v3/api-docs
```

---

# 🔑 Environment Variables

Production credentials and API keys should be supplied through environment variables or a secure secret-management system.

Example:

```text
DB_HOST
DB_PORT
DB_USERNAME
DB_PASSWORD

RABBITMQ_HOST
RABBITMQ_PORT
RABBITMQ_USERNAME
RABBITMQ_PASSWORD

JWT_SECRET
JWT_EXPIRATION

MAIL_USERNAME
MAIL_PASSWORD

SARVAM_API_KEY

EXTERNAL_API_KEY
GOVT_API_BASE_URL
```

---

# 🔒 Security Notes

Before deploying the project publicly:

* Do not commit real API keys.
* Do not commit email passwords.
* Do not expose production database credentials.
* Use strong JWT secrets.
* Rotate credentials that have been exposed.
* Use HTTPS in production.
* Restrict Actuator endpoints in production.
* Use separate credentials for development and production.
* Store secrets using environment variables or a secret manager.

---

# 🧰 Useful Docker Commands

### Start

```bash
docker compose up -d
```

### Build and Start

```bash
docker compose up --build -d
```

### Check Services

```bash
docker compose ps
```

### View Logs

```bash
docker compose logs -f
```

### View Specific Service Logs

```bash
docker compose logs -f order-service
```

### Restart a Service

```bash
docker compose restart order-service
```

### Rebuild a Service

```bash
docker compose up --build order-service
```

### Stop Services

```bash
docker compose down
```

### Stop and Remove Volumes

```bash
docker compose down -v
```

> `docker compose down -v` removes Docker volumes and can delete locally persisted database/message-broker data.

---

# 🏗️ Build Without Docker

Build the complete Maven project:

```bash
mvn clean install
```

Or on Windows:

```powershell
.\mvnw.cmd clean install
```

Run an individual service:

```bash
cd <service-folder>
mvn spring-boot:run
```

Example:

```bash
cd auth-service
mvn spring-boot:run
```

When running without Docker, make sure MySQL, RabbitMQ, Eureka and Config Server are available.

---

# 🧠 Important Concepts Demonstrated

This project demonstrates practical implementation of:

* Microservices Architecture
* REST APIs
* Spring Boot
* Spring Cloud
* API Gateway
* Service Discovery
* Centralized Configuration
* JWT Authentication
* Role-Based Authorization
* Spring Security
* DTO Pattern
* Layered Architecture
* Spring Data JPA
* Hibernate
* OpenFeign
* RabbitMQ
* Event-Driven Architecture
* Circuit Breaker
* Retry Pattern
* Global Exception Handling
* Input Validation
* Database-per-Service
* API Documentation
* Application Monitoring
* Docker
* Docker Compose
* AI API Integration

---

# 🔮 Future Enhancements

Planned improvements can include:

* [ ] Angular/React frontend
* [ ] Kubernetes deployment
* [ ] CI/CD pipeline
* [ ] Prometheus and Grafana monitoring
* [ ] Distributed tracing
* [ ] Centralized logging
* [ ] Redis caching
* [ ] Cloud object storage for crop images
* [ ] OAuth2 / OpenID Connect
* [ ] Real-time WebSocket notifications
* [ ] Production payment gateway integration
* [ ] Advanced recommendation system
* [ ] Automated integration testing
* [ ] Contract testing
* [ ] Production secret management

---

# 👨‍💻 Contributors

**CropDeal Team**

This project was developed as a team-based microservices application to demonstrate practical implementation of **Java, Spring Boot, Spring Cloud, REST APIs, distributed systems, database management, security, messaging, resilience, and Docker**.

---

# 📜 License

This project is developed for **educational and academic purposes**.

---

## ⭐ If you find this project useful

Give the repository a ⭐ and feel free to explore the implementation.
