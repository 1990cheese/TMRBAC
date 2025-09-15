import { Component, Output, EventEmitter } from '@angular/core';
import { SearchService } from '../../services/search.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
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
  currentUser: User | null = null;

  constructor(private authService: AuthService, private router: Router, private searchService: SearchService) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = {
          id: user.id ?? '',
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          email: user.email ?? 'Unknown'
        };
      } else {
        this.currentUser = null;
      }
    });
  }

  onSearch(): void {
    this.searchService.setSearchQuery(this.searchQuery);
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
    // Optionally clear user state
    this.authService.logout();
  }
}
