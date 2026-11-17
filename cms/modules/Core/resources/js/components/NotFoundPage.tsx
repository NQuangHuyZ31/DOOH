import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ROUTING_CONFIG } from '../configs/routing';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Button type="primary" onClick={() => navigate(ROUTING_CONFIG.defaultPath)}>
          Back to Dashboard
        </Button>
      }
    />
  );
};

export default NotFoundPage;
