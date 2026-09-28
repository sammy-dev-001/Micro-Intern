import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Clock, CheckCircle2, FileText, X, Link, ShieldCheck, ArrowRight, MessageSquare, Building2 } from 'lucide-react';
import './ProjectWorkspace.css';

export default function ProjectWorkspace() {
  const navigate = useNavigate();

  return (
    <div className="workspace-container">
      {/* Header */}
      <header className="workspace-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <img src="/logo.png" alt="MicroIntern Logo" className="details-logo" />
          <h2>Deliverable Submission</h2>
        </div>
        <div className="avatar-circle">
          <User size={18} />
        </div>
      </header>

      {/* Top Summary */}
      <div className="workspace-summary">
        <div className="summary-top-row">
          <span className="active-milestone-tag">ACTIVE MILESTONE</span>
          <span className="due-time">
            <Clock size={12} /> Due in 18 hrs
          </span>
        </div>
        <h1>Organise 500 customer records</h1>
        <div className="meta-row">
          <Building2 size={12} color="#64748b" />
          <span>Nexus Retail Ltd</span>
          <span>•</span>
          <span className="price">₦15,000</span>
        </div>
      </div>

      {/* Submission Form */}
      <div className="submission-form">
        
        <div>
          <div className="form-group-title">
            ATTACHED FILE
            <span className="verified-text"><CheckCircle2 size={12} /> Verified</span>
          </div>
          <div className="file-attachment-box">
            <div className="file-info">
              <div className="file-icon-box">
                <FileText size={18} />
              </div>
              <div className="file-details">
                <h4>Master_Customer_Records_vFinal.xlsx</h4>
                <p>2.4 MB • Uploaded ✓</p>
              </div>
            </div>
            <button className="remove-btn">
              <X size={16} />
            </button>
          </div>
        </div>

        <div>
          <div className="form-group-title">CLOUD MIRROR / WORKING LINK</div>
          <div className="link-input-wrapper">
            <Link size={14} className="link-icon" />
            <input type="text" defaultValue="https://docs.google.com/spreadsheets/d/1A9xK_89qLz-nex" />
          </div>
        </div>

        <div>
          <div className="form-group-title">COMPLETION NOTES</div>
          <textarea 
            className="notes-textarea"
            defaultValue="Completed deduplication across all 500 rows, standardized phone formatting with country codes, and verified 0 blank email rows."
          ></textarea>
        </div>

      </div>

      {/* Escrow Banner */}
      <div className="escrow-safeguard">
        <div className="escrow-icon-box">
          <ShieldCheck size={18} />
        </div>
        <div className="escrow-text">
          <h4>Escrow Safeguard Active</h4>
          <p>Business has 24 hours to review and approve release of <strong>₦15,000</strong> to your wallet.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="action-buttons">
        <button className="btn-submit-work" onClick={() => navigate('/workspace/1/completion')}>
          Submit Work for Approval <ArrowRight size={18} />
        </button>
        <button className="btn-message">
          <MessageSquare size={18} /> Message Business
        </button>
      </div>
    </div>
  );
}
