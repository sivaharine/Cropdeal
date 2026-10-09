import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Negotiation, NegotiationRequest } from '../models/negotiation.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NegotiationService {
  private baseUrl = `${environment.apiUrl}/negotiations`;

  constructor(private http: HttpClient) {}

  getNegotiationsByUser(userId: string): Observable<Negotiation[]> {
    return this.http.get<Negotiation[]>(`${this.baseUrl}/user/${userId}`).pipe(
      catchError(() => of([]))
    );
  }

  createNegotiation(req: NegotiationRequest): Observable<Negotiation> {
    return this.http.post<Negotiation>(this.baseUrl, req).pipe(
      catchError(() => of(req as any))
    );
  }

  counterOffer(negotiationId: string, counterPrice: number, notes?: string): Observable<Negotiation> {
    return this.http.put<Negotiation>(`${this.baseUrl}/${negotiationId}/counter`, { counterPrice, notes }).pipe(
      catchError(() => of({ id: negotiationId, currentOfferPrice: counterPrice } as any))
    );
  }

  acceptOffer(negotiationId: string): Observable<Negotiation> {
    return this.http.put<Negotiation>(`${this.baseUrl}/${negotiationId}/accept`, {}).pipe(
      catchError(() => of({ id: negotiationId, status: 'ACCEPTED' } as any))
    );
  }

  rejectOffer(negotiationId: string): Observable<Negotiation> {
    return this.http.put<Negotiation>(`${this.baseUrl}/${negotiationId}/reject`, {}).pipe(
      catchError(() => of({ id: negotiationId, status: 'REJECTED' } as any))
    );
  }
}
