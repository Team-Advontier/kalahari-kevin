// components/data-uploaders/XeroQuoteUploader.tsx

'use client';

import React, { useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { supabase } from '../../lib/supabaseClient';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

interface XeroQuoteRow {
  quote_number: string;
  contact_name: string;
  contact_account_number: string;
  quote_date: string | null;
  expiry_date: string | null;
  created_date: string | null;
  total_amount: number | null;
  status: string;
  branding: string;
  vertical: string;
  business_unit: string;
  source_data: any;
  synced_at: string;
  _uploadStatus?: 'pending' | 'success' | 'error';
  _uploadMessage?: string;
}

// Helper to convert Excel serial date to ISO string or null
function excelSerialToISO(val: any): string | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return val;
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (!isNaN(num) && num > 2000) {
    // Already a year, treat as ISO
    return num.toString();
  }
  if (!isNaN(num)) {
    // Excel serial date
    const msPerDay = 86400000;
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + num * msPerDay);
    return date.toISOString().slice(0, 10);
  }
  return null;
}

export const XeroQuoteUploader: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [quotes, setQuotes] = useState<XeroQuoteRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<XeroQuoteRow[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [errorLogUrl, setErrorLogUrl] = useState<string | null>(null);

  const columns = React.useMemo<ColumnDef<XeroQuoteRow, any>[]>(
    () => [
      { accessorKey: 'quote_number', header: 'Quote Number' },
      { accessorKey: 'contact_name', header: 'Contact' },
      { accessorKey: 'contact_account_number', header: 'Account Number' },
      { accessorKey: 'quote_date', header: 'Quote Date' },
      { accessorKey: 'expiry_date', header: 'Expiry Date' },
      { accessorKey: 'created_date', header: 'Created Date' },
      { accessorKey: 'total_amount', header: 'Total (ex) (AED)' },
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'branding', header: 'Branding' },
      { accessorKey: 'vertical', header: 'Vertical' },
      { accessorKey: 'business_unit', header: 'Business Unit' },
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
    ],
    []
  );

  const table = useReactTable({
    data: quotes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    let allQuotes: XeroQuoteRow[] = [];
    for (const file of Array.from(files)) {
      if (file.name.endsWith('.xlsx')) {
        try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets['All quotes summary'];
          if (!sheet) {
            alert('Worksheet "All quotes summary" not found.');
            return;
          }
          const raw = XLSX.utils.sheet_to_json<any>(sheet, { header: 1, defval: '' });
          if (raw.length < 7) {
            alert('Sheet does not have enough rows.');
            return;
          }
          const headers = raw[6];
          const rows = raw.slice(7).filter(r => r.some((cell: any) => cell !== ''));
          allQuotes = allQuotes.concat(
            rows.map((row: any[]) => {
              const rowObj: any = {};
              headers.forEach((h: string, i: number) => {
                rowObj[h] = row[i];
              });
              return {
                quote_number: rowObj['Invoice Number']?.toString().trim() || null,
                contact_name: rowObj['Contact']?.toString().trim() || null,
                contact_account_number: rowObj['Contact Account Number']?.toString().trim() || null,
                quote_date: excelSerialToISO(rowObj['Invoice Date']),
                expiry_date: excelSerialToISO(rowObj['Expiry Date']),
                created_date: excelSerialToISO(rowObj['Created Date']),
                total_amount: rowObj['Total (ex) (AED)'] !== undefined && rowObj['Total (ex) (AED)'] !== '' ? parseFloat(rowObj['Total (ex) (AED)']) : null,
                status: rowObj['Status']?.toString().trim() || null,
                branding: rowObj['Branding']?.toString().trim() || null,
                vertical: rowObj['Vertical']?.toString().trim() || null,
                business_unit: rowObj['Business Unit']?.toString().trim() || null,
                source_data: rowObj,
                synced_at: new Date().toISOString(),
                _uploadStatus: 'pending',
                _uploadMessage: '',
              };
            })
          );
        } catch (e) {
          alert('Failed to parse XLSX: ' + (e as Error).message);
          return;
        }
      }
    }
    setQuotes(allQuotes);
    setResults([]);
    setErrorLogUrl(null);
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(quotes);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'xero_quotes.csv');
  };

  const handleExportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(quotes);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quotes');
    const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'xero_quotes.xlsx');
  };

  const handleInsert = async () => {
    setUploading(true);
    setResults([]);
    setErrorLogUrl(null);
    const batchSize = 100;
    let rowResults: XeroQuoteRow[] = [];
    for (let i = 0; i < quotes.length; i += batchSize) {
      const batch = quotes.slice(i, i + batchSize);
      const deduped = Array.from(
        new Map(batch.map(row => [`${row.quote_number ?? ''}|${row.created_date ?? ''}`, row])).values()
      );
      const rows = deduped.map(({ _uploadStatus, _uploadMessage, ...rest }) => rest);
      const { error } = await supabase
        .from('source_xero_quotes')
        .upsert(rows, {
          onConflict: 'quote_number,created_date',
        });
      for (let j = 0; j < deduped.length; j++) {
        rowResults.push({
          ...deduped[j],
          _uploadStatus: error ? 'error' : 'success',
          _uploadMessage: error?.message || '',
        });
      }
      setResults([...rowResults]);
    }
    setQuotes(rowResults);
    setUploading(false);

    const errorRows = rowResults.filter(r => r._uploadStatus === 'error');
    if (errorRows.length > 0) {
      const blob = new Blob([JSON.stringify(errorRows, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      setErrorLogUrl(url);
    }
  };

  const uploadLogs = results.map((r, idx) => ({
    status: r._uploadStatus,
    message:
      r._uploadStatus === 'success'
        ? `Row ${idx + 1} uploaded successfully.`
        : `Row ${idx + 1} failed: ${r._uploadMessage}`,
  }));

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md bg-white shadow w-full max-w-5xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-2">Upload Xero Quotes (Excel)</h2>
      <div className="flex gap-4 items-center flex-wrap">
        <Input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          multiple={false}
          onChange={e => handleFiles(e.target.files)}
          className="w-auto"
        />
        <Button onClick={() => inputRef.current?.click()} type="button">
          Select XLSX File
        </Button>
        <Button onClick={handleExportCSV} variant="outline" disabled={quotes.length === 0}>
          Export CSV
        </Button>
        <Button onClick={handleExportXLSX} variant="outline" disabled={quotes.length === 0}>
          Export XLSX
        </Button>
        <Button onClick={handleInsert} variant="default" disabled={uploading || quotes.length === 0}>
          {uploading ? 'Uploading...' : 'Insert to Supabase'}
        </Button>
        {results.length > 0 && (
          <Button variant="outline" onClick={() => setLogOpen(v => !v)}>
            {logOpen ? 'Hide Log' : 'Show Log'}
          </Button>
        )}
      </div>

      {/* Table preview */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-2 py-1 text-left font-semibold">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className={row.original._uploadStatus === 'error' ? 'bg-red-50' : row.original._uploadStatus === 'success' ? 'bg-green-50' : ''}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-2 py-1 border-t">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr><td colSpan={columns.length} className="text-center py-4">No quotes loaded.</td></tr>
            )}
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
      {errorLogUrl && (
        <a href={errorLogUrl} download="upload-errors.json" className="text-blue-600 underline mt-2">
          Download error log
        </a>
      )}
    </div>
  );
};
