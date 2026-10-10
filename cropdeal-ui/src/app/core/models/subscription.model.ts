export interface CropSubscription {
  id: string;
  dealerId: string;
  dealerName?: string;
  commodity: string; // e.g. "Wheat", "Basmati Rice", "Cotton", etc.
  category?: string; // e.g. "Grains", "Pulses", "Oilseeds", etc.
  preferredState?: string;
  maxBudgetPerUnit?: number;
  notifyInApp: boolean;
  createdAt: string;
}
