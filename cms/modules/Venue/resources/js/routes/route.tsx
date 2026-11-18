import React from 'react';
import { DesktopOutlined } from '@ant-design/icons';
import type { AppRoute } from '@core/routes/types';
import VenueListPage from '../pages/VenueListPage';

export const venueRoutes: AppRoute[] = [
  {
    path: '/admin/venues',
    key: 'venues',
    title: 'Venues (Screens)',
    label: 'Venues (Screens)',
    icon: <DesktopOutlined />,
    order: 10,
    module: 'venue',
    element: <VenueListPage />,
  },
];

export default venueRoutes;
