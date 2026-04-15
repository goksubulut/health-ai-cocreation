import React from 'react';
import { Users, FileText, Activity, AlertTriangle } from 'lucide-react';

function AdminPanel() {
  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <div className="section-header">
          <h2>Admin Control Center</h2>
          <span className="status-badge active"><span className="dot"></span> Platform Health: Optimal</span>
        </div>

        <div className="post-meta-grid" style={{gap: '2rem', marginBottom: '3rem'}}>
          <div className="glass-card" style={{flex: 1, padding: '2rem', textAlign: 'center'}}>
            <h3 style={{fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary)'}}>1,240</h3>
            <p className="text-muted">Active Users</p>
          </div>
          <div className="glass-card" style={{flex: 1, padding: '2rem', textAlign: 'center'}}>
            <h3 style={{fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary)'}}>342</h3>
            <p className="text-muted">Active Collaborations</p>
          </div>
          <div className="glass-card" style={{flex: 1, padding: '2rem', textAlign: 'center'}}>
            <h3 style={{fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary)'}}>12</h3>
            <p className="text-muted">Flagged Posts</p>
          </div>
        </div>

        <div className="dashboard-grid" style={{gridTemplateColumns: '1fr 1fr'}}>
          <div className="glass-card">
            <h3 style={{marginBottom: '1.5rem', fontSize: '1.5rem', display:'flex', alignItems:'center', gap:'8px'}}><Users size={20}/> User Management</h3>
            <div className="notification-item">
              <div className="notif-content">
                <p><strong>alex.c@mit.edu</strong> (Engineer)</p>
                <div style={{display:'flex', gap:'8px', marginTop: '8px'}}>
                  <button className="btn-secondary sm-btn" style={{padding: '4px 12px', fontSize: '0.85rem'}}>Suspend</button>
                  <button className="btn-secondary sm-btn" style={{padding: '4px 12px', fontSize: '0.85rem'}}>View Logs</button>
                </div>
              </div>
            </div>
            <div className="notification-item">
              <div className="notif-content">
                <p><strong>elena.r@stanford.edu</strong> (Healthcare)</p>
                <div style={{display:'flex', gap:'8px', marginTop: '8px'}}>
                  <button className="btn-secondary sm-btn" style={{padding: '4px 12px', fontSize: '0.85rem'}}>Suspend</button>
                  <button className="btn-secondary sm-btn" style={{padding: '4px 12px', fontSize: '0.85rem'}}>View Logs</button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{marginBottom: '1.5rem', fontSize: '1.5rem', display:'flex', alignItems:'center', gap:'8px'}}><FileText size={20}/> Reported Posts</h3>
            <div className="notification-item">
              <div className="icon-wrapper sm" style={{color: 'var(--color-primary)', background: 'rgba(187,133,136,0.1)'}}><AlertTriangle size={16} /></div>
              <div className="notif-content">
                <p><strong>Genomics Dashboard</strong> flagged for inappropriate content.</p>
                <button className="btn-secondary sm-btn" style={{padding: '4px 12px', fontSize: '0.85rem', marginTop: '8px', color: 'var(--color-primary)', borderColor: 'var(--color-primary)'}}>Remove Post</button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{marginTop: '3rem'}}>
          <h3 style={{marginBottom: '1.5rem', fontSize: '1.5rem', display:'flex', alignItems:'center', gap:'8px'}}><Activity size={20}/> Activity & Audit Logs</h3>
          <p className="text-muted mb-4">Immutable logs of platform activity. Retained for 24 months per security policy.</p>
          <button className="btn-secondary">Export Full CSV</button>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
