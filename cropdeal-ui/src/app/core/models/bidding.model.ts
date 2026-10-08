export interface BiddingAuction {
  id: string;
  cropId: string;
  cropName: string;
  farmerId: string;
  farmerName?: string;
  startingPrice: number;
  currentHighestBid: number;
  highestBidderId?: string;
  highestBidderName?: string;
  quantity: number;
  unit: string;
  endTime: string;
  status: 'OPEN' | 'CLOSED' | 'AWARDED' | 'BLOCKED' | 'CANCELLED';
  bidsCount: number;
  awardedOrderId?: string;
  awardedAmount?: number;
  durationHours?: number;
  minIncrement?: number;
  location?: string;
  variety?: string;
  createdAt?: string;
  bidsHistory?: Array<{ bidderName: string; bidPriceKg: number; bidTime: string }>;
}

export interface BidOffer {
  id?: string;
  biddingId: string;
  dealerId: string;
  dealerName?: string;
  bidAmount: number;
  bidTime?: string;
}
