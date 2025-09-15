import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { SharedModule } from '../../../shared/shared.module';
import { WarningModalComponent } from '../../shared/warning-modal.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [SharedModule, WarningModalComponent],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit {
  showModal = false;
  modalMessage = '';

  constructor(private authService: AuthService) { }

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.modalMessage = 'You must be logged in to access Tasks.';
      this.showModal = true;
    } else if (!this.authService.hasPermission('READ_TASK')) {
      this.modalMessage = 'You do not have permission to access Tasks.';
      this.showModal = true;
    }
  }
}