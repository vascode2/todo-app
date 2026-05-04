import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskList, Task } from '../../types';
import TaskCard from './TaskCard';
import { tasksApi } from '../../api/client';

interface Props {
  list: TaskList;
  projectId: string;
  onTaskClick: (task: Task) => void;
  onDeleteList: (listId: string) => void;
}

export default function KanbanColumn({ list, projectId, onTaskClick, onDeleteList }: Props) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const qc = useQueryClient();

  const { setNodeRef, isOver } = useDroppable({ id: list.id, data: { type: 'list', listId: list.id } });

  const addTask = useMutation({
    mutationFn: (t: string) => tasksApi.create({ title: t, listId: list.id, priority: 'MEDIUM' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project', projectId] }); setTitle(''); setAdding(false); },
  });

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-700 text-sm">{list.name}</h3>
          <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{list.tasks.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setAdding(true)}
            className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button onClick={() => onDeleteList(list.id)}
            className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div ref={setNodeRef}
        className={`flex-1 rounded-xl p-2 min-h-24 transition-colors ${isOver ? 'bg-primary-50 border-2 border-dashed border-primary-300' : 'bg-gray-100'}`}>
        <SortableContext items={list.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {list.tasks.map(task => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))}
          </div>
        </SortableContext>

        {adding ? (
          <form className="mt-2" onSubmit={e => { e.preventDefault(); if (title.trim()) addTask.mutate(title.trim()); }}>
            <textarea autoFocus value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (title.trim()) addTask.mutate(title.trim()); } if (e.key === 'Escape') setAdding(false); }}
              placeholder="Task title..." rows={2}
              className="w-full text-sm border border-gray-300 rounded-lg p-2 resize-none focus:outline-none focus:border-primary-500" />
            <div className="flex gap-1 mt-1">
              <button type="submit" className="text-xs bg-primary-500 text-white px-3 py-1 rounded-md hover:bg-primary-600">Add</button>
              <button type="button" onClick={() => setAdding(false)} className="text-xs text-gray-500 px-2 py-1 rounded-md hover:bg-gray-200">Cancel</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setAdding(true)}
            className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add task
          </button>
        )}
      </div>
    </div>
  );
}
