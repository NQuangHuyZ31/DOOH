import React from 'react';
import type { AppRoute } from '@core/routes/types';
import { ROUTING_CONFIG } from '@core/configs/routing';
import VenueListPage from '../pages/VenueListPage';

export const venueRoutes: AppRoute[] = [
  {
    path: ROUTING_CONFIG.modules.venues.path,
    key: ROUTING_CONFIG.modules.venues.key,
    title: ROUTING_CONFIG.modules.venues.label,
    element: <VenueListPage />,
  },
];

export default venueRoutes;
