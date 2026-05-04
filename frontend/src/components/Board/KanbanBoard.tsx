import { useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay, closestCorners,
} from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, Task, TaskList } from '../../types';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { listsApi, tasksApi } from '../../api/client';

interface Props {
  project: Project;
  onTaskClick: (task: Task) => void;
  search: string;
}

export default function KanbanBoard({ project, onTaskClick, search }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const qc = useQueryClient();
  const [addingList, setAddingList] = useState(false);
  const [listName, setListName] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const addList = useMutation({
    mutationFn: (name: string) => listsApi.create(project.id, name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project', project.id] }); setListName(''); setAddingList(false); },
  });

  const deleteList = useMutation({
    mutationFn: (listId: string) => listsApi.delete(project.id, listId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', project.id] }),
  });

  const moveTask = useMutation({
    mutationFn: ({ taskId, listId, position }: { taskId: string; listId: string; position: number }) =>
      tasksApi.update(taskId, { listId, position }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', project.id] }),
  });

  function findListByTaskId(taskId: string): TaskList | undefined {
    return project.lists.find(l => l.tasks.some(t => t.id === taskId));
  }

  function onDragStart(e: DragStartEvent) {
    if (e.active.data.current?.type === 'task') setActiveTask(e.active.data.current.task);
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const activeList = findListByTaskId(active.id as string);
    const overListId = over.data.current?.type === 'list'
      ? over.id as string
      : findListByTaskId(over.id as string)?.id;

    if (!activeList || !overListId || activeList.id === overListId) return;

    qc.setQueryData(['project', project.id], (old: Project | undefined) => {
      if (!old) return old;
      const task = activeList.tasks.find(t => t.id === active.id)!;
      return {
        ...old,
        lists: old.lists.map(l => {
          if (l.id === activeList.id) return { ...l, tasks: l.tasks.filter(t => t.id !== active.id) };
          if (l.id === overListId) return { ...l, tasks: [...l.tasks, { ...task, listId: overListId }] };
          return l;
        }),
      };
    });
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const task = active.data.current?.task as Task;
    const overListId = over.data.current?.type === 'list'
      ? over.id as string
      : findListByTaskId(over.id as string)?.id;

    if (!overListId) return;
    const targetList = project.lists.find(l => l.id === overListId);
    if (!targetList) return;

    const overIndex = targetList.tasks.findIndex(t => t.id === over.id);
    const position = overIndex >= 0 ? overIndex : targetList.tasks.length;

    moveTask.mutate({ taskId: task.id, listId: overListId, position });
  }

  const filteredLists = search
    ? project.lists.map(l => ({
        ...l,
        tasks: l.tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase())),
      }))
    : project.lists;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners}
      onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
      <div className="flex gap-4 h-full overflow-x-auto pb-4 items-start">
        {filteredLists.map(list => (
          <KanbanColumn key={list.id} list={list} projectId={project.id}
            onTaskClick={onTaskClick}
            onDeleteList={id => deleteList.mutate(id)} />
        ))}

        <div className="w-72 shrink-0">
          {addingList ? (
            <form onSubmit={e => { e.preventDefault(); if (listName.trim()) addList.mutate(listName.trim()); }}
              className="bg-gray-100 rounded-xl p-3">
              <input autoFocus value={listName} onChange={e => setListName(e.target.value)}
                onBlur={() => { if (!listName.trim()) setAddingList(false); }}
                placeholder="List name" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
              <div className="flex gap-1 mt-2">
                <button type="submit" className="text-xs bg-primary-500 text-white px-3 py-1.5 rounded-md hover:bg-primary-600">Add list</button>
                <button type="button" onClick={() => setAddingList(false)} className="text-xs text-gray-500 px-2 py-1.5 rounded-md hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setAddingList(true)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add another list
            </button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} onClick={() => {}} />}
      </DragOverlay>
    </DndContext>
  );
}
