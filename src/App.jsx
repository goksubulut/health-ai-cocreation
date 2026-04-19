import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import PostForm from './pages/PostForm';
import Board from './pages/Board';
import PostDetail from './pages/PostDetail';
import MeetingRequest from './pages/MeetingRequest';
import MeetingRequests from './pages/MeetingRequests';
import MeetingDetail from './pages/MeetingDetail';
import Profile from './pages/Profile';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPosts from './pages/admin/AdminPosts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLogs from './pages/admin/AdminLogs';
import './index.css';
import { ThemeProvider } from './components/theme-provider';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
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
            <Route path="post/:id" element={<PostDetail />} />
            <Route path="post/:id/meeting" element={<MeetingRequest />} />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
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
            <Route path="logs" element={<AdminLogs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
