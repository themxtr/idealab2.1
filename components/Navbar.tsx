
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Box, User as UserIcon, Settings, LogOut, ChevronDown, Printer, Shield, LayoutDashboard, ChevronRight, Users, Zap, Info, MessageSquare, Globe, Home, Calendar, LayoutTemplate, Package, CircuitBoard } from 'lucide-react';
import { User, StaffUser } from '../types';
import SettingsModal from './SettingsModal';

interface NavbarProps {
  user: User | null;
  staffUser?: StaffUser | null;
  onLogout: () => void;
  onUpdateUser: (data: any) => Promise<void>;
}

const Navbar: React.FC<NavbarProps> = ({ user, staffUser, onLogout, onUpdateUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);

  const LOGO_LIGHT_BG = "https://www.reva.edu.in/icgtasmt-2022/assets/pages/img/Logo/Reva_logo.jpeg";
  const LOGO_DARK_BG = "https://researchportal.reva.edu.in/assets/revawhite-Cgq6Hl76.png";

  // Hide Navbar completely on specific dashboard pages for mobile to use their own headers
  // But keep it for desktop or other pages
  const isDashboard = location.pathname === '/staff-dashboard' || location.pathname === '/dashboard';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setProfileOpen(false);
  }, [location]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isLightPage = [
      '/events', 
      '/login', 
      '/staff-login', 
      '/staff-dashboard', 
      '/dashboard',
      '/team',
      '/resources',
      '/about',
      '/projects',
      '/testimonials'
  ].some(path => location.pathname === path || location.pathname.startsWith(path + '/'));
  
  const useDarkText = (scrolled || isLightPage) && !isOpen;

  const mainLinks = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'Gallery', path: '/gallery' },
  ];

  const activeUser = user || (staffUser ? { ...staffUser, id: staffUser.employeeId, type: 'staff', email: 'staff@reva.edu.in', avatar: staffUser.avatar || 'https://ui-avatars.com/api/?name=Staff+Member&background=0D8ABC&color=fff' } as any : null);

  const mobileLinks = [
    // Dashboard Link (Top priority if logged in)
    ...(activeUser ? [{
      name: staffUser ? 'Staff Dashboard' : 'My Dashboard',
      path: staffUser ? '/staff-dashboard' : '/dashboard',
      icon: LayoutDashboard
    }] : []),
    // Main Pages
    { name: 'Home', path: '/', icon: Home },
    // App Features (if logged in)
    ...(activeUser ? [
        { name: '3D Print', path: '/3d-print', icon: Printer },
        { name: 'PCB Fabrication', path: '/pcb-order', icon: CircuitBoard },
        ...(user?.type !== 'non-university' && !staffUser ? [{ name: 'Component Catalog', path: '/components', icon: Package }] : [])
    ] : []),
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Gallery', path: '/gallery', icon: LayoutTemplate },
    // Extended Pages
    { name: 'About Us', path: '/about', icon: Info },
    { name: 'Our Team', path: '/team', icon: Users },
    { name: 'Projects', path: '/projects', icon: Zap },
    { name: 'Resources', path: '/resources', icon: Box },
    { name: 'Testimonials', path: '/testimonials', icon: MessageSquare },
  ];

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogout();
    navigate('/');
  };

  const handleSettingsClick = () => {
      setProfileOpen(false);
      setIsOpen(false);
      if (staffUser) {
          navigate('/staff-dashboard');
      } else if (user) {
          navigate('/dashboard');
      }
  };

  const getUserBadgeLabel = () => {
      if (staffUser) return 'Staff Access';
      if (user?.type === 'university') return 'University Access';
      if (user?.type === 'non-university') return 'Guest Access';
      return 'Student Access';
  };

  const getUserIcon = () => {
      if (staffUser) return <Shield className="w-3 h-3 text-brand-600" />;
      if (user?.type === 'non-university') return <Globe className="w-3 h-3 text-blue-600" />;
      return <UserIcon className="w-3 h-3 text-brand-600" />;
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'py-2' : 'py-4'
        } ${isDashboard ? 'hidden md:block' : ''}`} // Hide on mobile dashboard pages
      >
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
            scrolled && !isOpen
                ? 'bg-white/80 backdrop-blur-lg rounded-full shadow-lg border border-white/20' 
                : 'bg-transparent'
        }`}>
          <div className="flex justify-between items-center h-14">
            <NavLink to="/" onClick={() => setIsOpen(false)} className="flex items-center group pl-2 z-50 relative">
                <img 
                  src={useDarkText ? LOGO_LIGHT_BG : LOGO_DARK_BG} 
                  alt="REVA University" 
                  className="h-10 w-auto object-contain transition-all duration-300"
                  style={useDarkText ? { mixBlendMode: 'multiply' } : {}}
                />
            </NavLink>

            <div className="hidden md:flex space-x-1 items-center bg-gray-100/10 p-1 rounded-full backdrop-blur-sm">
              {mainLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm'
                        : useDarkText
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-gray-100/50'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
              
              <NavLink
                to="/pcb-order"
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                        ? 'bg-white text-slate-900 shadow-sm'
                        : useDarkText
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-gray-100/50'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <CircuitBoard className="w-3.5 h-3.5" />
                PCB
              </NavLink>

              <NavLink
                to="/3d-print"
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                        ? 'bg-white text-slate-900 shadow-sm'
                        : useDarkText
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-gray-100/50'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Printer className="w-3.5 h-3.5" />
                3D Print
              </NavLink>
            </div>

            <div className="hidden md:flex items-center gap-3 pr-1">
              {activeUser ? (
                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => setProfileOpen(!profileOpen)}
                    className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full transition-all border ${
                      useDarkText 
                        ? 'border-gray-200 hover:border-gray-300 bg-white' 
                        : 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <img 
                      src={activeUser.avatar} 
                      alt={activeUser.name} 
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white/50" 
                    />
                    <span className={`text-sm font-bold max-w-[100px] truncate ${useDarkText ? 'text-slate-700' : 'text-white'}`}>
                      {activeUser.name.split(' ')[0]}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 ${useDarkText ? 'text-slate-400' : 'text-white/70'}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-slide-up transform origin-top-right overflow-hidden z-[51]">
                      <div className="px-4 py-3 border-b border-gray-50 mb-1 bg-gray-50/50">
                        <div className="flex items-center gap-2 mb-1">
                            {getUserIcon()}
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{getUserBadgeLabel()}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-900 truncate">{activeUser.name}</p>
                        <p className="text-xs text-slate-500 truncate">{staffUser ? staffUser.employeeId : activeUser.email}</p>
                      </div>
                      
                      <div className="p-1 space-y-0.5">
                        {staffUser ? (
                             <button 
                               onClick={() => navigate('/staff-dashboard')}
                               className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 font-medium"
                             >
                               <LayoutDashboard className="w-4 h-4 text-slate-400" /> Staff Dashboard
                             </button>
                        ) : (
                          <>
                              <button 
                                  onClick={() => navigate('/dashboard')}
                                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 font-medium"
                              >
                                  <LayoutDashboard className="w-4 h-4 text-slate-400" /> My Dashboard
                              </button>
                              {user?.type !== 'non-university' && (
                                <button 
                                    onClick={() => navigate('/components')}
                                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 font-medium"
                                >
                                    <Box className="w-4 h-4 text-slate-400" /> Catalog
                                </button>
                              )}
                          </>
                        )}
                        
                        <button 
                           onClick={handleSettingsClick}
                           className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 font-medium"
                        >
                          <Settings className="w-4 h-4 text-slate-400" /> Settings
                        </button>
                      </div>
                      
                      <div className="border-t border-gray-50 mt-1 pt-1 p-1">
                        <button 
                          onClick={handleLogoutClick}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => navigate('/login')}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2 border ${
                    useDarkText 
                    ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' 
                    : 'bg-white text-slate-900 border-white hover:bg-gray-100'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>

            <div className="md:hidden flex items-center z-50">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full transition-all duration-300 ${
                  isOpen ? 'bg-white/20 text-white rotate-90' : 
                  useDarkText ? 'text-slate-900 bg-gray-100' : 'text-white bg-white/10'
                }`}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div
          className={`md:hidden fixed inset-0 z-40 transition-all duration-500 ease-in-out ${
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
          }`}
        >
          {/* Updated Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-slate-900 backdrop-blur-xl"></div>
          <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none"></div>
          
          <div className="relative flex flex-col h-full pt-24 pb-8 px-6 overflow-y-auto">
            {activeUser ? (
               <div className="mb-8 flex items-center gap-4 p-4 rounded-2xl bg-white/10 border border-white/20 animate-slide-up shadow-lg" style={{animationDelay: '0.1s'}}>
                  <div className="relative">
                     <img src={activeUser.avatar} alt={activeUser.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-brand-500" />
                     <div className="absolute bottom-0 right-0 bg-brand-500 rounded-full p-1 border border-[#0f172a]">
                        {staffUser ? <Shield className="w-3 h-3 text-white" /> : <UserIcon className="w-3 h-3 text-white" />}
                     </div>
                  </div>
                  <div className="flex-grow">
                     <h3 className="text-lg font-bold text-white leading-tight truncate">{activeUser.name}</h3>
                     <p className="text-xs text-slate-300 mb-1">{getUserBadgeLabel()}</p>
                     
                     <button 
                        onClick={handleSettingsClick}
                        className="text-xs font-bold text-brand-400 flex items-center gap-1 hover:text-brand-300"
                     >
                        <Settings className="w-3 h-3" /> Manage Settings
                     </button>
                  </div>
               </div>
            ) : (
                <button 
                    onClick={() => { setIsOpen(false); navigate('/login'); }}
                    className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                    <UserIcon className="w-5 h-5" /> Sign In
                </button>
            )}

            <div className="mt-4 space-y-2">
              {mobileLinks.map((link, idx) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-4 p-4 rounded-xl transition-all duration-300 animate-slide-up ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                  style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-bold">{link.name}</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </NavLink>
              ))}
              
              {activeUser && (
                  <button 
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-4 p-4 rounded-xl text-red-400 hover:bg-white/5 hover:text-red-300 transition-all duration-300 animate-slide-up mt-4 border border-white/5"
                    style={{ animationDelay: '0.6s' }}
                  >
                      <LogOut className="w-5 h-5" />
                      <span className="font-bold">Sign Out</span>
                  </button>
              )}
            </div>
            
            <div className="mt-auto pt-8 border-t border-white/10 flex justify-between items-center text-slate-500 text-xs">
                 <span>© 2024 IDEA Lab</span>
                 <div className="flex gap-4">
                     <a href="#" className="hover:text-white transition-colors">Privacy</a>
                     <a href="#" className="hover:text-white transition-colors">Terms</a>
                 </div>
            </div>

          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
