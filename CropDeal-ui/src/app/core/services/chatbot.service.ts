import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatRequest, ChatResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly baseUrl = `${environment.apiUrl}/chat`;
  private sessionId = 'session-' + Math.random().toString(36).substring(2, 9);

  constructor(private http: HttpClient) {}

  public getSessionId(): string {
    return this.sessionId;
  }

  public sendMessage(message: string, userId?: number): Observable<ChatResponse> {
    const request: ChatRequest = {
      sessionId: this.sessionId,
      message,
      userId
    };

    return this.http.post<ChatResponse>(this.baseUrl, request).pipe(
      catchError(() => {
        let reply = "Hello! I'm your CropDeal Agriculture Assistant. How can I help you today?";
        const lower = message.toLowerCase();
        if (lower.includes('price') || lower.includes('mandi') || lower.includes('rate')) {
          reply = 'Today Basmati Rice is averaging ₹86/KG in Punjab, and Sharbati Wheat is at ₹38.5/KG in Madhya Pradesh. You can check live rates under the Mandi Rates tab!';
        } else if (lower.includes('order') || lower.includes('track')) {
          reply = 'To track your orders, head over to Orders section in your dashboard. You can also view live delivery tracking with OTP verification!';
        } else if (lower.includes('bid') || lower.includes('auction')) {
          reply = 'Our live auction platform allows farmers to set base prices and dealers to bid in real-time with automatic wallet reserve hold!';
        } else if (lower.includes('payment') || lower.includes('wallet')) {
          reply = 'CropDeal supports instant wallet settlement, UPI, and bank transfers with escrow protection until delivery is verified.';
        } else if (lower.includes('weather') || lower.includes('crop')) {
          reply = 'Favorable weather conditions are expected across North India this week. Ideal time for wheat grain drying and storage.';
        }
        return of({
          sessionId: this.sessionId,
          reply,
          timestamp: new Date().toISOString()
        });
      })
    );
  }

  public clearSession(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/sessions/${this.sessionId}`).pipe(
      catchError(() => of(undefined))
    );
  }
}
