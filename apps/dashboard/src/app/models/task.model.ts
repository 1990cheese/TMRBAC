export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  reporter: string;
  createdDate: Date;
  updatedDate: Date;
  dueDate?: Date;
  labels: string[];
  comments: Comment[];
  attachments: Attachment[];
  estimatedHours?: number;
  loggedHours?: number;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdDate: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  key: string;
  createdDate: Date;
  members: string[];
  tasks: Task[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  DEVELOPER = 'DEVELOPER',
  TESTER = 'TESTER'
}

export interface Board {
  id: string;
  name: string;
  columns: BoardColumn[];
  projectId: string;
}

export interface BoardColumn {
  id: string;
  name: string;
  status: TaskStatus;
  tasks: Task[];
  order: number;
}

