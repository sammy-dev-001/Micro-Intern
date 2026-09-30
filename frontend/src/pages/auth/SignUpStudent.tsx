import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUpStudent.css';

// SVG Icons to avoid dependency on lucide-react (since disk space is full)
const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#000" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#000"/>
    <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const GradCapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);
const BuildingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
    <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
  </svg>
);
const UserIcon = () => (
  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const AtSignIcon = () => (
  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
  </svg>
);
const EyeIcon = () => (
  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

export default function SignUpStudent() {
  const navigate = useNavigate();
  const [profileType, setProfileType] = useState('student');

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (profileType === 'student') {
      navigate('/projects'); // Explore screen
    } else {
      navigate('/projects'); // Explore screen
    }
  };

  return (
    <div className="signup-container">
      {/* Header */}
      <header className="signup-header">
        <img src="/logo.png" alt="MicroIntern Logo" className="logo-box" />
        <div className="header-text">
          <span className="network-label">VERIFIED TALENT NETWORK</span>
          <span className="brand-name">MicroIntern</span>
        </div>
      </header>

      {/* Hero Text */}
      <div className="hero-section">
        <h1>Real work. Verified experience.</h1>
        <p>Connect students with forward-thinking businesses for short milestone projects.</p>
      </div>

      {/* Profile Selection */}
      <div className="profile-selection-header">
        <span className="section-title">SELECT YOUR PROFILE</span>
        <span className="step-indicator">Step 1 of 2</span>
      </div>

      <div className="profile-cards">
        {/* Student Card */}
        <div 
          className={`profile-card ${profileType === 'student' ? 'active' : ''}`}
          onClick={() => setProfileType('student')}
        >
          <div className="card-icon-container bg-blue-100">
            <GradCapIcon />
          </div>
          <div className="card-content">
            <div className="card-title-row">
              <h3>I'm a Student / Young Pro</h3>
              {profileType === 'student' ? <CheckCircleIcon /> : <div className="radio-circle"></div>}
            </div>
            <p>Gain experience, complete 2-5 day tasks, and build an on-chain verified track record.</p>
            <div className="card-tags">
              <span className="tag tag-blue">Flexible gigs</span>
              <span className="tag tag-green">Direct rewards</span>
            </div>
          </div>
        </div>

        {/* Business Card */}
        <div 
          className={`profile-card ${profileType === 'business' ? 'active' : ''}`}
          onClick={() => setProfileType('business')}
        >
          <div className="card-icon-container bg-gray-100">
            <BuildingIcon />
          </div>
          <div className="card-content">
            <div className="card-title-row">
              <h3>I'm a Business</h3>
              {profileType === 'business' ? <CheckCircleIcon /> : <div className="radio-circle"></div>}
            </div>
            <p>Delegate sprint tasks, reward with cash, and hire pre-vetted campus talent without recruitment friction.</p>
            <div className="card-tags">
              <span className="tag tag-gray">Quality assured</span>
              <span className="tag tag-gray">Fast deliverables</span>
            </div>
          </div>
        </div>
      </div>

      {/* Google Auth */}
      <button className="btn-google" type="button">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={18} />
        Continue with Google
      </button>

      <div className="divider">
        <span>OR SIGN UP WITH EMAIL</span>
      </div>

      {/* Form */}
      <form onSubmit={handleContinue} className="signup-form">
        <div className="form-group">
          <label>Full Legal Name</label>
          <div className="input-with-icon">
            <input type="text" placeholder="e.g. Tunde Adeyemi" required />
            <UserIcon />
          </div>
        </div>

        <div className="form-group">
          <label>Institutional or Work Email</label>
          <div className="input-with-icon">
            <input type="email" placeholder="name@university.edu.ng" required />
            <AtSignIcon />
          </div>
        </div>

        <div className="form-group">
          <label>Create Password</label>
          <div className="input-with-icon">
            <input type="password" placeholder="Minimum 8 characters" required />
            <EyeIcon />
          </div>
        </div>

        <button type="submit" className="btn-primary">
          Continue as {profileType === 'student' ? 'Student' : 'Business'} <ArrowRightIcon />
        </button>
      </form>

      <p className="footer-text">
        By clicking continue, you accept the <a>Terms of Service</a> & <a>Privacy Policy</a>.
      </p>
    </div>
  );
}
