import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Check, TableProperties, Eye, MessageSquare, Star, ShieldCheck, CheckCircle2, RefreshCcw } from 'lucide-react';
import './ProjectCompletion.css';

export default function ProjectCompletion() {
  const navigate = useNavigate();

  return (
    <div className="completion-container">
      {/* Header */}
      <header className="completion-header">
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

      {/* Stage Banner */}
      <div className="stage-banner">
        <div className="stage-info">
          <div className="check-circle-green">
            <Check size={20} />
          </div>
          <div className="stage-text">
            <h4>STAGE 04 OF 04</h4>
            <h1>Deliverable Review & Payout</h1>
          </div>
        </div>
        <div className="pending-tag">
          Pending<br/>Release
        </div>
      </div>

      {/* Scope Card */}
      <div className="review-card">
        <div className="review-card-header">
          <span className="review-section-title">PROJECT SCOPE</span>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <span className="escrow-label">ESCROW</span>
            <span className="escrow-amt">₦15,000</span>
          </div>
        </div>
        <h2>Organise 500 customer r...</h2>
        <div className="student-profile-row">
          <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Student" className="student-avatar" />
          <div className="student-info">
            <h4>Tobi Adebayo</h4>
            <p>BSc Information Systems • Covenant Univ</p>
          </div>
        </div>
      </div>

      {/* Submission Card */}
      <div className="review-card">
        <div className="submission-header-row">
          <span className="review-section-title">DELIVERABLE SUBMISSION</span>
          <span className="submitted-time"><div className="green-dot"></div> Submitted 2h ago</span>
        </div>
        <div className="file-row">
          <div className="file-left">
            <div className="file-icon">
              <TableProperties size={20} />
            </div>
            <div className="file-text">
              <h5>Master_Customer_R...</h5>
              <p>1.4 MB • Complete dataset</p>
            </div>
          </div>
          <button className="btn-preview">
            <Eye size={16} /> Preview
          </button>
        </div>
        <div className="notes-box">
          <div className="notes-label">
            <MessageSquare size={14} /> Note from Tobi
          </div>
          <p>"Cleaned all 500 records and removed 42 duplicate entries. Validated standardized phone prefixes and corporate email addresses."</p>
        </div>
      </div>

      {/* Feedback Card */}
      <div className="review-card">
        <div className="feedback-header">
          <div className="feedback-text">
            <h3>Student Feedback</h3>
            <p>Your review shapes Tobi's campus verified credential score.</p>
          </div>
          <div className="score-tag">
            5.0 /<br/>5.0
          </div>
        </div>
        <div className="stars-row">
          <Star size={24} className="star-icon" />
          <Star size={24} className="star-icon" />
          <Star size={24} className="star-icon" />
          <Star size={24} className="star-icon" />
          <Star size={24} className="star-icon" />
        </div>
        <span className="review-section-title" style={{display: 'block', marginBottom: '8px'}}>PUBLIC ENDORSEMENT</span>
        <div className="endorsement-box">
          <p>Excellent work! Fast turnaround and very clean formatting. Highly recommended.</p>
        </div>
      </div>

      {/* Release Banner */}
      <div className="release-banner">
        <div className="release-icon">
          <ShieldCheck size={18} />
        </div>
        <p><strong>₦15,000</strong> will be instantly released to Tobi Adebayo's wallet.</p>
      </div>

      {/* Actions */}
      <div className="payout-actions">
        <button className="btn-approve" onClick={() => navigate('/business/dashboard')}>
          <CheckCircle2 size={20} /> Approve & Release ₦15,000
        </button>
        <button className="btn-revision">
          <RefreshCcw size={16} /> Request Minor Revision
        </button>
      </div>

    </div>
  );
}
