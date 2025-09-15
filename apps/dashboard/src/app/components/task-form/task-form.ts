import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';
import { UsersService } from '../../services/users.service';
import { User } from '../../models/task.model';
import { AuthService } from '../../services/auth.service';
import { OrganizationsService } from '../../services/organizations.service';

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

  availableUsers: User[] = [];
  currentUserOrgId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private authService: AuthService,
    private organizationsService: OrganizationsService
  ) {}

  ngOnInit(): void {
  console.log('[TaskForm] ngOnInit status:', this.task?.status, this.initialStatus);
    // Get current user's organizationId and role
    const currentUser = this.authService.getUserFromStorage();
    this.currentUserOrgId = currentUser?.organizationId ?? null;
    const currentUserRole = currentUser?.roles?.[0]?.name ?? null;
    const orgId = this.currentUserOrgId ? String(this.currentUserOrgId) : '';
    if (!orgId) {
      this.availableUsers = [];
      this.initializeForm();
      return;
    }
    Promise.all([
      this.usersService.getUsers().toPromise(),
      this.organizationsService.getOrganizations().toPromise()
    ]).then((results) => {
      const users = (results[0] ?? []).map((u: any) => ({
        id: u.id,
        firstName: typeof u.firstName === 'string' ? u.firstName : '',
        lastName: typeof u.lastName === 'string' ? u.lastName : '',
        email: typeof u.email === 'string' ? u.email : '',
        organizationId: typeof u.organizationId === 'string' ? u.organizationId : ''
      }));
      const orgs: any[] = results[1] ?? [];
      let orgIds: string[] = [];
      if (currentUserRole === 'OWNER') {
        // Find all child orgs recursively
        const findChildOrgIds = (parentId: string): string[] => {
          const children: any[] = orgs.filter((o: any) => o.parentId === parentId);
          let ids: string[] = children.map((c: any) => c.id);
          for (const child of children) {
            ids = ids.concat(findChildOrgIds(child.id));
          }
          return ids;
        };
        orgIds = [orgId, ...findChildOrgIds(orgId)];
      } else {
        orgIds = [orgId];
      }
      this.availableUsers = users
        .filter((u: any) => orgIds.includes(u.organizationId))
        .map((u: any) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email
        }));
      this.initializeForm();
    });
  }

  ngOnChanges(): void {
  console.log('[TaskForm] ngOnChanges status:', this.task?.status, this.initialStatus);
    if (this.taskForm) {
      this.taskForm.markAsDirty();
      console.log(this.taskForm)
      this.initializeForm();
    }
  }

  onDropdownChange(): void {
  console.log('[TaskForm] onDropdownChange status:', this.taskForm?.get('status')?.value);
    if (this.taskForm) {
      this.taskForm.markAsDirty();
      Object.keys(this.taskForm.controls).forEach(key => {
        this.taskForm.controls[key].markAsTouched();
        this.taskForm.controls[key].updateValueAndValidity();
      });
    }
  }

  private initializeForm(): void {
  console.log('[TaskForm] initializeForm status:', this.task?.status, this.initialStatus);
    this.isEditMode = !!this.task;

    let statusInit: TaskStatus;
    if (this.isEditMode) {
      statusInit = this.task?.status || TaskStatus.TODO;
    } else {
      statusInit = this.initialStatus ?? TaskStatus.TODO;
    }

    console.log('statusInit:', statusInit);
    this.taskForm = this.fb.group({
      title: [this.task?.title || '', [Validators.required]],
      description: [this.task?.description || ''],
      status: [statusInit],
      priority: [this.task?.priority || TaskPriority.MEDIUM, [Validators.required]],
      assignee: [this.task?.assignee?.id || '', [Validators.required]],
      reporter: [this.task?.reporter?.id || '', [Validators.required]],
    });

    this.taskForm.markAsPristine();

        

  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }


  onSubmit(): void {
  console.log('[TaskForm] onSubmit status:', this.taskForm?.get('status')?.value);
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      // Find selected assignee and reporter objects
      const assigneeObj = this.availableUsers.find(u => u.id === formValue.assignee) || undefined;
      const reporterObj = this.availableUsers.find(u => u.id === formValue.reporter) || undefined;
      const taskData: Task = {
        id: this.task?.id || this.generateId(),
        title: formValue.title,
        description: formValue.description,
        status: formValue.status,
        priority: formValue.priority,
        assignee: assigneeObj,
        reporter: reporterObj,
        createdDate: this.task?.createdDate || new Date(),
        updatedDate: new Date(),
      };
      console.log('taskData to emit:', taskData);
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
