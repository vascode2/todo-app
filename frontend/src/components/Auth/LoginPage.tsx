import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const { login } = useAuth();

  useEffect(() => {
    const init = () => {
      window.google?.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          await login(response.credential);
        },
      });
      const el = document.getElementById('google-btn');
      if (el) {
        window.google?.accounts.id.renderButton(el, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
        });
      }
    };

    if (window.google) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.google) { clearInterval(interval); init(); }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [login]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">TaskFlow</h1>
          <p className="text-gray-500 mt-2">Your personal project & task manager</p>
        </div>
        <div className="flex justify-center mt-8">
          <div id="google-btn" />
        </div>
      </div>
    </div>
  );
}
