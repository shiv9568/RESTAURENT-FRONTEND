import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const isSignedIn = !!token;

  if (requireAuth && !isSignedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!requireAuth && isSignedIn) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}
