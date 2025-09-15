import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-warning-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="visible">
      <div class="modal">
        <h2>Access Denied</h2>
        <p>{{ message }}</p>
        <button (click)="close()">OK</button>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: #fff;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      text-align: center;
    }
    button {
      margin-top: 1rem;
      padding: 0.5rem 1.5rem;
      font-size: 1rem;
      border: none;
      border-radius: 4px;
      background: #007bff;
      color: #fff;
      cursor: pointer;
    }
  `]
})
export class WarningModalComponent {
  @Input() visible = false;
  @Input() message = '';
  @Output() closed = new EventEmitter<void>();

  close() {
    this.visible = false;
    this.closed.emit();
  }
}
