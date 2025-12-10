
import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpRight, Play, ExternalLink } from 'lucide-react';
import { PROJECTS } from '../constants';
import { Project } from '../types';
import { Link, useNavigate } from 'react-router-dom';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isHovered && videoRef.current && project.video) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isHovered, project.video]);

  return (
    <div 
      className={`relative group rounded-3xl overflow-hidden mb-6 break-inside-avoid bg-gray-100 dark:bg-gray-900 cursor-pointer transition-transform duration-500 ease-out hover:scale-[1.02] hover:shadow-2xl h-[300px] md:h-[400px]`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      {/* Media Layer */}
      <div className="absolute inset-0 w-full h-full">
         <img 
            src={project.image} 
            alt={project.title} 
            className={`w-full h-full object-cover transition-opacity duration-700 ${isHovered && project.video ? 'opacity-0' : 'opacity-100'}`}
         />
         {project.video && (
             <video
                ref={videoRef}
                src={project.video}
                loop
                muted
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
             />
         )}
         
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
      </div>

      {project.video && (
          <div className={`absolute top-4 right-4 bg-white/20 backdrop-blur-md p-3 rounded-full text-white transition-all duration-300 ${isHovered ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
             <Play className="w-4 h-4 fill-current" />
          </div>
      )}

      {/* Content Layer */}
      <div className="absolute bottom-0 left-0 w-full p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
         <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {project.category}
            </span>
         </div>
         <h3 className="text-2xl font-display font-bold leading-tight mb-2 drop-shadow-md">{project.title}</h3>
         <p className={`text-sm text-gray-200 line-clamp-2 mb-4 transition-all duration-500 ${isHovered ? 'opacity-100 max-h-20' : 'opacity-80 max-h-0 md:max-h-20'}`}>
            {project.description}
         </p>
         
         {/* Footer Actions */}
         <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75">
            <span className="text-xs font-medium text-gray-300">By {project.author}</span>
            <div className="flex gap-2">
                <Link
                    to={`/projects/${project.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 rounded-lg text-xs font-bold hover:bg-brand-500 transition-colors shadow-lg"
                    onClick={(e) => e.stopPropagation()} 
                >
                    View Project <ArrowUpRight className="w-3 h-3" />
                </Link>
            </div>
         </div>
      </div>
    </div>
  );
};

const Projects: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
       <div className="bg-slate-900 pt-32 pb-20 px-4 text-center text-white relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80"></div>
         <div className="relative z-10 max-w-4xl mx-auto">
             <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
               Innovation in Motion
             </h1>
             <p className="text-xl md:text-2xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
               Explore the breakthrough technologies and creative solutions developed by the brilliant minds at IDEA Lab.
             </p>
         </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-16">
         <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {PROJECTS.map(proj => (
               <ProjectCard key={proj.id} project={proj} />
            ))}
         </div>
      </div>
    </div>
  );
};

export default Projects;
