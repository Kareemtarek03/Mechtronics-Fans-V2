import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  console.log('🔐 ProtectedRoute Check:', { token: !!token, userRole, requireAdmin });

  // If no token, redirect to login
  if (!token) {
    console.log('❌ No token found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If admin route is required but user is not admin, redirect to fan selection
  if (requireAdmin && userRole !== 'super_admin') {
    console.log('❌ Admin route required but user role is:', userRole);
    return <Navigate to="/fan-selection" replace />;
  }

  console.log('✅ ProtectedRoute passed, rendering children');
  // User is authenticated and has required permissions
  return children;
};
