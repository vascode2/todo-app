import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../api/client';
import { Project } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: Props) {
  const { projectId } = useParams();
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  const createProject = useMutation({
    mutationFn: (name: string) => projectsApi.create({ name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setNewName('');
      setCreating(false);
    },
  });

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen md:h-full shrink-0">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-sm font-bold">TF</div>
          <span className="font-semibold text-lg">TaskFlow</span>
        </div>
        {onNavigate && (
          <button onClick={onNavigate} aria-label="Close menu" className="md:hidden text-gray-400 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <nav className="flex-1 p-3 overflow-y-auto">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-sm mb-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          All Tasks
        </Link>
        <div className="mt-4">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</span>
            <button onClick={() => setCreating(true)} className="text-gray-500 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {creating && (
            <form onSubmit={e => { e.preventDefault(); if (newName.trim()) createProject.mutate(newName.trim()); }} className="px-3 mb-2">
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onBlur={() => { if (!newName.trim()) setCreating(false); }} placeholder="Project name" className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1 outline-none border border-gray-600 focus:border-primary-500" />
            </form>
          )}
          {projects.map(p => (
            <Link key={p.id} to={`/project/${p.id}`} onClick={onNavigate} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${projectId === p.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span className="truncate">{p.name}</span>
            </Link>
          ))}
        </div>
      </nav>
      <div className="p-3 border-t border-gray-700">
        <div className="flex items-center gap-2 px-2 py-1.5">
          {user?.avatar
            ? <img src={user.avatar} alt="" className="w-7 h-7 rounded-full" />
            : <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-xs font-bold">{user?.name[0]}</div>
          }
          <span className="text-sm text-gray-300 truncate flex-1">{user?.name}</span>
          <button onClick={logout} title="Sign out" className="text-gray-500 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
