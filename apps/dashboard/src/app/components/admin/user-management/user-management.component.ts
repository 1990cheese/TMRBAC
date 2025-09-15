import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { User, RoleName } from '../../../../../../libs/ui-data/users/user.model';
import { UsersService } from '../../../services/users.service';
import { WarningModalComponent } from '../../shared/warning-modal.component';
import { AuthService } from '../../../services/auth.service';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, WarningModalComponent],
  templateUrl: './user-management.component.html',
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  availableRoles: RoleName[] = ['OWNER', 'ADMIN', 'USER'];
  selectedRoles: { [userId: string]: RoleName } = {};
  savingAll: boolean = false;
  showModal = false;
  modalMessage = '';

  constructor(private usersService: UsersService, private authService: AuthService) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.modalMessage = 'You must be logged in to access User Management.';
      this.showModal = true;
    } else if (!this.authService.hasPermission('READ_USER')) {
      this.modalMessage = 'You do not have permission to access User Management.';
      this.showModal = true;
    } else {
      this.loadUsers();
    }
  }

  loadUsers() {
    this.usersService.getUsers().subscribe(users => {
      this.users = users;
      // Initialize selectedRoles to current role for each user
      for (const user of users) {
        this.selectedRoles[user.id] = user.roles?.[0]?.name as RoleName;
      }
    });
  }

  saveAllRoles() {
    this.savingAll = true;
    const updates = this.users
      .filter(user => this.selectedRoles[user.id] !== user.roles?.[0]?.name)
      .map(user => this.usersService.updateUserRole(user.id, this.selectedRoles[user.id]));
    if (updates.length === 0) {
      this.savingAll = false;
      return;
    }
    Promise.all(updates.map(obs => obs.toPromise())).then(() => {
      this.savingAll = false;
      this.loadUsers();
    }).catch(err => {
      this.savingAll = false;
      console.error('Failed to update roles', err);
    });
  }

  hasPendingChanges(): boolean {
    return this.users.some(user => this.selectedRoles[user.id] !== user.roles?.[0]?.name);
  }
}