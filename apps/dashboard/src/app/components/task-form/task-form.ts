import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';

@Component({
  selector: 'app-task-form',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss'
})
export class TaskForm implements OnInit, OnChanges {
  @Input() task: Task | null = null;
  @Input() initialStatus: TaskStatus | null = null;
  @Output() taskSaved = new EventEmitter<Task>();
  @Output() cancelled = new EventEmitter<void>();

  taskForm!: FormGroup;
  isEditMode = false;
  selectedLabels: string[] = [];
  newLabel = '';

  statusOptions = [
    { value: TaskStatus.TODO, label: 'To Do' },
    { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
    { value: TaskStatus.IN_REVIEW, label: 'In Review' },
    { value: TaskStatus.DONE, label: 'Done' }
  ];

  priorityOptions = [
    { value: TaskPriority.LOW, label: 'Low', icon: '🟢' },
    { value: TaskPriority.MEDIUM, label: 'Medium', icon: '🟡' },
    { value: TaskPriority.HIGH, label: 'High', icon: '🟠' },
    { value: TaskPriority.CRITICAL, label: 'Critical', icon: '🔴' }
  ];

  availableUsers = [
    'John Doe',
    'Jane Smith',
    'Alice Johnson',
    'Bob Wilson',
    'Carol Davis'
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(): void {
    if (this.taskForm) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    this.isEditMode = !!this.task;
    
    const defaultStatus = this.initialStatus || TaskStatus.TODO;
    
    this.taskForm = this.fb.group({
      title: [this.task?.title || '', [Validators.required]],
      description: [this.task?.description || ''],
      status: [this.task?.status || defaultStatus],
      priority: [this.task?.priority || TaskPriority.MEDIUM],
      assignee: [this.task?.assignee || ''],
      reporter: [this.task?.reporter || 'John Doe', [Validators.required]],
      dueDate: [this.task?.dueDate ? this.formatDateForInput(this.task.dueDate) : ''],
      estimatedHours: [this.task?.estimatedHours || null],
      loggedHours: [this.task?.loggedHours || null]
    });

    this.selectedLabels = this.task?.labels ? [...this.task.labels] : [];
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  addLabel(): void {
    if (this.newLabel.trim() && !this.selectedLabels.includes(this.newLabel.trim())) {
      this.selectedLabels.push(this.newLabel.trim());
      this.newLabel = '';
    }
  }

  removeLabel(index: number): void {
    this.selectedLabels.splice(index, 1);
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      
      const taskData: Task = {
        id: this.task?.id || this.generateId(),
        title: formValue.title,
        description: formValue.description,
        status: formValue.status,
        priority: formValue.priority,
        assignee: formValue.assignee || undefined,
        reporter: formValue.reporter,
        createdDate: this.task?.createdDate || new Date(),
        updatedDate: new Date(),
        dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined,
        labels: [...this.selectedLabels],
        comments: this.task?.comments || [],
        attachments: this.task?.attachments || [],
        estimatedHours: formValue.estimatedHours || undefined,
        loggedHours: formValue.loggedHours || undefined
      };

      this.taskSaved.emit(taskData);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
