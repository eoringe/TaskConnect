import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface DashboardAnalyticsProps {
  categoryTaskerCounts: { name: string; value: number }[];
  sortedCategoryTaskerCounts: { name: string; value: number }[];
  pieColors: string[];
}

const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ categoryTaskerCounts, sortedCategoryTaskerCounts, pieColors }) => (
  <div style={{ display: 'flex', gap: 32, marginBottom: 48, flexWrap: 'wrap', alignItems: 'flex-start' }}>
    {/* Pie Chart */}
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #eaeaea', padding: 32, minWidth: 320, flex: '1 1 320px', height: 320 }}>
      <div style={{ fontSize: 18, color: '#888', marginBottom: 8 }}>Taskers per Category</div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={categoryTaskerCounts}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#4A80F0"
            label={({ name, value }) => `${name} (${value})`}
          >
            {categoryTaskerCounts.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
    {/* Bar Chart */}
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #eaeaea', padding: 32, minWidth: 320, flex: '1 1 320px', height: 320 }}>
      <div style={{ fontSize: 18, color: '#888', marginBottom: 8 }}>Most Common Categories</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={sortedCategoryTaskerCounts}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#4A80F0" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default DashboardAnalytics; 