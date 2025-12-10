
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/api';
import { StaffUser } from '../types';

interface StaffLoginProps {
  onLogin: (user: StaffUser) => void;
}

const StaffLogin: React.FC<StaffLoginProps> = ({ onLogin }) => {
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Pass password to service
      const user = await authService.loginStaff(empId, password);
      onLogin(user);
      navigate('/staff-dashboard');
    } catch (err: any) {
      console.error("Staff login failed", err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-noise opacity-10"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
              <ShieldCheck className="w-8 h-8 text-brand-500" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white">Staff Portal</h1>
            <p className="text-slate-400 text-sm mt-1">Authorized Personnel Only</p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Employee ID</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium"
                  placeholder="EMP-XXXX"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm font-medium">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/30 active:scale-95 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : 'Access Dashboard'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button onClick={() => navigate('/')} className="text-slate-400 text-sm hover:text-slate-600 font-medium">
              Back to Student View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
