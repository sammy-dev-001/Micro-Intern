import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';
import { getSession, clearSession } from '../../utils/session';

// SVG Icons
const VerifiedCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#047857" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.8 4.2L18.2 4.2L18.9 7.6L21.8 9.6L20.4 12.8L21.8 16L18.9 18L18.2 21.4L14.8 21.4L12 23.6L9.2 21.4L5.8 21.4L5.1 18L2.2 16L3.6 12.8L2.2 9.6L5.1 7.6L5.8 4.2L9.2 4.2L12 2Z" fill="#047857" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 12.5L11 14.5L15 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const VerifiedBadgeBig = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#047857" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#047857"/>
    <path d="M7 12.5L10 15.5L17 8.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const ShareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
);

const BulbIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg> // Placeholder for generic skill/competency icon
);
const CompIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <circle cx="12" cy="11" r="3"/>
  </svg>
);

const PaperclipIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
);

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);

// Nav Icons
const ExploreIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>;
const CheckCircleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const PlusCircleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
const ProfileIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

export default function StudentDashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const [data, setData] = useState<any>(null);
  const [skills, setSkills] = useState<string[]>([]);

  const handleAddSkill = async () => {
    const newSkill = window.prompt("Enter a new skill:");
    if (newSkill && newSkill.trim()) {
      const updatedSkills = [...skills, newSkill.trim()];
      setSkills(updatedSkills);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        await fetch(`${apiUrl}/api/users/${session?.id}/skills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skills: updatedSkills })
        });
      } catch (err) {
        console.error("Failed to save skills", err);
      }
    }
  };

  useEffect(() => {
    if (!session) {
      navigate('/auth/student/signup');
      return;
    }
    const fetchDashboard = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/users/${session.id}/dashboard`);
        if (res.ok) {
          const dashboardData = await res.json();
          setData(dashboardData);
          if (dashboardData.user?.skills) {
            setSkills(dashboardData.user.skills.split(',').map((s: string) => s.trim()));
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard", err);
      }
    };
    fetchDashboard();
  }, []);

  if (!data) return <div style={{padding: '2rem'}}>Loading...</div>;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="brand-area">
          <img src="/logo.png" alt="MicroIntern Logo" className="logo-box" style={{width: 32, height: 32, padding: 2, objectFit: 'contain'}} />
          <div className="brand-text">
            <h2>MicroIntern</h2>
            <span>Profile</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="avatar-mini">
            <ProfileIcon />
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Success Banner */}
        <div className="success-banner">
          <div className="banner-content">
            <VerifiedBadgeBig />
            <div className="banner-text">
              <h4>Flow 4 Completed!</h4>
              <p>Work logged & approved</p>
            </div>
          </div>
          <button style={{background:'none', border:'none', cursor:'pointer'}}>
            <CloseIcon />
          </button>
        </div>

        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-top">
            <div className="profile-avatar-wrapper">
              <img src="https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?q=80&w=200&auto=format&fit=crop" alt="Avatar" className="profile-avatar" />
              <div className="verified-badge-abs">
                <VerifiedBadgeBig />
              </div>
            </div>
            <div className="profile-info">
              <h1>{data.user?.name || 'Loading...'} <VerifiedCheck /></h1>
              <p className="subtitle">{data.user?.course || 'Undergraduate'} {data.user?.bio ? `• ${data.user.bio}` : ''}</p>
              <div className="uni-row">
                <GradCapIconMini /> {data.user?.university || 'University'}
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span>Earnings</span>
              <strong>₦{data.stats.earnings.toLocaleString()}</strong>
            </div>
            <div className="stat-box">
              <span>Projects</span>
              <strong>{data.stats.projects}</strong>
            </div>
            <div className="stat-box">
              <span>Rating</span>
              <strong>{data.stats.rating.toFixed(1)} <span className="text-green">☆</span></strong>
            </div>
            <div className="stat-box">
              <span>On-Time</span>
              <strong className="text-green">{data.stats.onTime}%</strong>
            </div>
          </div>
        </div>

        {/* Public Credential */}
        <div className="credential-box">
          <div className="cred-text">
            <span>PUBLIC CREDENTIAL</span>
            <p>microintern.io/p/{data.user?.name ? data.user.name.toLowerCase().replace(/\s+/g, '-') : 'loading'}</p>
          </div>
          <button className="btn-share-sm">
            <ShareIcon /> Share
          </button>
        </div>

        {/* Core Competencies */}
        <div>
          <div className="section-header">
            <h3><CompIcon /> Core Competencies</h3>
            <button className="add-skill-btn" onClick={handleAddSkill}>Add Skill +</button>
          </div>
          <div className="skills-container">
            {skills.map(skill => (
              <div key={skill} className="skill-tag">
                <div className="skill-dot"></div> {skill}
              </div>
            ))}
          </div>
        </div>

        {/* Verified Work History */}
        <div>
          <div className="section-header">
            <h3><VerifiedCheck /> Verified Work History</h3>
            <span className="records-count">{data.history.length} records</span>
          </div>

          {data.history.map((record: any, index: number) => (
            <div key={index} className="history-card">
              <div className="history-card-header">
                <div className="history-tag-row">
                  <span className="verified-tag"><VerifiedCheck /> Verified Record</span>
                  <span className="date-text">{new Date(record.completed_at).toLocaleDateString()}</span>
                </div>
              </div>
              <h4>{record.title}</h4>
              <p className="company-text">{record.business_name}</p>
              
              <div className="review-box">
                <div className="review-top">
                  <div className="stars">
                    <StarIcon/><StarIcon/><StarIcon/><StarIcon/><StarIcon/>
                  </div>
                  <span className="review-status">Confirmed Approval</span>
                </div>
                <p className="review-text">“Great work on this task!”</p>
                <span className="reviewer-name">By {record.business_name}</span>
              </div>
              
              <div className="output-row">
                <PaperclipIcon />
                <span>Output: {record.deliverable_link || 'Submitted Deliverable'}</span>
              </div>
            </div>
          ))}
          
          {data.history.length === 0 && (
            <p style={{color: '#64748b', fontSize: '0.9rem', marginTop: '1rem'}}>
              No verified work history yet. Complete your first project to build your credential!
            </p>
          )}
        </div>

        {/* Share Verified Portfolio */}
        <button className="btn-primary" style={{marginTop: 16}}>
          <ShareIcon /> Share Verified Portfolio
        </button>

      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/projects')}>
          <ExploreIcon />
          <span>Explore</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/workspace/1')}>
          <CheckCircleIcon />
          <span>My Projects</span>
        </button>
        <button className="nav-item active" onClick={() => navigate('/student/dashboard')}>
          <ProfileIcon />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}

// Helper icon
const GradCapIconMini = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);
