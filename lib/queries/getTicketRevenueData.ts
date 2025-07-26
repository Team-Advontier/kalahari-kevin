// lib/queries/getTicketRevenueData.ts
// This is the query that fetches the ticket revenue data for the dashboard.

export type TicketRevenueRow = {
  ticket_id: string;
  subject: string;
  type: string;
  status: string;
  inbox: string;
  quote_number: string;
  quote_status: string;
  quote_date: string;
  quote_total: number | null;
  invoice_number: string;
  invoice_status: string;
  invoice_total: number | null;
  contact_name: string;
};

export type TicketRevenueSummary = {
  totalRevenue: number;
  totalTickets: number;
};

export async function getTicketRevenueData(filters: any = {}): Promise<{ rows: TicketRevenueRow[]; summary: TicketRevenueSummary }> {
  // Build query string from filters
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`/api/ticket-revenue${params ? `?${params}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch ticket revenue data');
  const { rows } = await res.json();
  // Calculate summary
  const totalRevenue = rows.reduce((sum: number, row: TicketRevenueRow) => sum + (row.invoice_total || 0), 0);
  const totalTickets = rows.length;
  return {
    rows,
    summary: { totalRevenue, totalTickets },
  };
}
