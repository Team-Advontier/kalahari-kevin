// components/ExportToolbar.tsx
// This is the export toolbar component for the application.
// It contains the buttons for exporting the tickets to CSV and XLSX.

import React, { useState } from 'react';
import { Button } from './ui/button';
import { FlattenedTicket } from './flattenTickets';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase } from '../lib/supabaseClient';

// Toast notification (simple fallback)
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  if (typeof window !== 'undefined') {
    const el = document.createElement('div');
    el.textContent = msg;
    el.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded shadow text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

function parseBoolean(val: any): boolean {
  return typeof val === 'string' ? val.toLowerCase() === 'yes' : Boolean(val);
}

type RowUploadResult = {
  row: FlattenedTicket;
  status: 'success' | 'error';
  message?: string;
};

interface ExportToolbarProps {
  tickets: FlattenedTicket[];
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({ tickets }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<RowUploadResult[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [errorLogUrl, setErrorLogUrl] = useState<string | null>(null);

  // Deduplicate by id (client-side)
  const dedupedTickets = React.useMemo(() => {
    const seen = new Set<number>();
    return tickets.filter(t => {
      if (!t.ticketid || seen.has(t.ticketid)) return false;
      seen.add(t.ticketid);
      return true;
    });
  }, [tickets]);

  const handleExportCSV = () => {
    const csv = Papa.unparse(tickets);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'flattened_tickets.csv');
  };

  const handleExportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(tickets);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
    const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'flattened_tickets.xlsx');
  };

  const handleInsertToSupabase = async () => {
    setLoading(true);
    setResults([]);
    setProgress(0);
    setErrorLogUrl(null);
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;
    const rowResults: RowUploadResult[] = [];
    for (let i = 0; i < dedupedTickets.length; i += batchSize) {
      const batch = dedupedTickets.slice(i, i + batchSize);
      const rows = batch.map((t) => ({
        source_data: t,
        subject: t.subject,
        ticketstatus: t.ticketstatus,
        tickettype: t.tickettype,
        createdat: t.createdat,
        updatedat: t.updatedat,
        customerid: t.customerid,
        firstmessage: t.firstmessage,
        attachments: t.attachments,
        tags: t.tags,
        threadcount: t.threadcount,
        hasattachments: parseBoolean(t.hasattachments),
        assignedtoid: t.assignedtoid || null,
        ticketid: t.ticketid, // now numeric
        synced_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from('source_desk_tickets')
        .upsert(rows, {
          onConflict: 'ticketid',
          ignoreDuplicates: false,
        });
      for (let j = 0; j < batch.length; j++) {
        if (!error) {
          rowResults.push({ row: batch[j], status: 'success' });
          successCount++;
        } else {
          rowResults.push({ row: batch[j], status: 'error', message: error.message });
          errorCount++;
        }
      }
      setResults([...rowResults]);
      setProgress((i + batch.length) / dedupedTickets.length);
    }
    setLoading(false);
    setProgress(1);
    // Toasts
    if (successCount > 0) showToast(`${successCount} tickets uploaded successfully`, 'success');
    if (errorCount > 0) showToast(`${errorCount} tickets failed. Check logs.`, 'error');
    // Prepare downloadable error log
    const errorRows = rowResults.filter(r => r.status === 'error');
    if (errorRows.length > 0) {
      const blob = new Blob([JSON.stringify(errorRows, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      setErrorLogUrl(url);
    }
  };

  // Visual log output
  const uploadLogs = results.map((r, idx) => ({
    status: r.status,
    message: r.status === 'success' ? `Row ${idx + 1} uploaded successfully.` : `Row ${idx + 1} failed: ${r.message}`
  }));

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex gap-4">
        <Button onClick={handleExportCSV} variant="outline">Export CSV</Button>
        <Button onClick={handleExportXLSX} variant="outline">Export XLSX</Button>
        <Button onClick={handleInsertToSupabase} variant="default" disabled={loading}>
          {loading ? 'Uploading...' : 'Insert to Supabase'}
        </Button>
        {results.length > 0 && (
          <Button variant="outline" onClick={() => setLogOpen(v => !v)}>
            {logOpen ? 'Hide Log' : 'Show Log'}
          </Button>
        )}
      </div>
      {/* Progress bar */}
      {loading || progress > 0 ? (
        <div className="w-full bg-gray-200 h-2 rounded">
          <div className="h-2 bg-green-500 rounded" style={{ width: `${progress * 100}%` }} />
        </div>
      ) : null}
      {/* Visual log output */}
      {logOpen && uploadLogs.length > 0 && (
        <div className="mt-2 max-h-64 overflow-y-auto text-sm bg-gray-100 p-2 rounded border">
          {uploadLogs.map((log, idx) => (
            <div key={idx} className={log.status === 'error' ? 'text-red-500' : 'text-green-600'}>
              {log.status.toUpperCase()}: {log.message}
            </div>
          ))}
        </div>
      )}
      {/* Download error log */}
      {errorLogUrl && (
        <a href={errorLogUrl} download="upload-errors.json" className="text-blue-600 underline mt-2">
          Download error log
        </a>
      )}
    </div>
  );
}; 