
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { Camera, User as UserIcon, Upload, CheckCircle, Loader2, ScanFace, ShieldAlert } from 'lucide-react';

interface OnboardingModalProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ user, onComplete }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '', // Pre-filled from login
    srn: user.srn || '',
    accountType: user.degree || '', // Maps to degree
    program: user.program || '', // Maps to program/title
    avatar: user.avatar || ''
  });
  const [loading, setLoading] = useState(false);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Simulate Face Detection Analysis
      setAnalyzingPhoto(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        // Simulate a delay for "AI Analysis"
        setTimeout(() => {
          setAnalyzingPhoto(false);
          // In a real app, face-api.js would validate here. 
          // We assume valid for now but show the UX.
          setFormData(prev => ({ ...prev, avatar: reader.result as string }));
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const updatedUser: User = {
        ...user,
        name: formData.name,
        phone: formData.phone,
        srn: user.type === 'university' ? formData.srn : undefined,
        degree: formData.accountType,
        program: formData.program,
        // Use uploaded avatar or generate a deterministic one based on name
        avatar: formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=0ea5e9&color=fff`,
        isProfileComplete: true
      };
      onComplete(updatedUser);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex md:items-center justify-center bg-white md:bg-slate-900/90 md:backdrop-blur-md md:p-4 overflow-y-auto md:overflow-hidden">
      <div className="bg-white w-full min-h-screen md:min-h-0 md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-3xl md:shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        <div className="bg-gradient-to-r from-brand-600 to-vivid-pink p-8 text-white text-center shrink-0">
          <h2 className="text-2xl font-display font-bold mb-2">Complete Profile</h2>
          <p className="text-white/90 text-sm">Setup your official IDEA Lab account.</p>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1">
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* Avatar Upload with Face Validaton UX */}
            <div className="flex flex-col items-center justify-center -mt-16 mb-6">
                <div 
                onClick={() => !analyzingPhoto && fileInputRef.current?.click()}
                className={`relative w-28 h-28 rounded-full bg-white border-4 border-white shadow-lg cursor-pointer group overflow-hidden ${analyzingPhoto ? 'ring-4 ring-brand-400 ring-opacity-50' : ''}`}
                >
                {analyzingPhoto ? (
                    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-brand-400">
                        <ScanFace className="w-8 h-8 animate-pulse" />
                        <span className="text-[10px] mt-1 font-bold animate-pulse">Scanning...</span>
                    </div>
                ) : formData.avatar ? (
                    <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-200 transition-colors">
                    <Camera className="w-8 h-8" />
                    </div>
                )}
                
                {!analyzingPhoto && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 text-white" />
                    </div>
                )}
                </div>
                <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
                />
                <div className="text-center mt-2">
                    <span className="text-xs text-slate-500 font-medium block">Profile Photo (Optional)</span>
                    <span className="text-[10px] text-brand-600 font-bold flex items-center justify-center gap-1">
                    <ScanFace className="w-3 h-3" /> Face must be clearly visible
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                    placeholder="Ex. Aditya Sharma"
                />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile Number</label>
                    <div className="relative">
                        <input 
                            type="tel" 
                            disabled
                            value={formData.phone || 'N/A'}
                            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl font-bold text-slate-500 cursor-not-allowed"
                            placeholder="Verified on Login"
                        />
                        {formData.phone && <CheckCircle className="absolute right-4 top-3.5 w-5 h-5 text-green-500" />}
                    </div>
                    {formData.phone && <p className="text-[10px] text-slate-400 mt-1 ml-1">Verified via OTP</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Type</label>
                    <select 
                        required
                        value={formData.accountType}
                        onChange={e => setFormData({...formData, accountType: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium appearance-none text-sm"
                    >
                        <option value="">Select Role...</option>
                        <option value="B.Tech Account">B.Tech Account</option>
                        <option value="M.Tech Account">M.Tech Account</option>
                        <option value="PhD Account">PhD Account</option>
                        <option value="Faculty Account">Faculty Account</option>
                        <option value="Staff Account">Staff Account</option>
                        <option value="Guest Researcher">Guest Researcher</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Program / Title</label>
                    <input 
                        type="text" 
                        required 
                        value={formData.program}
                        onChange={e => setFormData({...formData, program: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-sm"
                        placeholder="e.g. CSE, Asst. Prof"
                    />
                </div>
                </div>

                {user.type === 'university' && (
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SRN / University ID</label>
                    <input 
                    type="text" 
                    required 
                    value={formData.srn}
                    onChange={e => setFormData({...formData, srn: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                    placeholder="Ex. R21EC001"
                    />
                </div>
                )}
            </div>

            <button 
                type="submit" 
                disabled={loading || analyzingPhoto}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Complete Profile
            </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
