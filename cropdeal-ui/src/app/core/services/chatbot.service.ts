import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  id?: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  suggestedActions?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private baseUrl = `${environment.apiUrl}/chat/ask`;

  constructor(private http: HttpClient) {}

  askBot(query: string, userId?: string): Observable<{ response: string; suggestedActions?: string[] }> {
    return this.http.post<any>(this.baseUrl, {
      message: query
    }).pipe(
      map(res => ({
        response: res.answer || res.reply || res.response || 'I have processed your query.',
        suggestedActions: res.suggestedActions || []
      })),
      catchError(() => {
        const q = (query || '').toLowerCase();
        let fallback = 'CropDeal connects farmers directly with dealers across India with zero middlemen commissions and transparent APMC benchmark pricing.';
        if (q.includes('price') || q.includes('mandi') || q.includes('rate')) {
          fallback = 'Current APMC Mandi rates: Paddy (Rice) ₹19.80/Kg, Wheat ₹24.50/Kg, Cotton ₹72.00/Kg, Turmeric ₹102.00/Kg. Check the Mandhi Price section for full market data.';
        } else if (q.includes('delivery') || q.includes('transport') || q.includes('shipping')) {
          fallback = 'CropDeal offers flexible logistics: Self Pickup from mandi yard (Free ₹0) or CropDeal Express Logistics with tracked delivery agents.';
        } else if (q.includes('bid') || q.includes('auction')) {
          fallback = 'Live Bidding lets farmers auction bulk lots to verified dealers. Minimum increment is ₹1/Kg with automated highest bid settlement.';
        } else if (q.includes('wallet') || q.includes('recharge') || q.includes('payment')) {
          fallback = 'Your CropDeal Wallet supports instant recharging and deductions for direct crop purchases and bidding settlements.';
        }
        return of({
          response: fallback,
          suggestedActions: ['Check Mandhi Prices', 'Explore Live Bidding', 'View My Wallet', 'How delivery works']
        });
      })
    );
  }
}
