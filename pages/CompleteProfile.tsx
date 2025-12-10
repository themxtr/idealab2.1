import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Phone, Building2, BookOpen, AlertCircle, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { authService } from '../services/api';

interface CompleteProfileProps {
  onProfileComplete: (user: any) => void;
}

const CompleteProfile: React.FC<CompleteProfileProps> = ({ onProfileComplete }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    srn: '',
    degree: '',
    program: '',
    department: '',
    institution: '',
  });

  const [userType, setUserType] = useState<'university' | 'non-university'>('non-university');

  // Load Google user data from localStorage on mount
  useEffect(() => {
    try {
      const userData = localStorage.getItem('idea_lab_oauth_user');
      if (!userData) {
        setError('No user data found. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const oauthUser = JSON.parse(userData);
      const type = searchParams.get('type') as 'university' | 'non-university' || 'non-university';

      console.log('OAuth user data:', oauthUser);

      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('idea_lab_users') || '[]');
      const existingUser = existingUsers.find((u: any) => u.email === oauthUser.email);

      if (existingUser) {
        console.log('Existing user found, skipping profile completion:', existingUser);

        // Update existing user with latest OAuth data
        const updatedUser = {
          ...existingUser,
          name: oauthUser.name || existingUser.name,
          avatar: oauthUser.picture || existingUser.avatar,
          isProfileComplete: true,
        };

        // Update in users array
        const updatedUsers = existingUsers.map((u: any) =>
          u.email === oauthUser.email ? updatedUser : u
        );
        localStorage.setItem('idea_lab_users', JSON.stringify(updatedUsers));

        // Set as current user
        localStorage.setItem('idea_lab_current_user', JSON.stringify(updatedUser));

        // Get JWT token (stored during OAuth callback)
        const token = localStorage.getItem('idea_lab_jwt_token');
        if (token) {
          localStorage.setItem('idea_lab_current_user_token', token);
        }

        // Clean up temp OAuth data
        localStorage.removeItem('idea_lab_oauth_user');

        // Call onProfileComplete and redirect to dashboard
        onProfileComplete(updatedUser);
        setTimeout(() => navigate('/'), 1000);
        return;
      }

      // New user - proceed with profile completion
      // Pre-fill form with Google data
      setFormData(prev => ({
        ...prev,
        name: oauthUser.name || '',
        email: oauthUser.email || '',
      }));

      setUserType(type);
      setLoading(false);
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
      setLoading(false);
    }
  }, [navigate, searchParams, onProfileComplete]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    if (userType === 'university') {
      if (!formData.srn.trim()) {
        setError('Student Registration Number is required');
        return false;
      }
      if (!formData.degree.trim()) {
        setError('Degree is required');
        return false;
      }
      if (!formData.program.trim()) {
        setError('Program is required');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Get the OAuth data
      const oauthUserData = localStorage.getItem('idea_lab_oauth_user');
      if (!oauthUserData) {
        throw new Error('OAuth user data not found');
      }

      const oauthUser = JSON.parse(oauthUserData);

      // Create complete user profile
      const completeUser = {
        id: oauthUser.id || `USR-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        avatar: oauthUser.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=random`,
        phone: formData.phone,
        type: userType,
        isProfileComplete: true,
        ...(userType === 'university' && {
          srn: formData.srn,
          degree: formData.degree,
          program: formData.program,
          department: formData.department,
          institution: formData.institution,
        }),
      };

      console.log('Completing profile with:', completeUser);

      // Store complete user profile
      localStorage.setItem('idea_lab_current_user', JSON.stringify(completeUser));
      
      // Get JWT token (stored during OAuth callback)
      const token = localStorage.getItem('idea_lab_jwt_token');
      if (token) {
        localStorage.setItem('idea_lab_current_user_token', token);
      }

      setSuccess(true);
      onProfileComplete(completeUser);

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        localStorage.removeItem('idea_lab_oauth_user'); // Clean up temp OAuth data
        navigate('/');
      }, 1000);

    } catch (err: any) {
      console.error('Profile completion error:', err);
      setError(err.message || 'Failed to complete profile. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Loading Profile...</h1>
          <p className="text-slate-400">Please wait while we prepare your profile</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="text-center bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-8 max-w-md">
          <CheckCircle className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Profile Complete! 🎉</h1>
          <p className="text-brand-100 mb-6">
            Your IDEA Lab account has been created successfully. You'll be redirected to your dashboard.
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-white mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Complete Your Profile
          </h1>
          <p className="text-slate-400">
            Set up your IDEA Lab account to get started
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* User Type Selection */}
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold text-white mb-4">Who are you?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setUserType('non-university')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    userType === 'non-university'
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-slate-600 bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-white">Guest User</div>
                  <div className="text-sm text-slate-400">Visitor, Alumni, Researcher</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setUserType('university')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    userType === 'university'
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-slate-600 bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-white">University Member</div>
                  <div className="text-sm text-slate-400">Student or Faculty</div>
                </button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5" /> Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" /> Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    disabled
                    className="w-full px-4 py-3 rounded-lg bg-slate-600 border border-slate-500 text-slate-400 cursor-not-allowed opacity-75"
                  />
                  <p className="text-xs text-slate-500 mt-1">From your Google account</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" /> Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            {/* University Member Fields */}
            {userType === 'university' && (
              <div className="space-y-4 p-6 bg-slate-900 rounded-xl border border-slate-700">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> University Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Student Registration Number (SRN) *
                    </label>
                    <input
                      type="text"
                      name="srn"
                      value={formData.srn}
                      onChange={handleInputChange}
                      placeholder="e.g., 21BCE0XXX"
                      className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Degree *
                    </label>
                    <select
                      name="degree"
                      value={formData.degree}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="">Select a degree</option>
                      <option value="B.Tech">B.Tech</option>
                      <option value="B.E">B.E</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="M.E">M.E</option>
                      <option value="PhD">PhD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Program/Branch *
                  </label>
                  <select
                    name="program"
                    value={formData.program}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">Select your program</option>
                    <option value="Computer Science">Computer Science & Engineering</option>
                    <option value="Electronics">Electronics & Communication</option>
                    <option value="Mechanical">Mechanical Engineering</option>
                    <option value="Electrical">Electrical Engineering</option>
                    <option value="Civil">Civil Engineering</option>
                    <option value="Aeronautical">Aeronautical Engineering</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Building2 className="w-4 h-4 inline mr-2" /> Department
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="e.g., Innovation & Design"
                      className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Institution
                    </label>
                    <input
                      type="text"
                      name="institution"
                      value={formData.institution}
                      onChange={handleInputChange}
                      placeholder="e.g., REVA University"
                      className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-brand-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Complete Profile
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-xs text-slate-500 text-center">
              Your data is securely stored and used only for IDEA Lab access
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
