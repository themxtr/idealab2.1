
import React, { useRef, useEffect, useState } from 'react';
import { GALLERY_ITEMS } from '../constants';
import { Play, X, ZoomIn, Image as ImageIcon, Video } from 'lucide-react';
import { GalleryItem } from '../types';

const Gallery: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  const filteredItems = GALLERY_ITEMS.filter(item => filter === 'all' || item.type === filter);

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Captured Moments
          </h1>
          <p className="text-gray-400 text-sm md:text-lg max-w-2xl mx-auto mb-8">
            A glimpse into the daily innovations and breakthroughs happening at the IDEA Lab.
          </p>

          {/* Filters */}
          <div className="inline-flex bg-gray-900 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${filter === 'all' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                  All
              </button>
              <button 
                onClick={() => setFilter('image')}
                className={`px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${filter === 'image' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                 <ImageIcon className="w-3 h-3 md:w-4 md:h-4" /> Photos
              </button>
              <button 
                onClick={() => setFilter('video')}
                className={`px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${filter === 'video' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                 <Video className="w-3 h-3 md:w-4 md:h-4" /> Videos
              </button>
          </div>
        </div>

        {/* Masonry-like Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-[250px] md:auto-rows-[300px]">
          {filteredItems.map((item, idx) => (
            <div 
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`relative group rounded-3xl overflow-hidden bg-gray-900 border border-white/10 cursor-zoom-in ${
                item.size === 'large' ? 'md:col-span-2 md:row-span-2' : 
                item.size === 'medium' ? 'md:row-span-2' : ''
              }`}
            >
              {item.type === 'video' ? (
                <div className="w-full h-full relative">
                     <img src={item.poster || item.src} alt={item.title} className="w-full h-full object-cover opacity-80" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                             <Play className="w-5 h-5 md:w-6 md:h-6 text-white fill-current" />
                        </div>
                     </div>
                </div>
              ) : (
                <img 
                  src={item.src} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              )}

              {/* Overlay info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                 <h3 className="text-white font-bold text-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                   {item.title}
                 </h3>
                 <p className="text-gray-400 text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                    Click to expand
                 </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedItem && (
          <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-20 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
              >
                  <X className="w-6 h-6 md:w-8 md:h-8" />
              </button>
              
              <div className="w-full max-w-6xl max-h-[90vh] relative flex flex-col items-center">
                  {selectedItem.type === 'video' ? (
                      <video 
                         src={selectedItem.src} 
                         controls 
                         autoPlay 
                         className="max-w-full max-h-[80vh] rounded-xl shadow-2xl"
                      />
                  ) : (
                      <img 
                         src={selectedItem.src} 
                         alt={selectedItem.title} 
                         className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                      />
                  )}
                  <div className="mt-4 text-center px-4">
                      <h3 className="text-xl md:text-2xl font-bold font-display">{selectedItem.title}</h3>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Gallery;
