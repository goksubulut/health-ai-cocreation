import React from 'react';
import { UserX, DownloadCloud, Settings, ShieldCheck } from 'lucide-react';

function Profile() {
  const handleDelete = () => {
    if(window.confirm('WARNING: Deleting your account will permanently remove all data in compliance with GDPR. Proceed?')) {
      alert('Account queued for deletion.');
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container" style={{maxWidth: '800px'}}>
        <div className="section-header">
          <h2>Profile & Settings</h2>
        </div>

        <div className="glass-card mb-4" style={{marginBottom: '2rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem'}}>
            <div className="icon-wrapper"><Settings size={28}/></div>
            <div>
              <h3 style={{fontSize: '1.5rem'}}>Base Information</h3>
              <p className="text-muted">Manage your identity and institutional affiliation.</p>
            </div>
          </div>
          
          <div className="auth-form">
            <div className="form-group mb-4">
              <label style={{display:'block', marginBottom: '0.5rem', fontWeight: 500}}>Full Name</label>
              <input type="text" defaultValue="Dr. Sarah M." style={{paddingLeft: '16px'}} />
            </div>
            <div className="form-group mb-4">
              <label style={{display:'block', marginBottom: '0.5rem', fontWeight: 500}}>Institution</label>
              <input type="text" defaultValue="Stanford University" disabled style={{paddingLeft: '16px', opacity: 0.7}} />
            </div>
          </div>
        </div>

        <div className="glass-card" style={{border: '1px solid var(--color-primary)', background: 'rgba(187, 133, 136, 0.05)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem'}}>
            <div className="icon-wrapper" style={{color: 'var(--color-primary)'}}><ShieldCheck size={28}/></div>
            <div>
              <h3 style={{fontSize: '1.5rem', color: 'var(--color-primary)'}}>GDPR & Data Privacy</h3>
              <p className="text-muted">Control your data in compliance with EU regulations.</p>
            </div>
          </div>

          <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <button className="btn-secondary" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <DownloadCloud size={18}/> Export My Data
            </button>
            <button className="btn-primary" onClick={handleDelete} style={{background: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <UserX size={18}/> Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
