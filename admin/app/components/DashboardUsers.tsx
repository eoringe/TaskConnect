import React from 'react';

interface DashboardUsersProps {
  users: any[];
  taskers: any[];
}

const thStyle: React.CSSProperties = {
  padding: 12,
  background: '#f0f4fa',
  color: '#2d3a4a',
  fontWeight: 700,
  fontSize: 15,
  borderBottom: '2px solid #eaeaea',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: 12,
  fontWeight: 600,
  fontSize: 14,
  color: '#fff',
};

const DashboardUsers: React.FC<DashboardUsersProps> = ({ users, taskers }) => {
  const taskerIds = new Set(taskers.map((t: any) => t.id));

  return (
    <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px rgba(44,62,80,0.07)', padding: 32, marginBottom: 32 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#232946', marginBottom: 8 }}>User Management</h2>
      <p style={{ fontSize: 16, color: '#666', marginBottom: 24 }}>View and manage all users in the system</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
        <thead>
          <tr>
            <th style={thStyle}>Display Name</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Phone Number</th>
            <th style={thStyle}>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: any) => {
            const isTasker = taskerIds.has(user.id);
            return (
              <tr key={user.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                <td style={{ padding: 10 }}>{user.displayName || <span style={{ color: '#aaa' }}>N/A</span>}</td>
                <td style={{ padding: 10 }}>{user.email || <span style={{ color: '#aaa' }}>N/A</span>}</td>
                <td style={{ padding: 10 }}>{user.phoneNumber || <span style={{ color: '#aaa' }}>N/A</span>}</td>
                <td style={{ padding: 10 }}>
                  <span
                    style={{
                      ...badgeStyle,
                      background: isTasker ? '#27ae60' : '#4A80F0',
                    }}
                  >
                    {isTasker ? 'Tasker' : 'Customer'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DashboardUsers; 