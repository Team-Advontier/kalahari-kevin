// components/dashboard/DashboardSummaryCards.tsx
// This is the component that displays the summary cards for the dashboard.

import React from 'react';

export default function DashboardSummaryCards({ summary }: { summary: any }) {
  // Placeholder: expects summary to have totalRevenue, totalTickets, etc.
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
      <div className="border rounded p-4 min-w-[120px]">
        <div>Total Revenue</div>
        <div className="font-bold text-lg">${'{summary.totalRevenue ?? "-"}'}</div>
      </div>
      <div className="border rounded p-4 min-w-[120px]">
        <div>Total Tickets</div>
        <div className="font-bold text-lg">{summary.totalTickets ?? '-'}</div>
      </div>
      {/* Add more cards as needed */}
    </div>
  );
}
