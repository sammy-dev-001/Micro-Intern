import React, { useState } from 'react';
import { Zap, Building2, CheckCircle2, Lock, X, Rocket, Compass, FolderKanban, PlusCircle, User } from 'lucide-react';
import './PostProject.css';

export default function PostProject() {
  const [duration, setDuration] = useState('3 days');

  return (
    <div className="post-project-container">
      {/* Header */}
      <header className="post-header">
        <div className="brand-area">
          <div className="logo-box">M</div>
          <div className="brand-text">
            <h2>MicroIntern</h2>
            <span>Post Project</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="toggle-group">
            <button className="toggle-btn">Student</button>
            <button className="toggle-btn active">Business</button>
          </div>
          <div className="avatar-mini">
            <User size={16} />
          </div>
        </div>
      </header>

      <main className="post-content">
        <div className="page-title-row">
          <h1>Post a Micro-Project</h1>
          <span className="instant-tag"><Zap size={14} /> Instant Post</span>
        </div>
        <p className="page-subtitle">Vetted university talent ready to deliver verified outputs in days.</p>

        {/* Business Card */}
        <div className="business-card">
          <div className="biz-left">
            <div className="biz-icon"><Building2 size={20} /></div>
            <div className="biz-info">
              <h4>Apex Ventures Ltd</h4>
              <span className="biz-meta"><CheckCircle2 size={12} /> Verified Business Account</span>
            </div>
          </div>
          <span className="tier-tag">Micro-Tier</span>
        </div>

        {/* Forms */}
        <div className="form-section">
          <div className="form-label-row">
            <label className="form-label">1. Project Title</label>
            <span className="label-hint">0/60</span>
          </div>
          <input type="text" className="form-input" placeholder="e.g. Organise 500 customer records" />
        </div>

        <div className="form-section">
          <div className="form-label-row">
            <label className="form-label">2. Category & Required Skills</label>
          </div>
          <div className="skills-input-container">
            <span className="skill-pill">Excel <X size={12} /></span>
            <span className="skill-pill">Data Entry <X size={12} /></span>
            <input type="text" className="add-skill-input" placeholder="+ Add skill..." />
          </div>
          <div className="suggested-skills">
            Suggested:
            <span className="suggested-tag">+ Python</span>
            <span className="suggested-tag">+ Copywriting</span>
            <span className="suggested-tag">+ Figma</span>
          </div>
        </div>

        <div className="form-section">
          <div className="form-label-row">
            <label className="form-label">3. Budget (₦)</label>
            <span className="escrow-label"><Lock size={12} /> 100% Escrow</span>
          </div>
          <div className="budget-input-wrapper">
            <span className="budget-symbol">₦</span>
            <input type="text" className="form-input" defaultValue="15,000" />
          </div>
          <p className="form-help-text">Paid securely to student upon your review and work approval.</p>
        </div>

        <div className="form-section">
          <div className="form-label-row">
            <label className="form-label">4. Estimated Duration / Deadline</label>
          </div>
          <div className="segment-control">
            {['1 day', '3 days', '1 week', 'Custom'].map(dur => (
              <button 
                key={dur} 
                className={`segment-btn ${duration === dur ? 'active' : ''}`}
                onClick={() => setDuration(dur)}
              >
                {dur}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <div className="form-label-row">
            <label className="form-label">5. Task Instructions & Deliverables</label>
            <span className="link-template">Use Template</span>
          </div>
          <textarea 
            className="instructions-textarea"
            defaultValue={`1. Download CSV raw data.\n2. Remove duplicate emails.\n3. Format phone numbers to international\nstandard.`}
          ></textarea>
          <p className="form-help-text">Step-by-step instructions dramatically increase completion rate and quality.</p>
        </div>

        {/* Cost Summary */}
        <div className="cost-summary-card">
          <div className="summary-top">
            <h4>COST SUMMARY</h4>
            <strong>Budget: ₦15,000</strong>
          </div>
          <ul className="summary-list" style={{listStyle: 'none', padding: 0, margin: 0}}>
            <li><CheckCircle2 size={14} color="#047857" /> Escrow Protected: Funds held until your final sign-off</li>
            <li><CheckCircle2 size={14} color="#047857" /> No platform fee until milestone accepted</li>
          </ul>
        </div>

        <button className="btn-publish">
          <Rocket size={18} /> Publish Project
        </button>
        <p className="publish-hint">Matches average university applicants in &lt; 14 minutes</p>
      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="nav-item">
          <Compass size={20} />
          <span>Explore</span>
        </button>
        <button className="nav-item">
          <FolderKanban size={20} />
          <span>My Projects</span>
        </button>
        <button className="nav-item active">
          <PlusCircleIcon />
          <span>Post</span>
        </button>
        <button className="nav-item">
          <User size={20} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}

// PlusCircle wrapper to match design (solid fill style or just regular icon)
const PlusCircleIcon = () => (
  <PlusCircle size={20} />
);
