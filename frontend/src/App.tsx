import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import Home from './pages/Home';
import SignUpStudent from './pages/auth/SignUpStudent';
import SignUpBusiness from './pages/auth/SignUpBusiness';
import StudentProfileSetup from './pages/student/StudentProfileSetup';
import ProjectList from './pages/student/ProjectList';
import ProjectDetails from './pages/student/ProjectDetails';
import StudentDashboard from './pages/student/StudentDashboard';
import PostProject from './pages/business/PostProject';
import ViewApplicants from './pages/business/ViewApplicants';
import BusinessDashboard from './pages/business/BusinessDashboard';
import ProjectWorkspace from './pages/project/ProjectWorkspace';
import ProjectCompletion from './pages/project/ProjectCompletion';

function App() {
  return (
    <Router>
      <Toaster position="top-center" toastOptions={{ style: { fontSize: '14px', fontWeight: 600 } }} />
      <div className="app-container">
        <main className="main-content">
          <Routes>
            {/* Redirect / to student signup for demo purposes */}
            <Route path="/" element={<Navigate to="/auth/student/signup" />} />
            <Route path="/home" element={<Home />} />
            
            {/* Auth */}
            <Route path="/auth/student/signup" element={<SignUpStudent />} />
            <Route path="/auth/business/signup" element={<SignUpBusiness />} />

            {/* Student Flows */}
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/profile/setup" element={<StudentProfileSetup />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />

            {/* Business Flows */}
            <Route path="/business/dashboard" element={<BusinessDashboard />} />
            <Route path="/business/project/new" element={<PostProject />} />
            <Route path="/business/project/:id/applicants" element={<ViewApplicants />} />

            {/* Active Project Workspace & Completion */}
            <Route path="/workspace/:id" element={<ProjectWorkspace />} />
            <Route path="/workspace/:id/completion" element={<ProjectCompletion />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
