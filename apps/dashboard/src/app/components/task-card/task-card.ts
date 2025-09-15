
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Task } from '../../models/task.model';
import { TaskPriority } from '../../models/task.model';

@Component({
  selector: 'app-task-card',
  imports: [CommonModule],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss'
})
export class TaskCard {
  get assigneeInitials(): string {
    if (!this.task || !this.task.assignee) return '?';
    const assignee = this.task.assignee as any;
    if (typeof assignee === 'string') {
      return assignee.length > 0 ? assignee[0].toUpperCase() : '?';
    }
    if (assignee && typeof assignee === 'object') {
      const first = assignee.firstName?.trim()?.charAt(0) || '';
      const last = assignee.lastName?.trim()?.charAt(0) || '';
      if (first || last) return (first + last).toUpperCase();
      if (assignee.email) return assignee.email.charAt(0).toUpperCase();
    }
    return '?';
  }

  get assigneeName(): string {
    if (!this.task || !this.task.assignee) return 'Unassigned';
    const assignee = this.task.assignee as any;
    if (typeof assignee === 'string') {
      return assignee;
    }
    if (assignee && typeof assignee === 'object') {
      const first = assignee.firstName?.trim() || '';
      const last = assignee.lastName?.trim() || '';
      const name = (first + (last ? ' ' + last : '')).trim();
      if (name) return name;
      if (assignee.email) return assignee.email;
    }
    return 'Unassigned';
  }
  @Input() task!: Task;
  @Input() draggable = false;
  @Output() taskClicked = new EventEmitter<Task>();
  @Output() taskUpdated = new EventEmitter<Task>();

  isDragging = false;

  onCardClick(): void {
    this.taskClicked.emit(this.task);
  }

  onDragStart(event: DragEvent): void {
    this.isDragging = true;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', this.task.id);
    }
  }

  onDragEnd(): void {
    this.isDragging = false;
  }

  getPriorityIcon(): string {
    switch (this.task.priority) {
      case TaskPriority.CRITICAL:
        return '🔴';
      case TaskPriority.HIGH:
        return '🟠';
      case TaskPriority.MEDIUM:
        return '🟡';
      case TaskPriority.LOW:
        return '🟢';
      default:
        return '⚪';
    }
  }


  isOverdue(): boolean {
    if (!this.task.dueDate) return false;
    return new Date(this.task.dueDate) < new Date();
  }

  getProgressPercentage(): number {
    if (!this.task.estimatedHours || !this.task.loggedHours) return 0;
    return Math.min((this.task.loggedHours / this.task.estimatedHours) * 100, 100);
  }
}
