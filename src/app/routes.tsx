import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const CommunesPage = lazy(() => import('@/pages/CommunesPage'));
const MairiePage = lazy(() => import('@/pages/MairiePage'));
const WplanPage = lazy(() => import('@/pages/WplanPage'));
const ZoneMakerPage = lazy(() => import('@/pages/ZoneMakerPage'));
const TeamPlannerPage = lazy(() => import('@/pages/TeamPlannerPage'));
const OperationsPage = lazy(() => import('@/pages/OperationsPage'));
const UploadPage = lazy(() => import('@/pages/UploadPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'communes', element: <CommunesPage /> },
      { path: 'mairie', element: <MairiePage /> },
      { path: 'wplan', element: <WplanPage /> },
      { path: 'zone-maker', element: <ZoneMakerPage /> },
      { path: 'operations', element: <OperationsPage /> },
      { path: 'upload', element: <UploadPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/team-planner', element: <TeamPlannerPage /> },
];
