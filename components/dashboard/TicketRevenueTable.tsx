// components/dashboard/TicketRevenueTable.tsx
// This is the component that displays the ticket revenue table.

import React from 'react';

export default function TicketRevenueTable({ rows, filters, onFilterChange }: {
  rows: Array<any>,
  filters: any,
  onFilterChange: (filters: any) => void
}) {
  return (
    <div>
      {/* Filters placeholder */}
      <div style={{ marginBottom: 16 }}>
        {/* Integrate filter components here */}
        <span>Filters will go here</span>
      </div>
      {/* Table */}
      <table className="min-w-full border text-sm">
        <thead>
          <tr>
            <th>Ticket ID</th>
            <th>Subject</th>
            <th>Type</th>
            <th>Status</th>
            <th>Inbox</th>
            <th>Quote #</th>
            <th>Quote Status</th>
            <th>Quote Date</th>
            <th>Quote Total</th>
            <th>Invoice #</th>
            <th>Invoice Status</th>
            <th>Invoice Total</th>
            <th>Contact Name</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>{row.ticket_id}</td>
              <td>{row.subject}</td>
              <td>{row.type}</td>
              <td>{row.status}</td>
              <td>{row.inbox}</td>
              <td>{row.quote_number}</td>
              <td>{row.quote_status}</td>
              <td>{row.quote_date}</td>
              <td>{row.quote_total}</td>
              <td>{row.invoice_number}</td>
              <td>{row.invoice_status}</td>
              <td>{row.invoice_total}</td>
              <td>{row.contact_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Export button placeholder */}
      <div style={{ marginTop: 16 }}>
        <button className="border px-4 py-2 rounded">Export</button>
      </div>
    </div>
  );
}
