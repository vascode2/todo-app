import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
});

export default api;

export const authApi = {
  googleLogin: (credential: string) => api.post('/auth/google', { credential }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
};

export const projectsApi = {
  list: () => api.get('/api/projects').then(r => r.data),
  get: (id: string) => api.get(`/api/projects/${id}`).then(r => r.data),
  create: (data: { name: string; description?: string; color?: string }) =>
    api.post('/api/projects', data).then(r => r.data),
  update: (id: string, data: Partial<{ name: string; description: string; color: string; position: number }>) =>
    api.patch(`/api/projects/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/api/projects/${id}`).then(r => r.data),
};

export const listsApi = {
  create: (projectId: string, name: string) =>
    api.post(`/api/projects/${projectId}/lists`, { name }).then(r => r.data),
  update: (projectId: string, listId: string, data: { name?: string; position?: number }) =>
    api.patch(`/api/projects/${projectId}/lists/${listId}`, data).then(r => r.data),
  delete: (projectId: string, listId: string) =>
    api.delete(`/api/projects/${projectId}/lists/${listId}`).then(r => r.data),
};

export const tasksApi = {
  list: (params?: Record<string, string>) =>
    api.get('/api/tasks', { params }).then(r => r.data),
  get: (id: string) => api.get(`/api/tasks/${id}`).then(r => r.data),
  create: (data: {
    title: string; description?: string; priority?: string;
    dueDate?: string; listId: string; labelIds?: string[];
  }) => api.post('/api/tasks', data).then(r => r.data),
  update: (id: string, data: Partial<{
    title: string; description: string; priority: string; dueDate: string | null;
    completed: boolean; position: number; listId: string; labelIds: string[];
  }>) => api.patch(`/api/tasks/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/api/tasks/${id}`).then(r => r.data),
  addSubtask: (taskId: string, title: string) =>
    api.post(`/api/tasks/${taskId}/subtasks`, { title }).then(r => r.data),
  updateSubtask: (taskId: string, subtaskId: string, data: { completed?: boolean; title?: string }) =>
    api.patch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, data).then(r => r.data),
  deleteSubtask: (taskId: string, subtaskId: string) =>
    api.delete(`/api/tasks/${taskId}/subtasks/${subtaskId}`).then(r => r.data),
  addComment: (taskId: string, body: string) =>
    api.post(`/api/tasks/${taskId}/comments`, { body }).then(r => r.data),
  deleteComment: (taskId: string, commentId: string) =>
    api.delete(`/api/tasks/${taskId}/comments/${commentId}`).then(r => r.data),
};

export const labelsApi = {
  list: (projectId: string) => api.get(`/api/projects/${projectId}/labels`).then(r => r.data),
  create: (projectId: string, data: { name: string; color: string }) =>
    api.post(`/api/projects/${projectId}/labels`, data).then(r => r.data),
  update: (projectId: string, labelId: string, data: { name?: string; color?: string }) =>
    api.patch(`/api/projects/${projectId}/labels/${labelId}`, data).then(r => r.data),
  delete: (projectId: string, labelId: string) =>
    api.delete(`/api/projects/${projectId}/labels/${labelId}`).then(r => r.data),
};
