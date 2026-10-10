export interface Delivery {
  id: string;
  orderId: string;
  dealerId?: string | null;
  farmerId?: string | null;
  partnerId?: string | null;
  partnerName?: string | null;
  cropName?: string | null;
  cropQuantity?: number | null;
  cropUnit?: string | null;
  farmerName?: string | null;
  farmerPhone?: string | null;
  pickupAddress: string | null;
  dealerName?: string | null;
  dealerPhone?: string | null;
  dropAddress: string | null;
  distanceKm?: number | null;
  deliveryFee?: number | null;
  fulfillmentType?: 'SELF_PICKUP' | 'DELIVERY_AGENT';
  status: 'PENDING_ASSIGNMENT' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'AVAILABLE_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  trackingNumber?: string | null;
  estimatedDeliveryDate?: string | null;
  updatedAt?: string;
  createdAt?: string;
}
