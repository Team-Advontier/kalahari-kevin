import React, { useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase } from '../../lib/supabaseClient';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

const CONTACT_FIELDS = [
  'ContactName',
  'AccountNumber',
  'EmailAddress',
  'FirstName',
  'LastName',
];

export const XeroContactUploader: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [errorLogUrl, setErrorLogUrl] = useState<string | null>(null);

  // Only show the 5 fields + status columns
  const columns = React.useMemo<ColumnDef<any, any>[]>(() => [
    ...CONTACT_FIELDS.map(key => ({ accessorKey: key, header: key })),
    {
      accessorKey: '_uploadStatus',
      header: 'Upload Status',
      cell: ({ getValue }) => {
        const status = getValue();
        if (status === 'success') return <span className="text-green-600">Success</span>;
        if (status === 'error') return <span className="text-red-600">Error</span>;
        return <span className="text-gray-500">Pending</span>;
      },
    },
    {
      accessorKey: '_uploadMessage',
      header: 'Message',
      cell: ({ getValue }) => <span className="text-xs">{getValue() || ''}</span>,
    },
  ], []);

  const table = useReactTable({
    data: contacts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // File upload handler
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    let allContacts: any[] = [];
    for (const file of Array.from(files)) {
      if (file.name.endsWith('.csv')) {
        try {
          const text = await file.text();
          const { data, errors, meta } = Papa.parse<any>(text, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
            quoteChar: '"',
            transformHeader: h => h.trim(),
          });
          if (errors.length) {
            alert('CSV parse error: ' + errors[0].message);
            return;
          }
          if (data.length > 0 && meta.fields && Object.keys(data[0]).length !== meta.fields.length) {
            alert(`Warning: Detected ${Object.keys(data[0]).length} fields in first row, but header has ${meta.fields.length}. Possible CSV formatting issue.`);
          }
          allContacts = allContacts.concat(
            data.map((row: any) => {
              const mapped = {
                ContactName: row['ContactName'] || null,
                AccountNumber: row['AccountNumber'] || null,
                EmailAddress: row['EmailAddress'] || null,
                FirstName: row['FirstName'] || null,
                LastName: row['LastName'] || null,
                source_data: row,
                synced_at: new Date().toISOString(),
                _uploadStatus: 'pending',
                _uploadMessage: '',
              };
              return mapped;
            })
          );
        } catch (e) {
          alert('Failed to parse CSV: ' + (e as Error).message);
          return;
        }
      }
    }
    setContacts(allContacts);
    setResults([]);
    setErrorLogUrl(null);
  };

  // Export handlers
  const handleExportCSV = () => {
    const csv = Papa.unparse(contacts.map((row: any) => {
      const out: any = {};
      CONTACT_FIELDS.forEach(f => out[f] = row[f]);
      return out;
    }));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'xero_contacts.csv');
  };

  const handleExportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(contacts.map((row: any) => {
      const out: any = {};
      CONTACT_FIELDS.forEach(f => out[f] = row[f]);
      return out;
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'xero_contacts.xlsx');
  };

  // Insert handler
  const handleInsert = async () => {
    setUploading(true);
    setResults([]);
    setErrorLogUrl(null);
    const batchSize = 100;
    let rowResults: any[] = [];
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      const rows = batch.map(({ _uploadStatus, _uploadMessage, ...rest }) => rest);
      const { error } = await supabase
        .from('source_xero_contacts')
        .insert(rows);
      for (let j = 0; j < batch.length; j++) {
        if (!error) {
          rowResults.push({ ...batch[j], _uploadStatus: 'success', _uploadMessage: '' });
        } else {
          rowResults.push({ ...batch[j], _uploadStatus: 'error', _uploadMessage: error.message });
        }
      }
      setResults([...rowResults]);
    }
    setContacts(rowResults);
    setUploading(false);
    // Error log
    const errorRows = rowResults.filter(r => r._uploadStatus === 'error');
    if (errorRows.length > 0) {
      const blob = new Blob([JSON.stringify(errorRows, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      setErrorLogUrl(url);
    }
  };

  // Visual log output
  const uploadLogs = results.map((r, idx) => ({
    status: r._uploadStatus,
    message:
      r._uploadStatus === 'success'
        ? `Row ${idx + 1} uploaded successfully.`
        : `Row ${idx + 1} failed: ${r._uploadMessage}`,
  }));

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex gap-4 items-center">
        <Input
          ref={inputRef}
          type="file"
          accept=".csv"
          multiple={false}
          onChange={e => handleFiles(e.target.files)}
          className="w-auto"
        />
        <Button onClick={() => inputRef.current?.click()} type="button">
          Select CSV File
        </Button>
        <Button onClick={handleExportCSV} variant="outline" disabled={contacts.length === 0}>
          Export CSV
        </Button>
        <Button onClick={handleExportXLSX} variant="outline" disabled={contacts.length === 0}>
          Export XLSX
        </Button>
        <Button onClick={handleInsert} variant="default" disabled={uploading || contacts.length === 0}>
          {uploading ? 'Uploading...' : 'Insert to Supabase'}
        </Button>
        {results.length > 0 && (
          <Button variant="outline" onClick={() => setLogOpen(v => !v)}>
            {logOpen ? 'Hide Log' : 'Show Log'}
          </Button>
        )}
      </div>
      {/* Table preview */}
      <div className="overflow-x-auto border rounded bg-white">
        <table className="min-w-full text-xs">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-2 py-1 border-b font-semibold text-left">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-2 py-1 border-b">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Visual log output */}
      {logOpen && uploadLogs.length > 0 && (
        <div className="mt-2 max-h-64 overflow-y-auto text-sm bg-gray-100 p-2 rounded border">
          {uploadLogs.map((log, idx) => (
            <div key={idx} className={log.status === 'error' ? 'text-red-500' : 'text-green-600'}>
              {log.status?.toUpperCase()}: {log.message}
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