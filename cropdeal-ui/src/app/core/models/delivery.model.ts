export interface Delivery {
  id: string;
  orderId: string;
  dealerId?: string;
  farmerId?: string;
  partnerId?: string;
  partnerName?: string;
  cropName?: string;
  cropQuantity?: number;
  cropUnit?: string;
  farmerName?: string;
  farmerPhone?: string;
  pickupAddress: string;
  dealerName?: string;
  dealerPhone?: string;
  dropAddress: string;
  distanceKm?: number;
  deliveryFee?: number;
  fulfillmentType?: 'SELF_PICKUP' | 'DELIVERY_AGENT';
  status: 'PENDING_ASSIGNMENT' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED';
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  updatedAt?: string;
  createdAt?: string;
}
