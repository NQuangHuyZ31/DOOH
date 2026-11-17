import React from 'react';
import { Card, Typography } from 'antd';
import { AppRoute } from './types';
import { ROUTING_CONFIG } from '../configs/routing';
import '@modules/Venue/resources/js/index';
import '@modules/Auth/resources/js/index';

const { Title, Paragraph } = Typography;

const createModulePlaceholder = (title: string, subtitle: string, desc: string): React.ReactNode => (
  <Card title={title}>
    <Title level={4}>{subtitle}</Title>
    <Paragraph>{desc}</Paragraph>
  </Card>
);

export const moduleRoutes: AppRoute[] = [
  {
    path: ROUTING_CONFIG.modules.delivery.path,
    key: ROUTING_CONFIG.modules.delivery.key,
    title: ROUTING_CONFIG.modules.delivery.label,
    element: createModulePlaceholder(
      'Delivery Management',
      'Campaigns & Line Items',
      'Manage DOOH flights, daily share-of-voice pacing (120s loops), and flight targets.'
    ),
  },
  {
    path: ROUTING_CONFIG.modules.creatives.path,
    key: ROUTING_CONFIG.modules.creatives.key,
    title: ROUTING_CONFIG.modules.creatives.label,
    element: createModulePlaceholder(
      'Creative Library',
      'Digital Out-Of-Home Creative Assets',
      'Upload and validate 16:9 / 9:16 video (H.264 / AAC) and high-res imagery with strict bitrates.'
    ),
  },
  {
    path: ROUTING_CONFIG.modules.simulator.path,
    key: ROUTING_CONFIG.modules.simulator.key,
    title: ROUTING_CONFIG.modules.simulator.label,
    element: createModulePlaceholder(
      'Screen Simulator & Player',
      'Web Player Preview',
      'Live simulator for screen playback loops and opaque tracking token validation.'
    ),
  },
  {
    path: ROUTING_CONFIG.modules.reports.path,
    key: ROUTING_CONFIG.modules.reports.key,
    title: ROUTING_CONFIG.modules.reports.label,
    element: createModulePlaceholder(
      'Analytics & Reports',
      'Proof-of-Play & Audit Reports',
      'Aggregated hourly and daily impression counts with verification hash auditing.'
    ),
  },
  {
    path: ROUTING_CONFIG.modules.logs.path,
    key: ROUTING_CONFIG.modules.logs.key,
    title: ROUTING_CONFIG.modules.logs.label,
    element: createModulePlaceholder(
      'Tracking & Audit Logs',
      'Proof-of-Play Verification Logs',
      'Live ingest audit logs and Redis dedup inspection records.'
    ),
  },
];

export default moduleRoutes;
