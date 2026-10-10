export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ORDER' | 'NEGOTIATION' | 'BID' | 'PRICE_ALERT' | 'WALLET' | 'DELIVERY' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
}
