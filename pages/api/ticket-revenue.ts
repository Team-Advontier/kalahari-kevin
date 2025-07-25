import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function extractTicketIdFromReference(reference: string): string | null {
  if (!reference) return null;
  const match = reference.match(/\b\d{5,}\b/); // 5+ digit number
  return match ? match[0] : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Fetch all tickets
  const { data: tickets, error: ticketError } = await supabase
    .from('source_desk_tickets')
    .select('*');
  if (ticketError) return res.status(500).json({ error: ticketError.message });

  // 2. Fetch all inboxes
  const { data: inboxes } = await supabase
    .from('source_desk_inboxes')
    .select('*');

  // 3. Fetch all quotes
  const { data: quotes } = await supabase
    .from('source_xero_quotes')
    .select('*');

  // 4. Fetch all invoices
  const { data: invoices } = await supabase
    .from('source_xero_invoices')
    .select('*');

  // Build lookup maps
  const inboxMap = new Map((inboxes || []).map(i => [i.id, i]));
  const quoteMap = new Map();
  (quotes || []).forEach(q => {
    const ticketId = extractTicketIdFromReference(q.reference || '');
    if (ticketId) quoteMap.set(ticketId, q);
  });
  // Invoice join: by quote_number or contact+total
  const invoiceByQuote = new Map((invoices || []).map(inv => [inv.invoice_number, inv]));
  const invoiceByContactTotal = new Map(
    (invoices || []).map(inv => [
      `${inv.contact_name || ''}|${inv.total || ''}`,
      inv
    ])
  );

  // Normalize rows
  const rows = (tickets || []).map(ticket => {
    const inbox = inboxMap.get(ticket.inboxid) || {};
    const quote = quoteMap.get(ticket.ticketid?.toString()) || null;
    let invoice = null;
    if (quote) {
      invoice = invoiceByQuote.get(quote.quote_number) ||
        invoiceByContactTotal.get(`${quote.contact_name || ''}|${quote.total_amount || ''}`) || null;
    }
    return {
      ticket_id: ticket.ticketid,
      subject: ticket.subject,
      type: ticket.tickettype,
      status: ticket.ticketstatus,
      inbox: inbox.display_name || '',
      quote_number: quote?.quote_number || '',
      quote_status: quote?.status || '',
      quote_date: quote?.quote_date || '',
      quote_total: quote?.total_amount || null,
      invoice_number: invoice?.invoice_number || '',
      invoice_status: invoice?.status || '',
      invoice_total: invoice?.total || null,
      contact_name: invoice?.contact_name || '',
    };
  });

  res.status(200).json({ rows });
} 