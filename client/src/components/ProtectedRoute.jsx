import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, requireSuperAdmin = false, requireAdmin = false, excludeSuperAdmin = false }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  console.log('🔐 ProtectedRoute Check:', { token: !!token, userRole, requireAdmin, excludeSuperAdmin });

  // If no token, redirect to login
  if (!token) {
    console.log('❌ No token found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If super_admin route is required but user is not super_admin, redirect to dashboard
  if (requireSuperAdmin && userRole !== 'super_admin') {
    console.log('❌ Super admin route required but user role is:', userRole);
    return <Navigate to="/dashboard" replace />;
  }

  // If route excludes super_admin (like user dashboard), redirect super_admin to admin dashboard
  if (excludeSuperAdmin && userRole === 'super_admin') {
    console.log('❌ Route excludes super_admin, redirecting to admin dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  }

  console.log('✅ ProtectedRoute passed, rendering children');
  // User is authenticated and has required permissions
  return children;
};
