import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Building2, CheckCircle2, Lock, X, Rocket, Compass, FolderKanban, PlusCircle, User } from 'lucide-react';
import toast from 'react-hot-toast';
import './PostProject.css';

export default function PostProject() {
  const navigate = useNavigate();
  const [duration, setDuration] = useState('3 days');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('15,000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !description) {
      toast.error('Please fill out the title and instructions.');
      return;
    }
    setIsSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: 1, // Mock business ID
          title,
          description,
          budget: parseInt(budget.replace(/,/g, '')),
          duration_days: parseInt(duration) || 3
        })
      });

      if (response.ok) {
        toast.success('Project posted successfully!');
        navigate('/projects'); // Go back to explore to see it
      } else {
        toast.error('Failed to post project.');
      }
    } catch (error) {
      toast.error('Network error. Is the backend running?');
    }
    setIsSubmitting(false);
  };

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
            <span className="label-hint">{title.length}/60</span>
          </div>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. Organise 500 customer records"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={60}
          />
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
            <label className="form-label">3. Points Reward</label>
          </div>
          <div className="budget-input-wrapper">
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 500"
              value={budget}
              onChange={e => setBudget(e.target.value)}
            />
          </div>
          <p className="form-help-text">Points will be awarded upon task approval.</p>
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
            placeholder="1. Download CSV raw data..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          ></textarea>
          <p className="form-help-text">Step-by-step instructions dramatically increase completion rate and quality.</p>
        </div>

        {/* Cost Summary */}
        <div className="cost-summary-card">
          <div className="summary-top">
            <h4>PROJECT SUMMARY</h4>
            <strong>Points: {budget}</strong>
          </div>
          <ul className="summary-list" style={{listStyle: 'none', padding: 0, margin: 0}}>
            <li><CheckCircle2 size={14} color="#047857" /> Task goes live immediately</li>
            <li><CheckCircle2 size={14} color="#047857" /> Points distributed upon final sign-off</li>
          </ul>
        </div>

        <button className="btn-publish" onClick={handleSubmit} disabled={isSubmitting}>
          <Rocket size={18} /> {isSubmitting ? 'Publishing...' : 'Publish Project'}
        </button>
        <p className="publish-hint">Matches average university applicants in &lt; 14 minutes</p>
      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/projects')}>
          <Compass size={20} />
          <span>Explore</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/business/dashboard')}>
          <FolderKanban size={20} />
          <span>My Projects</span>
        </button>
        <button className="nav-item active" onClick={() => navigate('/business/project/new')}>
          <PlusCircleIcon />
          <span>Post</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/student/dashboard')}>
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
