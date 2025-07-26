import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let query = supabase.from('v_ticket_revenue').select('*');

  // Filters from query string
  const {
    quoteStatus,
    invoiceStatus,
    contact,
    ticketType,
    inbox,
    ticketStatus,
    startDate,
    endDate
  } = req.query;

  if (quoteStatus) {
    const arr = Array.isArray(quoteStatus) ? quoteStatus : [quoteStatus];
    query = query.in('quote_status', arr);
  }
  if (invoiceStatus) {
    const arr = Array.isArray(invoiceStatus) ? invoiceStatus : [invoiceStatus];
    query = query.in('invoice_status', arr);
  }
  if (contact) {
    const arr = Array.isArray(contact) ? contact : [contact];
    query = query.in('contact_name', arr);
  }
  if (ticketType) {
    const arr = Array.isArray(ticketType) ? ticketType : [ticketType];
    query = query.in('type', arr);
  }
  if (inbox) {
    const arr = Array.isArray(inbox) ? inbox : [inbox];
    query = query.in('inbox', arr);
  }
  if (ticketStatus) {
    const arr = Array.isArray(ticketStatus) ? ticketStatus : [ticketStatus];
    query = query.in('status', arr);
  }
  if (startDate && endDate) {
    // Prefer quote_date, fallback to invoice_date if available
    query = query.gte('quote_date', startDate as string).lte('quote_date', endDate as string);
  }

  const { data: rows, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ rows });
} 