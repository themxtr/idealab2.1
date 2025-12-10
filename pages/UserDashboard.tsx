
import React, { useState, useEffect } from 'react';
import { Package, Printer, Calendar, Clock, AlertCircle, Menu, X, User as UserIcon, Settings, HelpCircle, LogOut, ChevronRight, LayoutDashboard, Home, Bell, PlusCircle, CheckCircle, CircuitBoard } from 'lucide-react';
import { User, PrintOrder, Indent, SlotBooking, Notification, PcbOrder } from '../types';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import SettingsPanel from '../components/SettingsPanel';

interface UserDashboardProps {
  user?: User;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'activity' | 'settings'>('activity');
  
  // Quick Book Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookDate, setBookDate] = useState('');
  const [bookStartTime, setBookStartTime] = useState('09:00');
  const [bookDuration, setBookDuration] = useState('1'); // hours
  const [bookPurpose, setBookPurpose] = useState('Project Work');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Data
  const [printOrders, setPrintOrders] = useState<PrintOrder[]>([]);
  const [pcbOrders, setPcbOrders] = useState<PcbOrder[]>([]);
  const [indents, setIndents] = useState<Indent[]>([]);
  const [slotRequests, setSlotRequests] = useState<SlotBooking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const refreshData = async () => {
      const orders = await authService.getPrintOrders();
      setPrintOrders(orders);
      const pcbs = await authService.getPcbOrders();
      setPcbOrders(pcbs);
      const ind = await authService.getIndents();
      setIndents(ind.filter(i => i.studentId === user?.id));
      const slots = await authService.getSlotRequests();
      setSlotRequests(slots.filter(s => s.userId === user?.id));
      
      if (user) {
          const notifs = await authService.getNotifications(user.id);
          setNotifications(notifs);
      }
  };

  useEffect(() => {
      refreshData();
  }, [user]);

  const handleLogout = async () => {
      await authService.logout();
      navigate('/');
  };

  const handleQuickBook = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!user) return;
      setBookingLoading(true);

      // Calculate End Time
      const [hours, minutes] = bookStartTime.split(':').map(Number);
      const durationHours = parseFloat(bookDuration);
      const endTotalMinutes = (hours * 60) + minutes + (durationHours * 60);
      const endH = Math.floor(endTotalMinutes / 60);
      const endM = endTotalMinutes % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      const newRequest: SlotBooking = {
         id: `SLOT-${Math.floor(Math.random() * 100000)}`,
         userId: user.id,
         userName: user.name,
         date: bookDate,
         startTime: bookStartTime,
         endTime: endTime,
         purpose: bookPurpose,
         attendees: 1,
         status: 'pending',
         requestDate: new Date().toLocaleDateString()
      };

      await authService.createSlotRequest(newRequest);
      await refreshData();
      
      setTimeout(() => {
          setBookingLoading(false);
          setShowBookingModal(false);
      }, 1000);
  };

  const isGuest = user?.type === 'non-university';

  return (
    <div className="h-screen bg-gray-50 flex pt-0 md:pt-24 overflow-hidden">
        
        {/* --- SIDEBAR (Desktop) --- */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 pt-20 md:pt-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} hidden md:block`}>
            <div className="p-6 flex flex-col h-full">
                <div className="space-y-1">
                    <button 
                        onClick={() => { setActiveSection('activity'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === 'activity' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-gray-50'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" /> My Activity
                    </button>
                    
                    <div className="pt-4 pb-2">
                        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Services</p>
                    </div>
                    
                    {!isGuest && (
                        <button onClick={() => navigate('/components')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-gray-50 transition-all">
                            <Package className="w-5 h-5 text-blue-500" /> Component Library
                        </button>
                    )}
                    <button onClick={() => navigate('/3d-print')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-gray-50 transition-all">
                        <Printer className="w-5 h-5 text-purple-500" /> 3D Printing
                    </button>
                    <button onClick={() => navigate('/pcb-order')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-gray-50 transition-all">
                        <CircuitBoard className="w-5 h-5 text-emerald-500" /> PCB Fabrication
                    </button>
                    <button onClick={() => setShowBookingModal(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-gray-50 transition-all">
                        <Calendar className="w-5 h-5 text-green-500" /> Book Slot
                    </button>

                    <div className="pt-4 pb-2">
                        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account</p>
                    </div>

                    <button 
                        onClick={() => { setActiveSection('settings'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === 'settings' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-gray-50'}`}
                    >
                        <Settings className="w-5 h-5" /> Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-gray-50 transition-all">
                        <HelpCircle className="w-5 h-5" /> Help & Support
                    </button>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-100">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all">
                        <LogOut className="w-5 h-5" /> Sign Out
                    </button>
                </div>
            </div>
        </aside>

        {/* --- MOBILE SIDEBAR --- */}
        <div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)}>
            <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out p-6 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-8">
                    <img src={user?.avatar} alt="Profile" className="w-12 h-12 rounded-full border-2 border-brand-100" />
                    <div>
                        <p className="font-bold text-sm text-slate-900 line-clamp-1">{user?.name}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{user?.email}</p>
                    </div>
                </div>
                
                <div className="space-y-1">
                    <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-gray-50">
                        <Home className="w-5 h-5" /> Home
                    </button>
                    <button onClick={() => navigate('/pcb-order')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-gray-50">
                        <CircuitBoard className="w-5 h-5" /> PCB Order
                    </button>
                    <button onClick={() => { setActiveSection('settings'); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-gray-50">
                        <Settings className="w-5 h-5" /> Settings
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50">
                        <LogOut className="w-5 h-5" /> Sign Out
                    </button>
                </div>
            </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
            
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <img src="https://www.reva.edu.in/icgtasmt-2022/assets/pages/img/Logo/Reva_logo.jpeg" alt="REVA Logo" className="h-8 w-auto mix-blend-multiply" />
                </div>
                <div className="relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-500 relative">
                        <Bell className="w-6 h-6" />
                        {notifications.some(n => !n.read) && <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                    </button>
                    {showNotifications && (
                       <div className="absolute right-0 top-12 w-72 bg-white shadow-2xl rounded-xl border border-gray-100 p-2 animate-slide-up max-h-80 overflow-y-auto z-50">
                           <div className="flex justify-between items-center px-3 py-2 border-b border-gray-50">
                               <h4 className="text-xs font-bold text-slate-500 uppercase">Notifications</h4>
                               <button onClick={() => setShowNotifications(false)}><X className="w-3 h-3 text-slate-400"/></button>
                           </div>
                           {notifications.length === 0 ? <p className="text-center text-sm text-slate-400 py-4">No notifications</p> : (
                               notifications.map(n => (
                                   <div key={n.id} className={`p-3 rounded-xl mb-1 ${n.read ? 'opacity-60' : 'bg-blue-50'}`}>
                                       <p className="text-sm font-bold text-slate-900">{n.title}</p>
                                       <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                                   </div>
                               ))
                           )}
                       </div>
                   )}
                </div>
            </div>

            {/* Desktop Notification Bell */}
            <div className="hidden md:block absolute top-6 right-8 z-30">
                <div className="relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors relative">
                        <Bell className="w-5 h-5 text-slate-600" />
                        {notifications.some(n => !n.read) && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
                    </button>
                    {showNotifications && (
                       <div className="absolute right-0 top-12 w-80 bg-white shadow-2xl rounded-2xl border border-gray-100 p-2 animate-slide-up max-h-96 overflow-y-auto">
                           <div className="flex justify-between items-center px-3 py-2 border-b border-gray-50">
                               <h4 className="text-xs font-bold text-slate-500 uppercase">Notifications</h4>
                               <button onClick={() => setShowNotifications(false)}><X className="w-3 h-3 text-slate-400"/></button>
                           </div>
                           {notifications.length === 0 ? <p className="text-center text-sm text-slate-400 py-4">No notifications</p> : (
                               notifications.map(n => (
                                   <div key={n.id} className={`p-3 rounded-xl mb-1 ${n.read ? 'opacity-60' : 'bg-blue-50'}`}>
                                       <p className="text-sm font-bold text-slate-900">{n.title}</p>
                                       <p className="text-xs text-slate-500">{n.message}</p>
                                   </div>
                               ))
                           )}
                       </div>
                   )}
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                {activeSection === 'activity' ? (
                    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
                        {/* Welcome Banner */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl md:rounded-3xl p-5 md:p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 md:w-64 md:h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <h1 className="text-xl md:text-3xl font-display font-bold mb-1 md:mb-2">Hello, {user?.name.split(' ')[0]}!</h1>
                                    <p className="text-slate-300 text-xs md:text-base max-w-lg">Track your projects & bookings.</p>
                                </div>
                                <div className="hidden md:block">
                                    <span className="text-3xl">👋</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions (Mobile/Tablet) */}
                        <div className="grid grid-cols-4 gap-2 md:hidden">
                            <button onClick={() => setShowBookingModal(true)} className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
                                <div className="p-2 bg-green-50 text-green-600 rounded-full"><Calendar className="w-5 h-5"/></div>
                                <span className="text-[10px] font-bold text-slate-700">Book</span>
                            </button>
                            <button onClick={() => navigate('/3d-print')} className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-full"><Printer className="w-5 h-5"/></div>
                                <span className="text-[10px] font-bold text-slate-700">Print</span>
                            </button>
                            <button onClick={() => navigate('/pcb-order')} className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full"><CircuitBoard className="w-5 h-5"/></div>
                                <span className="text-[10px] font-bold text-slate-700">PCB</span>
                            </button>
                            <button onClick={() => navigate('/events')} className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
                                <div className="p-2 bg-orange-50 text-orange-600 rounded-full"><Clock className="w-5 h-5"/></div>
                                <span className="text-[10px] font-bold text-slate-700">Events</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* 3D Prints */}
                            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4 md:mb-6">
                                    <h2 className="text-base md:text-lg font-bold flex items-center gap-2"><Printer className="w-5 h-5 text-purple-600"/> 3D Prints</h2>
                                    <button onClick={() => navigate('/3d-print')} className="text-xs font-bold text-purple-600 hover:bg-purple-50 px-3 py-1 rounded-full transition-colors hidden md:block">+ New</button>
                                </div>
                                <div className="space-y-3">
                                    {printOrders.length === 0 && <div className="text-center py-6 text-slate-400 text-xs md:text-sm">No active print orders.</div>}
                                    {printOrders.map(order => (
                                        <div key={order.id} className="border border-gray-100 rounded-xl p-3 flex gap-3 md:gap-4 items-center hover:bg-gray-50 transition-colors">
                                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden"><img src={order.thumbnail} alt="" className="w-full h-full object-cover"/></div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h3 className="font-bold text-xs md:text-sm text-slate-900 truncate">{order.fileName}</h3>
                                                    <span className={`text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
                                                </div>
                                                <p className="text-[10px] md:text-xs text-slate-500">{order.material} • {order.submitDate}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PCB Orders */}
                            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4 md:mb-6">
                                    <h2 className="text-base md:text-lg font-bold flex items-center gap-2"><CircuitBoard className="w-5 h-5 text-emerald-600"/> PCB Orders</h2>
                                    <button onClick={() => navigate('/pcb-order')} className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1 rounded-full transition-colors hidden md:block">+ New</button>
                                </div>
                                <div className="space-y-3">
                                    {pcbOrders.length === 0 && <div className="text-center py-6 text-slate-400 text-xs md:text-sm">No PCB orders.</div>}
                                    {pcbOrders.map(order => (
                                        <div key={order.id} className="border border-gray-100 rounded-xl p-3 flex gap-3 md:gap-4 items-center hover:bg-gray-50 transition-colors">
                                            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 text-emerald-600"><CircuitBoard className="w-6 h-6"/></div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h3 className="font-bold text-xs md:text-sm text-slate-900 truncate">{order.fileName}</h3>
                                                    <span className={`text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
                                                </div>
                                                <p className="text-[10px] md:text-xs text-slate-500">{order.specs.layers} Layers • {order.specs.quantity} Pcs</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Indents */}
                            {!isGuest && (
                                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4 md:mb-6">
                                        <h2 className="text-base md:text-lg font-bold flex items-center gap-2"><Package className="w-5 h-5 text-blue-600"/> Indents</h2>
                                        <button onClick={() => navigate('/components')} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-full transition-colors hidden md:block">+ New</button>
                                    </div>
                                    <div className="space-y-3">
                                        {indents.length === 0 && <div className="text-center py-6 text-slate-400 text-xs md:text-sm">No component requests.</div>}
                                        {indents.map(indent => (
                                            <div key={indent.id} className="border border-gray-100 rounded-xl p-3 md:p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div><h3 className="font-bold text-xs md:text-sm text-slate-900">{indent.projectTitle}</h3><p className="text-[10px] md:text-xs text-slate-500">{indent.items.length} Items</p></div>
                                                    <span className={`text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-full uppercase ${indent.status === 'active' ? 'bg-green-100 text-green-700' : indent.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{indent.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bookings */}
                            <div className={`bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 lg:col-span-2`}>
                                <div className="flex items-center justify-between mb-4 md:mb-6">
                                    <h2 className="text-base md:text-lg font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-green-600"/> Bookings</h2>
                                    <button onClick={() => setShowBookingModal(true)} className="text-xs font-bold text-green-600 hover:bg-green-50 px-3 py-1 rounded-full transition-colors hidden md:block">+ Book</button>
                                </div>
                                <div className="space-y-3">
                                    {slotRequests.length === 0 && <div className="text-center py-6 text-slate-400 text-xs md:text-sm">No upcoming bookings.</div>}
                                    {slotRequests.map(slot => (
                                        <div key={slot.id} className="border border-gray-100 rounded-xl p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                                            <div>
                                                <h3 className="font-bold text-xs md:text-sm text-slate-900 flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-400"/> {slot.date} ({slot.startTime} - {slot.endTime})</h3>
                                                <p className="text-[10px] md:text-xs text-slate-500 mt-1">Purpose: {slot.purpose}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-full uppercase ${slot.status === 'approved' ? 'bg-green-100 text-green-700' : slot.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{slot.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto pb-20">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 px-4 md:px-0">Account Settings</h2>
                        {user && <SettingsPanel user={user} onUpdate={async (data) => {
                            await authService.updateProfile({ ...user, ...data });
                            window.location.reload(); 
                        }} />}
                    </div>
                )}
            </div>
        </main>

        {/* --- MOBILE BOTTOM NAVIGATION --- */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-6 flex justify-between items-center z-40 pb-safe">
            <button onClick={() => { setActiveSection('activity'); navigate('/dashboard'); }} className="flex flex-col items-center gap-1 text-brand-600">
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px] font-bold">Home</span>
            </button>
            
            {!isGuest && (
                <button onClick={() => navigate('/components')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-900">
                    <Package className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Catalog</span>
                </button>
            )}

            {/* Quick Action Center Button */}
            <button onClick={() => setShowBookingModal(true)} className="flex flex-col items-center justify-center -mt-8 active:scale-95 transition-transform">
                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center shadow-lg shadow-slate-900/40 border-4 border-gray-50">
                    <PlusCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-bold mt-1 text-slate-900">Book</span>
            </button>

            <button onClick={() => navigate('/3d-print')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-900">
                <Printer className="w-5 h-5" />
                <span className="text-[10px] font-medium">Print</span>
            </button>

            <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-900">
                <Menu className="w-5 h-5" />
                <span className="text-[10px] font-medium">Menu</span>
            </button>
        </div>

        {/* Quick Booking Modal */}
        {showBookingModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowBookingModal(false)}>
                <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-slate-900">Quick Book Slot</h3>
                        <button onClick={() => setShowBookingModal(false)}><X className="w-5 h-5 text-slate-500"/></button>
                    </div>
                    <form onSubmit={handleQuickBook} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                            <input type="date" required className="w-full p-3 bg-gray-50 border rounded-xl" value={bookDate} onChange={e => setBookDate(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Time</label>
                                <input type="time" required className="w-full p-3 bg-gray-50 border rounded-xl" value={bookStartTime} onChange={e => setBookStartTime(e.target.value)} min="09:00" max="17:00" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (Hrs)</label>
                                <select className="w-full p-3 bg-gray-50 border rounded-xl" value={bookDuration} onChange={e => setBookDuration(e.target.value)}>
                                    <option value="0.5">0.5</option>
                                    <option value="1">1.0</option>
                                    <option value="1.5">1.5</option>
                                    <option value="2">2.0</option>
                                    <option value="3">3.0</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purpose</label>
                            <select className="w-full p-3 bg-gray-50 border rounded-xl" value={bookPurpose} onChange={e => setBookPurpose(e.target.value)}>
                                <option>Project Work</option>
                                <option>3D Printing</option>
                                <option>Consultation</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <button disabled={bookingLoading} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold mt-2 shadow-lg disabled:opacity-70">
                            {bookingLoading ? 'Submitting...' : 'Confirm Request'}
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
