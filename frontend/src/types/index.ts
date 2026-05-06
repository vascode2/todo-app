export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

export interface Label {
    id: string;
    name: string;
    color: string;
    projectId: string;
}

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
    position: number;
    taskId: string;
}

export interface Comment {
    id: string;
    body: string;
    createdAt: string;
    taskId: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    priority: Priority;
    dueDate?: string;
    position: number;
    completed: boolean;
    listId: string;
    list?: {
      id: string;
      name: string;
      project?: {
        id: string;
        name: string;
      };
    };
    labels: Label[];
    subtasks: Subtask[];
    _count?: { comments: number };
    comments?: Comment[];
}

export interface TaskList {
    id: string;
    name: string;
    position: number;
    projectId: string;
    tasks: Task[];
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    color: string;
    position: number;
    lists: TaskList[];
    labels: Label[];
}
