import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, Card, Typography } from 'antd';
import { MainLayout, doohTheme } from '@core';
import { VenueListPage } from '@modules/Venue/resources/js';

const { Title, Paragraph } = Typography;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('venues');

  const renderContent = () => {
    switch (activeTab) {
      case 'venues':
        return <VenueListPage />;
      case 'campaigns':
      case 'line-items':
        return (
          <Card title="Delivery Management">
            <Title level={4}>Campaigns & Line Items</Title>
            <Paragraph>
              Manage DOOH flights, daily share-of-voice pacing (120s loops), and flight targets.
            </Paragraph>
          </Card>
        );
      case 'creatives':
        return (
          <Card title="Creative Library">
            <Title level={4}>Digital Out-Of-Home Creative Assets</Title>
            <Paragraph>
              Upload and validate 16:9 / 9:16 video (H.264 / AAC) and high-res imagery with strict bitrates.
            </Paragraph>
          </Card>
        );
      case 'simulator':
        return (
          <Card title="Screen Simulator & Player">
            <Title level={4}>Web Player Preview</Title>
            <Paragraph>
              Live simulator for screen playback loops and opaque tracking token validation.
            </Paragraph>
          </Card>
        );
      case 'reports':
      case 'logs':
        return (
          <Card title="Analytics & Audit Logs">
            <Title level={4}>Proof-of-Play & Audit Reports</Title>
            <Paragraph>
              Aggregated hourly and daily impression counts with verification hash auditing.
            </Paragraph>
          </Card>
        );
      default:
        return <VenueListPage />;
    }
  };

  return (
    <ConfigProvider theme={doohTheme}>
      <MainLayout activeKey={activeTab} onNavigate={(key) => setActiveTab(key)}>
        {renderContent()}
      </MainLayout>
    </ConfigProvider>
  );
};

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;
