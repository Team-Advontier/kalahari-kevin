import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Distinct from v_ticket_revenue
  const [quoteStatusRes, invoiceStatusRes, contactRes, quoteDateRes, invoiceDateRes] = await Promise.all([
    supabase.from('v_ticket_revenue').select('quote_status').neq('quote_status', '').order('quote_status', { ascending: true }),
    supabase.from('v_ticket_revenue').select('invoice_status').neq('invoice_status', '').order('invoice_status', { ascending: true }),
    supabase.from('v_ticket_revenue').select('contact_name').neq('contact_name', '').order('contact_name', { ascending: true }),
    supabase.from('v_ticket_revenue').select('min(quote_date), max(quote_date)').maybeSingle(),
    supabase.from('v_ticket_revenue').select('min(invoice_date), max(invoice_date)').maybeSingle(),
  ]);

  // Distinct from source_desk_tickets
  const [ticketTypeRes, ticketStatusRes, inboxRes] = await Promise.all([
    supabase.from('source_desk_tickets').select('tickettype').neq('tickettype', '').order('tickettype', { ascending: true }),
    supabase.from('source_desk_tickets').select('ticketstatus').neq('ticketstatus', '').order('ticketstatus', { ascending: true }),
    supabase.from('source_desk_tickets').select('inboxid').neq('inboxid', '').order('inboxid', { ascending: true }),
  ]);

  // Optionally join inboxid to display_name
  let inboxes: string[] = [];
  if (inboxRes.data && inboxRes.data.length > 0) {
    const inboxIds = Array.from(new Set(inboxRes.data.map((row: any) => row.inboxid).filter(Boolean)));
    if (inboxIds.length > 0) {
      const inboxLookup = await supabase.from('source_desk_inboxes').select('id, display_name').in('id', inboxIds);
      inboxes = (inboxLookup.data || []).map((row: any) => row.display_name).filter(Boolean);
    }
  }

  // Extract and dedupe values
  const quoteStatuses = Array.from(new Set((quoteStatusRes.data || []).map((row: any) => row.quote_status).filter(Boolean)));
  const invoiceStatuses = Array.from(new Set((invoiceStatusRes.data || []).map((row: any) => row.invoice_status).filter(Boolean)));
  const contacts = Array.from(new Set((contactRes.data || []).map((row: any) => row.contact_name).filter(Boolean)));
  const ticketTypes = Array.from(new Set((ticketTypeRes.data || []).map((row: any) => row.tickettype).filter(Boolean)));
  const ticketStatuses = Array.from(new Set((ticketStatusRes.data || []).map((row: any) => row.ticketstatus).filter(Boolean)));

  // Date range: prefer quote_date, fallback to invoice_date
  let min = null, max = null;
  if (quoteDateRes.data && (quoteDateRes.data.min || quoteDateRes.data.max)) {
    min = quoteDateRes.data.min;
    max = quoteDateRes.data.max;
  } else if (invoiceDateRes.data && (invoiceDateRes.data.min || invoiceDateRes.data.max)) {
    min = invoiceDateRes.data.min;
    max = invoiceDateRes.data.max;
  }

  res.status(200).json({
    quoteStatuses,
    invoiceStatuses,
    contacts,
    ticketTypes,
    ticketStatuses,
    inboxes,
    dateRange: { min, max },
  });
} 