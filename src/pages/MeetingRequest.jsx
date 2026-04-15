import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Send, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

function MeetingRequest() {
  const navigate = useNavigate();
  const [requested, setRequested] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setRequested(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  return (
    <div className="wizard-wrapper">
      <div className="wizard-container" style={{maxWidth: '700px'}}>
        <Link to="/post/1" className="back-link"><ArrowLeft size={18}/> Back to Project</Link>

        <motion.div 
          className="glass-card"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        >
          <div className="wizard-header text-center" style={{marginBottom: '2rem'}}>
            <h3>Schedule a Meeting</h3>
            <p>Connect with the author to discuss collaboration details via Zoom/Teams.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group mb-4">
              <textarea placeholder="Introduce yourself and briefly explain why you are a good fit for this collaboration..." rows={5} required
                style={{width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(163, 163, 128, 0.4)', background: 'rgba(255, 255, 255, 0.5)'}}
              ></textarea>
            </div>

            <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem'}}>
              <div className="form-group" style={{flex: 1}}>
                <Calendar size={18} className="input-icon" />
                <input type="date" required style={{paddingLeft: '44px'}}/>
              </div>
              <div className="form-group" style={{flex: 1}}>
                <Clock size={18} className="input-icon" />
                <input type="time" required style={{paddingLeft: '44px'}}/>
              </div>
            </div>

            <div className="nda-box mb-4" style={{border: '1px solid var(--color-primary)', background: 'transparent'}}>
              <label className="checkbox-container text-muted">
                <input type="checkbox" required />
                <span className="checkmark"></span>
                By proposing this meeting, I reaffirm my agreement to the Non-Disclosure Agreement (NDA).
              </label>
            </div>

            <button type="submit" className={`btn-primary full-width ${requested ? 'success' : ''}`} style={{justifyContent: 'center'}} disabled={requested}>
              {requested ? 'Meeting Request Sent!' : <><Send size={18}/> Send Request</>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default MeetingRequest;
