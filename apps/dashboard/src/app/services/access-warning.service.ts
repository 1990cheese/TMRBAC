import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AccessWarningService {
  private warningSubject = new BehaviorSubject<string | null>(null);
  warning$ = this.warningSubject.asObservable();

  showWarning(message: string) {
    this.warningSubject.next(message);
  }

  clearWarning() {
    this.warningSubject.next(null);
  }
}
