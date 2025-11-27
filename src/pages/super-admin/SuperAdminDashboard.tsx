import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';

import Dashboard from './Dashboard';
import FoodManagement from './FoodManagement';
import SystemHealth from './SystemHealth';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

export default function SuperAdminDashboard() {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <Dashboard />
        }
      />
      <Route
        path="/food-management"
        element={
          <FoodManagement />
        }
      />
      <Route
        path="/system-health"
        element={
          <SystemHealth />
        }
      />
      <Route path="/" element={<Navigate to="/super-admin/dashboard" replace />} />
    </Routes>
  );
}