
import React from 'react';
import { Target, Eye, Lightbulb, Zap, Award, Globe, History, Cpu, PenTool, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-20 md:py-32 relative overflow-hidden bg-noise">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-slate-900 to-black opacity-90"></div>
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600 rounded-full blur-[120px] opacity-20"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
           <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-brand-400 font-bold text-[10px] md:text-sm mb-6 uppercase tracking-wider backdrop-blur-md">
              Established 2021
           </span>
           <h1 className="text-4xl md:text-7xl font-display font-bold mb-6 leading-tight tracking-tight">
             Innovate. Incubate. <br className="hidden md:block" />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-vivid-pink">Inspire.</span>
           </h1>
           <p className="text-base md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed px-4">
             AICTE IDEA Lab at REVA University is a 24x7 manufacturing ecosystem designed to foster creativity, hands-on learning, and the translation of theoretical ideas into tangible reality.
           </p>
        </div>
      </div>

      {/* Mission & Vision Split */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
            <div className="order-2 lg:order-1 space-y-8">
               <div>
                   <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4 flex items-center gap-3">
                       <Target className="w-8 h-8 text-brand-600" /> Our Mission
                   </h2>
                   <p className="text-slate-600 leading-relaxed text-sm md:text-base text-justify">
                     To provide a collaborative workspace where students, faculty, and industry experts utilize advanced machinery to solve real-world problems. We aim to bridge the gap between textbook theory and industrial application through rapid prototyping and product development.
                   </p>
               </div>
               <div>
                   <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4 flex items-center gap-3">
                       <Eye className="w-8 h-8 text-purple-600" /> Our Vision
                   </h2>
                   <p className="text-slate-600 leading-relaxed text-sm md:text-base text-justify">
                     To become a global center of excellence for innovation, fostering a culture where every student has the tools and mentorship to become a job creator rather than just a job seeker.
                   </p>
               </div>
               
               <div className="flex flex-wrap gap-3 pt-4">
                  {['24/7 Access', 'Industry Mentors', 'Seed Funding'].map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">
                          #{tag}
                      </span>
                  ))}
               </div>
            </div>
            
            <div className="order-1 lg:order-2 relative group">
               <div className="absolute inset-0 bg-brand-600 rounded-[2rem] transform rotate-3 group-hover:rotate-6 transition-transform duration-500 opacity-20"></div>
               <img 
                  src="https://picsum.photos/seed/mission/800/800" 
                  alt="Innovation Workspace" 
                  className="relative rounded-[2rem] shadow-2xl w-full h-[300px] md:h-[500px] object-cover" 
               />
            </div>
         </div>

         {/* Values Grid */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
            {[
                { icon: Lightbulb, title: "Creativity", desc: "Thinking beyond conventional boundaries to find novel solutions.", color: "text-yellow-500", bg: "bg-yellow-50" },
                { icon: Users, title: "Collaboration", desc: "Cross-disciplinary teamwork between engineering, arts, and science.", color: "text-blue-500", bg: "bg-blue-50" },
                { icon: Award, title: "Excellence", desc: "Pursuing the highest standards in design, fabrication, and research.", color: "text-brand-600", bg: "bg-brand-50" }
            ].map((item, idx) => (
                <div key={idx} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mb-6`}>
                        <item.icon className={`w-7 h-7 ${item.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
            ))}
         </div>

         {/* Facilities Section */}
         <div className="mb-24">
             <div className="text-center mb-12">
                 <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900 mb-4">State-of-the-Art Facilities</h2>
                 <p className="text-slate-500 max-w-2xl mx-auto">Equipped with industrial-grade machinery worth over ₹2 Crores.</p>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 {[
                     { name: "3D Printing Farm", icon: Cpu, count: "12 Units" },
                     { name: "Laser Cutters", icon: Zap, count: "2 Units" },
                     { name: "CNC Machining", icon: PenTool, count: "5 Axis" },
                     { name: "IoT Workstations", icon: Globe, count: "30 Seats" }
                 ].map((fac, idx) => (
                     <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center text-center hover:bg-slate-900 hover:text-white transition-colors group">
                         <fac.icon className="w-8 h-8 text-slate-400 mb-3 group-hover:text-brand-400" />
                         <h4 className="font-bold text-lg mb-1">{fac.name}</h4>
                         <span className="text-xs font-medium opacity-60 bg-black/5 group-hover:bg-white/20 px-2 py-1 rounded">{fac.count}</span>
                     </div>
                 ))}
             </div>
         </div>

         {/* Timeline / Journey */}
         <div className="relative border-l-2 border-slate-200 pl-8 ml-4 md:ml-0 md:pl-0 md:border-l-0 md:border-t-2 md:pt-12 md:grid md:grid-cols-4 gap-8">
             {[
                 { year: "2021", title: "Inception", desc: "Grant received from AICTE. Lab infrastructure setup begins." },
                 { year: "2022", title: "Inauguration", desc: "Officially opened to students. First hackathon conducted." },
                 { year: "2023", title: "Expansion", desc: "Added metal 3D printing and advanced PCB fabrication units." },
                 { year: "2024", title: "Global Reach", desc: "Collaborations with 5 international universities established." }
             ].map((milestone, idx) => (
                 <div key={idx} className="mb-10 md:mb-0 relative">
                     {/* Mobile Dot */}
                     <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-white border-4 border-brand-500 md:hidden"></div>
                     {/* Desktop Dot */}
                     <div className="hidden md:block absolute -top-[59px] left-0 w-5 h-5 rounded-full bg-white border-4 border-brand-500"></div>
                     
                     <span className="text-4xl font-display font-black text-slate-200 block mb-2">{milestone.year}</span>
                     <h4 className="text-lg font-bold text-slate-900 mb-2">{milestone.title}</h4>
                     <p className="text-sm text-slate-600">{milestone.desc}</p>
                 </div>
             ))}
         </div>
      </div>

      {/* CTA */}
      <div className="bg-slate-900 py-16 px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">Ready to start your journey?</h2>
          <Link to="/login" className="inline-flex items-center px-8 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-all hover:scale-105">
              Join the Lab <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
      </div>
    </div>
  );
};

export default About;
