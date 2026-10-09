import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthModalService {
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new BehaviorSubject<string>('Please sign in or quick-login to perform this action.');

  public isOpen$ = this.isOpenSubject.asObservable();
  public message$ = this.messageSubject.asObservable();

  open(customMessage?: string): void {
    if (customMessage) {
      this.messageSubject.next(customMessage);
    } else {
      this.messageSubject.next('Please sign in or quick-login to perform this action.');
    }
    this.isOpenSubject.next(true);
  }

  close(): void {
    this.isOpenSubject.next(false);
  }
}
