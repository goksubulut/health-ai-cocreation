import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth, getDashboardPathByRole } from '@/lib/auth';

function ProtectedRoute({ children, allowedRoles }) {
  const auth = getAuth();

  if (!auth) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.user.role)) {
    return <Navigate to={getDashboardPathByRole(auth.user.role)} replace />;
  }

  return children;
}

export default ProtectedRoute;
