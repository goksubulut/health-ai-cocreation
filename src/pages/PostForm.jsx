import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function PostForm() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', desc: '', area: '', roleNeeded: '', stage: '', privacy: '', location: '', expiration: ''
  });

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));
  const handleSubmit = (e) => {
    e.preventDefault();
    if(step < 3) return handleNext();
    // Finish submission
    navigate('/dashboard');
  };

  return (
    <div className="wizard-wrapper">
      <div className="wizard-container">
        
        <div className="wizard-progress">
          <div className="progress-bar">
            <motion.div 
              className="progress-fill" 
              initial={{ width: 0 }}
              animate={{ width: `${((step - 1) / 2) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="step-indicators">
            <span className={step >= 1 ? "active" : ""}>1. Basics</span>
            <span className={step >= 2 ? "active" : ""}>2. Details</span>
            <span className={step >= 3 ? "active" : ""}>3. Logistics</span>
          </div>
        </div>

        <motion.div 
          className="glass-card wizard-card"
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        >
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="wizard-content">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="wizard-header">
                      <h3>Project Basics</h3>
                      <p>Start by outlining your primary goals.</p>
                    </div>
                    <div className="form-group mb-4">
                      <input type="text" placeholder="Project Title" style={{paddingLeft: '16px'}} required
                        value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div className="form-group mb-4">
                      <input type="text" placeholder="Study Area (e.g. Cardiology)" style={{paddingLeft: '16px'}} required
                        value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <textarea placeholder="Short Description & Goals" rows={4} style={{width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(163, 163, 128, 0.4)', background: 'rgba(255, 255, 255, 0.5)'}} required
                        value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="wizard-header">
                      <h3>Needs & Collaboration</h3>
                      <p>What kind of expertise are you looking for?</p>
                    </div>
                    <div className="form-group mb-4">
                      <select style={{paddingLeft: '16px'}} required value={formData.roleNeeded} onChange={e => setFormData({...formData, roleNeeded: e.target.value})}>
                        <option value="" disabled>Expertise Needed...</option>
                        <option value="ml_engineer">Machine Learning Engineer</option>
                        <option value="data_scientist">Data Scientist</option>
                        <option value="surgeon">Surgeon / Clinical Lead</option>
                        <option value="radiologist">Radiologist</option>
                      </select>
                    </div>
                    <div className="form-group mb-4">
                      <select style={{paddingLeft: '16px'}} required value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                        <option value="" disabled>Project Stage...</option>
                        <option value="idea">Idea Concept</option>
                        <option value="validation">Concept Validation</option>
                        <option value="prototype">Prototype</option>
                        <option value="pilot">Pilot</option>
                        <option value="pre_deployment">Pre-deployment</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <select style={{paddingLeft: '16px'}} required value={formData.privacy} onChange={e => setFormData({...formData, privacy: e.target.value})}>
                        <option value="" disabled>Privacy Level...</option>
                        <option value="public">Publicly Visible</option>
                        <option value="confidential">Confidential (Requires NDA & Meeting)</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="wizard-header">
                      <h3>Final Logistics</h3>
                      <p>Where is this happening and what's the timeline?</p>
                    </div>
                    <div className="form-group mb-4">
                      <input type="text" placeholder="City & Country" style={{paddingLeft: '16px'}} required
                        value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                    </div>
                    <div className="form-group mb-4">
                      <input type="date" style={{paddingLeft: '16px'}} required
                        value={formData.expiration} onChange={e => setFormData({...formData, expiration: e.target.value})} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="wizard-actions">
              {step > 1 && (
                <button type="button" onClick={handlePrev} className="btn-secondary">
                  <ArrowLeft size={18} /> Back
                </button>
              )}
              <div style={{ flex: 1 }}></div>
              <button type="submit" className="btn-primary">
                {step < 3 ? (
                  <>Next Step <ArrowRight size={18} /></>
                ) : (
                  <>Create Post <CheckCircle2 size={18} /></>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default PostForm;
