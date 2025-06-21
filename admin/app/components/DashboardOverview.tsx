import React from 'react';

interface DashboardOverviewProps {
  totalUsers: number;
  totalTaskers: number;
  totalCategories: number;
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 18,
  boxShadow: '0 2px 12px rgba(44,62,80,0.07)',
  padding: '32px 20px 24px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: 180,
  minHeight: 140,
  margin: '0 12px',
};

const labelStyle: React.CSSProperties = {
  fontSize: 16,
  color: '#888',
  marginBottom: 8,
  fontWeight: 500,
};

const valueStyle: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 800,
  color: '#4A80F0',
};

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ totalUsers, totalTaskers, totalCategories }) => (
  <div style={{ display: 'flex', gap: 32, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
    <div style={cardStyle}>
      <div style={labelStyle}>Total Users</div>
      <div style={valueStyle}>{totalUsers}</div>
    </div>
    <div style={cardStyle}>
      <div style={labelStyle}>Total Taskers</div>
      <div style={valueStyle}>{totalTaskers}</div>
    </div>
    <div style={cardStyle}>
      <div style={labelStyle}>Total Categories</div>
      <div style={valueStyle}>{totalCategories}</div>
    </div>
  </div>
);

export default DashboardOverview; 