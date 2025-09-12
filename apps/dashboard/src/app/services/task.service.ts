import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Task, TaskStatus, TaskPriority, Project, Board, BoardColumn } from '../models/task.model';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  private boardsSubject = new BehaviorSubject<Board[]>([]);

  public tasks$ = this.tasksSubject.asObservable();
  public projects$ = this.projectsSubject.asObservable();
  public boards$ = this.boardsSubject.asObservable();

  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor() {
    this.initializeMockData();
  }

  // Task operations
  getTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  getTaskById(id: string): Task | undefined {
    return this.tasksSubject.value.find(task => task.id === id);
  }

  createTask(task: Omit<Task, 'id' | 'createdDate' | 'updatedDate'>): Task {
    const newTask: Task = {
      ...task,
      id: this.generateId(),
      createdDate: new Date(),
      updatedDate: new Date()
    };
    
    const currentTasks = this.tasksSubject.value;
    this.tasksSubject.next([...currentTasks, newTask]);
    
    return newTask;
  }

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const currentTasks = this.tasksSubject.value;
    const taskIndex = currentTasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) return null;
    
    const updatedTask = {
      ...currentTasks[taskIndex],
      ...updates,
      updatedDate: new Date()
    };
    
    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = updatedTask;
    this.tasksSubject.next(updatedTasks);
    
    return updatedTask;
  }

  deleteTask(id: string): boolean {
    const currentTasks = this.tasksSubject.value;
    const filteredTasks = currentTasks.filter(task => task.id !== id);
    
    if (filteredTasks.length === currentTasks.length) return false;
    
    this.tasksSubject.next(filteredTasks);
    return true;
  }

  // Project operations
  getProjects(): Observable<Project[]> {
    return this.projects$;
  }

  createProject(project: Omit<Project, 'id' | 'createdDate' | 'tasks'>): Project {
    const newProject: Project = {
      ...project,
      id: this.generateId(),
      createdDate: new Date(),
      tasks: []
    };
    
    const currentProjects = this.projectsSubject.value;
    this.projectsSubject.next([...currentProjects, newProject]);
    
    return newProject;
  }

  // Board operations
  getBoards(): Observable<Board[]> {
    return this.boards$;
  }

  getBoardByProjectId(projectId: string): Board | undefined {
    return this.boardsSubject.value.find(board => board.projectId === projectId);
  }

  updateTaskStatus(taskId: string, newStatus: TaskStatus): void {
    this.updateTask(taskId, { status: newStatus });
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private initializeMockData(): void {
    // Initialize with some mock data
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Implement user authentication',
        description: 'Create login and registration functionality with JWT tokens',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        assignee: 'John Doe',
        reporter: 'Jane Smith',
        createdDate: new Date('2024-01-15'),
        updatedDate: new Date('2024-01-20'),
        dueDate: new Date('2024-02-01'),
        labels: ['backend', 'security'],
        comments: [],
        attachments: [],
        estimatedHours: 16,
        loggedHours: 8
      },
      {
        id: '2',
        title: 'Design dashboard UI',
        description: 'Create responsive dashboard with charts and widgets',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        assignee: 'Alice Johnson',
        reporter: 'Jane Smith',
        createdDate: new Date('2024-01-16'),
        updatedDate: new Date('2024-01-16'),
        dueDate: new Date('2024-01-30'),
        labels: ['frontend', 'ui/ux'],
        comments: [],
        attachments: [],
        estimatedHours: 12,
        loggedHours: 0
      },
      {
        id: '3',
        title: 'Setup CI/CD pipeline',
        description: 'Configure automated testing and deployment',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        assignee: 'Bob Wilson',
        reporter: 'John Doe',
        createdDate: new Date('2024-01-10'),
        updatedDate: new Date('2024-01-18'),
        dueDate: new Date('2024-01-25'),
        labels: ['devops', 'automation'],
        comments: [],
        attachments: [],
        estimatedHours: 8,
        loggedHours: 10
      },
      {
        id: '4',
        title: 'Write API documentation',
        description: 'Document all REST API endpoints with examples',
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.LOW,
        assignee: 'Carol Davis',
        reporter: 'Jane Smith',
        createdDate: new Date('2024-01-12'),
        updatedDate: new Date('2024-01-19'),
        labels: ['documentation'],
        comments: [],
        attachments: [],
        estimatedHours: 6,
        loggedHours: 5
      }
    ];

    const mockProjects: Project[] = [
      {
        id: 'proj-1',
        name: 'Task Management System',
        description: 'A comprehensive task management application',
        key: 'TMS',
        createdDate: new Date('2024-01-01'),
        members: ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Wilson', 'Carol Davis'],
        tasks: mockTasks
      }
    ];

    const mockBoards: Board[] = [
      {
        id: 'board-1',
        name: 'Main Board',
        projectId: 'proj-1',
        columns: [
          {
            id: 'col-1',
            name: 'To Do',
            status: TaskStatus.TODO,
            tasks: mockTasks.filter(t => t.status === TaskStatus.TODO),
            order: 1
          },
          {
            id: 'col-2',
            name: 'In Progress',
            status: TaskStatus.IN_PROGRESS,
            tasks: mockTasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
            order: 2
          },
          {
            id: 'col-3',
            name: 'In Review',
            status: TaskStatus.IN_REVIEW,
            tasks: mockTasks.filter(t => t.status === TaskStatus.IN_REVIEW),
            order: 3
          },
          {
            id: 'col-4',
            name: 'Done',
            status: TaskStatus.DONE,
            tasks: mockTasks.filter(t => t.status === TaskStatus.DONE),
            order: 4
          }
        ]
      }
    ];

    this.tasksSubject.next(mockTasks);
    this.projectsSubject.next(mockProjects);
    this.boardsSubject.next(mockBoards);
  }
}

