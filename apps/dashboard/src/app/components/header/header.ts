import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { User, UserRole } from '../../models/task.model';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  @Output() createTaskClicked = new EventEmitter<void>();
  @Output() searchChanged = new EventEmitter<string>();

  searchQuery = '';
  showUserMenu = false;
  
  currentUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: UserRole.DEVELOPER
  };

  onSearch(): void {
    this.searchChanged.emit(this.searchQuery);
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  openCreateTaskModal(): void {
    this.createTaskClicked.emit();
  }

  logout(): void {
    // Implement logout logic
    console.log('Logout clicked');
    this.showUserMenu = false;
  }
}
