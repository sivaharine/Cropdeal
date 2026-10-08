export interface Crop {
  id?: string;
  cropId?: string;
  farmerId?: string;
  farmerName?: string;
  farmerPhone?: string;
  cropName: string;
  variety?: string;
  cropType: string;
  quantity: number;
  availableQuantity?: number;
  unit: string; // kg
  pricePerUnit: number;
  location: string;
  harvestDate?: string;
  imageUrl?: string;
  status: 'AVAILABLE' | 'SOLD' | 'IN_NEGOTIATION' | 'AUCTION' | 'BLOCKED';
  description?: string;
  govMspPrice?: number;
  createdAt?: string;
}

export interface GovernmentPrice {
  id?: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety?: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  recordDate: string;
}

export interface CropAlert {
  id?: string;
  userId: string;
  cropName: string;
  targetPrice: number;
  currentGovPrice?: number;
  condition: 'ABOVE' | 'BELOW';
  status: 'ACTIVE' | 'TRIGGERED';
  message?: string;
}
