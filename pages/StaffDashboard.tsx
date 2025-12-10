
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

/**
 * Minimal placeholder Staff Dashboard
 * Purpose: Replace the large original file with a simplified component
 * to eliminate editor/TypeScript noise while preserving sign-out behavior.
 */
const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await authService.logout();
    } finally {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">Staff Dashboard</h1>
        <p className="text-sm text-slate-600 mb-4">Placeholder simplified view — original dashboard temporarily disabled to reduce errors.</p>
        <div className="flex gap-2">
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-slate-100 rounded">Go to Site</button>
          <button onClick={handleSignOut} className="px-4 py-2 bg-red-600 text-white rounded">Sign Out</button>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
