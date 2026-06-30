import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '../modules/auth/pages/LoginPage';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import DashboardHome from '../modules/dashboard/pages/DashboardHome';
import ModulePageWrapper from './ModulePageWrapper';
import FaceAttendanceSelfPage from '../modules/attendance/self/pages/FaceAttendanceSelfPage';

import SaasDashboardPage from '../modules/saas-admin/pages/SaasDashboardPage';
import SaasDashboardHome from '../modules/saas-admin/pages/SaasDashboardHome';
import SaasClientManagementPage from '../modules/saas-admin/pages/SaasClientManagementPage';
import SaasCoAdminsPage from '../modules/saas-admin/pages/SaasCoAdminsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />
  },
  {
    path: '/saas-dashboard',
    element: <SaasDashboardPage />,
    children: [
      {
        path: '',
        element: <SaasDashboardHome />
      },
      {
        path: 'clients',
        element: <SaasClientManagementPage />
      },
      {
        path: 'co-admins',
        element: <SaasCoAdminsPage />
      }
    ]
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
