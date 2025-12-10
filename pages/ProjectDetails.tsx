
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Project } from '../types';
import { ArrowLeft, Calendar, Tag, User, Layers, Share2, ExternalLink } from 'lucide-react';

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (id) {
        const data = await authService.getProjectById(id);
        setProject(data);
      }
      setLoading(false);
    };
    fetchProject();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>;
  
  if (!project) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Project Not Found</h2>
        <button onClick={() => navigate('/projects')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">Back to Projects</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Immersive Hero Header */}
      <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0">
            {project.video ? (
                <video src={project.video} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : (
                <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
        </div>
        
        <div className="absolute top-0 left-0 w-full p-6 z-20 pt-24">
            <button onClick={() => navigate('/projects')} className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-sm font-bold hover:bg-white/20 transition-colors border border-white/10">
                <ArrowLeft className="w-4 h-4" /> All Projects
            </button>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-16 max-w-7xl mx-auto z-10">
            <div className="animate-slide-up">
                <span className="inline-block px-3 py-1 mb-4 rounded-full bg-brand-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-brand-900/20">
                    {project.category}
                </span>
                <h1 className="text-4xl md:text-7xl font-display font-bold text-white mb-6 leading-tight max-w-4xl drop-shadow-xl">{project.title}</h1>
                
                <div className="flex flex-wrap items-center gap-6 text-slate-300 text-sm md:text-base font-medium">
                    <div className="flex items-center gap-2"><User className="w-5 h-5 text-brand-400" /> {project.author}</div>
                    <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-brand-400" /> {project.date}</div>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
              
              {/* Main Content */}
              <div className="lg:w-2/3 space-y-12">
                  <section>
                      <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-6">About the Project</h2>
                      <div className="prose prose-lg text-slate-600 leading-relaxed">
                          <p className="text-xl font-light text-slate-800 mb-6">{project.description}</p>
                          <p>{project.longDescription || project.description}</p>
                      </div>
                  </section>

                  {project.gallery && project.gallery.length > 0 && (
                      <section>
                          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-6">Gallery</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {project.gallery.map((img, idx) => (
                                  <div key={idx} className={`rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all ${idx === 0 ? 'md:col-span-2 md:h-[400px]' : 'h-[250px]'}`}>
                                      <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                  </div>
                              ))}
                          </div>
                      </section>
                  )}
              </div>

              {/* Sidebar Info */}
              <div className="lg:w-1/3">
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 sticky top-24">
                      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                          <Layers className="w-5 h-5 text-brand-600" /> Technology Stack
                      </h3>
                      
                      <div className="flex flex-wrap gap-2 mb-8">
                          {project.technologies?.map(tech => (
                              <span key={tech} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-1.5 shadow-sm">
                                  <Tag className="w-3 h-3 text-slate-400" /> {tech}
                              </span>
                          ))}
                      </div>

                      <div className="space-y-4 pt-6 border-t border-slate-200">
                          <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-brand-600 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-brand-500/20">
                              Contact Author <ExternalLink className="w-4 h-4" />
                          </button>
                          <button className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                              Share Project <Share2 className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
