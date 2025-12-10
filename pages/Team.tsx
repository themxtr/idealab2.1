
import React from 'react';
import { Linkedin, Mail, Twitter, Globe, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FACULTY = [
  { name: "Dr. P. Shyama Raju", role: "Chancellor", image: "https://ui-avatars.com/api/?name=P+S&background=0D8ABC&color=fff&size=200", designation: "Chief Patron", email: "chancellor@reva.edu.in", linkedin: "#" },
  { name: "Dr. M. Dhanamjaya", role: "Vice Chancellor", image: "https://ui-avatars.com/api/?name=M+D&background=ea580c&color=fff&size=200", designation: "Patron", email: "vc@reva.edu.in", linkedin: "#" },
  { name: "Dr. Kiran Kumari Patil", role: "Director, UIIC", image: "https://ui-avatars.com/api/?name=K+K&background=db2777&color=fff&size=200", designation: "Chief Coordinator", email: "director.uiic@reva.edu.in", linkedin: "#" },
  { name: "Prof. Adithya", role: "Lab In-Charge", image: "https://ui-avatars.com/api/?name=Adithya&background=333&color=fff&size=200", designation: "Faculty Coordinator", email: "adithya@reva.edu.in", linkedin: "#" },
];

const STUDENTS = [
  { name: "Sarah Johnson", role: "Student Lead", image: "https://ui-avatars.com/api/?name=Sarah&background=random&size=200", designation: "Tech Lead", email: "sarah@reva.edu.in", linkedin: "#" },
  { name: "Rahul Verma", role: "Student Coordinator", image: "https://ui-avatars.com/api/?name=Rahul&background=random&size=200", designation: "Operations", email: "rahul@reva.edu.in", linkedin: "#" },
  { name: "Amit Patel", role: "Hardware Lead", image: "https://ui-avatars.com/api/?name=Amit&background=random&size=200", designation: "Electronics", email: "amit@reva.edu.in", linkedin: "#" },
];

const TeamMemberCard: React.FC<{ member: any }> = ({ member }) => (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-xl transition-all hover:-translate-y-2 group flex flex-col items-center h-full">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-4 md:mb-6 border-4 border-gray-50 group-hover:border-brand-100 transition-colors shadow-inner">
            <img src={member.image} alt={member.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-slate-900">{member.name}</h3>
        <p className="text-brand-600 font-medium mb-1 text-sm md:text-base">{member.role}</p>
        <p className="text-slate-400 text-xs md:text-sm mb-6">{member.designation}</p>
        
        <div className="flex justify-center gap-3 mt-auto w-full">
            <a href={member.linkedin} target="_blank" rel="noreferrer" className="p-2.5 bg-gray-50 rounded-xl hover:bg-[#0077b5] hover:text-white transition-all duration-300">
                <Linkedin className="w-4 h-4" />
            </a>
            <a href={`mailto:${member.email}`} className="p-2.5 bg-gray-50 rounded-xl hover:bg-brand-600 hover:text-white transition-all duration-300">
                <Mail className="w-4 h-4" />
            </a>
            <a href="#" className="p-2.5 bg-gray-50 rounded-xl hover:bg-slate-900 hover:text-white transition-all duration-300">
                <Globe className="w-4 h-4" />
            </a>
        </div>
    </div>
);

const Team: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 text-center mb-16">
         <button onClick={() => navigate(-1)} className="md:hidden absolute top-24 left-4 p-2 bg-white rounded-full shadow-sm">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
         </button>
         <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-900 mb-4">Meet the Minds</h1>
         <p className="text-base md:text-xl text-slate-500 max-w-2xl mx-auto px-4">
            The dedicated visionaries and student innovators driving the future of REVA IDEA Lab.
         </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
         
         {/* Faculty Section */}
         <section>
             <div className="flex items-center gap-4 mb-8">
                 <h2 className="text-2xl font-bold text-slate-900">Leadership & Faculty</h2>
                 <div className="h-px bg-gray-200 flex-grow"></div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {FACULTY.map((member, idx) => (
                   <TeamMemberCard key={idx} member={member} />
                ))}
             </div>
         </section>

         {/* Student Team Section */}
         <section>
             <div className="flex items-center gap-4 mb-8">
                 <h2 className="text-2xl font-bold text-slate-900">Student Coordinators</h2>
                 <div className="h-px bg-gray-200 flex-grow"></div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {STUDENTS.map((member, idx) => (
                   <TeamMemberCard key={idx} member={member} />
                ))}
                
                {/* Join Team Card */}
                <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-700 text-center flex flex-col items-center justify-center h-full min-h-[300px] group cursor-pointer hover:bg-brand-900 transition-colors">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Users className="w-10 h-10 text-brand-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Join the Team</h3>
                    <p className="text-slate-400 text-sm mb-6 px-4">Are you passionate about innovation? We are hiring interns.</p>
                    <a href="mailto:idealab@reva.edu.in" className="px-6 py-2 bg-white text-slate-900 rounded-full font-bold text-sm hover:bg-brand-400 transition-colors">
                        Apply Now
                    </a>
                </div>
             </div>
         </section>

      </div>
    </div>
  );
};

// Simple Icon for Join Card
const Users = ({className}: {className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);

export default Team;
