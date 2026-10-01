import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveSession } from '../../utils/session';
import './SignUpStudent.css';

// Icons
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
const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#000" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#000"/>
    <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);
const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type ProfileType = 'student' | 'business';

export default function AuthPage() {
  const navigate = useNavigate();
  const [profileType, setProfileType] = useState<ProfileType>('student');
  const [isLogin, setIsLogin] = useState(false);
  const [step, setStep] = useState(1); // 1 = role select + basic, 2 = role-specific details
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Student-specific
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  // Business-specific
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isLogin) {
      handleLogin();
    } else {
      setStep(2);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
        return;
      }
      saveSession(data.user);
      if (data.user.type === 'business') {
        navigate('/business/dashboard');
      } else {
        navigate('/projects');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const body: any = { name, email, password, type: profileType };
      if (profileType === 'student') {
        body.university = university;
        body.course = course;
        body.year_of_study = yearOfStudy;
        body.bio = bio;
        body.skills = skills;
      } else {
        body.company_name = companyName;
        body.industry = industry;
        body.company_size = companySize;
      }

      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }
      saveSession(data.user);
      if (profileType === 'business') {
        navigate('/business/dashboard');
      } else {
        navigate('/projects');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
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

      {/* Hero */}
      <div className="hero-section">
        <h1>{isLogin ? 'Welcome back.' : 'Real work. Verified experience.'}</h1>
        <p>{isLogin ? 'Sign in to continue your journey.' : 'Connect students with forward-thinking businesses for short milestone projects.'}</p>
      </div>

      {/* Step 1: Role + Basic Info */}
      {step === 1 && (
        <>
          {!isLogin && (
            <>
              <div className="profile-selection-header">
                <span className="section-title">SELECT YOUR PROFILE</span>
                <span className="step-indicator">Step 1 of 2</span>
              </div>

              <div className="profile-cards">
                <div className={`profile-card ${profileType === 'student' ? 'active' : ''}`} onClick={() => setProfileType('student')}>
                  <div className="card-icon-container bg-blue-100"><GradCapIcon /></div>
                  <div className="card-content">
                    <div className="card-title-row">
                      <h3>I'm a Student / Young Pro</h3>
                      {profileType === 'student' ? <CheckCircleIcon /> : <div className="radio-circle"></div>}
                    </div>
                    <p>Gain experience, complete 2-5 day tasks, and build a verified track record.</p>
                    <div className="card-tags">
                      <span className="tag tag-blue">Flexible gigs</span>
                      <span className="tag tag-green">Direct rewards</span>
                    </div>
                  </div>
                </div>

                <div className={`profile-card ${profileType === 'business' ? 'active' : ''}`} onClick={() => setProfileType('business')}>
                  <div className="card-icon-container bg-gray-100"><BuildingIcon /></div>
                  <div className="card-content">
                    <div className="card-title-row">
                      <h3>I'm a Business</h3>
                      {profileType === 'business' ? <CheckCircleIcon /> : <div className="radio-circle"></div>}
                    </div>
                    <p>Delegate sprint tasks, reward with cash, and hire pre-vetted campus talent.</p>
                    <div className="card-tags">
                      <span className="tag tag-gray">Quality assured</span>
                      <span className="tag tag-gray">Fast deliverables</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleStep1} className="signup-form">
            {!isLogin && (
              <div className="form-group">
                <label>Full Legal Name</label>
                <input type="text" placeholder="e.g. Tunde Adeyemi" required value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="name@university.edu.ng" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>{isLogin ? 'Password' : 'Create Password'}</label>
              <div className="input-with-icon">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setShowPassword(!showPassword)}>
                  <EyeIcon open={showPassword} />
                </div>
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : `Continue as ${profileType === 'student' ? 'Student' : 'Business'}`)} {!isLoading && <ArrowRightIcon />}
            </button>
          </form>
        </>
      )}

      {/* Step 2: Role-specific profile details */}
      {step === 2 && !isLogin && (
        <>
          <div className="profile-selection-header">
            <span className="section-title">{profileType === 'student' ? 'YOUR ACADEMIC PROFILE' : 'YOUR BUSINESS PROFILE'}</span>
            <span className="step-indicator">Step 2 of 2</span>
          </div>

          <form onSubmit={handleRegister} className="signup-form">
            {profileType === 'student' ? (
              <>
                <div className="form-group">
                  <label>University / Institution <span className="required-star">*</span></label>
                  <input type="text" placeholder="e.g. University of Lagos" required value={university} onChange={e => setUniversity(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Course / Programme <span className="required-star">*</span></label>
                  <input type="text" placeholder="e.g. Computer Science" required value={course} onChange={e => setCourse(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Year of Study <span className="required-star">*</span></label>
                  <select required value={yearOfStudy} onChange={e => setYearOfStudy(e.target.value)} className="form-select">
                    <option value="">Select year...</option>
                    <option>100 Level</option>
                    <option>200 Level</option>
                    <option>300 Level</option>
                    <option>400 Level</option>
                    <option>500 Level</option>
                    <option>Graduate / Postgrad</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Skills <span style={{ color: '#94a3b8', fontSize: '11px' }}>Optional, comma-separated</span></label>
                  <input type="text" placeholder="e.g. Excel, Python, Data Entry" value={skills} onChange={e => setSkills(e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Short Bio <span style={{ color: '#94a3b8', fontSize: '11px' }}>Optional</span></label>
                  <textarea
                    placeholder="Tell businesses about your skills and what you're looking for..."
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    className="signup-textarea"
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Company / Business Name <span className="required-star">*</span></label>
                  <input type="text" placeholder="e.g. Nexus Retail Ltd" required value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Industry <span className="required-star">*</span></label>
                  <select required value={industry} onChange={e => setIndustry(e.target.value)} className="form-select">
                    <option value="">Select industry...</option>
                    <option>E-commerce & Retail</option>
                    <option>Fintech & Finance</option>
                    <option>Logistics & Supply Chain</option>
                    <option>Media & Marketing</option>
                    <option>Education & EdTech</option>
                    <option>Healthcare</option>
                    <option>Tech & Software</option>
                    <option>Agriculture & Food</option>
                    <option>Real Estate</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Company Size <span className="required-star">*</span></label>
                  <select required value={companySize} onChange={e => setCompanySize(e.target.value)} className="form-select">
                    <option value="">Select size...</option>
                    <option>Solo / Freelancer</option>
                    <option>2–10 employees</option>
                    <option>11–50 employees</option>
                    <option>51–200 employees</option>
                    <option>200+ employees</option>
                  </select>
                </div>
              </>
            )}

            {error && <p className="auth-error" style={{ gridColumn: 'span 2' }}>{error}</p>}

            <div className="step2-actions">
              <button type="button" className="btn-back" onClick={() => { setStep(1); setError(''); }}>← Back</button>
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'} {!isLoading && <ArrowRightIcon />}
              </button>
            </div>
          </form>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <p style={{ fontSize: '0.9rem', color: '#64748b', cursor: 'pointer' }} onClick={() => { setIsLogin(!isLogin); setStep(1); setError(''); }}>
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </p>
      </div>

      <p className="footer-text">
        By continuing, you accept the <a>Terms of Service</a> & <a>Privacy Policy</a>.
      </p>
    </div>
  );
}
