import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '../modules/auth/pages/LoginPage';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import FaceAttendanceSelfPage from '../modules/attendance/self/pages/FaceAttendanceSelfPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />
  },
  {
    path: '/dashboard',
    element: <DashboardPage />
  },
  {
    path: '/trial-attendance',
    element: <FaceAttendanceSelfPage />
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
