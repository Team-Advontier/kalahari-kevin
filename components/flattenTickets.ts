// components/flattenTickets.ts
// This is the component that flattens the tickets into a single array of tickets.

export interface FlattenedTicket {
  id: string;
  subject: string;
  ticketStatus: string;
  ticketType: string;
  createdAt: string;
  updatedAt: string;
  customerID: string;
  firstMessage: string;
  attachments: string;
  tags: string;
  threadCount: number;
  hasAttachments: boolean;
  assignedToID?: string;
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
      id: ticket.id,
      subject: ticket.subject || '',
      ticketStatus: ticket.ticketStatus || '',
      ticketType: ticket.ticketType || '',
      createdAt: ticket.createdAt || '',
      updatedAt: ticket.updatedAt || '',
      customerID: ticket.customerID || '',
      firstMessage,
      attachments: attachmentNames.join(', '),
      tags,
      threadCount,
      hasAttachments,
      assignedToID: ticket.assignedToID || '',
    };
  });
} 