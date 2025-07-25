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

// Xero Invoice row type
interface XeroInvoiceRow {
  contact_name: string;
  email_address: string;
  invoice_number: string;
  reference: string;
  issue_date: string;
  due_date: string;
  currency: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: string;
  type: string;
  tracking_name_1: string;
  tracking_option_1: string;
  tracking_name_2: string;
  tracking_option_2: string;
  source_data: any;
  synced_at: string;
  _uploadStatus?: 'pending' | 'success' | 'error';
  _uploadMessage?: string;
}

export const XeroInvoiceUploader: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [invoices, setInvoices] = useState<XeroInvoiceRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<XeroInvoiceRow[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [errorLogUrl, setErrorLogUrl] = useState<string | null>(null);

  // Table columns
  const columns = React.useMemo<ColumnDef<XeroInvoiceRow, any>[]>(
    () => [
      { accessorKey: 'invoice_number', header: 'Invoice Number' },
      { accessorKey: 'type', header: 'Type' },
      { accessorKey: 'contact_name', header: 'Contact' },
      { accessorKey: 'email_address', header: 'Email' },
      { accessorKey: 'reference', header: 'Reference' },
      { accessorKey: 'issue_date', header: 'Issue Date' },
      { accessorKey: 'due_date', header: 'Due Date' },
      { accessorKey: 'currency', header: 'Currency' },
      { accessorKey: 'subtotal', header: 'Subtotal' },
      { accessorKey: 'tax_amount', header: 'Tax' },
      { accessorKey: 'total', header: 'Total' },
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'tracking_name_1', header: 'Tracking 1' },
      { accessorKey: 'tracking_option_1', header: 'Option 1' },
      { accessorKey: 'tracking_name_2', header: 'Tracking 2' },
      { accessorKey: 'tracking_option_2', header: 'Option 2' },
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
    data: invoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // File upload handler
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    let allInvoices: XeroInvoiceRow[] = [];
    for (const file of Array.from(files)) {
      if (file.name.endsWith('.csv')) {
        try {
          const text = await file.text();
          const { data, errors } = Papa.parse<any>(text, { header: true, skipEmptyLines: true });
          if (errors.length) {
            alert('CSV parse error: ' + errors[0].message);
            return;
          }
          allInvoices = allInvoices.concat(
            data.map((row: any) => ({
              contact_name: row['ContactName'] || '',
              email_address: row['EmailAddress'] || '',
              invoice_number: row['InvoiceNumber'] || '',
              reference: row['Reference'] || '',
              issue_date: row['InvoiceDate'] || '',
              due_date: row['DueDate'] || '',
              currency: row['Currency'] || '',
              subtotal: parseFloat(row['SubTotal']) || 0,
              tax_amount: parseFloat(row['TaxAmount']) || 0,
              total: parseFloat(row['Total']) || 0,
              status: row['Status'] || '',
              type: row['Type'] || '',
              tracking_name_1: row['TrackingName1'] || '',
              tracking_option_1: row['TrackingOption1'] || '',
              tracking_name_2: row['TrackingName2'] || '',
              tracking_option_2: row['TrackingOption2'] || '',
              source_data: row,
              synced_at: new Date().toISOString(),
              _uploadStatus: 'pending',
              _uploadMessage: '',
            }))
          );
        } catch (e) {
          alert('Failed to parse CSV: ' + (e as Error).message);
          return;
        }
      }
    }
    setInvoices(allInvoices);
    setResults([]);
    setErrorLogUrl(null);
  };

  // Export handlers
  const handleExportCSV = () => {
    const csv = Papa.unparse(invoices);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'xero_invoices.csv');
  };

  const handleExportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(invoices);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'xero_invoices.xlsx');
  };

  // Insert handler
  const handleInsert = async () => {
    setUploading(true);
    setResults([]);
    setErrorLogUrl(null);
    const batchSize = 100;
    let rowResults: XeroInvoiceRow[] = [];
    for (let i = 0; i < invoices.length; i += batchSize) {
      const batch = invoices.slice(i, i + batchSize);
      // Deduplicate within batch
      const deduped = Array.from(
        new Map(batch.map(row => [row.invoice_number + '|' + row.type, row])).values()
      );
      const rows = deduped.map(({ _uploadStatus, _uploadMessage, ...rest }) => rest);
      const { error } = await supabase
        .from('source_xero_invoices')
        .upsert(rows, {
          onConflict: 'invoice_number,type',
        });
      for (let j = 0; j < deduped.length; j++) {
        if (!error) {
          rowResults.push({ ...deduped[j], _uploadStatus: 'success', _uploadMessage: '' });
        } else {
          rowResults.push({ ...deduped[j], _uploadStatus: 'error', _uploadMessage: error.message });
        }
      }
      setResults([...rowResults]);
    }
    setInvoices(rowResults);
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
        <Button onClick={handleExportCSV} variant="outline" disabled={invoices.length === 0}>
          Export CSV
        </Button>
        <Button onClick={handleExportXLSX} variant="outline" disabled={invoices.length === 0}>
          Export XLSX
        </Button>
        <Button onClick={handleInsert} variant="default" disabled={uploading || invoices.length === 0}>
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