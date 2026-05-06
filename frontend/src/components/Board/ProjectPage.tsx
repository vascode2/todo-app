import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../api/client';
import { Project, Task } from '../../types';
import KanbanBoard from './KanbanBoard';
import ListView from '../ListView/ListView';
import TaskModal from '../TaskModal/TaskModal';

type View = 'board' | 'list';

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [view, setView] = useState<View>('board');
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });

  const deleteProject = useMutation({
    mutationFn: () => projectsApi.delete(projectId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      navigate('/');
    },
  });

  const handleDelete = () => {
    if (!project) return;
    if (confirm(`Delete project "${project.name}"? This will permanently remove all its lists and tasks.`)) {
      deleteProject.mutate();
    }
  };

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!project) return <div className="flex-1 flex items-center justify-center text-gray-400">Project not found</div>;

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Toolbar */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-white flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
          <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">{project.name}</h1>
          {project.description && <span className="hidden sm:inline text-sm text-gray-400 truncate">{project.description}</span>}
        </div>
        {/* Search */}
        <div className="relative order-3 sm:order-none w-full sm:w-auto">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…" className="text-sm pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 w-full sm:w-48" />
        </div>
        {/* View toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setView('board')} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors ${view === 'board' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span className="hidden sm:inline">Board</span>
          </button>
          <button onClick={() => setView('list')} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
        {/* Delete project */}
        <button onClick={handleDelete} title="Delete project" aria-label="Delete project" className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-hidden p-3 sm:p-6">
        {view === 'board'
          ? <KanbanBoard project={project} onTaskClick={setSelectedTask} search={search} />
          : <ListView project={project} onTaskClick={setSelectedTask} search={search} />
        }
      </div>
      {selectedTask && (
        <TaskModal taskId={selectedTask.id} projectId={project.id} labels={project.labels} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
