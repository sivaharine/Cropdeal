export interface BiddingAuction {
  id: string;
  cropId: string;
  cropName: string;
  farmerId: string;
  farmerName?: string | null;
  startingPrice: number;
  currentHighestBid: number;
  highestBidderId?: string | null;
  highestBidderName?: string | null;
  quantity: number;
  unit: string;
  endTime: string;
  status: 'OPEN' | 'CLOSED' | 'AWARDED' | 'BLOCKED' | 'CANCELLED';
  bidsCount: number;
  awardedOrderId?: string | null;
  awardedAmount?: number | null;
  durationHours?: number;
  minIncrement?: number;
  location?: string | null;
  variety?: string | null;
  createdAt?: string;
  bidsHistory?: Array<{ bidderName: string; bidPriceKg: number; bidTime: string }>;
}

export interface BidOffer {
  id?: string;
  biddingId: string;
  dealerId: string;
  dealerName?: string | null;
  bidAmount: number;
  bidTime?: string;
}
