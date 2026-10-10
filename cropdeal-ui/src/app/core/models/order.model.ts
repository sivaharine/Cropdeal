export interface Order {
  id: string;
  cropId: string;
  cropName?: string;
  farmerId: string;
  farmerName?: string;
  farmerPhone?: string;
  farmerLocation?: string;
  dealerId: string;
  dealerName?: string;
  dealerPhone?: string;
  quantity: number;
  unit?: string;
  pricePerUnit?: number;
  govMspPrice?: number;
  totalPrice: number;
  taxAmount?: number;
  deliveryFee?: number;
  finalAmount?: number;
  fulfillmentType?: 'DELIVERY_AGENT' | 'SELF_PICKUP';
  distanceKm?: number;
  paymentMethod?: string;
  transactionId?: string;
  status: 'PENDING' | 'PAID' | 'CONFIRMED' | 'PROCESSING' | 'ASSIGNED' | 'DISPATCHED' | 'IN_TRANSIT' | 'PICKED_UP' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  deliveryAddress?: string;
  deliveryPartnerId?: string;
  createdAt: string;
  invoiceId?: string;
  isBidding?: boolean;
}

export interface CreateOrderRequest {
  cropId: string;
  dealerId: string;
  dealerName?: string;
  dealerPhone?: string;
  farmerId?: string;
  farmerName?: string;
  farmerPhone?: string;
  farmerLocation?: string;
  quantity: number;
  totalPrice: number;
  deliveryAddress: string;
  fulfillmentType?: 'DELIVERY_AGENT' | 'SELF_PICKUP';
  deliveryFee?: number;
  distanceKm?: number;
  paymentMethod?: string;
  transactionId?: string;
  taxAmount?: number;
  finalAmount?: number;
  cropName?: string;
  unit?: string;
  pricePerUnit?: number;
  govMspPrice?: number;
  isBidding?: boolean;
}
