import React from 'react';
import { Typography, Space, Badge, Tag } from 'antd';
import { DesktopOutlined, ThunderboltOutlined, CheckCircleOutlined, GlobalOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export const LoginShowcase: React.FC = () => {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 40px',
        background: 'radial-gradient(circle at 20% 20%, #1e293b 0%, #0a0f1d 60%, #030712 100%)',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div>
        <Space size={14} style={{ marginBottom: 36 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)',
            }}
          >
            <DesktopOutlined style={{ fontSize: 24, color: '#ffffff' }} />
          </div>
          <div>
            <Title level={4} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
              DOOH CMS
            </Title>
            <Text style={{ color: '#94a3b8', fontSize: 13 }}>Enterprise Media Management</Text>
          </div>
        </Space>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 16,
            padding: 24,
            backdropFilter: 'blur(16px)',
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Space>
              <Badge status="processing" color="#10b981" />
              <Text strong style={{ color: '#f8fafc', fontSize: 14 }}>Times Square LED #08</Text>
            </Space>
            <Tag color="cyan" style={{ borderRadius: 8 }}>4K UHD</Tag>
          </div>

          <div
            style={{
              height: 140,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1e3a8a, #0e7490, #1e1b4b)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
              textAlign: 'center',
              boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.4)',
            }}
          >
            <GlobalOutlined style={{ fontSize: 32, color: '#38bdf8', marginBottom: 8 }} />
            <Text style={{ color: '#ffffff', fontWeight: 600, fontSize: 15 }}>Summer Spark 2026 Campaign</Text>
            <Text style={{ color: '#cbd5e1', fontSize: 12 }}>120s Dynamic Pacing Loop • Active</Text>
          </div>
        </div>

        <Space size={16} wrap style={{ width: '100%' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: '12px 16px', minWidth: 120 }}>
            <Text style={{ color: '#38bdf8', fontSize: 18, fontWeight: 700, display: 'block' }}>99.98%</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>Playback SLA</Text>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: '12px 16px', minWidth: 120 }}>
            <Text style={{ color: '#34d399', fontSize: 18, fontWeight: 700, display: 'block' }}>&lt; 3ms</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>Tracking Latency</Text>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: '12px 16px', minWidth: 120 }}>
            <Text style={{ color: '#fbbf24', fontSize: 18, fontWeight: 700, display: 'block' }}>120s</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>Loop Engine</Text>
          </div>
        </Space>
      </div>

      <div style={{ marginTop: 32, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 20 }}>
        <Paragraph style={{ color: '#94a3b8', fontSize: 13, margin: 0, lineHeight: '20px' }}>
          Powering intelligent digital billboards, transit screens, and outdoor LED networks worldwide.
        </Paragraph>
      </div>
    </div>
  );
};

export default LoginShowcase;
