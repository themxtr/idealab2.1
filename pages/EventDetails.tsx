
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Event } from '../types';
import { authService } from '../services/api';
import { Calendar, MapPin, Clock, ArrowLeft, Share2, CalendarPlus, UserCheck } from 'lucide-react';
import { generateGoogleCalendarUrl } from '../utils/calendar';

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
        if (id) {
            const data = await authService.getEventById(id);
            setEvent(data);
        }
        setLoading(false);
    };
    fetchEvent();
  }, [id]);

  const handleRegister = () => {
      setRegistered(true);
      // In real app, call API
  };

  if (loading) return <div className="min-h-screen pt-24 text-center">Loading...</div>;
  if (!event) return <div className="min-h-screen pt-24 text-center">Event not found</div>;

  const googleUrl = generateGoogleCalendarUrl(event);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <div className="relative h-[40vh] md:h-[50vh] w-full">
         <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
         <div className="absolute bottom-0 left-0 w-full p-6 md:p-16 text-white max-w-7xl mx-auto">
             <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-white/80 hover:text-white mb-4 md:mb-6 transition-colors text-sm font-bold">
                <ArrowLeft className="w-4 h-4" /> Back to Events
             </button>
             <span className="inline-block px-3 py-1 mb-3 md:mb-4 rounded-full bg-brand-500 text-white text-[10px] md:text-xs font-bold uppercase tracking-wider">
                {event.category}
             </span>
             <h1 className="text-3xl md:text-6xl font-display font-bold mb-4 leading-tight">{event.title}</h1>
             <div className="flex flex-col md:flex-row flex-wrap gap-3 md:gap-6 text-sm md:text-lg opacity-90">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 md:w-5 md:h-5 text-brand-400" /> {event.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 md:w-5 md:h-5 text-brand-400" /> {event.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 md:w-5 md:h-5 text-brand-400" /> {event.location}</div>
             </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-16">
          <div className="flex flex-col md:flex-row gap-8 md:gap-16">
             
             {/* Content Side */}
             <div className="md:w-2/3 order-2 md:order-1">
                 <h2 className="text-2xl font-bold mb-4 text-slate-900">About This Event</h2>
                 <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-8">
                    {event.description}
                    <br/><br/>
                    Join us for an immersive experience where innovation meets application. This event is designed for students, faculty, and industry professionals looking to expand their knowledge and network with like-minded individuals.
                 </p>
                 
                 <h3 className="text-xl font-bold mb-3 text-slate-900">What to Expect</h3>
                 <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-8 text-sm md:text-base">
                    <li>Hands-on demonstrations and workshops</li>
                    <li>Expert-led sessions and Q&A</li>
                    <li>Networking opportunities with industry leaders</li>
                    <li>Certificate of participation</li>
                 </ul>
             </div>

             {/* Registration Side (Sticks nicely on desktop, flows naturally on mobile) */}
             <div className="md:w-1/3 order-1 md:order-2">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:sticky md:top-24">
                   <h3 className="text-lg font-bold text-slate-900 mb-4">Registration</h3>
                   
                   {!registered ? (
                       <button 
                        onClick={handleRegister}
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg mb-4"
                       >
                        Register Now
                       </button>
                   ) : (
                       <button disabled className="w-full py-4 bg-green-100 text-green-700 font-bold rounded-xl flex items-center justify-center gap-2 mb-4">
                          <UserCheck className="w-5 h-5" /> Registered
                       </button>
                   )}

                   <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                       <a 
                          href={googleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 bg-gray-50 text-slate-700 font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 border border-gray-200 text-sm"
                       >
                          <CalendarPlus className="w-4 h-4" /> <span className="hidden md:inline">Add to Calendar</span><span className="md:hidden">Calendar</span>
                       </a>
                       
                       <button className="w-full py-3 text-slate-500 font-bold hover:text-brand-600 transition-colors flex items-center justify-center gap-2 text-sm border border-transparent hover:border-gray-100 rounded-xl">
                          <Share2 className="w-4 h-4" /> Share
                       </button>
                   </div>
                </div>
             </div>
          </div>
      </div>
    </div>
  );
};

export default EventDetails;
