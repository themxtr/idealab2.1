import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';

interface GoogleCallbackProps {
  onLogin: (user: any) => void;
}

const GoogleCallback: React.FC<GoogleCallbackProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        const userType = localStorage.getItem('idea_lab_oauth_user_type') || 'non-university';

        console.log('Callback params:', { code, error: errorParam, userType });

        if (errorParam) {
          setError(`Google OAuth error: ${errorParam}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!code) {
          setError('No authorization code received from Google');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        console.log('Exchanging code for token...');

        // Exchange code for token via the API server
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${API_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const { user, token } = await response.json();
        console.log('Login successful:', user);

        // Persist user locally (mirror of server persistence) and set active session
        try {
          const existingUsers = JSON.parse(localStorage.getItem('idea_lab_users') || '[]');
          const matchedIndex = existingUsers.findIndex((u: any) => (u.email && u.email === user.email) || (u.phone && user.phone && u.phone === user.phone));
          const storedUser = { ...user, isProfileComplete: true };

          if (matchedIndex >= 0) {
            existingUsers[matchedIndex] = { ...existingUsers[matchedIndex], ...storedUser };
          } else {
            existingUsers.push(storedUser);
          }
          localStorage.setItem('idea_lab_users', JSON.stringify(existingUsers));
          localStorage.setItem('idea_lab_current_user', JSON.stringify(storedUser));
          if (token) localStorage.setItem('idea_lab_current_user_token', token);
          // Notify parent and redirect home
          onLogin(storedUser);
          navigate('/');
          return;
        } catch (err) {
          console.warn('Callback local storage error:', err);
        }
      } catch (err: any) {
        console.error('Callback error:', err);
        setError(err.message || 'Authentication failed');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="text-center bg-slate-800 rounded-xl p-8 border border-red-500/20">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Authentication Error</h1>
          <p className="text-slate-400 mb-4">{error}</p>
          <p className="text-slate-500 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Authenticating with Google...</h1>
        <p className="text-slate-400">Please wait while we complete your login</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
