import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Check, TableProperties, Eye, MessageSquare, Star, ShieldCheck, CheckCircle2, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import './ProjectCompletion.css';

export default function ProjectCompletion() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [project, setProject] = useState<any>(null);
  const [deliverable, setDeliverable] = useState<any>(null);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const [projRes, delivRes] = await Promise.all([
          fetch(`${apiUrl}/api/projects/${id}`),
          fetch(`${apiUrl}/api/projects/${id}/deliverable`)
        ]);
        
        if (projRes.ok) setProject(await projRes.json());
        if (delivRes.ok) setDeliverable(await delivRes.json());
      } catch (err) {
        console.error("Error fetching completion details", err);
      }
    };
    fetchDetails();
  }, [id]);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/projects/${id}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        toast.success("Project approved and points awarded!");
        navigate('/business/dashboard');
      } else {
        toast.error("Failed to approve project");
      }
    } catch (err) {
      toast.error("Network error");
    }
    setIsApproving(false);
  };

  if (!project) return <div style={{padding: '2rem'}}>Loading...</div>;

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
            <h1>Deliverable Review & Approval</h1>
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
            <span className="escrow-label">REWARD</span>
            <span className="escrow-amt">{project.budget?.toLocaleString()} pts</span>
          </div>
        </div>
        <h2>{project.title}</h2>
        <div className="student-profile-row">
          <img src={`https://i.pravatar.cc/150?u=${deliverable?.student_id || 'default'}`} alt="Student" className="student-avatar" />
          <div className="student-info">
            <h4>{deliverable?.student_name || 'Student'}</h4>
            <p>Applicant</p>
          </div>
        </div>
      </div>

      {/* Submission Card */}
      <div className="review-card">
        <div className="submission-header-row">
          <span className="review-section-title">DELIVERABLE SUBMISSION</span>
          <span className="submitted-time"><div className="green-dot"></div> Ready for review</span>
        </div>
        <div className="file-row">
          <div className="file-left">
            <div className="file-icon">
              <TableProperties size={20} />
            </div>
            <div className="file-text">
              <h5>{deliverable?.link || 'No link provided'}</h5>
              <p>Submitted work</p>
            </div>
          </div>
          <button className="btn-preview" onClick={() => window.open(deliverable?.link, '_blank')}>
            <Eye size={16} /> View
          </button>
        </div>
        <div className="notes-box">
          <div className="notes-label">
            <MessageSquare size={14} /> Note from {deliverable?.student_name || 'Student'}
          </div>
          <p>"{deliverable?.notes || 'No notes provided'}"</p>
        </div>
      </div>

      {/* Feedback Card */}
      <div className="review-card">
        <div className="feedback-header">
          <div className="feedback-text">
            <h3>Student Feedback</h3>
            <p>Your review shapes {deliverable?.student_name || 'the student'}'s campus verified credential score.</p>
          </div>
          <div className="score-tag">
            5.0 /<br/>5.0
          </div>
        </div>
        <div className="stars-row">
          <Star size={24} className="star-icon" fill="#eab308" color="#eab308" />
          <Star size={24} className="star-icon" fill="#eab308" color="#eab308" />
          <Star size={24} className="star-icon" fill="#eab308" color="#eab308" />
          <Star size={24} className="star-icon" fill="#eab308" color="#eab308" />
          <Star size={24} className="star-icon" fill="#eab308" color="#eab308" />
        </div>
        <span className="review-section-title" style={{display: 'block', marginBottom: '8px'}}>PUBLIC ENDORSEMENT</span>
        <div className="endorsement-box">
          <p>Excellent work! Fast turnaround and very clean formatting. Highly recommended.</p>
        </div>
      </div>

      <div className="release-banner">
        <div className="release-icon">
          <ShieldCheck size={18} />
        </div>
        <p><strong>{project.budget?.toLocaleString()} pts</strong> will be instantly awarded to {deliverable?.student_name || 'the student'}.</p>
      </div>

      {/* Actions */}
      <div className="payout-actions">
        <button className="btn-approve" onClick={handleApprove} disabled={isApproving}>
          <CheckCircle2 size={20} /> {isApproving ? 'Approving...' : `Approve & Award ${project.budget?.toLocaleString()} pts`}
        </button>
        <button className="btn-revision">
          <RefreshCcw size={16} /> Request Minor Revision
        </button>
      </div>

    </div>
  );
}
