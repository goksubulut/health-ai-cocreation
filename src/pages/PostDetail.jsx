import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Send, MapPin, Target, CheckCircle2 } from 'lucide-react';

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [interestSent, setInterestSent] = useState(false);

  // Determine dynamic mesh based on ID for visual variety
  const meshImage = `/assets/mesh_${(parseInt(id) % 5) + 1 || 4}.png`;

  // Mock post
  const post = {
    title: 'Confidential Neurosurgery Robotics Model', 
    role: 'Robotics Engineer',
    stage: 'Concept Validation', 
    city: 'Remote / London', 
    tags: ['Neurosurgery', 'Hardware'], 
    isDiscreet: true, 
    author: 'Confidential User',
    desc: 'Due to ongoing patent drafts, the exact specifications cannot be listed here. We are seeking an electronics and robotics engineer to refine the prototype arm.'
  };

  const handleInterest = () => {
    if(post.isDiscreet && !ndaAccepted) {
      alert("Please review and agree to the NDA terms to proceed.");
      return;
    }
    setInterestSent(true);
    setTimeout(() => {
      navigate('/board');
    }, 2000);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 max-w-6xl mx-auto">
      
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/board" className="inline-flex items-center text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={16} className="mr-2"/> Back to Discovery
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Content Pane */}
        <motion.div 
          className="lg:col-span-8 flex flex-col gap-8"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        >
          {/* Aesthetic Hero Banner */}
          <div className="relative w-full h-[300px] sm:h-[350px] rounded-[2rem] overflow-hidden border border-border/50 shadow-2xl group flex flex-col justify-end">
            <div className="absolute inset-0 bg-black">
              <img src={meshImage} alt="Cover Aesthetic" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80" />
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent"></div>
            
            <div className="relative z-10 p-8 sm:p-10 text-white">
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map(tag => (
                  <span key={tag} className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white shadow-sm">
                    {tag}
                  </span>
                ))}
                {post.isDiscreet && (
                  <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-red-500/20 px-3 py-1.5 rounded-full font-mono text-xs font-bold text-red-300 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Confidential
                  </span>
                )}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight drop-shadow-xl text-white leading-tight">
                {post.title}
              </h1>
            </div>
          </div>

          {/* Details Card */}
          <motion.div 
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 sm:p-10 shadow-sm"
            whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 pb-8 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Target size={24} />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Seeking Role</div>
                  <div className="font-medium text-foreground">{post.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Project Stage</div>
                  <div className="font-medium text-foreground">{post.stage}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin size={24} />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Location</div>
                  <div className="font-medium text-foreground">{post.city}</div>
                </div>
              </div>
            </div>

            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <h3 className="font-serif text-2xl font-bold text-foreground mb-4">Project Overview</h3>
              <p className="text-muted-foreground text-lg leading-relaxed font-mono tracking-tight">{post.desc}</p>
            </div>

            {post.isDiscreet && (
              <div className="mt-10 p-6 rounded-2xl bg-zinc-900/5 dark:bg-zinc-900/50 border border-zinc-900/10 dark:border-white/10 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-16 h-16 shrink-0 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 dark:text-red-400">
                  <ShieldAlert size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">Confidential Information</h4>
                  <p className="text-sm text-muted-foreground">Full technical methodologies, clinical trials, and proprietary blueprints are protected under NDA. Authorized access will be granted post-match.</p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Action Pane / Sidebar */}
        <motion.div 
          className="lg:col-span-4"
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div 
            className="sticky top-28 bg-card backdrop-blur-xl border border-border shadow-xl rounded-[2rem] p-8"
            whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="mb-8">
               <h3 className="font-sans font-bold text-2xl mb-2 text-foreground tracking-tight">Express Interest</h3>
               <p className="text-sm text-muted-foreground leading-relaxed">Initiate contact with <strong className="text-foreground">{post.author}</strong> to propose a technical review meeting.</p>
            </div>
            
            {post.isDiscreet && (
              <div className="mb-8 bg-background rounded-xl border border-border p-5">
                <label className="flex items-start gap-4 cursor-pointer group">
                  <div className="relative mt-1">
                    <input type="checkbox" className="sr-only" checked={ndaAccepted} onChange={(e) => setNdaAccepted(e.target.checked)} />
                    <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${ndaAccepted ? 'bg-primary border-primary' : 'bg-transparent border-border group-hover:border-primary'}`}>
                      {ndaAccepted && <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground leading-snug select-none">
                    I digitally sign and agree to the <span className="text-primary underline underline-offset-2">Mutual Non-Disclosure Agreement (MNDA)</span> required by the publisher.
                  </span>
                </label>
              </div>
            )}
            
            <button 
              className={`w-full relative overflow-hidden rounded-full py-4 px-6 text-sm font-bold uppercase tracking-widest shadow-lg transition-all duration-300 flex items-center justify-center gap-3 ${interestSent ? 'bg-green-500 text-white cursor-default' : 'bg-primary text-primary-foreground hover:opacity-90 hover:shadow-primary/25'}`}
              onClick={handleInterest}
              disabled={interestSent}
            >
              {interestSent ? (
                 <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                   <CheckCircle2 size={18}/> Request Transmitted
                 </motion.div>
              ) : (
                <>Transmit Proposal <Send size={16}/></>
              )}
            </button>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}

export default PostDetail;
