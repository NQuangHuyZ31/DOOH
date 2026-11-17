import React from 'react';
import { Card, Flex, Space, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export interface ListLayoutProps {
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
      <Flex justify="space-between" align="center">
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
      </Flex>

      {filterBar && <Card size="small">{filterBar}</Card>}

      <Card styles={{ body: { padding: 0 } }}>{children}</Card>
    </Space>
  );
};

export default ListLayout;
