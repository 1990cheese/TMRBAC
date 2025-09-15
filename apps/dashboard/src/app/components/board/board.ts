import { Component, OnInit, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority, BoardColumn } from '../../models/task.model';
import { TaskCard } from '../task-card/task-card';

import { TaskForm } from '../task-form/task-form';
import { AuthService } from '../../services/auth.service';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-board',
  imports: [CommonModule, FormsModule, TaskCard, TaskForm],
  templateUrl: './board.html',
  styleUrl: './board.scss'
})

export class Board implements OnInit, OnChanges {
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchQuery']) {
      this.updateFilteredData();
    }
  }
  // Search query from header
  @Input() searchQuery: string = '';
  getAssigneeAvatar(task: Task): string {
    if (!task.assignee) return '?';
    if (typeof task.assignee === 'string' && !!task.assignee) {
      return (task.assignee as string).charAt(0).toUpperCase();
    }
    if (typeof task.assignee === 'object' && task.assignee !== null) {
      const first = task.assignee.firstName?.trim()?.charAt(0) || '';
      const last = task.assignee.lastName?.trim()?.charAt(0) || '';
      if (first || last) return (first + last).toUpperCase();
      if (task.assignee.email) return task.assignee.email.charAt(0).toUpperCase();
    }
    return '?';
  }
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
  selectedTask: Task | null = null;

  constructor(private taskService: TaskService, private authService: AuthService, private searchService: SearchService) {
    this.searchService.searchQuery$.subscribe(query => {
      this.searchQuery = query;
      this.updateFilteredData();
    });
  }
  logout(): void {
    this.authService.logout();
  }

  ngOnInit(): void {
    // Subscribe to tasks from backend
    this.taskService.getTasks().subscribe(tasks => {
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
      let assigneeValue = '';
      if (task.assignee) {
        if (typeof task.assignee === 'string') {
          assigneeValue = task.assignee;
        } else if (typeof task.assignee === 'object' && task.assignee.email) {
          assigneeValue = task.assignee.email;
        }
      }
      const assigneeMatch = !this.selectedAssignee || assigneeValue === this.selectedAssignee;
      const priorityMatch = !this.selectedPriority || task.priority === this.selectedPriority;
      const titleMatch = !this.searchQuery || (task.title?.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return assigneeMatch && priorityMatch && titleMatch;
    });
  }

  private updateAssignees(): void {
    const allTasks = this.columns.flatMap(column => column.tasks);
    this.assignees = [...new Set(
      allTasks
        .map(task => {
          const a = task.assignee;
          if (!a) return undefined;
          if (typeof a === 'string') return a;
          if (typeof a === 'object' && a.email) return a.email;
          return undefined;
        })
        .filter((assignee): assignee is string => !!assignee)
    )];
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
      this.taskService.updateTask(this.draggedTask.id, { status: newStatus }).subscribe(() => {
        this.taskService.getTasks().subscribe(tasks => {
          this.allTasks = tasks;
          this.rebuildColumns();
          this.updateFilteredData();
          this.updateAssignees();
        });
      });
    }
    this.draggedTask = null;
  }

  onTaskClicked(task: Task): void {
    this.selectedTask = task;
    this.showTaskForm = true;
    // Only reset newTaskStatus if editing an existing task
    if (task) {
      this.newTaskStatus = null;
    }
    this.taskClicked.emit(task);
  }

  onTaskUpdated(task: Task): void {
    // Refresh columns and assignees after a task update
    this.updateFilteredData();
    this.updateAssignees();
    console.log('Task updated:', task);
  }

  addTaskToColumn(status: TaskStatus): void {
    this.selectedTask = null;
    this.newTaskStatus = status;
    this.showTaskForm = true;
    this.createTaskClicked.emit(status);
  }

  onTaskSaved(newTask: Task): void {
    // Prepare payload for backend
    const payload: any = {
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      priority: newTask.priority,
      assigneeId: typeof newTask.assignee === 'object' ? newTask.assignee.id : newTask.assignee,
      reporterId: typeof newTask.reporter === 'object' ? newTask.reporter.id : newTask.reporter,
    };
    if (this.selectedTask) {
      // Only send patch if there are changes
      const original = this.selectedTask;
      const hasChanges =
        original.title !== newTask.title ||
        original.description !== newTask.description ||
        original.status !== newTask.status ||
        original.priority !== newTask.priority ||
        ((original.assignee && newTask.assignee && original.assignee.id !== newTask.assignee.id) || (!original.assignee && newTask.assignee) || (original.assignee && !newTask.assignee)) ||
        ((original.reporter && newTask.reporter && original.reporter.id !== newTask.reporter.id) || (!original.reporter && newTask.reporter) || (original.reporter && !newTask.reporter));
      if (hasChanges) {
        this.taskService.updateTask(newTask.id, payload).subscribe(() => {
          this.taskService.getTasks().subscribe(tasks => {
            this.allTasks = tasks;
            this.rebuildColumns();
            this.updateFilteredData();
            this.updateAssignees();
          });
        });
      }
    } else {
      // Creating new task
      console.log('payload' , payload)
      this.taskService.createTask(payload).subscribe(() => {
        this.taskService.getTasks().subscribe(tasks => {
          this.allTasks = tasks;
          this.rebuildColumns();
          this.updateFilteredData();
          this.updateAssignees();
        });
      });
    }
    this.showTaskForm = false;
    this.selectedTask = null;
    this.newTaskStatus = null;
  }

  closeTaskForm(): void {
    this.showTaskForm = false;
    this.selectedTask = null;
    this.newTaskStatus = null;
  }

  editTask(task: Task): void {
    this.taskClicked.emit(task);
  }

  deleteTask(taskId: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId).subscribe(() => {
        this.taskService.getTasks().subscribe(tasks => {
          this.allTasks = tasks;
          this.rebuildColumns();
          this.updateFilteredData();
          this.updateAssignees();
        });
      });
    }
  }
}
