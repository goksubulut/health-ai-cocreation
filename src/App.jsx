import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import FaqPage from './pages/FaqPage';
import TroubleshootingPage from './pages/TroubleshootingPage';
import ContactSupportPage from './pages/ContactSupportPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import PostForm from './pages/PostForm';
import Board from './pages/Board';
import PostDetail from './pages/PostDetail';
import MeetingRequest from './pages/MeetingRequest';
import MeetingRequests from './pages/MeetingRequests';
import MeetingDetail from './pages/MeetingDetail';
import MndaAgreementPage from './pages/MndaAgreementPage';
import Profile from './pages/Profile';
import SettingsPage from './pages/SettingsPage';
import HowMatchingWorks from './pages/HowMatchingWorks';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPosts from './pages/admin/AdminPosts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLogs from './pages/admin/AdminLogs';
import AdminStats from './pages/admin/AdminStats';
import './index.css';
import { ThemeProvider } from './components/theme-provider';
import { ToastProvider } from './components/ui/toast';
import CommandPalette from './components/ui/command-palette';
import { LocaleProvider } from './contexts/locale-context';
import { TourProvider } from './contexts/tour-context';
import { AccessibilityProvider, useAccessibility } from './contexts/accessibility-context';

function AccessibilityMotionBoundary({ children }) {
  const { preferences } = useAccessibility();

  return (
    <MotionConfig reducedMotion={preferences.reduceMotion ? 'always' : 'never'}>
      {children}
    </MotionConfig>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LocaleProvider>
      <AccessibilityProvider>
      <AccessibilityMotionBoundary>
      <ToastProvider>
      <BrowserRouter>
        <TourProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="faq" element={<Navigate to="/help/faq" replace />} />
            <Route path="help/faq" element={<FaqPage />} />
            <Route path="help/troubleshooting" element={<TroubleshootingPage />} />
            <Route path="help/contact-support" element={<ContactSupportPage />} />
            <Route path="auth" element={<AuthPage />} />
            <Route
              path="dashboard/engineer"
              element={
                <ProtectedRoute allowedRoles={['engineer']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard/healthcare"
              element={
                <ProtectedRoute allowedRoles={['healthcare']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="dashboard" element={<Navigate to="/" replace />} />
            <Route
              path="post/new"
              element={
                <ProtectedRoute allowedRoles={['healthcare', 'engineer']}>
                  <PostForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="post/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['healthcare', 'engineer']}>
                  <PostForm />
                </ProtectedRoute>
              }
            />
            <Route path="board" element={<Board />} />
            <Route path="how-matching-works" element={<HowMatchingWorks />} />
            <Route path="post/:id" element={<PostDetail />} />
            <Route path="post/:id/meeting" element={<MeetingRequest />} />
            <Route path="legal/mnda" element={<MndaAgreementPage />} />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="meetings"
              element={
                <ProtectedRoute allowedRoles={['healthcare', 'engineer']}>
                  <MeetingRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="meetings/:id"
              element={
                <ProtectedRoute allowedRoles={['healthcare', 'engineer']}>
                  <MeetingDetail />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="posts" element={<AdminPosts />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="stats" element={<AdminStats />} />
            <Route path="logs" element={<AdminLogs />} />
          </Route>
        </Routes>
        <CommandPalette />
        </TourProvider>
      </BrowserRouter>
      </ToastProvider>
      </AccessibilityMotionBoundary>
      </AccessibilityProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}

export default App;
