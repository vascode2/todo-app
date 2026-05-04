import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isPast, isToday } from 'date-fns';
import { tasksApi } from '../../api/client';
import { Task, Priority } from '../../types';
import PriorityBadge from '../UI/PriorityBadge';

export default function AllTasksPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks', search, priority],
    queryFn: () => tasksApi.list({
      ...(search ? { search } : {}),
      ...(priority ? { priority } : {}),
    }),
  });

  const toggleTask = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => tasksApi.update(id, { completed }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-4">
        <h1 className="text-lg font-bold text-gray-900 flex-1">All Tasks</h1>
        <div className="relative">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="text-sm pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 w-48" />
        </div>
        <select value={priority} onChange={e => setPriority(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary-500">
          <option value="">All priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>No tasks found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                  <th className="text-left px-4 py-2 w-8"></th>
                  <th className="text-left px-4 py-2">Title</th>
                  <th className="text-left px-4 py-2 w-24">Priority</th>
                  <th className="text-left px-4 py-2 w-28">Due</th>
                  <th className="text-left px-4 py-2 w-32">Labels</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, i) => {
                  const isOverdue = task.dueDate && !task.completed && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
                  return (
                    <tr key={task.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${i === tasks.length - 1 ? 'border-b-0' : ''}`}
                      onClick={() => setSelectedTask(task)}>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={task.completed}
                          onChange={e => toggleTask.mutate({ id: task.id, completed: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-primary-500 cursor-pointer" />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</span>
                      </td>
                      <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                      <td className="px-4 py-3">
                        {task.dueDate
                          ? <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>{format(new Date(task.dueDate), 'MMM d')}</span>
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {task.labels.map(l => (
                            <span key={l.id} className="text-xs px-1.5 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: l.color }}>{l.name}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
