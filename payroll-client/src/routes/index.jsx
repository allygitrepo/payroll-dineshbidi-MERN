import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '../modules/auth/pages/LoginPage';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import DashboardHome from '../modules/dashboard/pages/DashboardHome';
import ModulePageWrapper from './ModulePageWrapper';
import FaceAttendanceSelfPage from '../modules/attendance/self/pages/FaceAttendanceSelfPage';
// import FaceAttendanceSelfPage from '../modules/attendance/self/pages/FaceAttendanceSelfPage';
// import DashboardHome from '../modules/dashboard/pages/DashboardHome';
import ModulePageWrapper from './ModulePageWrapper';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />
  },
  {
    path: '/',
    element: <DashboardPage />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardHome />
      },
      {
        path: ':moduleName',
        element: <ModulePageWrapper />
      },
      {
        path: ':moduleName/:subMenuSlug',
        element: <ModulePageWrapper />
      }
    ]
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
