import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, isToday } from 'date-fns';
import { Task } from '../../types';
import PriorityBadge from '../UI/PriorityBadge';

interface Props {
  task: Task;
  onClick: (task: Task) => void;
}

export default function TaskCard({ task, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const completedSubtasks = task.subtasks?.filter(s => s.completed).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;
  const isOverdue = task.dueDate && !task.completed && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={() => onClick(task)}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer hover:shadow-md hover:border-primary-300 transition-all select-none ${task.completed ? 'opacity-60' : ''}`}>

      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map(l => (
            <span key={l.id} className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
              style={{ backgroundColor: l.color }}>{l.name}</span>
          ))}
        </div>
      )}

      <p className={`text-sm font-medium text-gray-800 leading-snug ${task.completed ? 'line-through text-gray-400' : ''}`}>
        {task.title}
      </p>

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <PriorityBadge priority={task.priority} />

        {task.dueDate && (
          <span className={`text-xs flex items-center gap-0.5 ${isOverdue ? 'text-red-600 font-medium' : isDueToday ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>

      {(totalSubtasks > 0 || (task._count?.comments ?? 0) > 0) && (
        <div className="flex items-center gap-3 mt-2">
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-400">{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}
          {(task._count?.comments ?? 0) > 0 && (
            <span className="text-xs text-gray-400 flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {task._count?.comments}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
