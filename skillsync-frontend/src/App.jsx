import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

// Layout Components
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FindWorkPage from './pages/FindWorkPage';
import PostJobPage from './pages/PostJobPage';
import FreelancersPage from './pages/FreelancersPage';
import JobDetailsPage from './pages/JobDetailsPage';
import MyJobsPage from './pages/MyJobsPage';
import ProposalsPage from './pages/ProposalsPage';
import ContractsPage from './pages/ContractsPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route Component
const ProtectedRoute = ({ children, requiredUserType }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  if (requiredUserType && user.user_type !== requiredUserType) {
    import('react-hot-toast').then(({ toast }) => {
      toast.error(`This page is only for ${requiredUserType}s`);
    });
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Public Only Route Component
const PublicOnlyRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (token && user) {
    // Redirect based on user type
    if (user.user_type === 'client') {
      return <Navigate to="/dashboard" />;
    } else {
      return <Navigate to="/find-work" />;
    }
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          
          {/* Auth Routes - Only accessible when NOT logged in */}
          <Route path="/" element={
            <PublicOnlyRoute>
              <AuthLayout />
            </PublicOnlyRoute>
          }>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* Protected Routes - Main Layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="find-work" element={
              <ProtectedRoute requiredUserType="freelancer">
                <FindWorkPage />
              </ProtectedRoute>
            } />
            <Route path="post-job" element={
              <ProtectedRoute requiredUserType="client">
                <PostJobPage />
              </ProtectedRoute>
            } />
            <Route path="freelancers" element={<FreelancersPage />} />
            <Route path="jobs/:id" element={<JobDetailsPage />} />
            <Route path="my-jobs" element={
              <ProtectedRoute requiredUserType="client">
                <MyJobsPage />
              </ProtectedRoute>
            } />
            {/* <Route path="proposals" element={
              <ProtectedRoute requiredUserType="freelancer">
                <ProposalsPage />
              </ProtectedRoute>
            } /> */}
            <Route path="contracts" element={<ContractsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="messages/:userId" element={<MessagesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="proposals" element={<ProposalsPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;