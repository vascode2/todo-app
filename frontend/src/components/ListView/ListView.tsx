import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, Task } from '../../types';
import PriorityBadge from '../UI/PriorityBadge';
import { tasksApi } from '../../api/client';

interface Props {
  project: Project;
  onTaskClick: (task: Task) => void;
  search: string;
}

export default function ListView({ project, onTaskClick, search }: Props) {
  const qc = useQueryClient();

  const toggleTask = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      tasksApi.update(id, { completed }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', project.id] }),
  });

  const allTasks = project.lists.flatMap(l =>
    l.tasks.map(t => ({ ...t, listName: l.name }))
  );

  const filtered = search
    ? allTasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : allTasks;

  const grouped = project.lists.map(l => ({
    ...l,
    tasks: filtered.filter(t => t.listId === l.id),
  })).filter(l => l.tasks.length > 0 || !search);

  return (
    <div className="flex-1 overflow-y-auto">
      {grouped.map(list => (
        <div key={list.id} className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">{list.name}</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {list.tasks.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">No tasks</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                    <th className="text-left px-4 py-2 w-8"></th>
                    <th className="text-left px-4 py-2">Title</th>
                    <th className="text-left px-4 py-2 w-24">Priority</th>
                    <th className="text-left px-4 py-2 w-28">Due Date</th>
                    <th className="text-left px-4 py-2 w-32">Labels</th>
                    <th className="text-left px-4 py-2 w-20">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {list.tasks.map((task, i) => (
                    <tr key={task.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${i === list.tasks.length - 1 ? 'border-b-0' : ''}`}
                      onClick={() => onTaskClick(task)}>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={task.completed}
                          onChange={e => toggleTask.mutate({ id: task.id, completed: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-primary-500 cursor-pointer" />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {task.title}
                        </span>
                        {task.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{task.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                      <td className="px-4 py-3">
                        {task.dueDate ? (
                          <span className="text-xs text-gray-500">{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {task.labels.map(l => (
                            <span key={l.id} className="text-xs px-1.5 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: l.color }}>{l.name}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {task.subtasks.length > 0 ? (
                          <span className="text-xs text-gray-400">
                            {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                          </span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
