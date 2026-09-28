import React from 'react';
import { ArrowLeft, User, Users, CheckCircle2, Star, Banknote, Clock, FileSpreadsheet, Sparkles, Link, Upload, Shield, Bookmark } from 'lucide-react';
import './ProjectDetails.css';
import { useNavigate } from 'react-router-dom';

export default function ProjectDetails() {
  const navigate = useNavigate();

  return (
    <div className="project-details-container">
      {/* Header */}
      <header className="details-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <img src="/logo.png" alt="MicroIntern Logo" className="details-logo" />
          <h2>Project Details</h2>
        </div>
        <div className="avatar-circle">
          <User size={18} />
        </div>
      </header>

      <main className="details-content">
        <div className="status-row">
          <div className="status-left">
            <span className="sprint-tag">
              <div className="sprint-dot"></div> Active Sprint
            </span>
            <span className="posted-time">Posted 2h ago</span>
          </div>
          <div className="applicants-count">
            <Users size={14} /> 4 Applicants
          </div>
        </div>

        <h1 className="project-title">Organise 500 customer records</h1>

        <div className="company-box">
          <div className="company-logo">N</div>
          <div className="company-info">
            <h4>Nexus Retail Ltd <CheckCircle2 size={16} fill="#047857" color="white" /></h4>
            <div className="company-meta">
              <span className="star-rating"><Star size={12} fill="currentColor" /> 4.9</span>
              <span>•</span>
              <span>Verified Business</span>
              <span>•</span>
              <span>Lagos (Remote)</span>
            </div>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-box">
            <span className="info-label"><Banknote size={12} color="#047857" /> PAYOUT</span>
            <span className="info-val">₦15,000</span>
            <span className="info-sub green">Upon approval</span>
          </div>
          <div className="info-box">
            <span className="info-label"><Clock size={12} color="#475569" /> TIMELINE</span>
            <span className="info-val">3 Days</span>
            <span className="info-sub">Fri, 6:00 PM</span>
          </div>
          <div className="info-box">
            <span className="info-label"><FileSpreadsheet size={12} color="#475569" /> DATASET</span>
            <span className="info-val">500 rows</span>
            <span className="info-sub">Deduplication</span>
          </div>
        </div>

        <div className="detail-card">
          <div className="card-header-flex">
            <h3>Task Overview</h3>
            <span className="milestone-badge">Milestone 1/1</span>
          </div>
          <p className="task-desc">
            Cleanse and consolidate customer contact lists from 3 separate CSV exports into a single master sheet with standard formatting and deduplicated phone numbers.
          </p>
          <div className="checklist">
            <div className="check-item">
              <CheckCircle2 size={16} color="#047857" />
              <span>Normalize phone numbers to international standard format (+234...)</span>
            </div>
            <div className="check-item">
              <CheckCircle2 size={16} color="#047857" />
              <span>Identify and eliminate exact & fuzzy duplicates across 3 source sheets</span>
            </div>
            <div className="check-item">
              <CheckCircle2 size={16} color="#047857" />
              <span>Export final deliverable as clean .xlsx with separate error audit tab</span>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h3>Required Capabilities</h3>
          <div className="cap-tags" style={{marginTop: 12}}>
            <span className="cap-tag">
              <FileSpreadsheet size={14} /> Excel
            </span>
            <span className="cap-tag">
              <FileSpreadsheet size={14} /> Data Entry
            </span>
            <span className="cap-tag">
              <FileSpreadsheet size={14} /> Data Cleaning
            </span>
            <span className="cap-tag">
              Σ VLOOKUP / XLOOKUP
            </span>
          </div>
        </div>

        <div className="detail-card">
          <h3><Sparkles size={18} /> Fast-Track Pitch</h3>
          <p className="pitch-subtitle">Client values turnaround speed & attention to detail. Keep it punchy.</p>
          
          <div className="textarea-header">
            <span>Why you're a fit (2 sentences)</span>
            <span>78/140</span>
          </div>
          <textarea 
            className="pitch-textarea"
            defaultValue="Experienced with Excel VLOOKUP and data hygiene. Ready to start immediately."
          ></textarea>

          <div className="textarea-header">
            <span>Attach proof of work / sample</span>
            <span>Optional</span>
          </div>
          <div className="attach-row">
            <div className="attach-input-wrapper">
              <Link size={16} className="link-icon" />
              <input type="text" defaultValue="https://drive.google.com/file/d/1xK-spread" />
            </div>
            <button className="upload-btn">
              <Upload size={18} />
            </button>
          </div>

          <div className="escrow-banner">
            <Shield size={20} color="#047857" />
            <p>Escrow Protected: Nexus Retail Ltd has pre-funded the ₦15,000 bounty with MicroIntern.</p>
          </div>
        </div>
      </main>

      <div className="bottom-action-bar">
        <button className="btn-bookmark">
          <Bookmark size={20} />
        </button>
        <button className="btn-submit">
          Submit Application <span className="price-badge">₦15,000</span>
        </button>
      </div>
    </div>
  );
}
