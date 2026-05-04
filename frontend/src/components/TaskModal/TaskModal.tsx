import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { tasksApi } from '../../api/client';
import { Task, Priority, Label } from '../../types';
import PriorityBadge from '../UI/PriorityBadge';

interface Props {
  taskId: string;
  projectId: string;
  labels: Label[];
  onClose: () => void;
}

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function TaskModal({ taskId, projectId, labels, onClose }: Props) {
  const qc = useQueryClient();
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descVal, setDescVal] = useState('');

  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.get(taskId),
  });

  useEffect(() => {
    if (task) { setTitleVal(task.title); setDescVal(task.description || ''); }
  }, [task]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['task', taskId] });
    qc.invalidateQueries({ queryKey: ['project', projectId] });
  };

  const updateTask = useMutation({ mutationFn: (data: Parameters<typeof tasksApi.update>[1]) => tasksApi.update(taskId, data), onSuccess: invalidate });
  const addSubtask = useMutation({ mutationFn: (title: string) => tasksApi.addSubtask(taskId, title), onSuccess: () => { invalidate(); setNewSubtask(''); } });
  const toggleSubtask = useMutation({ mutationFn: ({ id, completed }: { id: string; completed: boolean }) => tasksApi.updateSubtask(taskId, id, { completed }), onSuccess: invalidate });
  const deleteSubtask = useMutation({ mutationFn: (id: string) => tasksApi.deleteSubtask(taskId, id), onSuccess: invalidate });
  const addComment = useMutation({ mutationFn: (body: string) => tasksApi.addComment(taskId, body), onSuccess: () => { invalidate(); setNewComment(''); } });
  const deleteComment = useMutation({ mutationFn: (id: string) => tasksApi.deleteComment(taskId, id), onSuccess: invalidate });
  const deleteTask = useMutation({ mutationFn: () => tasksApi.delete(taskId), onSuccess: () => { qc.invalidateQueries({ queryKey: ['project', projectId] }); onClose(); } });

  if (isLoading || !task) return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
    </div>
  );

  const completedSubtasks = task.subtasks?.filter(s => s.completed).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
          <div className="flex-1 mr-4">
            {editingTitle ? (
              <input autoFocus value={titleVal} onChange={e => setTitleVal(e.target.value)}
                onBlur={() => { updateTask.mutate({ title: titleVal }); setEditingTitle(false); }}
                onKeyDown={e => { if (e.key === 'Enter') { updateTask.mutate({ title: titleVal }); setEditingTitle(false); } if (e.key === 'Escape') setEditingTitle(false); }}
                className="text-xl font-bold text-gray-900 w-full border-b-2 border-primary-500 outline-none bg-transparent" />
            ) : (
              <h2 className={`text-xl font-bold text-gray-900 cursor-pointer hover:text-primary-600 transition-colors ${task.completed ? 'line-through text-gray-400' : ''}`}
                onClick={() => setEditingTitle(true)}>{task.title}</h2>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400">{task.list?.project?.name} / {task.list?.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => updateTask.mutate({ completed: !task.completed })}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${task.completed ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {task.completed ? '✓ Done' : 'Mark done'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Meta row */}
          <div className="flex flex-wrap gap-4">
            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Priority</label>
              <select value={task.priority}
                onChange={e => updateTask.mutate({ priority: e.target.value as Priority })}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary-500">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Due date</label>
              <input type="date" value={task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''}
                onChange={e => updateTask.mutate({ dueDate: e.target.value || null })}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary-500" />
            </div>

            {/* Labels */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Labels</label>
              <div className="flex flex-wrap gap-1">
                {labels.map(l => {
                  const active = task.labels.some(tl => tl.id === l.id);
                  return (
                    <button key={l.id}
                      onClick={() => {
                        const ids = active
                          ? task.labels.filter(tl => tl.id !== l.id).map(tl => tl.id)
                          : [...task.labels.map(tl => tl.id), l.id];
                        updateTask.mutate({ labelIds: ids });
                      }}
                      className={`text-xs px-2 py-0.5 rounded-full border-2 transition-all ${active ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-600'}`}
                      style={active ? { backgroundColor: l.color, borderColor: l.color } : {}}>
                      {l.name}
                    </button>
                  );
                })}
                {labels.length === 0 && <span className="text-xs text-gray-400">No labels in this project</span>}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
            {editingDesc ? (
              <textarea autoFocus value={descVal} onChange={e => setDescVal(e.target.value)} rows={4}
                onBlur={() => { updateTask.mutate({ description: descVal }); setEditingDesc(false); }}
                onKeyDown={e => { if (e.key === 'Escape') { setEditingDesc(false); } }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-primary-500" />
            ) : (
              <div onClick={() => setEditingDesc(true)}
                className="min-h-12 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors">
                {task.description || <span className="text-gray-400">Add description…</span>}
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-400">
                Subtasks {totalSubtasks > 0 && `(${completedSubtasks}/${totalSubtasks})`}
              </label>
            </div>
            {totalSubtasks > 0 && (
              <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }} />
              </div>
            )}
            <div className="space-y-1 mb-2">
              {task.subtasks?.map(s => (
                <div key={s.id} className="flex items-center gap-2 group">
                  <input type="checkbox" checked={s.completed}
                    onChange={e => toggleSubtask.mutate({ id: s.id, completed: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary-500" />
                  <span className={`text-sm flex-1 ${s.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{s.title}</span>
                  <button onClick={() => deleteSubtask.mutate(s.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={e => { e.preventDefault(); if (newSubtask.trim()) addSubtask.mutate(newSubtask.trim()); }}>
              <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                placeholder="Add subtask…"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-500" />
            </form>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Comments</label>
            <div className="space-y-2 mb-2">
              {task.comments?.map(c => (
                <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2 group flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-gray-700">{c.body}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</p>
                  </div>
                  <button onClick={() => deleteComment.mutate(c.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={e => { e.preventDefault(); if (newComment.trim()) addComment.mutate(newComment.trim()); }}
              className="flex gap-2">
              <input value={newComment} onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment…"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-500" />
              <button type="submit" disabled={!newComment.trim()}
                className="text-sm bg-primary-500 text-white px-3 py-1.5 rounded-lg hover:bg-primary-600 disabled:opacity-50">Post</button>
            </form>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button onClick={() => { if (confirm('Delete this task?')) deleteTask.mutate(); }}
            className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete task
          </button>
        </div>
      </div>
    </div>
  );
}
