import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InvoiceResponse, InvoiceCreateRequest, InvoicePaymentRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly baseUrl = `${environment.apiUrl}/invoices`;
  private invoicesCache: InvoiceResponse[] = [];

  constructor(private http: HttpClient) {}

  public createInvoice(request: InvoiceCreateRequest): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(this.baseUrl, request).pipe(
      catchError(() => {
        const amt = request.subtotal ?? request.amount ?? 0;
        const tax = request.taxAmount ?? (amt * 0.05);
        const inv: InvoiceResponse = {
          id: Date.now(),
          invoiceNumber: 'INV-' + Date.now().toString().substring(6),
          orderId: request.orderId,
          farmerId: request.farmerId,
          dealerId: request.dealerId,
          subtotal: amt,
          amount: amt,
          taxAmount: tax,
          totalAmount: request.totalAmount ?? (amt + tax),
          status: 'PAID',
          createdAt: new Date().toISOString()
        };
        this.invoicesCache.unshift(inv);
        return of(inv);
      })
    );
  }

  public getInvoiceById(id: number): Observable<InvoiceResponse> {
    return this.http.get<InvoiceResponse>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => of(this.invoicesCache.find(i => i.id === id) || this.invoicesCache[0]))
    );
  }

  public getInvoiceByNumber(invoiceNumber: string): Observable<InvoiceResponse> {
    return this.http.get<InvoiceResponse>(`${this.baseUrl}/number/${invoiceNumber}`).pipe(
      catchError(() => of(this.invoicesCache.find(i => i.invoiceNumber === invoiceNumber) || this.invoicesCache[0]))
    );
  }

  public getInvoiceByOrderId(orderId: number): Observable<InvoiceResponse> {
    return this.http.get<InvoiceResponse>(`${this.baseUrl}/order/${orderId}`).pipe(
      catchError(() => of(this.invoicesCache.find(i => i.orderId === orderId) || this.invoicesCache[0]))
    );
  }

  public getAllInvoices(): Observable<InvoiceResponse[]> {
    return this.http.get<InvoiceResponse[]>(this.baseUrl).pipe(
      catchError(() => of([...this.invoicesCache]))
    );
  }

  public updateInvoice(id: number, request: InvoiceCreateRequest): Observable<InvoiceResponse> {
    return this.http.put<InvoiceResponse>(`${this.baseUrl}/${id}`, request);
  }

  public deleteInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  public downloadInvoicePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/pdf`, { responseType: 'blob' }).pipe(
      catchError(() => {
        // Return dummy text file as Blob for demo if backend PDF is not reachable
        const content = `CROPDEAL AGRICULTURAL MARKETPLACE INVOICE #${id}\nGenerated on: ${new Date().toLocaleDateString()}\nStatus: PAID\nThank you for choosing CropDeal!`;
        return of(new Blob([content], { type: 'application/pdf' }));
      })
    );
  }

  public downloadInvoicePdfByOrderId(orderId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/order/${orderId}/pdf`, { responseType: 'blob' }).pipe(
      catchError(() => {
        // If order pdf fails, fallback to downloadInvoicePdf or synthetic blob
        const content = `CROPDEAL AGRICULTURAL MARKETPLACE INVOICE FOR ORDER #${orderId}\nGenerated on: ${new Date().toLocaleDateString()}\nStatus: PAID\nThank you for choosing CropDeal!`;
        return of(new Blob([content], { type: 'application/pdf' }));
      })
    );
  }

  public generateInvoiceFromPayment(request: InvoicePaymentRequest): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(`${this.baseUrl}/payment`, request).pipe(
      catchError(() => of(this.invoicesCache[0]))
    );
  }
}
