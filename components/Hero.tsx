
import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SLIDES = [
  {
    id: 1,
    image: 'https://media.licdn.com/dms/image/v2/D5622AQE--CpBfS3hjA/feedshare-shrink_2048_1536/B56Zq6XKx4JwAw-/0/1764063229576?e=1766620800&v=beta&t=BWheflcayTj7wfzOOwRBQW0ijtC5WM74uGGmhIE57tc',
    title: 'Innovation Redefined',
    subtitle: 'Where ideas meet execution'
  },
  {
    id: 2,
    image: 'https://media.licdn.com/dms/image/v2/D5622AQEKNpUmLFTYwg/feedshare-shrink_800/B56Zq6XKx8J8Ak-/0/1764063228086?e=1766620800&v=beta&t=aMIIdGCfLQWXjsaHpqv2hqClkbwIRalYlhBmVHYIZrk',
    title: 'Future Ready',
    subtitle: 'Building the next generation of creators'
  },
  {
    id: 3,
    image: 'https://media.licdn.com/dms/image/v2/D4E22AQHCDqcEgRDbyw/feedshare-shrink_2048_1536/B4EZrEWe9uGcA4-/0/1764230822999?e=1766620800&v=beta&t=jWTCdY3WSutu_rpJQvv085_OD5FDQSPCxWWnvdcYPac',
    title: 'Limitless Potential',
    subtitle: 'Explore the boundaries of science'
  },
  {
    id: 4,
    image: 'https://media.licdn.com/dms/image/v2/D4E22AQFd6EoSgwRg0g/feedshare-shrink_800/B4EZrEWe91IoAg-/0/1764230828946?e=1766620800&v=beta&t=gWNHxiaIvVP-eDg-1CLf3p3-Hz0f5HGb1yOhivA4lB4',
    title: 'Collaborative Ecosystem',
    subtitle: 'Uniting diverse minds for breakthrough solutions'
  },
  {
    id: 5,
    image: 'https://media.licdn.com/dms/image/v2/D4E22AQH2fUc_38f_hA/feedshare-shrink_800/B4EZrEWe.OGoAg-/0/1764230835251?e=1766620800&v=beta&t=a7smqpOT-r0qySlyC-trmhiotoz_PRN2SC1BXi2shA0',
    title: 'Advanced Fabrication',
    subtitle: 'State-of-the-art tools for rapid prototyping'
  }
];

const Hero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      
      {/* Full Screen Background Slider */}
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img 
            src={slide.image} 
            alt={slide.title} 
            className="w-full h-full object-cover"
          />
          {/* Gradients for text readability */}
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-transparent to-black/30 opacity-80" />
          <div className="absolute inset-0 bg-noise opacity-10 mix-blend-overlay" />
        </div>
      ))}

      {/* Content Layer */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8">
        <div className="animate-fade-in max-w-6xl">
          <span className="inline-block px-4 py-2 mb-6 text-sm font-bold tracking-widest text-brand-400 uppercase bg-black/50 backdrop-blur-md rounded-full border border-brand-500/30">
            Welcome to
          </span>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-white leading-tight mb-6 drop-shadow-2xl">
            REVA University <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-vivid-pink">
              AICTE IDEA LAB
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
            {SLIDES[currentSlide].subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/gallery" className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-brand-600/30 flex items-center group">
              Explore Gallery <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/events" className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-full font-bold text-lg transition-all transform hover:scale-105">
              Upcoming Events
            </Link>
          </div>
        </div>
      </div>

      {/* Slider Controls */}
      <div className="absolute bottom-10 right-10 z-20 hidden md:flex space-x-4">
        <button onClick={prevSlide} className="p-3 bg-black/30 hover:bg-black/50 backdrop-blur-md text-white rounded-full border border-white/10 transition-all hover:scale-110 active:scale-95">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button onClick={nextSlide} className="p-3 bg-black/30 hover:bg-black/50 backdrop-blur-md text-white rounded-full border border-white/10 transition-all hover:scale-110 active:scale-95">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Indicators */}
       <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'w-8 bg-brand-500' : 'w-2 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
