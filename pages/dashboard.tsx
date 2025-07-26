import React, { useEffect, useState } from 'react';
import TicketRevenueTable from '../components/dashboard/TicketRevenueTable';
import DashboardSummaryCards from '../components/dashboard/DashboardSummaryCards';
import QuoteStatusFilter from '../components/dashboard/filters/QuoteStatusFilter';
import DateRangePicker from '../components/dashboard/filters/DateRangePicker';
import ContactFilter from '../components/dashboard/filters/ContactFilter';
import { getTicketRevenueData, TicketRevenueRow, TicketRevenueSummary } from '../lib/queries/getTicketRevenueData';

const fetchUniqueOptions = async (field: string): Promise<string[]> => {
  const res = await fetch(`/api/ticket-revenue-options?field=${field}`);
  if (!res.ok) return [];
  const { options } = await res.json();
  return options;
};

type Filters = {
  quoteStatus: string[];
  invoiceStatus: string[];
  contact: string[];
  ticketType: string[];
  inbox: string[];
  ticketStatus: string[];
  dateRange: { start: string; end: string };
};

type FilterOptions = {
  quoteStatus: string[];
  invoiceStatus: string[];
  contact: string[];
  ticketType: string[];
  inbox: string[];
  ticketStatus: string[];
};

export default function DashboardPage() {
  const [filters, setFilters] = useState<Filters>({
    quoteStatus: [],
    invoiceStatus: [],
    contact: [],
    ticketType: [],
    inbox: [],
    ticketStatus: [],
    dateRange: { start: '', end: '' },
  });
  const [rows, setRows] = useState<TicketRevenueRow[]>([]);
  const [summary, setSummary] = useState<TicketRevenueSummary>({ totalRevenue: 0, totalTickets: 0 });
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<FilterOptions>({
    quoteStatus: [],
    invoiceStatus: [],
    contact: [],
    ticketType: [],
    inbox: [],
    ticketStatus: [],
  });

  useEffect(() => {
    // Fetch unique filter options on mount
    Promise.all([
      fetchUniqueOptions('quote_status'),
      fetchUniqueOptions('invoice_status'),
      fetchUniqueOptions('contact_name'),
      fetchUniqueOptions('type'),
      fetchUniqueOptions('inbox'),
      fetchUniqueOptions('status'),
    ]).then(([quoteStatus, invoiceStatus, contact, ticketType, inbox, ticketStatus]) => {
      setOptions({ quoteStatus, invoiceStatus, contact, ticketType, inbox, ticketStatus });
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    getTicketRevenueData({
      quoteStatus: filters.quoteStatus,
      invoiceStatus: filters.invoiceStatus,
      contact: filters.contact,
      ticketType: filters.ticketType,
      inbox: filters.inbox,
      ticketStatus: filters.ticketStatus,
      startDate: filters.dateRange.start,
      endDate: filters.dateRange.end,
    })
      .then(({ rows, summary }) => {
        setRows(rows);
        setSummary(summary);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  // Multi-select handler
  const handleMultiSelect = (key: keyof Filters, values: string[]) => {
    setFilters(f => ({ ...f, [key]: values }));
  };

  return (
    <div style={{ padding: 32 }}>
      <nav style={{ marginBottom: 24 }}>
        <a href="/" style={{ marginRight: 16 }}>Home</a>
        <a href="/dashboard" style={{ fontWeight: 'bold' }}>Dashboard</a>
      </nav>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Ticket Revenue Dashboard</h1>
      <DashboardSummaryCards summary={summary} />
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <QuoteStatusFilter
          value={filters.quoteStatus}
          onChange={vals => handleMultiSelect('quoteStatus', vals)}
          options={options.quoteStatus}
          multi
        />
        <QuoteStatusFilter
          value={filters.invoiceStatus}
          onChange={vals => handleMultiSelect('invoiceStatus', vals)}
          options={options.invoiceStatus}
          label="Invoice Status"
          multi
        />
        <ContactFilter
          value={filters.contact}
          onChange={vals => handleMultiSelect('contact', vals)}
          options={options.contact}
          multi
        />
        <QuoteStatusFilter
          value={filters.ticketType}
          onChange={vals => handleMultiSelect('ticketType', vals)}
          options={options.ticketType}
          label="Ticket Type"
          multi
        />
        <QuoteStatusFilter
          value={filters.inbox}
          onChange={vals => handleMultiSelect('inbox', vals)}
          options={options.inbox}
          label="Inbox"
          multi
        />
        <QuoteStatusFilter
          value={filters.ticketStatus}
          onChange={vals => handleMultiSelect('ticketStatus', vals)}
          options={options.ticketStatus}
          label="Ticket Status"
          multi
        />
        <DateRangePicker
          value={filters.dateRange}
          onChange={val => setFilters(f => ({ ...f, dateRange: val }))}
        />
      </div>
      {loading ? <div>Loading...</div> : (
        <TicketRevenueTable
          rows={rows}
          filters={filters}
          onFilterChange={setFilters}
        />
      )}
    </div>
  );
}
