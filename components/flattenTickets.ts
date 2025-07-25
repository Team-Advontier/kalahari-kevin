// components/flattenTickets.ts
// This is the component that flattens the tickets into a single array of tickets.

export interface FlattenedTicket {
  ticketid: number;
  subject: string;
  ticketstatus: string;
  tickettype: string;
  createdat: string;
  updatedat: string;
  customerid: string;
  firstmessage: string;
  attachments: string;
  tags: string;
  threadcount: number;
  hasattachments: boolean;
  assignedtoid?: string;
}

function excelSerialDateToISOString(serial: number | string | null): string | null {
  if (typeof serial === 'string') {
    const parsed = parseFloat(serial);
    if (isNaN(parsed)) return null;
    serial = parsed;
  }
  if (typeof serial !== 'number') return null;
  const msPerDay = 86400000;
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const date = new Date(excelEpoch.getTime() + serial * msPerDay);
  return date.toISOString();
}

// Add isoOrNull helper
function isoOrNull(val: any): string | null {
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z$/.test(val)) {
    return val;
  }
  if (typeof val === 'number') {
    // Excel serial date
    const msPerDay = 86400000;
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + val * msPerDay);
    return date.toISOString();
  }
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      const msPerDay = 86400000;
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + parsed * msPerDay);
      return date.toISOString();
    }
  }
  return null;
}

export function flattenTickets(tickets: any[]): FlattenedTicket[] {
  return tickets.map((ticket) => {
    // Extract first message body from threads of type 'Message'
    let firstMessage = '';
    if (Array.isArray(ticket.threads)) {
      const msg = ticket.threads.find((t: any) => t.type === 'Message' && t.body);
      if (msg && typeof msg.body === 'string') {
        firstMessage = msg.body.slice(0, 250);
      }
    }
    // Extract all attachment names from all threads
    let attachmentNames: string[] = [];
    if (Array.isArray(ticket.threads)) {
      for (const thread of ticket.threads) {
        if (Array.isArray(thread.attachment)) {
          for (const att of thread.attachment) {
            if (att && att.name) attachmentNames.push(att.name);
          }
        }
      }
    }
    // Tags as comma-separated string
    let tags = '';
    if (Array.isArray(ticket.tags)) {
      tags = ticket.tags.join(', ');
    } else if (typeof ticket.tags === 'string') {
      tags = ticket.tags;
    }
    // Derived fields
    const threadCount = Array.isArray(ticket.threads) ? ticket.threads.length : 0;
    const hasAttachments = attachmentNames.length > 0;
    return {
      ticketid: typeof ticket.id === 'number' ? ticket.id : parseInt(ticket.id, 10),
      subject: ticket.subject || '',
      ticketstatus: ticket.ticketStatus || '',
      tickettype: ticket.ticketType || '',
      createdat: isoOrNull(ticket.createdAt) || '',
      updatedat: isoOrNull(ticket.updatedAt) || '',
      customerid: ticket.customerID || '',
      firstmessage: firstMessage,
      attachments: attachmentNames.join(', '),
      tags,
      threadcount: threadCount,
      hasattachments: hasAttachments,
      assignedtoid: ticket.assignedToID || '',
    };
  });
} 