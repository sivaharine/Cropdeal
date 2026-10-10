export interface Negotiation {
  id: string;
  cropId: string;
  cropName: string;
  farmerId: string;
  farmerName?: string;
  dealerId: string;
  dealerName?: string;
  originalPrice: number;
  offeredPrice: number;
  counterPrice?: number;
  quantity: number;
  status: 'PENDING' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED';
  lastActionBy: 'DEALER' | 'FARMER';
  notes?: string;
  updatedAt: string;
}

export interface NegotiationRequest {
  cropId: string;
  cropName?: string;
  farmerId: string;
  farmerName?: string;
  dealerId: string;
  dealerName?: string;
  originalPrice?: number;
  quantity: number;
  offeredPrice: number;
  notes?: string;
}
