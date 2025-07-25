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

interface StatusRow {
  statusid: string;
  code: string | null;
  name: string | null;
  displayorder: number | null;
  iscustom: boolean | null;
  color: string | null;
  icon: string | null;
  createdat: string | null;
  updatedat: string | null;
  createdbyid: string | null;
  createdbytype: string | null;
  updatedbyid: string | null;
  updatedbytype: string | null;
  state: string | null;
  source_data: any;
  synced_at: string;
  _uploadStatus?: 'pending' | 'success' | 'error';
  _uploadMessage?: string;
}

export const StatusUploader: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [statuses, setStatuses] = useState<StatusRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<StatusRow[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [errorLogUrl, setErrorLogUrl] = useState<string | null>(null);

  // Table columns
  const columns = React.useMemo<ColumnDef<StatusRow, any>[]>(
    () => [
      { accessorKey: 'statusid', header: 'Status ID' },
      { accessorKey: 'code', header: 'Code' },
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'displayorder', header: 'Display Order' },
      { accessorKey: 'iscustom', header: 'Is Custom' },
      { accessorKey: 'color', header: 'Color' },
      { accessorKey: 'icon', header: 'Icon' },
      { accessorKey: 'createdat', header: 'Created At' },
      { accessorKey: 'updatedat', header: 'Updated At' },
      { accessorKey: 'createdbyid', header: 'Created By ID' },
      { accessorKey: 'createdbytype', header: 'Created By Type' },
      { accessorKey: 'updatedbyid', header: 'Updated By ID' },
      { accessorKey: 'updatedbytype', header: 'Updated By Type' },
      { accessorKey: 'state', header: 'State' },
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
    data: statuses,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // File upload handler
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    let allStatuses: StatusRow[] = [];
    for (const file of Array.from(files)) {
      if (file.name.endsWith('.json')) {
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            allStatuses = allStatuses.concat(
              data.map((status: any) => ({
                statusid: status.id,
                code: status.code ?? null,
                name: status.name ?? null,
                displayorder: status.displayOrder ?? null,
                iscustom: status.isCustom ?? null,
                color: status.color ?? null,
                icon: status.icon ?? null,
                createdat: status.createdAt ?? null,
                updatedat: status.updatedAt ?? null,
                createdbyid: status.createdBy?.id ?? null,
                createdbytype: status.createdBy?.type ?? null,
                updatedbyid: status.updatedBy?.id ?? null,
                updatedbytype: status.updatedBy?.type ?? null,
                state: status.state ?? null,
                source_data: status,
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
    setStatuses(allStatuses);
    setResults([]);
    setErrorLogUrl(null);
  };

  // Export handlers
  const handleExportCSV = () => {
    const csv = Papa.unparse(statuses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'flattened_statuses.csv');
  };
  const handleExportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(statuses);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Statuses');
    const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'flattened_statuses.xlsx');
  };

  // Insert handler
  const handleInsert = async () => {
    setUploading(true);
    setResults([]);
    setErrorLogUrl(null);
    const batchSize = 100;
    let rowResults: StatusRow[] = [];
    for (let i = 0; i < statuses.length; i += batchSize) {
      const batch = statuses.slice(i, i + batchSize);
      const rows = batch.map(({ _uploadStatus, _uploadMessage, ...rest }) => rest);
      const { error } = await supabase
        .from('source_desk_statuses')
        .upsert(rows, {
          onConflict: 'statusid',
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
    setStatuses(rowResults);
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
      <h2 className="text-xl font-bold mb-2">Upload Statuses (Teamwork Desk)</h2>
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
        <Button onClick={handleExportCSV} variant="outline" disabled={statuses.length === 0}>Export CSV</Button>
        <Button onClick={handleExportXLSX} variant="outline" disabled={statuses.length === 0}>Export XLSX</Button>
        <Button onClick={handleInsert} variant="default" disabled={uploading || statuses.length === 0}>
          {uploading ? 'Uploading...' : 'Insert to Supabase'}
        </Button>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span>Rows: <b>{statuses.length}</b></span>
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
              <tr><td colSpan={columns.length} className="text-center py-4">No statuses loaded.</td></tr>
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