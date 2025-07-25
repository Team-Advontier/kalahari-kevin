// components/TicketUpload.tsx
// This is the component that allows the user to upload the tickets from the helpdesk system.

import React, { useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export interface TicketUploadProps {
  onTicketsParsed: (tickets: any[]) => void;
}

// Utility to deduplicate tickets by id
function dedupeTickets(tickets: any[]): any[] {
  const map = new Map();
  for (const t of tickets) {
    if (t && t.id) map.set(t.id, t);
  }
  return Array.from(map.values());
}

export const TicketUpload: React.FC<TicketUploadProps> = ({ onTicketsParsed }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    let allTickets: any[] = [];
    for (const file of Array.from(files)) {
      if (file.name.endsWith('.json')) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            allTickets = allTickets.concat(data);
          } else {
            // If not an array, skip or handle as needed
          }
        } catch (e) {
          // Optionally handle parse error
        }
      }
    }
    const deduped = dedupeTickets(allTickets);
    onTicketsParsed(deduped);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-md bg-white shadow w-full max-w-xl mx-auto">
      <label className="font-semibold">Upload Helpdesk JSON Files</label>
      <Input
        ref={inputRef}
        type="file"
        accept=".json"
        multiple
        onChange={e => handleFiles(e.target.files)}
        className="w-full"
      />
      <Button onClick={() => inputRef.current?.click()} type="button">
        Select JSON Files
      </Button>
      <span className="text-xs text-gray-500">Supports multiple .json files exported from your helpdesk system.</span>
    </div>
  );
}; 