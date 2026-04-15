import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const cardBackgrounds = [
  "/assets/mesh_1.png",
  "/assets/mesh_2.png",
  "/assets/mesh_3.png",
  "/assets/mesh_4.png",
  "/assets/mesh_5.png"
];

function Board() {
  const [searchTerm, setSearchParams] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Dummy mock data dynamically linked with visual identity backgrounds
  const posts = [
    { id: 1, title: 'AI-driven Cardiology Imaging Enhancer', role: 'Machine Learning', stage: 'Pre-deployment', city: 'San Francisco', tags: ['Cardiology', 'Vision'], isDiscreet: false, author: 'Dr. Sarah M.', bg: cardBackgrounds[0] },
    { id: 2, title: 'Confidential Neurosurgery Robotics Model', role: 'Robotics Eng', stage: 'Concept Validation', city: 'Remote / London', tags: ['Neurosurgery', 'Hardware'], isDiscreet: true, author: 'Confidential', bg: cardBackgrounds[1] },
    { id: 3, title: 'Predictive Genomics Dashboard Architecture', role: 'Data Scientist', stage: 'Prototype', city: 'Boston', tags: ['Genomics', 'Bioinformatics'], isDiscreet: false, author: 'Dr. Ahmet Y.', bg: cardBackgrounds[2] },
    { id: 4, title: 'Haptic Feedback Surgical Controller', role: 'Hardware Eng', stage: 'Testing', city: 'Berlin', tags: ['Haptics', 'Neurology'], isDiscreet: true, author: 'Dr. M. Strauss', bg: cardBackgrounds[3] },
  ];

  return (
    <div className="min-h-[100dvh] pt-28 pb-20 px-6 lg:px-16 bg-background">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
              className="font-serif text-5xl md:text-7xl font-bold tracking-tight mb-4"
            >
              Discover Projects
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground font-medium max-w-2xl"
            >
              Explore high-impact medical engineering requests from leading healthcare professionals seeking technical co-founders and specialized developers.
            </motion.p>
          </div>
        </div>

        {/* Filters & Grid Container */}
        <div className="flex flex-col xl:flex-row gap-12">
          
          <aside className="xl:w-64 shrink-0 flex flex-col gap-10">
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2 flex w-full">Quick Search</label>
              <input 
                type="text" 
                placeholder="Keywords..." 
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-primary transition-colors"
              />
            </div>
            
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2 flex w-full">Field of Medicine</label>
              <ul className="space-y-3 font-medium text-sm">
                {[...new Set(posts.map(p => p.tags[0]))].map(tag => (
                  <li 
                    key={tag} 
                    className="flex items-center gap-3 cursor-pointer group select-none"
                    onClick={() => setActiveFilter(activeFilter === tag ? 'All' : tag)}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${activeFilter === tag ? 'bg-primary border-primary' : 'border-border group-hover:border-primary'}`}>
                      {activeFilter === tag && <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                    </div>
                    <span className={activeFilter === tag ? 'text-primary font-bold' : 'text-foreground/80 group-hover:text-foreground'}>{tag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
            <AnimatePresence>
              {posts.map((post, i) => (
                <motion.div 
                  key={post.id}
                  className="relative group w-full aspect-[16/9] rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                >
                  <div className="absolute inset-0 z-0 bg-black">
                     <img src={post.bg} alt="Background" className="w-full h-full object-cover opacity-90 dark:opacity-70 saturate-150 contrast-125 mix-blend-screen transition-transform duration-700 group-hover:scale-105" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30"></div>
                  </div>
                  
                  <div className="relative z-10 w-full h-full flex flex-col justify-between p-5 lg:p-6 text-white pb-4">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        {post.isDiscreet && (
                          <div className="mb-2 inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-2 py-1 font-mono text-[8px] font-bold text-red-300 border border-red-500/20 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span> NDA Required
                          </div>
                        )}
                        <h3 
                          className="font-sans text-lg font-bold leading-tight tracking-tight drop-shadow-md pr-1"
                          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        >
                          {post.title}
                        </h3>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {post.tags.map(tag => (
                          <span key={tag} className="bg-white/10 backdrop-blur-md border border-white/20 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t border-white/20 pt-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] lg:text-[10px] uppercase text-white/60 font-bold tracking-widest mb-0.5">Seeking</span>
                          <span className="text-[13px] lg:text-sm font-semibold truncate max-w-[120px]">{post.role}</span>
                        </div>
                        <Link to={`/post/${post.id}`} className="bg-white text-black hover:bg-zinc-200 transition-colors rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider shadow-lg shrink-0">
                          Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Board;
