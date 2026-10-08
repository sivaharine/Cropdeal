# 🌱 CropDeal – Enterprise Angular Frontend

> **Built for Capgemini Presentation & Evaluation**  
> An enterprise-grade, responsive Angular frontend for the **CropDeal** agricultural trading platform.

---

## 🎨 Design Theme & UI Architecture

- **Dashboard Theme**: Deep Dark Green (`#1B4332`, `#2D6A4F`, `#173B2C`) representing lush farmland, vitality, and prosperity.
- **Button Styling**: Solid Navy Blue (`#1E3A5F`, `#142B4A`) with subtle shadows and micro-interactions for a high-contrast, professional look.
- **Navigation & Dropdowns**:
  - Top navigation bar with agricultural branding, search shortcuts, and service dropdown menus.
  - Multi-persona **Role Demo Switcher** (instantly switch between Farmer, Dealer, Delivery Agent, and Admin views with pre-loaded mock profiles).
  - Quick Escrow Wallet Pill with instant top-up modal.
  - Interactive Notifications dropdown with live alert counters.
  - Collapsible dark-green sidebar with live Mandi ticker.
  - Floating 24/7 AI Agriculture Assistant widget (`/api/chat`).

---

## 🚀 Microservice Endpoints Covered

| Backend Service | Port | Covered Features & Endpoints |
|---|---|---|
| **API Gateway** | 8080 | Single-point unified reverse proxy routing all `/api/**` calls |
| **Auth Service** | 8081 | Register, Login, Logout, Forgot Password, Reset Password, User Status Update |
| **User Service** | 8082 | Farmer profile, Dealer profile, Delivery partner profile, Internal profile lookup |
| **Price Service** | 8083 | Mandi Wholesale Prices (`/api/prices/today`), Data.gov.in AGMARKNET sync (`/api/prices/sync`), Commodity query |
| **Crop Service** | 8084 | Crop CRUD, search, farmer crop inventory, Mandi ceiling validation, harvest subscriptions |
| **Order Service** | 8085 | Create order, Saga order, list by dealer/farmer, status transitions, pay order, cancellation |
| **Payment Service** | 8086 | Escrow payment, refund, wallet balance, debit, credit, top-up, direct farmer settlement |
| **Chatbot Service** | 8090 | AI Agricultural Assistant (`/api/chat`), session clear, contextual query recommendations |
| **Delivery Service** | 8091 | Delivery assignment, agent GPS tracking ping, customer OTP verification, status transitions |
| **Invoice Service** | 8092 | PDF tax invoice generation, invoice lookup by ID/number/order, payment invoice creation |
| **Negotiation Service** | 8095 | B2B direct bargaining, counter-offers, formal price acceptance/rejection |
| **Review Service** | 8094 | Farmer rating summary, verified dealer reviews, stars and qualitative comments |
| **Bidding Service** | 8088 | Live auction sessions, real-time bid logging, wallet hold integration, award winning bid |
| **Admin Dashboard** | 8097 | User governance, crop governance, order override, financial audit trail, CSV export center |

---

## 💻 Running the Application

### 1. Development Server
Navigate to the `cropdeal-frontend` directory and run:
```bash
npm start
```
or
```bash
npx ng serve
```
Navigate your browser to `http://localhost:4200/`.

### 2. Production Build
```bash
npm run build
```
Compiled production bundles are generated in `dist/cropdeal-frontend/`.

---

## 🌟 Demo Highlights for Evaluators

1. **Role Switcher in Navbar**: Click "View As: [Role]" in the top bar to immediately switch views without logging out.
2. **Interactive Wallet**: Click the wallet pill on the navbar to simulate adding funds.
3. **Mandi Benchmark Validation**: Compare listed crop rates directly against AGMARKNET modal rates.
4. **Live Auction Bidding**: Place bids and observe real-time leader status and outbid state changes.
5. **OTP Delivery Handover**: Delivery partner view supports GPS transmission and OTP code verification.
6. **Regulatory CSV Export**: Admin dashboard enables one-click CSV report downloads for Farmers, Dealers, Crops, Orders, and Payments.
