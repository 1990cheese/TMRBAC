import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { User, RoleName } from '../../../../../../libs/ui-data/users/user.model';
import { UsersService } from '../../../services/users.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-management.component.html', // Use external template file
})
export class UserManagementComponent implements OnInit {
  users$!: Observable<User[]>;
  availableRoles: RoleName[] = ['admin', 'manager', 'user'];

  constructor(private usersService: UsersService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.users$ = this.usersService.getUsers();
  }

  onRoleChange(event: Event, userId: string) {
    const selectElement = event.target as HTMLSelectElement;
    const newRoleName = selectElement.value as RoleName;
    
    this.usersService.updateUserRole(userId, newRoleName).subscribe({
      next: () => {
        console.log(`Successfully updated role for user ${userId}`);
        // Optionally, show a success message
        this.loadUsers(); // Refresh the list to show the change
      },
      error: (err) => {
        console.error('Failed to update role', err);
        // Optionally, show an error message
      }
    });
  }
}