import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, FolderKanban, PlusCircle, User, Sparkles, Bookmark, Star, CheckCircle, ChevronLeft, Lock, ArrowRight } from 'lucide-react';
import './ViewApplicants.css';

export default function ViewApplicants() {
  const navigate = useNavigate();

  return (
    <div className="applicants-container">
      {/* Header */}
      <header className="explore-header">
        <div className="brand-area">
          <img src="/logo.png" alt="MicroIntern Logo" className="details-logo" style={{width: 32, height: 32, objectFit: 'contain'}} />
          <div className="brand-text">
            <h2>MicroIntern</h2>
            <span>My Projects</span>
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

      {/* Project Summary Banner */}
      <div className="project-summary-banner">
        <div className="summary-top-row">
          <span className="status-tag">
            <div className="green-dot"></div> Active Review
          </span>
          <span className="applicants-count">3 Applicants</span>
        </div>
        <h1>Organise 500 customer records</h1>
        <div className="project-meta">
          <span className="price">₦15,000</span>
          <span>•</span>
          <span><span style={{fontFamily: 'monospace'}}>3</span> days delivery</span>
        </div>
      </div>

      <div className="list-header">
        <h3>RANKED CANDIDATES</h3>
        <span className="smart-match-label"><Sparkles size={14} /> Smart Match</span>
      </div>

      <main className="candidate-list">
        
        {/* Candidate 1 - Top Match */}
        <div className="candidate-card">
          <div className="candidate-card-top">
            <div className="candidate-info-row">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Tobi" className="candidate-avatar" />
              <div className="candidate-info">
                <h2>Tobi Adebayo <span className="tag-top-match">Top Match</span></h2>
                <p>B.Sc. Computer Science • Unilag</p>
                <div className="candidate-rating">
                  <Star size={12} className="star-icon" fill="currentColor" /> 5.0 (6 reviews)
                </div>
              </div>
            </div>
            <button className="bookmark-btn"><Bookmark size={20} /></button>
          </div>
          
          <div className="top-rated-banner">
            <CheckCircle size={14} /> Top Rated • 6 Micro-Projects Completed
          </div>
          
          <div className="quote-box">
            "I've worked on 2 similar database cleaning gigs on MicroIntern. Available to deliver within 24 hours."
          </div>
          
          <div className="candidate-skills">
            <span className="skill-tag">Excel</span>
            <span className="skill-tag">Data Cleaning</span>
            <span className="skill-tag">Google Sheets</span>
          </div>
          
          <button className="btn-select-main" onClick={() => navigate('/workspace/1')}>
            Select Student & Start Task <ArrowRight size={18} />
          </button>
          <a className="link-portfolio">View Full Portfolio</a>
        </div>

        {/* Candidate 2 */}
        <div className="candidate-card">
          <div className="candidate-card-top">
            <div className="candidate-info-row">
              <img src="https://i.pravatar.cc/150?u=a04258114e29026702d" alt="Chioma" className="candidate-avatar" />
              <div className="candidate-info">
                <h2>Chioma Nwosu</h2>
                <p>Economics Student</p>
                <div className="candidate-rating">
                  <Star size={12} className="star-icon" /> 4.8 (3 projects)
                </div>
              </div>
            </div>
            <button className="bookmark-btn"><Bookmark size={20} /></button>
          </div>
          <div className="candidate-skills">
            <span className="skill-tag">Data Entry</span>
            <span className="skill-tag">Excel</span>
          </div>
          <div className="small-actions">
            <button className="btn-view-profile">View Profile</button>
            <button className="btn-select-small">Select</button>
          </div>
        </div>

        {/* Candidate 3 */}
        <div className="candidate-card">
          <div className="candidate-card-top">
            <div className="candidate-info-row">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026703d" alt="Ibrahim" className="candidate-avatar" />
              <div className="candidate-info">
                <h2>Ibrahim Sani <span className="tag-new-talent">New Talent</span></h2>
                <p>Undergraduate Applicant</p>
                <div className="first-project-label">
                  <ChevronLeft size={12} /> First Micro-Project
                </div>
              </div>
            </div>
            <button className="bookmark-btn"><Bookmark size={20} /></button>
          </div>
          <div className="candidate-skills">
            <span className="skill-tag">Excel</span>
            <span className="skill-tag">Typing (65 WPM)</span>
          </div>
          <div className="small-actions">
            <button className="btn-view-profile">View Profile</button>
            <button className="btn-select-small">Select</button>
          </div>
        </div>

      </main>

      <div className="escrow-notice-bottom">
        <Lock size={16} className="lock-icon" />
        <p>Funds are secured in MicroIntern Escrow until you approve the completed record cleaning.</p>
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/projects')}>
          <Compass size={20} />
          <span>Explore</span>
        </button>
        <button className="nav-item active">
          <FolderKanban size={20} />
          <span>My Projects</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/business/project/new')}>
          <PlusCircle size={20} />
          <span>Post</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/business/dashboard')}>
          <User size={20} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
