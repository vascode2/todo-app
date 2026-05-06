import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/Auth/LoginPage';
import Sidebar from './components/Sidebar/Sidebar';
import ProjectPage from './components/Board/ProjectPage';
import AllTasksPage from './components/Board/AllTasksPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AppLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <LoginPage />;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar: drawer on mobile, fixed on desktop */}
      <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>
      {/* Backdrop on mobile when drawer open */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-30 md:hidden" />
      )}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" className="text-gray-700 p-1 -ml-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center text-xs font-bold text-white">TF</div>
          <span className="font-semibold text-gray-800">TaskFlow</span>
        </div>
        <Routes>
          <Route path="/" element={<AllTasksPage />} />
          <Route path="/project/:projectId" element={<ProjectPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
