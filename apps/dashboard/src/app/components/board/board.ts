import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority, BoardColumn } from '../../models/task.model';
import { TaskCard } from '../task-card/task-card';
import { TaskForm } from '../task-form/task-form';

@Component({
  selector: 'app-board',
  imports: [CommonModule, FormsModule, TaskCard, TaskForm],
  templateUrl: './board.html',
  styleUrl: './board.scss'
})
export class Board implements OnInit {
  @Output() taskClicked = new EventEmitter<Task>();
  @Output() createTaskClicked = new EventEmitter<TaskStatus>();

  boardName = 'Main Board';
  viewMode: 'board' | 'list' = 'board';
  showFilters = false;

  columns: BoardColumn[] = [];
  filteredColumns: BoardColumn[] = [];
  allFilteredTasks: Task[] = [];
  allTasks: Task[] = [];

  selectedAssignee = '';
  selectedPriority = '';
  assignees: string[] = [];
  priorities = Object.values(TaskPriority);

  draggedTask: Task | null = null;

  showTaskForm = false;
  newTaskStatus: TaskStatus | null = null;

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    // Subscribe to tasks and rebuild columns on every change
    this.taskService.tasks$.subscribe(tasks => {
      this.allTasks = tasks;
      this.rebuildColumns();
      this.updateFilteredData();
      this.updateAssignees();
    });
  }

  private rebuildColumns(): void {
    // Define the columns and their order
    const columnDefs: { status: TaskStatus; name: string; order: number }[] = [
      { status: TaskStatus.TODO, name: 'To Do', order: 1 },
      { status: TaskStatus.IN_PROGRESS, name: 'In Progress', order: 2 },
      { status: TaskStatus.IN_REVIEW, name: 'In Review', order: 3 },
      { status: TaskStatus.DONE, name: 'Done', order: 4 }
    ];
    this.columns = columnDefs.map(def => ({
      id: `col-${def.order}`,
      name: def.name,
      status: def.status,
      tasks: this.allTasks.filter(task => task.status === def.status),
      order: def.order
    }));
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  toggleView(): void {
    this.viewMode = this.viewMode === 'board' ? 'list' : 'board';
  }

  applyFilters(): void {
    this.updateFilteredData();
  }

  private updateFilteredData(): void {
    this.filteredColumns = this.columns.map(column => ({
      ...column,
      tasks: this.filterTasks(column.tasks)
    }));

    this.allFilteredTasks = this.filterTasks(
      this.columns.flatMap(column => column.tasks)
    );
  }

  private filterTasks(tasks: Task[]): Task[] {
    return tasks.filter(task => {
      const assigneeMatch = !this.selectedAssignee || task.assignee === this.selectedAssignee;
      const priorityMatch = !this.selectedPriority || task.priority === this.selectedPriority;
      return assigneeMatch && priorityMatch;
    });
  }

  private updateAssignees(): void {
    const allTasks = this.columns.flatMap(column => column.tasks);
    this.assignees = [...new Set(allTasks.map(task => task.assignee).filter((assignee): assignee is string => !!assignee))];
  }

  onDragStart(event: DragEvent, task: Task): void {
    this.draggedTask = task;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', task.id);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }


  onDrop(event: DragEvent, newStatus: TaskStatus): void {
    event.preventDefault();

    if (this.draggedTask && this.draggedTask.status !== newStatus) {
      this.taskService.updateTaskStatus(this.draggedTask.id, newStatus);
      this.updateFilteredData();
      this.updateAssignees();
    }

    this.draggedTask = null;
  }

  onTaskClicked(task: Task): void {
    this.taskClicked.emit(task);
  }

  onTaskUpdated(task: Task): void {
    // Refresh columns and assignees after a task update
    this.updateFilteredData();
    this.updateAssignees();
    console.log('Task updated:', task);
  }

  addTaskToColumn(status: TaskStatus): void {
    this.createTaskClicked.emit(status);
  }

  onTaskSaved(newTask: Task): void {
    // Add the new task to the service, which will trigger a rebuild
    const { id, createdDate, updatedDate, ...taskData } = newTask;
    this.taskService.createTask(taskData);
    this.showTaskForm = false;
  }

  closeTaskForm(): void {
    this.showTaskForm = false;
  }

  editTask(task: Task): void {
    this.taskClicked.emit(task);
  }

  deleteTask(taskId: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId);
    }
  }
}
