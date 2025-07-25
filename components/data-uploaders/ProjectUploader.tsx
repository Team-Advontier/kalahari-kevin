// components/data-uploaders/ProjectUploader.tsx
// This is the component that allows the user to upload the projects from the Excel file.

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

interface ProjectRow {
  project_id?: string | null;
  project_name: string | null;
  company_name: string | null;
  project_owner_name: string | null;
  category_name: string | null;
  description: string | null;
  start_date: string | null;
  due_date: string | null;
  end_date?: string | null;
  external_code: string | null;
  latest_update?: string | null;
  project_health?: string | null;
  portfolio_boards?: string | null;
  portfolio_column?: string | null;
  date_created?: string | null;
  last_active?: string | null;
  tags?: string[];
  budget_used?: string | null;
  budget_left?: string | null;
  budget_capacity?: string | null;
  status?: string | null;
  completed_date?: string | null;
  completed_by_firstname?: string | null;
  completed_by_lastname?: string | null;
  completed_on_time?: boolean;
  cl_renewal_date?: string | null;
  ct_filing_date?: string | null;
  jurisdiction?: string | null;
  payroll_incl_sla?: boolean;
  tax_incl_sla?: boolean;
  tw_updated_date?: string | null;
  vat_periods?: string | null;
  source_data: any;
  synced_at: string;
  _uploadStatus?: 'pending' | 'success' | 'error';
  _uploadMessage?: string;
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

export const ProjectUploader: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<ProjectRow[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [errorLogUrl, setErrorLogUrl] = useState<string | null>(null);

  // Table columns
  const columns = React.useMemo<ColumnDef<ProjectRow, any>[]>(
    () => [
      { accessorKey: 'project_id', header: 'Project ID' },
      { accessorKey: 'project_name', header: 'Project' },
      { accessorKey: 'company_name', header: 'Company' },
      { accessorKey: 'project_owner_name', header: 'Project Owner' },
      { accessorKey: 'category_name', header: 'Category' },
      { accessorKey: 'description', header: 'Description' },
      { accessorKey: 'start_date', header: 'Start Date' },
      { accessorKey: 'due_date', header: 'Due Date' },
      { accessorKey: 'end_date', header: 'End Date' },
      { accessorKey: 'external_code', header: 'XERO Code' },
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'budget_used', header: 'Budget Used' },
      { accessorKey: 'completed_on_time', header: 'Completed On Time', cell: ({ getValue }) => (getValue() ? 'Yes' : 'No') },
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
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // File upload handler for .xlsx
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    let allProjects: ProjectRow[] = [];
    for (const file of Array.from(files)) {
      if (file.name.endsWith('.xlsx')) {
        try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });
          allProjects = allProjects.concat(
            rows.map((row: any) => ({
              project_id: row['Project ID'] ?? null,
              project_name: row['Project'] ?? null,
              company_name: row['Company'] ?? null,
              project_owner_name: row['Project owner'] ?? null,
              category_name: row['Project category'] ?? null,
              description: row['Description'] ?? null,
              start_date: excelSerialDateToISOString(row['Start date']),
              due_date: excelSerialDateToISOString(row['Due date']),
              end_date: excelSerialDateToISOString(row['End date']),
              external_code: row['XERO Code'] ?? null,
              latest_update: excelSerialDateToISOString(row['Latest update']),
              project_health: row['Project health'] ?? null,
              portfolio_boards: row['Portfolio boards'] ?? null,
              portfolio_column: row['Portfolio column'] ?? null,
              date_created: excelSerialDateToISOString(row['Date created']),
              last_active: excelSerialDateToISOString(row['Last active']),
              tags: row['Tags'] ? row['Tags'].split(',').map((t: string) => t.trim()) : [],
              budget_used: row['Budget used'] ?? null,
              budget_left: row['Budget left'] ?? null,
              budget_capacity: row['Budget capacity'] ?? null,
              status: row['Status'] ?? null,
              completed_date: excelSerialDateToISOString(row['Completed date']),
              completed_by_firstname: row['Completed by firstname'] ?? null,
              completed_by_lastname: row['Completed by lastname'] ?? null,
              completed_on_time: row['Completed on time']?.toString().toLowerCase() === 'yes',
              cl_renewal_date: excelSerialDateToISOString(row['CL Renewal Date']),
              ct_filing_date: excelSerialDateToISOString(row['CT Filing Date']),
              jurisdiction: row['Jurisdiction'] ?? null,
              payroll_incl_sla: row['Payroll incl SLA?']?.toString().toLowerCase() === 'yes',
              tax_incl_sla: row['TAX incl SLA?']?.toString().toLowerCase() === 'yes',
              tw_updated_date: excelSerialDateToISOString(row['TW Updated Date']),
              vat_periods: row['VAT Periods'] ?? null,
              // legacy fields for backward compatibility
              source_data: row,
              synced_at: new Date().toISOString(),
              _uploadStatus: 'pending',
            }))
          );
        } catch (e) {
          // Optionally handle parse error
        }
      }
    }
    setProjects(allProjects);
    setResults([]);
    setErrorLogUrl(null);
  };

  // Export handlers
  const handleExportCSV = () => {
    const csv = Papa.unparse(projects);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'flattened_projects.csv');
  };
  const handleExportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(projects);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'flattened_projects.xlsx');
  };

  // Insert handler
  const handleInsert = async () => {
    setUploading(true);
    setResults([]);
    setErrorLogUrl(null);
    const batchSize = 100;
    let rowResults: ProjectRow[] = [];
    for (let i = 0; i < projects.length; i += batchSize) {
      const batch = projects.slice(i, i + batchSize);
      // Step 1: Strip upload metadata
      let rows = batch.map(({ _uploadStatus, _uploadMessage, ...rest }) => rest);
      // Step 2: Filter out rows without project_id
      const skipped = batch.filter(row => row.project_id === null);
      if (skipped.length > 0) {
        console.log('Skipped rows without project_id:', skipped.length);
      }
      rows = rows.filter(row => row.project_id !== null);
      // Step 3: Deduplicate rows using project_id
      rows = Array.from(
        new Map(rows.map(row => [row.project_id, row])).values()
      );
      const { error } = await supabase
        .from('source_projects_projects')
        .upsert(rows, {
          onConflict: 'project_id',
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
    setProjects(rowResults);
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
      <h2 className="text-xl font-bold mb-2">Upload Projects (Excel)</h2>
      <div className="flex gap-4 items-center">
        <Input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          multiple
          onChange={e => handleFiles(e.target.files)}
          className="w-full max-w-xs"
        />
        <Button onClick={() => inputRef.current?.click()} type="button">
          Select Excel Files
        </Button>
        <Button onClick={handleExportCSV} variant="outline" disabled={projects.length === 0}>Export CSV</Button>
        <Button onClick={handleExportXLSX} variant="outline" disabled={projects.length === 0}>Export XLSX</Button>
        <Button onClick={handleInsert} variant="default" disabled={uploading || projects.length === 0}>
          {uploading ? 'Uploading...' : 'Insert to Supabase'}
        </Button>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span>Rows: <b>{projects.length}</b></span>
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
              <tr><td colSpan={columns.length} className="text-center py-4">No projects loaded.</td></tr>
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