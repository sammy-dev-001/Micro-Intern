import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Compass, FolderKanban, PlusCircle, User, Sparkles, Bookmark, Star, CheckCircle, ChevronLeft, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './ViewApplicants.css';

export default function ViewApplicants() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    const fetchProjectAndApplicants = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        
        const projRes = await fetch(`${apiUrl}/api/projects/${id}`);
        if (projRes.ok) {
          setProject(await projRes.json());
        }

        const appRes = await fetch(`${apiUrl}/api/projects/${id}/applications`);
        if (appRes.ok) {
          setApplicants(await appRes.json());
        }
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };
    fetchProjectAndApplicants();
  }, [id]);

  const handleSelectApplicant = async (applicationId: number) => {
    setIsSelecting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/projects/${id}/select-applicant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId })
      });
      if (res.ok) {
        toast.success("Student selected! Moving to workspace.");
        navigate(`/workspace/${id}`);
      } else {
        toast.error("Failed to select applicant.");
      }
    } catch (err) {
      toast.error("Network error");
    }
    setIsSelecting(false);
  };

  if (!project) return <div style={{padding: '2rem'}}>Loading...</div>;

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
          <span className="applicants-count">{applicants.length} Applicants</span>
        </div>
        <h1>{project.title}</h1>
        <div className="project-meta">
          <span className="price">₦{project.budget?.toLocaleString()}</span>
          <span>•</span>
          <span><span style={{fontFamily: 'monospace'}}>{project.duration_days}</span> days delivery</span>
        </div>
      </div>

      <div className="list-header">
        <h3>RANKED CANDIDATES</h3>
        <span className="smart-match-label"><Sparkles size={14} /> Smart Match</span>
      </div>

      <main className="candidate-list">
        
        {applicants.length === 0 ? (
          <div style={{padding: '2rem', textAlign: 'center', color: '#64748b'}}>
            No applicants yet. Check back soon!
          </div>
        ) : (
          applicants.map((app, idx) => (
            <div className="candidate-card" key={app.id}>
              <div className="candidate-card-top">
                <div className="candidate-info-row">
                  <img src={`https://i.pravatar.cc/150?u=${app.student_id}`} alt="Student" className="candidate-avatar" />
                  <div className="candidate-info">
                    <h2>{app.student_name || 'Student'} {idx === 0 && <span className="tag-top-match">Top Match</span>}</h2>
                    <p>Applicant</p>
                    <div className="candidate-rating">
                      <Star size={12} className="star-icon" fill="currentColor" /> 5.0
                    </div>
                  </div>
                </div>
                <button className="bookmark-btn"><Bookmark size={20} /></button>
              </div>
              
              {idx === 0 && (
                <div className="top-rated-banner">
                  <CheckCircle size={14} /> Top Rated
                </div>
              )}
              
              <div className="quote-box">
                "{app.pitch}"
              </div>
              
              <div className="candidate-skills">
                <span className="skill-tag">General</span>
              </div>
              
              <button 
                className="btn-select-main" 
                onClick={() => handleSelectApplicant(app.id)}
                disabled={isSelecting}
              >
                {isSelecting ? 'Selecting...' : 'Select Student & Start Task'} <ArrowRight size={18} />
              </button>
            </div>
          ))
        )}

      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/projects')}>
          <Compass size={20} />
          <span>Explore</span>
        </button>
        <button className="nav-item active" onClick={() => navigate('/business/dashboard')}>
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
