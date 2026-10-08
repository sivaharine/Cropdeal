// ═══════════════════════════════════════════════════
// CROPDEAL – Shared Models / Interfaces
// ═══════════════════════════════════════════════════

// ─── AUTH ──────────────────────────────────────────
export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'FARMER' | 'DEALER' | 'DELIVERY_PARTNER' | 'ADMIN';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  role: string;
  name: string;
  email: string;
}

export interface MessageResponse {
  message: string;
}

export interface ForgotPasswordRequest { email: string; }
export interface ResetPasswordRequest  { token: string; newPassword: string; }

// ─── USER / PROFILE ────────────────────────────────
export interface FarmerResponse {
  id: number;
  userId: number;
  name: string;
  email?: string;
  phone: string;
  role?: string;
  address?: string;
  farmLocation?: string;
  bankDetails?: string;
  // kept optional for backwards-compat with local fallback:
  farmSize?: number;
  createdAt?: string;
}

export interface DealerResponse {
  id: number;
  userId: number;
  name: string;
  email?: string;
  phone: string;
  role?: string;
  businessName?: string;
  address?: string;
  bankDetails?: string;
  // kept optional for backwards-compat:
  gstNumber?: string;
  createdAt?: string;
}

export interface DeliveryPartnerResponse {
  id: number;
  userId: number;
  name: string;
  email?: string;
  phone: string;
  role?: string;
  address?: string;
  vehicleNumber?: string;
  vehicleType?: string;               // enum: BIKE | MINI_TRUCK | TRUCK | TEMPO
  drivingLicenseNumber?: string;
  availabilityStatus?: string;        // enum: AVAILABLE | UNAVAILABLE | ON_DELIVERY
  bankDetails?: string;
  // backwards-compat aliases:
  licenseNumber?: string;             // alias for drivingLicenseNumber
  available?: boolean;                // alias for availabilityStatus === 'AVAILABLE'
  createdAt?: string;
}

export interface FarmerUpdateRequest {
  name?: string;
  phone?: string;
  address?: string;
  farmLocation?: string;
  bankDetails?: string;
  // kept for backwards-compat:
  farmSize?: number;
}

export interface DealerUpdateRequest {
  name?: string;
  phone?: string;
  businessName?: string;
  address?: string;
  bankDetails?: string;
  // kept for backwards-compat:
  gstNumber?: string;
}

export interface DeliveryPartnerUpdateRequest {
  name?: string;
  phone?: string;
  address?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  drivingLicenseNumber?: string;
  availabilityStatus?: string;
  bankDetails?: string;
  // backwards-compat aliases:
  licenseNumber?: string;
  available?: boolean;
}

/** PUT /api/admin/users/{userId}/status */
export interface UserStatusUpdateRequest {
  status: string;   // ACTIVE | INACTIVE | SUSPENDED
}

// ─── CROPS ─────────────────────────────────────────
export interface CropResponse {
  id: number; farmerId: number; farmerName?: string; commodity: string;
  state: string; district: string; grade: string;
  quantity: number; unit: string; pricePerKg: number;
  description?: string; status: string;
  createdAt: string; updatedAt: string;
}

export interface CropSearchResponse {
  id: number; commodity: string; state: string;
  district: string; grade: string; quantity: number;
  unit: string; pricePerKg: number; status: string;
}

export interface CreateCropRequest {
  commodity: string; state: string; district: string;
  grade: string; quantity: number; unit: string;
  pricePerKg: number; description?: string;
  farmerId?: number; farmerName?: string;
}

// ─── FARMER FOLLOW (Dealer subscribes to Farmer profile) ───
export interface FarmerFollowRequest {
  dealerId: number;
  farmerId: number;
}

export interface FarmerFollowResponse {
  id: number;
  dealerId: number;
  farmerId: number;
  farmerName: string;
  farmerEmail?: string;
  followedAt: string;
}

// Legacy subscription kept for backward compat
export interface SubscriptionRequest {
  subscriberId: number; commodity: string;
  state?: string; district?: string; grade?: string;
}

export interface SubscriptionResponse {
  id: number; subscriberId: number; commodity: string;
  state?: string; district?: string; grade?: string;
  subscribedAt: string;
}

// ─── BUYING REQUESTS & INVENTORY UPDATE ─────────────
export interface BuyingRequestCreateDto {
  dealerId?: number;
  cropName: string;
  quantity: number;
  unit?: string;
  buyingPrice: number;
  district: string;
  state: string;
  notes?: string;
}

export interface BuyingRequestResponseDto {
  id: number;
  dealerId: number;
  cropName: string;
  quantity: number;
  unit: string;
  buyingPrice: number;
  district: string;
  state: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuantityUpdateRequest {
  purchasedQuantity: number;
}

// ─── ORDERS ────────────────────────────────────────
export interface CreateOrderRequest {
  dealerId: number;
  farmerId: number;
  cropId: number;
  cropName?: string;
  quantity: number;
  unitPrice: number;          // matches backend CreateOrderRequest.unitPrice
  // kept as alias for local cache fallback only:
  pricePerUnit?: number;
  deliveryAddress?: string;
}

export interface OrderResponse {
  id: number;
  dealerId: number;
  farmerId: number;
  cropId: number;
  cropName?: string;
  quantity: number;
  unitPrice?: number;         // backend sends unitPrice
  pricePerUnit?: number;      // alias used in template display
  totalAmount: number;
  status: string;
  paymentStatus?: string;     // local-only — backend doesn't return this
  deliveryAddress?: string;   // local-only — backend doesn't return this
  createdAt: string;
  updatedAt: string;
}

export interface PayOrderRequest { paymentMethod: string; }

/** POST /api/orders/saga — full saga: order + payment + delivery in one shot */
export interface SagaOrderRequest {
  order: {
    farmerId: number;
    dealerId: number;
    cropId: number;
    cropName?: string;
    quantity: number;
    unitPrice: number;
  };
  paymentMethod: string;
  deliveryOption?: string;    // SELF_PICKUP | DELIVERY_AGENT
  customerPhone?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  deliveryCharge?: number;
}

// ─── PAYMENTS ──────────────────────────────────────
export interface PaymentRequest {
  orderId: number;
  amount: number;
  paymentMethod: string;
  // Backend expects dealerId / farmerId:
  dealerId: number;
  farmerId: number;
  // Kept as frontend-only aliases (order.service uses these):
  payerId?: number;
  payeeId?: number;
}

export interface PaymentResponse {
  id: number;
  orderId: number;
  dealerId?: number;
  farmerId?: number;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionReference?: string;   // backend field name
  transactionId?: string;          // alias kept for compat
  paidAt?: string;                 // backend field name (LocalDateTime)
  createdAt?: string;              // alias kept for compat
}

export interface WalletTransactionResponse {
  id: number;
  walletId?: number;
  userId: number;
  amount: number;
  transactionType: string; // 'WALLET_TOPUP' | 'CREDIT' | 'DEBIT' | 'SETTLEMENT' | 'WITHDRAWAL'
  referenceId: string;
  status: string; // 'SUCCESS' | 'PENDING' | 'FAILED'
  description?: string;
  createdAt: string;
}

export interface WalletResponse {
  id?: number;
  userId: number;
  userRole?: string;
  balance: number;
  currency: string;
  transactions?: WalletTransactionResponse[];
  updatedAt?: string;
}

export interface WalletTopUpRequest {
  userId: number;
  userRole?: string;
  amount: number;
  paymentMethod?: string;
  transactionReference?: string;
}

export interface WalletDebitRequest {
  userId: number;
  userRole?: string;
  amount: number;
  referenceId: string;
  transactionType?: string;
  description?: string;
}

export interface WalletCreditRequest {
  userId: number;
  userRole?: string;
  amount: number;
  referenceId: string;
  transactionType?: string;
  description?: string;
}

export interface WalletSettlementRequest {
  userId: number;
  userRole?: string;
  amount: number;
  referenceId: string;
  description?: string;
  orderId?: number;
  farmerId?: number;
  dealerId?: number;
}

// ─── REVIEWS ───────────────────────────────────────
export interface FarmerReviewRequest {
  farmerId: number;
  dealerId: number;
  orderId: number;
  cropId: number;
  rating: number;
  reviewText?: string;
  comment?: string;
}

export interface FarmerReviewResponse {
  id: number;
  farmerId: number;
  dealerId: number;
  orderId: number;
  cropId: number;
  rating: number;
  reviewText?: string;
  comment?: string;
  reviewReference?: string;
  status?: string;
  dealerName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FarmerRatingSummaryResponse {
  farmerId: number;
  totalReviews: number;
  averageRating: number;
  reviews: FarmerReviewResponse[];
}

export interface UpdateReviewRequest {
  rating?: number;
  reviewText?: string;
  comment?: string;
}

// ─── DELIVERY ──────────────────────────────────────
export interface DeliveryAssignmentRequest {
  orderId: number;
  pickupAddress: string;
  deliveryAddress: string;
  deliveryOption?: string;       // SELF_PICKUP | DELIVERY_AGENT
  customerPhone?: string;
  deliveryCharge?: number;
  paymentCompleted?: boolean;
  paymentMethod?: string;
}

export interface DeliveryResponse {
  id: number;
  orderId: number;
  deliveryPartnerId?: number;
  deliveryReference?: string;
  deliveryOption?: string;
  deliveryCharge?: number;
  currency?: string;
  status: string;
  customerPhone?: string;
  pickupAddress: string;
  deliveryAddress: string;
  deliveryOtp?: string;
  otpVerified?: boolean;
  receiptId?: string;
  acceptedAt?: string;
  acceptedBy?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryAgentResponse {
  agentId: number;
  name: string;
  phoneNumber: string;
  vehicleType?: string;
  available: boolean;
  latitude?: number;
  longitude?: number;
}

export interface AcceptDeliveryRequest {
  deliveryPartnerId: number;
  partnerName?: string;
}
export interface VerifyDeliveryRequest { otp?: string; }
export interface UpdateDeliveryStatusRequest { status: string; notes?: string; }

// ─── INVOICES ──────────────────────────────────────
export interface InvoiceItemRequest {
  cropName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface InvoiceItemResponse {
  id: number;
  cropName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceCreateRequest {
  orderId: number;
  farmerId: number;
  dealerId: number;
  paymentId?: string;
  subtotal?: number;
  amount?: number;
  taxAmount?: number;
  totalAmount?: number;
  items?: InvoiceItemRequest[];
}

export interface InvoicePaymentRequest {
  orderId?: number;
  paymentId: number | string;
  farmerId?: number;
  dealerId?: number;
  amount?: number;
}

export interface InvoiceResponse {
  id: number;
  invoiceNumber: string;
  orderId: number;
  paymentId?: string;
  farmerId: number;
  dealerId: number;
  subtotal?: number;
  amount?: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  pdfPath?: string;
  pdfUrl?: string;
  invoiceDate?: string;
  createdAt: string;
  items?: InvoiceItemResponse[];
}

export interface InvoiceItem {
  description?: string;
  cropName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  lineTotal?: number;
}


// ─── BIDDING ───────────────────────────────────────
export interface CreateBiddingSessionRequest {
  cropId: number;
  farmerId?: number; // Optional — backend resolves from X-User-Id header / JWT
  cropName: string;
  quantity: number;
  unit: string;
  basePrice: number;
  minIncrement: number;
  startTime: string;
  endTime: string;
  district: string;
  state: string;
}

export interface BiddingSessionResponse {
  id: number; cropId: number; farmerId: number; cropName: string;
  quantity: number; unit: string; basePrice: number;
  minIncrement: number; currentHighestBid?: number;
  highestBidderId?: number; startTime: string; endTime: string;
  status: string; district: string; state: string;
  createdAt: string; updatedAt: string;
}

export interface PlaceBidRequest {
  dealerId?: number;  // Only used for offline fallback; backend resolves dealer from X-User-Id header
  bidAmount: number;
  walletHoldRef?: string;
  notes?: string;
}

export interface BidResponse {
  id: number; sessionId: number; dealerId: number;
  bidAmount: number; bidTime: string; status: string;
  walletHoldRef?: string; notes?: string;
}

// ─── NEGOTIATION ───────────────────────────────────
export interface CreateNegotiationRequest {
  cropId: number;
  buyerId: number;
  sellerId: number;
  quantity: number;
  targetPrice: number;
  // cropName is frontend-only — backend NegotiationCreateRequest does not have it
  cropName?: string;
}

export interface NegotiationResponse {
  id: number; cropId: number; cropName?: string; buyerId: number;
  sellerId: number; quantity: number; targetPrice: number;
  status: string; createdAt: string; updatedAt: string;
  offers: OfferResponse[];
}

/** Returned by GET /{id}/status and PATCH /{id}/close — field is negotiationId not id */
export interface NegotiationStatusResponse {
  negotiationId: number;   // backend record field name
  id?: number;             // alias kept for backward compat
  status: string;
}

export interface OfferRequest {
  offeredByUserId: number; amount: number; message?: string;
}

/** Same fields as OfferRequest — used for POST /{negotiationId}/counter-offers */
export interface CounterOfferRequest {
  offeredByUserId: number; amount: number; message?: string;
}

export interface OfferResponse {
  id: number; negotiationId: number; offeredByUserId: number;
  amount: number; message?: string; status: string; createdAt: string;
}

// ─── PRICE ─────────────────────────────────────────
export type PriceCondition =
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUAL'
  | 'EQUAL';

export interface PriceSearchRequest {
  commodity: string;
  state: string;
  district?: string;
  grade: string;    // required — backend @NotBlank, must be A|B|C
}

export interface PriceAlertSubscriptionRequest {
  cropName: string;
  targetPrice: number;
  priceCondition: PriceCondition;
  district?: string;
  state?: string;
  unit?: string;
  active?: boolean;
}

export interface PriceAlertSubscriptionResponse {
  id: number;
  userId: number;
  userRole: string;
  cropName: string;
  targetPrice: number;
  priceCondition: PriceCondition;
  district?: string;
  state?: string;
  unit?: string;
  active: boolean;
  lastNotifiedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

/** Returned by POST /api/prices/lookup (PriceController → CropPriceResponse) */
export interface CropPriceResponse {
  commodity: string;
  state: string;
  district?: string;
  grade: string;
  priceDate?: string;       // LocalDate serialized as ISO string
  minPricePerKg?: number;
  maxPricePerKg?: number;
  // Computed field for convenience (avg of min+max)
  modalPricePerKg?: number;
}

/** Returned by GET /api/prices/all — full mandi data with all price fields */
export interface MarketPriceResponse {
  id: number; commodity: string; state: string; district: string;
  grade: string; minPrice?: number; maxPrice?: number;
  modalPrice?: number; minPricePerKg?: number;
  maxPricePerKg?: number; modalPricePerKg?: number;
  arrivalDate: string; sourceUnit: string; kgPerUnit: number;
}

export interface PriceSyncResponse {
  message: string; processed: number; inserted: number;
  updated: number; latestDate: string;
}

// ─── ADMIN ─────────────────────────────────────────
export interface DashboardSummaryResponse {
  totalFarmers: number;
  totalDealers: number;
  totalDeliveryPartners: number;
  totalCrops: number;
  availableCrops: number;
  totalOrders: number;
  completedOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  totalTransactions: number;
  totalRevenue: number;
  successfulPayments: number;
  failedPayments: number;
  activeAuctions?: number;
  disputesResolved?: number;
}

export interface OrdersByStatusResponse {
  totalOrders: number;
  statusBreakdown: Record<string, number>;
}

export interface RevenueSummaryResponse {
  totalRevenue: number;
  averageOrderValue: number;
  totalCompletedTransactions: number;
  revenueByPaymentMethod: Record<string, number>;
}

export interface FarmerClientDto {
  id: number;
  userId: number;
  name: string;
  phone: string;
  address: string;
  farmLocation: string;
  bankDetails?: string;
  role?: string;
  active?: boolean;
  email?: string;
  registeredAt?: string;
}

export interface DealerClientDto {
  id: number;
  userId: number;
  name: string;
  phone: string;
  businessName: string;
  address: string;
  bankDetails?: string;
  role?: string;
  active?: boolean;
  email?: string;
  registeredAt?: string;
}

export interface DeliveryPartnerClientDto {
  id: number;
  userId: number;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  operationalArea: string;
  status: string;
  role?: string;
  active?: boolean;
  email?: string;
  registeredAt?: string;
}

export interface CropClientDto {
  id: number;
  farmerId: number;
  commodity: string;
  state: string;
  district: string;
  grade: string;
  quantity: number;
  unit: string;
  pricePerKg: number;
  status: string;
}

export interface OrderClientDto {
  id: number;
  farmerId: number;
  dealerId: number;
  cropId: number;
  cropName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentClientDto {
  id: number;
  orderId: number;
  dealerId: number;
  farmerId: number;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionReference: string;
  paidAt: string;
}

export interface AdminAuditLog {
  id: number;
  action: string;
  targetEntity?: string;
  entityType?: string;
  targetId?: string | number;
  entityId?: number;
  performedBy?: string;
  adminEmail?: string;
  details?: string;
  reason?: string;
  timestamp?: string;
  performedAt?: string;
}

// ─── CHATBOT ───────────────────────────────────────
export interface ChatRequest {
  sessionId: string; message: string; userId?: number;
}

export interface ChatResponse {
  sessionId: string; reply: string; timestamp: string;
}

// ─── NOTIFICATION ──────────────────────────────────
// NotificationResponse covers both backend DTO fields and local-only in-app fields
export interface NotificationResponse {
  id: number;
  // Backend DTO fields
  recipient?: string;    // email / phone used by backend
  type: string;
  message: string;
  status?: string;       // backend delivery status: SENT | FAILED
  orderId?: number;      // linked order if any
  // Local in-app only fields (not in backend DTO)
  userId?: number;
  title?: string;
  read?: boolean;
  createdAt: string;
}

/** POST /api/notifications — general notification */
export interface NotificationRequest {
  recipient: string;     // email address of recipient
  type: string;          // ORDER | DELIVERY | PAYMENT | CROP | SYSTEM etc.
  message: string;
  orderId?: number;
}

/** POST /api/notifications/delivery-otp — send OTP SMS */
export interface OtpNotificationRequest {
  phoneNumber: string;
  otp: string;
}

/** POST /api/notifications/delivery-completed — delivery done SMS */
export interface DeliveryCompletedNotificationRequest {
  phoneNumber: string;
  orderId: number;
}

// ─── REPORT ────────────────────────────────────────
export interface FarmerReportItem {
  farmerId: number;
  userId?: number;
  name: string;
  phone?: string;
  address?: string;
  farmLocation?: string;
  totalCropsListed?: number;
  estimatedCropValue?: number;
  totalCrops?: number;
  activeCrops?: number;
  totalOrders?: number;
  totalRevenue?: number;
}

export interface DealerReportItem {
  dealerId: number;
  userId?: number;
  name: string;
  phone?: string;
  businessName?: string;
  address?: string;
  totalOrdersPlaced?: number;
  totalAmountSpent?: number;
  totalOrders?: number;
  completedOrders?: number;
  totalSpend?: number;
}

export interface CropReportItem {
  cropId: number;
  farmerId?: number;
  commodity: string;
  state: string;
  district?: string;
  grade?: string;
  quantity: number;
  unit?: string;
  pricePerKg: number;
  status: string;
}

export interface OrderReportItem {
  orderId: number;
  dealerId?: number;
  farmerId?: number;
  cropId?: number;
  cropName?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface PaymentReportItem {
  paymentId: number;
  orderId?: number;
  dealerId?: number;
  farmerId?: number;
  amount: number;
  paymentMethod?: string;
  method?: string;
  status: string;
  transactionReference?: string;
  paidAt?: string;
  createdAt?: string;
}

// ─── SHARED ────────────────────────────────────────
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface CurrentUser {
  userId: number;
  role: string;
  name: string;
  email: string;
  token: string;
}
