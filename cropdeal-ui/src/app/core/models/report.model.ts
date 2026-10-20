export interface PaymentReportItem {
  id: string;
  orderId: string;
  amount: number;
  payerName: string;
  receiverName: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export interface UserReportItem {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  ordersCount: number;
  totalVolume: number;
  status: string;
  joinedDate: string;
}

export interface CropReportItem {
  id: string;
  cropName: string;
  farmerName: string;
  cropType: string;
  totalQuantity: number;
  avgPricePerUnit: number;
  status: string;
  listedDate: string;
}

export interface FullAdminReport {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalFarmers: number;
    totalDealers: number;
    totalDeliveryPartners: number;
    activeCropsCount: number;
  };
  paymentReports: PaymentReportItem[];
  dealerReports: UserReportItem[];
  farmerReports: UserReportItem[];
  deliveryPartnerReports: UserReportItem[];
  cropReports: CropReportItem[];
}
