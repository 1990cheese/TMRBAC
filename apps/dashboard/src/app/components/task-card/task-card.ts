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
