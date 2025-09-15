import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from './components/header/header';
import { Board } from './components/board/board';
import { TaskForm } from './components/task-form/task-form';
import { DashboardLayout } from './components/dashboard-layout/dashboard-layout';
import { Task, TaskStatus } from './models/task.model';
import { TaskService } from './services/task.service';
import { RouterOutlet } from '@angular/router';
import { AccessWarningService } from './services/access-warning.service';
import { WarningModalComponent } from './components/shared/warning-modal.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, Header, Board, TaskForm, RouterOutlet, WarningModalComponent, DashboardLayout],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'Task Management System';
  showTaskModal = false;
  selectedTask: Task | null = null;
  initialTaskStatus: TaskStatus | null = null;
  searchQuery = '';
  accessWarning: string | null = null;

  constructor(
    private taskService: TaskService,
    private accessWarningService: AccessWarningService,
    public router: Router
  ) {
    this.accessWarningService.warning$.subscribe(msg => {
      this.accessWarning = msg;
    });
  }

  openCreateTaskModal(status?: TaskStatus): void {
    this.selectedTask = null;
    this.initialTaskStatus = status || TaskStatus.TODO;
    this.showTaskModal = true;
  }

  openTaskDetails(task: Task): void {
    this.selectedTask = task;
    this.initialTaskStatus = null;
    this.showTaskModal = true;
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.selectedTask = null;
    this.initialTaskStatus = null;
  }

  onTaskSaved(task: Task): void {
    if (this.selectedTask) {
      // Update existing task
      this.taskService.updateTask(task.id, task);
    } else {
      // Create new task
      this.taskService.createTask(task);
    }
    this.closeTaskModal();
  }

  onSearchChanged(query: string): void {
    this.searchQuery = query;
    // Implement search functionality
    console.log('Search query:', query);
  }

  closeAccessWarning() {
    this.accessWarningService.clearWarning();
  }

  isAuthRoute(): boolean {
    const url = this.router.url;
    return url === '/login' || url === '/register';
  }
}