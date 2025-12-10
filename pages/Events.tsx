
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { EVENTS, INDIAN_HOLIDAYS } from '../constants';
import { Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle, X, Lock } from 'lucide-react';
import { User, SlotBooking } from '../types';
import { authService } from '../services/api';

interface EventsProps {
  user?: User;
}

const Events: React.FC<EventsProps> = ({ user }) => {
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'success'>('idle');
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking Form State
  const [slotPurpose, setSlotPurpose] = useState('Project Work');
  const [attendees, setAttendees] = useState(1);

  // Fetch blocked dates (manual staff blocks) on mount
  useEffect(() => {
    const fetchBlocked = async () => {
      const dates = await authService.getBlockedDates();
      setBlockedDates(dates);
    };
    fetchBlocked();
  }, []);

  // Calendar Helpers
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getFormattedDate = (day: number) => {
    return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isDateClosed = (day: number) => {
    const dateStr = getFormattedDate(day);
    return INDIAN_HOLIDAYS.includes(dateStr) || blockedDates.includes(dateStr);
  };

  // Mock slot data
  const getSlotsForDay = (day: number) => {
    if (isDateClosed(day)) return 0;
    const seed = day * (currentMonth.getMonth() + 1);
    const count = (seed * 17) % 6; 
    return count === 0 ? 0 : count; // 0 means full
  };

  const handleDateClick = (day: number) => {
    if (isDateClosed(day)) return;
    
    if (!user) {
        if (confirm("You must be logged in to book a lab slot. Login now?")) {
            navigate('/login');
        }
        return;
    }

    setSelectedDate(day);
    setBookingStatus('idle');
    setBookingModalOpen(true);
  };

  const handleBookSlot = async () => {
     if (!user || !selectedDate) return;
     
     setIsSubmitting(true);
     const dateStr = getFormattedDate(selectedDate);

     const newRequest: SlotBooking = {
         id: `SLOT-${Math.floor(Math.random() * 100000)}`,
         userId: user.id,
         userName: user.name,
         date: dateStr,
         startTime: '09:00', // Defaulting for simplicity
         endTime: '17:00',
         purpose: slotPurpose,
         attendees: attendees,
         status: 'pending',
         requestDate: new Date().toLocaleDateString()
     };

     await authService.createSlotRequest(newRequest);

     setIsSubmitting(false);
     setBookingStatus('success');
     
     setTimeout(() => {
        setBookingModalOpen(false);
        setBookingStatus('idle');
        setSlotPurpose('Project Work');
        setAttendees(1);
     }, 2000);
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  return (
    <div className="min-h-screen bg-white pt-24 md:pt-28 pb-10 md:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-10 pb-6 border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 tracking-tight">Lab Schedule</h1>
            <p className="text-slate-500 mt-2 text-sm md:text-lg">Upcoming workshops, seminars, and open lab slots.</p>
          </div>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl self-start md:self-auto">
             <button 
                onClick={() => setView('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <List className="w-4 h-4" /> List
             </button>
             <button 
                onClick={() => setView('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <CalendarIcon className="w-4 h-4" /> Calendar
             </button>
          </div>
        </div>

        {view === 'list' ? (
          /* List View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 animate-fade-in">
            {EVENTS.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          /* Calendar View */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm animate-fade-in overflow-hidden">
             <div className="p-4 md:p-6 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg md:text-xl font-bold text-slate-900">
                   {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <div className="flex gap-1">
                   <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-slate-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                   <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg text-slate-500 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>
             </div>
             
             <div className="grid grid-cols-7 text-center border-b border-gray-100 bg-gray-50">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                   <div key={i} className="py-3 text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      <span className="md:hidden">{day}</span>
                      <span className="hidden md:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span>
                   </div>
                ))}
             </div>

             <div className="grid grid-cols-7 auto-rows-[80px] md:auto-rows-[120px] divide-x divide-gray-100 divide-y border-b border-gray-100">
                {/* Empty Cells */}
                {Array.from({ length: firstDay }).map((_, i) => (
                   <div key={`empty-${i}`} className="bg-gray-50/20"></div>
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                   const day = i + 1;
                   const closed = isDateClosed(day);
                   const slots = getSlotsForDay(day);
                   const isFull = slots === 0;
                   const hasEvent = EVENTS.some(e => e.date.getDate() === day && e.date.getMonth() === currentMonth.getMonth());
                   
                   return (
                     <div 
                        key={day} 
                        onClick={() => !closed && !isFull && handleDateClick(day)}
                        className={`p-1 md:p-3 relative group transition-colors flex flex-col justify-between 
                            ${closed ? 'bg-red-50/50 cursor-not-allowed' : isFull ? 'bg-gray-50/50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
                     >
                        <div className="flex justify-between items-start">
                           <span className={`text-xs md:text-sm font-semibold ${closed ? 'text-red-400' : isFull ? 'text-gray-300' : 'text-slate-700'}`}>{day}</span>
                           {hasEvent && <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-brand-500"></div>}
                        </div>
                        
                        <div className="space-y-1">
                           {hasEvent && (
                              <div className="hidden md:block px-2 py-1 bg-brand-50 text-brand-700 text-[10px] font-bold rounded truncate">
                                 Event
                              </div>
                           )}

                           {closed ? (
                                <div className="flex items-center justify-center md:justify-start gap-1 text-[10px] font-bold text-red-400 uppercase">
                                    <Lock className="w-3 h-3" /> <span className="hidden md:inline">Closed</span>
                                </div>
                           ) : isFull ? (
                              <div className="flex items-center justify-center md:justify-start gap-1 text-[10px] font-bold text-gray-400 uppercase">
                                 <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> <span className="hidden md:inline">Full</span>
                              </div>
                           ) : (
                              <div className="flex items-center justify-center md:justify-start gap-1 text-[10px] font-bold text-green-600 uppercase bg-green-50 px-1 md:px-2 py-0.5 md:py-1 rounded">
                                 <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> 
                                 <span className="hidden md:inline">{slots} Slots</span>
                                 <span className="md:hidden text-[9px]">{slots}</span>
                              </div>
                           )}
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>
        )}

      </div>

      {/* Booking Modal */}
      {bookingModalOpen && (
         <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setBookingModalOpen(false)}></div>
            <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up overflow-hidden">
               {bookingStatus === 'success' ? (
                  <div className="p-12 text-center">
                     <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                     </div>
                     <h2 className="text-xl font-bold text-slate-900 mb-2">Request Sent!</h2>
                     <p className="text-slate-500 text-sm">Your booking request for {selectedDate} {monthNames[currentMonth.getMonth()]} has been submitted. Check your dashboard for updates.</p>
                  </div>
               ) : (
                  <>
                     <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="text-lg font-bold text-slate-900">Reserve Lab Slot</h3>
                        <button onClick={() => setBookingModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                     </div>
                     <div className="p-6 space-y-5">
                        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800">
                           <CalendarIcon className="w-5 h-5 shrink-0 text-blue-600" />
                           <div>
                              <p className="font-bold text-sm">{selectedDate} {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</p>
                              <p className="text-xs opacity-80">General Hours: 09:00 AM - 05:00 PM</p>
                           </div>
                        </div>

                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Purpose</label>
                           <select 
                                value={slotPurpose}
                                onChange={(e) => setSlotPurpose(e.target.value)}
                                className="w-full p-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                           >
                              <option>Project Work</option>
                              <option>3D Printing</option>
                              <option>Laser Cutting</option>
                              <option>Consultation</option>
                           </select>
                        </div>
                        
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Number of Students</label>
                           <input 
                                type="number" 
                                min="1" 
                                max="5" 
                                value={attendees}
                                onChange={(e) => setAttendees(parseInt(e.target.value))}
                                className="w-full p-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all" 
                           />
                        </div>

                        <button 
                            onClick={handleBookSlot} 
                            disabled={isSubmitting}
                            className="w-full py-3.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-brand-600 transition-all shadow-lg hover:shadow-brand-500/20 mt-2 disabled:opacity-70"
                        >
                           {isSubmitting ? 'Sending Request...' : 'Confirm Request'}
                        </button>
                     </div>
                  </>
               )}
            </div>
         </div>
      )}
    </div>
  );
};

export default Events;
