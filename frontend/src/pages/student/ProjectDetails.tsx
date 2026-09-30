import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Users, CheckCircle2, Star, Banknote, Clock, FileSpreadsheet, Sparkles, Link, Upload, Shield, Bookmark } from 'lucide-react';
import './ProjectDetails.css';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSession } from '../../utils/session';

export default function ProjectDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const session = getSession();
  
  const [project, setProject] = useState<any>(null);
  const [pitch, setPitch] = useState("Experienced with Excel VLOOKUP and data hygiene. Ready to start immediately.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);
        }
      } catch (err) {
        console.error("Failed to fetch project", err);
      }
    };
    fetchProject();
  }, [id]);

  const handleSubmit = async () => {
    if (!pitch) return toast.error("Please enter a pitch");
    if (!session) return toast.error("Please sign in first.");
    setIsSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: id,
          student_id: session.id,
          pitch: pitch
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Application submitted successfully!");
        navigate('/projects');
      } else {
        toast.error(data.error || "Failed to submit application");
      }
    } catch (err) {
      toast.error("Network error");
    }
    setIsSubmitting(false);
  };

  if (!project) return <div style={{padding: '2rem'}}>Loading...</div>;

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
              <div className="sprint-dot"></div> {project.status === 'open' ? 'Active Sprint' : 'Closed'}
            </span>
            <span className="posted-time">Just now</span>
          </div>
          <div className="applicants-count">
            <Users size={14} /> ? Applicants
          </div>
        </div>

        <h1 className="project-title">{project.title}</h1>

        <div className="company-box">
          <div className="company-logo">N</div>
          <div className="company-info">
            <h4>{project.business_name || 'Business'} <CheckCircle2 size={16} fill="#047857" color="white" /></h4>
            <div className="company-meta">
              <span className="star-rating"><Star size={12} fill="currentColor" /> 4.9</span>
              <span>•</span>
              <span>Verified Business</span>
              <span>•</span>
              <span>Remote</span>
            </div>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-box">
            <span className="info-label"><Banknote size={12} color="#047857" /> REWARD</span>
            <span className="info-val">₦{project.budget?.toLocaleString()}</span>
            <span className="info-sub green">Upon approval</span>
          </div>
          <div className="info-box">
            <span className="info-label"><Clock size={12} color="#475569" /> TIMELINE</span>
            <span className="info-val">{project.duration_days} Days</span>
            <span className="info-sub">Flexible</span>
          </div>
          <div className="info-box">
            <span className="info-label"><FileSpreadsheet size={12} color="#475569" /> DATASET</span>
            <span className="info-val">Task Data</span>
            <span className="info-sub">Provided</span>
          </div>
        </div>

        <div className="detail-card">
          <div className="card-header-flex">
            <h3>Task Overview</h3>
            <span className="milestone-badge">Milestone 1/1</span>
          </div>
          <p className="task-desc">
            {project.description}
          </p>
        </div>

        <div className="detail-card">
          <h3><Sparkles size={18} /> Fast-Track Pitch</h3>
          <p className="pitch-subtitle">Client values turnaround speed & attention to detail. Keep it punchy.</p>
          
          <div className="textarea-header">
            <span>Why you're a fit (2 sentences)</span>
          </div>
          <textarea 
            className="pitch-textarea"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
          ></textarea>
        </div>
      </main>

      <div className="bottom-action-bar">
        <button className="btn-bookmark">
          <Bookmark size={20} />
        </button>
        <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Application'} <span className="price-badge">₦{project.budget?.toLocaleString()}</span>
        </button>
      </div>
    </div>
  );
}
