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

interface CompanyRow {
  companyid: string;
  name: string;
  email: string | null;
  website: string | null;
  industry: string | null;
  details: string | null;
  avatarpath: string | null;
  permission: string | null;
  kind: string | null;
  customerscount: number | null;
  ticketscount: number | null;
  domains: string[] | null;
  address: string | null;
  phones: string[] | null;
  sociallinks: string[] | null;
  source_data: any;
  synced_at: string;
  _uploadStatus?: 'pending' | 'success' | 'error';
  _uploadMessage?: string;
}

export const CompanyUploader: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<CompanyRow[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [errorLogUrl, setErrorLogUrl] = useState<string | null>(null);

  // Table columns
  const columns = React.useMemo<ColumnDef<CompanyRow, any>[]>(
    () => [
      { accessorKey: 'companyid', header: 'Company ID' },
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'website', header: 'Website' },
      { accessorKey: 'industry', header: 'Industry' },
      { accessorKey: 'details', header: 'Details' },
      { accessorKey: 'avatarpath', header: 'Avatar Path' },
      { accessorKey: 'permission', header: 'Permission' },
      { accessorKey: 'kind', header: 'Kind' },
      { accessorKey: 'customerscount', header: 'Customers Count' },
      { accessorKey: 'ticketscount', header: 'Tickets Count' },
      { accessorKey: 'domains', header: 'Domains', cell: ({ getValue }) => (getValue() ? (getValue() as string[]).join(', ') : '') },
      { accessorKey: 'address', header: 'Address' },
      { accessorKey: 'phones', header: 'Phones', cell: ({ getValue }) => (getValue() ? (getValue() as string[]).join(', ') : '') },
      { accessorKey: 'sociallinks', header: 'Social Links', cell: ({ getValue }) => (getValue() ? (getValue() as string[]).join(', ') : '') },
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
    data: companies,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // File upload handler
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    let allCompanies: CompanyRow[] = [];
    for (const file of Array.from(files)) {
      if (file.name.endsWith('.json')) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            allCompanies = allCompanies.concat(
              data.map((company: any) => ({
                companyid: company.id,
                name: company.name,
                email: company.email ?? null,
                website: company.website ?? null,
                industry: company.industry ?? null,
                details: company.details ?? null,
                avatarpath: company.avatarPath ?? null,
                permission: company.permission ?? null,
                kind: company.kind ?? null,
                customerscount: company.customersCount ?? null,
                ticketscount: company.ticketsCount ?? null,
                domains: company.domains ?? null,
                address: company.address ?? null,
                phones: company.phones ?? null,
                sociallinks: company.socialLinks ?? null,
                source_data: company,
                synced_at: new Date().toISOString(),
                _uploadStatus: 'pending',
              }))
            );
          }
        } catch (e) {
          // Optionally handle parse error
        }
      }
    }
    setCompanies(allCompanies);
    setResults([]);
    setErrorLogUrl(null);
  };

  // Export handlers
  const handleExportCSV = () => {
    const csv = Papa.unparse(companies);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'flattened_companies.csv');
  };
  const handleExportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(companies);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Companies');
    const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'flattened_companies.xlsx');
  };

  // Insert handler
  const handleInsert = async () => {
    setUploading(true);
    setResults([]);
    setErrorLogUrl(null);
    const batchSize = 100;
    let rowResults: CompanyRow[] = [];
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      const rows = batch.map(({ _uploadStatus, _uploadMessage, ...rest }) => rest);
      const { error } = await supabase
        .from('source_projects_companies')
        .upsert(rows, {
          onConflict: 'companyid',
          ignoreDuplicates: false,
        });
      for (let j = 0; j < batch.length; j++) {
        if (!error) {
          rowResults.push({ ...batch[j], _uploadStatus: 'success', _uploadMessage: '' });
        } else {
          rowResults.push({ ...batch[j], _uploadStatus: 'error', _uploadMessage: error.message });
        }
      }
      setResults([...rowResults]);
    }
    setCompanies(rowResults);
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
    message: r._uploadStatus === 'success' ? `Row ${idx + 1} uploaded successfully.` : `Row ${idx + 1} failed: ${r._uploadMessage}`
  }));

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md bg-white shadow w-full max-w-5xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-2">Upload Companies (Teamwork Desk/Projects)</h2>
      <div className="flex gap-4 items-center">
        <Input
          ref={inputRef}
          type="file"
          accept=".json"
          multiple
          onChange={e => handleFiles(e.target.files)}
          className="w-full max-w-xs"
        />
        <Button onClick={() => inputRef.current?.click()} type="button">
          Select JSON Files
        </Button>
        <Button onClick={handleExportCSV} variant="outline" disabled={companies.length === 0}>Export CSV</Button>
        <Button onClick={handleExportXLSX} variant="outline" disabled={companies.length === 0}>Export XLSX</Button>
        <Button onClick={handleInsert} variant="default" disabled={uploading || companies.length === 0}>
          {uploading ? 'Uploading...' : 'Insert to Supabase'}
        </Button>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span>Rows: <b>{companies.length}</b></span>
        {results.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setLogOpen(v => !v)}>
            {logOpen ? 'Hide Log' : 'Show Log'}
          </Button>
        )}
        {errorLogUrl && (
          <a href={errorLogUrl} download="upload-errors.json" className="text-blue-600 underline">
            Download error log
          </a>
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
              <tr><td colSpan={columns.length} className="text-center py-4">No companies loaded.</td></tr>
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
    </div>
  );
}; 