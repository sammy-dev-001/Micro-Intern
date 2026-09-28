import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle2, Clock, ArrowRight, Compass, FolderKanban, PlusCircle, User } from 'lucide-react';
import './ProjectList.css';

const HARDCODED_PROJECTS = [
  {
    id: 1,
    business_name: 'Nexus Retail Ltd',
    title: 'Organise 500 customer records',
    description: 'Cleanse CSV customer records, remove duplicates, and format contacts.',
    budget: 15000,
    duration_days: 3,
    status: 'open',
    is_featured: true,
    tags: ['Excel', 'Data Entry'],
    time_ago: 'Just now',
    applicants: 4
  },
  {
    id: 2,
    business_name: 'OmniStore Logistics',
    title: 'Product Catalog Tagging & Categorization',
    description: 'Audit 320 SKU inventory entries, add hierarchical department taxonomy, and ensure image links match...',
    budget: 20000,
    duration_days: 4,
    status: 'open',
    tags: ['E-commerce', 'Attention to Detail'],
    time_ago: '2h ago',
    applicants: 2
  },
  {
    id: 3,
    business_name: 'Lagos Insights Co.',
    title: 'Competitor Pricing Audit (Spreadsheet)',
    description: 'Extract daily pricing from 5 key fintech landing pages into structured Google Sheets with variance formulas.',
    budget: 18000,
    duration_days: 2,
    status: 'open',
    tags: ['Research', 'Excel'],
    time_ago: '5h ago',
    applicants: 7
  }
];

export default function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    // Try to fetch from backend using env var or localhost
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/api/projects`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
        }
      })
      .catch(err => console.log('Backend not available or empty, using fallback data.'));
  }, []);

  const displayProjects = projects.length > 0 ? projects : HARDCODED_PROJECTS;

  return (
    <div className="explore-container">
      {/* Header */}
      <header className="explore-header">
        <div className="brand-area">
          <img src="/logo.png" alt="MicroIntern Logo" className="details-logo" style={{width: 32, height: 32, objectFit: 'contain'}} />
          <div className="brand-text">
            <h2>MicroIntern</h2>
            <span>Explore</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="toggle-group">
            <button className="toggle-btn active">Student</button>
            <button className="toggle-btn">Business</button>
          </div>
          <div className="avatar-mini">
            <User size={16} />
          </div>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="search-section">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Search micro-internships, skills..." />
        </div>
        <div className="chips-container">
          <button className="chip active">All</button>
          <button className="chip">Data Entry</button>
          <button className="chip">Excel</button>
          <button className="chip">Design</button>
          <button className="chip">Research</button>
          <button className="chip">Writing</button>
        </div>
      </div>

      <main className="list-content">
        <div className="section-title-row">
          <h3><div className="green-dot"></div> AVAILABLE TASKS</h3>
          <span className="open-count">{displayProjects.length} Open</span>
        </div>

        {displayProjects.map((project, index) => (
          <div className="task-card" key={project.id || index}>
            <div className="card-top">
              <div className="company-name">
                {project.business_name || 'Business'} <CheckCircle2 size={12} className="verified-icon" />
              </div>
              {project.is_featured ? (
                <span className="badge-featured">Featured</span>
              ) : (
                <span className="time-ago">{project.time_ago || '1d ago'}</span>
              )}
            </div>
            <h2>{project.title}</h2>
            <p className="task-desc">{project.description}</p>
            <div className="task-tags">
              {project.tags ? project.tags.map((tag: string) => (
                <span className="task-tag" key={tag}>{tag}</span>
              )) : (
                <span className="task-tag">General</span>
              )}
            </div>
            <div className="price-row">
              <div className="price-val">₦{(project.budget || 0).toLocaleString()} <span className="price-type">/ fixed</span></div>
              <div className="duration-val"><Clock size={12} /> {project.duration_days} days</div>
            </div>
            <div className="card-footer">
              <div className="status-info">
                <div className="green-dot"></div> Open • {project.applicants || 0} applicants
              </div>
              <button className="btn-apply" onClick={() => navigate(`/projects/${project.id}`)}>
                View / Apply <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="nav-item active">
          <Compass size={20} />
          <span>Explore</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/student/dashboard')}>
          <FolderKanban size={20} />
          <span>My Projects</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/business/project/new')}>
          <PlusCircle size={20} />
          <span>Post</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/student/dashboard')}>
          <User size={20} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
