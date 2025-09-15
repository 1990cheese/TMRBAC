import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { Board } from '../board/board';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, Header, Board],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss'
})
export class DashboardLayout {
  @Input() searchQuery = '';

  onSearchChanged(query: string) {
    this.searchQuery = query;
  }

  openCreateTaskModal() {}
  openTaskDetails(task: any) {}
}
