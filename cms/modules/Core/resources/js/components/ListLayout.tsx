import React from 'react';
import { Card, Space, Typography } from 'antd';

const { Title, Paragraph } = Typography;

interface ListLayoutProps {
  title: string;
  description?: string;
  extraActions?: React.ReactNode;
  filterBar?: React.ReactNode;
  children: React.ReactNode;
}

export const ListLayout: React.FC<ListLayoutProps> = ({
  title,
  description,
  extraActions,
  filterBar,
  children,
}) => {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
          {description && (
            <Paragraph type="secondary" style={{ margin: 0 }}>
              {description}
            </Paragraph>
          )}
        </div>
        {extraActions && <Space>{extraActions}</Space>}
      </div>

      {filterBar && <Card size="small">{filterBar}</Card>}

      <Card styles={{ body: { padding: 0 } }}>{children}</Card>
    </Space>
  );
};

export default ListLayout;
