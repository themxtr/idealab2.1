
import React, { useState, useRef, useEffect } from 'react';
import { User, Bell, Moon, Save, Camera, ShieldCheck, Mail, Linkedin, AlignLeft, Smartphone, Zap, GraduationCap, Loader2 } from 'lucide-react';

interface SettingsPanelProps {
  user: any; // Accepts User or Staff object
  onUpdate: (updatedData: any) => Promise<void>;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ user, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  
  // Profile State
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [bio, setBio] = useState(user.bio || '');
  const [skills, setSkills] = useState(user.skills || '');
  const [linkedin, setLinkedin] = useState(user.linkedin || '');
  
  // Student Specific State
  const [srn, setSrn] = useState(user.srn || '');
  const [degree, setDegree] = useState(user.degree || '');
  const [program, setProgram] = useState(user.program || '');
  
  // Security State
  const [emailLinked, setEmailLinked] = useState(user.emailLinked || false);
  const [twoFactor, setTwoFactor] = useState(user.twoFactorEnabled || false);
  const [linkEmailInput, setLinkEmailInput] = useState('');
  
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      setName(user.name);
      setAvatar(user.avatar);
      setBio(user.bio || '');
      setSkills(user.skills || '');
      setLinkedin(user.linkedin || '');
      setSrn(user.srn || '');
      setDegree(user.degree || '');
      setProgram(user.program || '');
      setEmailLinked(user.emailLinked || false);
      setTwoFactor(user.twoFactorEnabled || false);
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const updatePayload: any = { 
        name, 
        avatar,
        bio,
        skills,
        linkedin,
        emailLinked,
        twoFactorEnabled: twoFactor
    };

    // Add student specific fields if they were edited
    if (user.type === 'university') {
        updatePayload.srn = srn;
        updatePayload.degree = degree;
        updatePayload.program = program;
    }

    await onUpdate(updatePayload);
    setSaving(false);
  };

  const isUniversity = user.type === 'university';

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col md:flex-row overflow-hidden min-h-[600px]">
        {/* Sidebar */}
        <div className="md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto shrink-0">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex-1 md:w-full flex items-center justify-center md:justify-start space-x-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap ${
                activeTab === 'profile' ? 'bg-white shadow-sm text-brand-600 ring-1 ring-brand-100' : 'text-slate-600 hover:bg-gray-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex-1 md:w-full flex items-center justify-center md:justify-start space-x-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap ${
                activeTab === 'security' ? 'bg-white shadow-sm text-brand-600 ring-1 ring-brand-100' : 'text-slate-600 hover:bg-gray-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Security</span>
            </button>
            <button 
              onClick={() => setActiveTab('preferences')}
              className={`flex-1 md:w-full flex items-center justify-center md:justify-start space-x-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap ${
                activeTab === 'preferences' ? 'bg-white shadow-sm text-brand-600 ring-1 ring-brand-100' : 'text-slate-600 hover:bg-gray-100'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Preferences</span>
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6 max-w-3xl">
                <div className="flex flex-col items-start mb-6">
                   <div 
                      className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 shadow-md mb-3 group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                   >
                     <img src={avatar} alt={name} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                     </div>
                   </div>
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                   <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-brand-600 font-bold hover:underline"
                    >
                      Change Picture
                   </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                        <input 
                          type="text" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-brand-500 font-medium text-slate-900 text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Unique ID</label>
                        <input type="text" defaultValue={user.id} disabled className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-slate-500 cursor-not-allowed text-sm" />
                      </div>
                  </div>

                  {isUniversity && (
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                          <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Academic Details</h4>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SRN / University ID</label>
                            <input 
                                type="text" 
                                value={srn} 
                                onChange={(e) => setSrn(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Degree</label>
                                <select 
                                    value={degree}
                                    onChange={(e) => setDegree(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                >
                                    <option value="B.Tech Account">B.Tech</option>
                                    <option value="M.Tech Account">M.Tech</option>
                                    <option value="PhD Account">PhD</option>
                                    <option value="Faculty Account">Faculty</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Program</label>
                                <input 
                                    type="text" 
                                    value={program} 
                                    onChange={(e) => setProgram(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                                />
                              </div>
                          </div>
                      </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><AlignLeft className="w-3 h-3" /> Bio</label>
                    <textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us a bit about yourself..."
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-brand-500 text-sm"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> Skills (Comma separated)</label>
                    <input 
                      type="text" 
                      value={skills} 
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="e.g. IoT, 3D Printing, Python"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-brand-500 text-sm" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Linkedin className="w-3 h-3" /> LinkedIn Profile</label>
                    <input 
                      type="url" 
                      value={linkedin} 
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-brand-500 text-sm" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-6 max-w-2xl">
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-blue-900 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Link Email Address
                    </h3>
                    <p className="text-xs text-blue-700 mb-4">Link your university email for recovery and notifications.</p>
                    
                    {emailLinked ? (
                        <div className="flex items-center gap-2 text-green-600 bg-white px-3 py-2 rounded-lg border border-green-200 text-sm font-bold">
                            <ShieldCheck className="w-4 h-4" /> Email Linked
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input 
                                type="email" 
                                placeholder="name@reva.edu.in"
                                value={linkEmailInput}
                                onChange={(e) => setLinkEmailInput(e.target.value)}
                                className="flex-grow px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button 
                                onClick={() => setEmailLinked(true)}
                                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                            >
                                Link
                            </button>
                        </div>
                    )}
                 </div>

                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-brand-600" /> Two-Factor Authentication
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-[250px]">Secure your account with TOTP (Authenticator App).</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                        </label>
                    </div>
                 </div>
              </div>
            )}

            {/* PREFERENCES TAB */}
            {activeTab === 'preferences' && (
              <div className="space-y-6 max-w-2xl">
                 <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 border-b border-gray-100 pb-2">Notifications</h3>
                    <label className="flex items-center justify-between cursor-pointer">
                       <span className="text-sm text-slate-700">Email Alerts for Returns</span>
                       <input type="checkbox" defaultChecked className="accent-brand-600 w-4 h-4" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                       <span className="text-sm text-slate-700">New Workshop Announcements</span>
                       <input type="checkbox" defaultChecked className="accent-brand-600 w-4 h-4" />
                    </label>
                 </div>

                 <div className="space-y-4 pt-4">
                    <h3 className="font-bold text-slate-900 border-b border-gray-100 pb-2">Appearance</h3>
                    <label className="flex items-center justify-between cursor-pointer">
                       <span className="text-sm text-slate-700 flex items-center gap-2"><Moon className="w-4 h-4" /> Dark Mode (Beta)</span>
                       <input type="checkbox" className="accent-brand-600 w-4 h-4" />
                    </label>
                 </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
               <button 
                 onClick={handleSave} 
                 disabled={saving}
                 className="px-8 py-3 rounded-xl font-bold bg-brand-600 text-white hover:bg-brand-700 shadow-md transition-colors flex items-center gap-2 disabled:opacity-70 text-sm"
               >
                 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Save Changes
               </button>
            </div>
        </div>
    </div>
  );
};

export default SettingsPanel;
