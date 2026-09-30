import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, FolderKanban, PlusCircle, User, Building2, CheckCircle2, Clock, Users, ChevronRight, LogOut } from 'lucide-react';
import { getSession, clearSession } from '../../utils/session';
import './BusinessDashboard.css';

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || session.type !== 'business') {
      navigate('/auth/student/signup');
      return;
    }
    const fetchProjects = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/users/${session.id}/projects`);
        if (res.ok) setProjects(await res.json());
      } catch (err) {
        console.error('Error loading projects', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate('/auth/student/signup');
  };

  const statusColor: Record<string, string> = {
    open: '#047857',
    in_progress: '#1e40af',
    review: '#d97706',
    completed: '#64748b',
  };

  const statusLabel: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    review: 'Awaiting Review',
    completed: 'Completed',
  };

  return (
    <div className="biz-dash-container">
      {/* Header */}
      <header className="biz-dash-header">
        <div className="brand-area">
          <img src="/logo.png" alt="MicroIntern Logo" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6 }} />
          <div className="brand-text">
            <h2>MicroIntern</h2>
            <span>Business</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} /> Sign Out
        </button>
      </header>

      <main className="biz-dash-content">
        {/* Business Profile Card */}
        <div className="biz-profile-card">
          <div className="biz-profile-left">
            <div className="biz-avatar">
              <Building2 size={24} color="white" />
            </div>
            <div>
              <h2>{session?.company_name || session?.name || 'Your Business'}</h2>
              <p><CheckCircle2 size={12} color="#047857" /> Verified · {session?.industry || 'Business Account'}</p>
            </div>
          </div>
          <button className="btn-post-project" onClick={() => navigate('/business/project/new')}>
            <PlusCircle size={16} /> Post Project
          </button>
        </div>

        {/* Stats */}
        <div className="biz-stats-row">
          <div className="biz-stat-box">
            <span>Total Projects</span>
            <strong>{projects.length}</strong>
          </div>
          <div className="biz-stat-box">
            <span>Active</span>
            <strong>{projects.filter(p => p.status === 'in_progress').length}</strong>
          </div>
          <div className="biz-stat-box">
            <span>Completed</span>
            <strong>{projects.filter(p => p.status === 'completed').length}</strong>
          </div>
          <div className="biz-stat-box">
            <span>In Review</span>
            <strong>{projects.filter(p => p.status === 'review').length}</strong>
          </div>
        </div>

        {/* Projects list */}
        <div className="biz-section-header">
          <h3>YOUR PROJECTS</h3>
          <button className="btn-new-sm" onClick={() => navigate('/business/project/new')}>+ New</button>
        </div>

        {loading && <p style={{ color: '#64748b', padding: '1rem 0' }}>Loading...</p>}

        {!loading && projects.length === 0 && (
          <div className="biz-empty-state">
            <FolderKanban size={48} color="#cbd5e1" />
            <p>No projects yet. Post your first one!</p>
            <button className="btn-post-project" onClick={() => navigate('/business/project/new')}>
              <PlusCircle size={16} /> Post a Project
            </button>
          </div>
        )}

        {projects.map(project => (
          <div key={project.id} className="biz-project-card">
            <div className="biz-proj-top">
              <span className="biz-status-tag" style={{ color: statusColor[project.status] || '#64748b' }}>
                <div className="dot" style={{ background: statusColor[project.status] || '#64748b' }}></div>
                {statusLabel[project.status] || project.status}
              </span>
              <span className="biz-proj-budget">₦{project.budget?.toLocaleString()}</span>
            </div>
            <h4>{project.title}</h4>
            <div className="biz-proj-meta">
              <span><Clock size={12} /> {project.duration_days} days</span>
              <span><Users size={12} /> {project.applicant_count || 0} applicants</span>
            </div>
            <div className="biz-proj-actions">
              {project.status === 'open' && (
                <button className="btn-view-applicants" onClick={() => navigate(`/business/project/${project.id}/applicants`)}>
                  View Applicants <ChevronRight size={14} />
                </button>
              )}
              {project.status === 'in_progress' && (
                <button className="btn-view-applicants" onClick={() => navigate(`/workspace/${project.id}`)}>
                  View Workspace <ChevronRight size={14} />
                </button>
              )}
              {project.status === 'review' && (
                <button className="btn-view-applicants review" onClick={() => navigate(`/workspace/${project.id}/completion`)}>
                  Review Submission <ChevronRight size={14} />
                </button>
              )}
              {project.status === 'completed' && (
                <span className="completed-tag"><CheckCircle2 size={14} /> Completed & Paid</span>
              )}
            </div>
          </div>
        ))}
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
