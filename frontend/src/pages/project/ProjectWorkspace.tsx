import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Clock, CheckCircle2, FileText, X, Link, ShieldCheck, ArrowRight, MessageSquare, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './ProjectWorkspace.css';

export default function ProjectWorkspace() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [project, setProject] = useState<any>(null);
  const [link, setLink] = useState('https://docs.google.com/spreadsheets/d/1A9xK_89qLz-nex');
  const [notes, setNotes] = useState('Completed deduplication across all 500 rows, standardized phone formatting with country codes, and verified 0 blank email rows.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/projects/${id}`);
        if (res.ok) setProject(await res.json());
      } catch (err) {
        console.error("Error fetching project", err);
      }
    };
    fetchProject();
  }, [id]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/projects/${id}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 1, // Mock student ID
          link,
          notes
        })
      });
      
      if (res.ok) {
        toast.success("Deliverable submitted!");
        navigate(`/workspace/${id}/completion`);
      } else {
        toast.error("Failed to submit deliverable");
      }
    } catch (err) {
      toast.error("Network error");
    }
    setIsSubmitting(false);
  };

  if (!project) return <div style={{padding: '2rem'}}>Loading...</div>;

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
        <h1>{project.title}</h1>
        <div className="meta-row">
          <Building2 size={12} color="#64748b" />
          <span>{project.business_name || 'Business'}</span>
          <span>•</span>
          <span className="price">₦{project.budget?.toLocaleString()}</span>
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
            <input 
              type="text" 
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="form-group-title">COMPLETION NOTES</div>
          <textarea 
            className="notes-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>

      </div>

      {/* Actions */}
      <div className="action-buttons">
        <button className="btn-submit-work" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Work for Approval'} <ArrowRight size={18} />
        </button>
        <button className="btn-message">
          <MessageSquare size={18} /> Message Business
        </button>
      </div>
    </div>
  );
}
