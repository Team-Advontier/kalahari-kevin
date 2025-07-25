// components/data-uploaders/TaskUploader.tsx
// This is the component that allows the user to upload the tasks from the Excel file.

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

interface TaskRow {
  taskid: string | null;
  task_name: string | null;
  task_description: string | null;
  company_name: string | null;
  project_name: string | null;
  project_description: string | null;
  task_list_name: string | null;
  task_list_description: string | null;
  milestone: string | null;
  start_date: string | null;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string | null;
  progress: number | null;
  priority_level: string | null;
  is_private: boolean;
  time_estimate: string | null;
  billable_minutes: number;
  nonbillable_minutes: number;
  tags: string[];
  parent_task_id: string | null;
  priority_text: string | null;
  completed_date: string | null;
  completed_by: string | null;
  board_column: string | null;
  price: number | null;
  sku_ref: string | null;
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

export const TaskUploader: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<TaskRow[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [errorLogUrl, setErrorLogUrl] = useState<string | null>(null);

  // Table columns
  const columns = React.useMemo<ColumnDef<TaskRow, any>[]>(
    () => [
      { accessorKey: 'taskid', header: 'Task ID' },
      { accessorKey: 'task_name', header: 'Task Name' },
      { accessorKey: 'company_name', header: 'Company' },
      { accessorKey: 'project_name', header: 'Project' },
      { accessorKey: 'milestone', header: 'Milestone' },
      { accessorKey: 'start_date', header: 'Start Date' },
      { accessorKey: 'due_date', header: 'Due Date' },
      { accessorKey: 'assigned_to', header: 'Assigned To' },
      { accessorKey: 'progress', header: 'Progress' },
      { accessorKey: 'priority_level', header: 'Priority' },
      { accessorKey: 'is_private', header: 'Private', cell: ({ getValue }) => (getValue() ? 'Yes' : 'No') },
      { accessorKey: 'tags', header: 'Tags', cell: ({ getValue }) => (getValue() ? (getValue() as string[]).join(', ') : '') },
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
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // File upload handler for .xlsx
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    let allTasks: TaskRow[] = [];
    for (const file of Array.from(files)) {
      if (file.name.endsWith('.xlsx')) {
        try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });
          allTasks = allTasks.concat(
            rows.map((row: any) => ({
              taskid: row['ID'] ?? null,
              task_name: row['Task name'] ?? null,
              task_description: row['Task description'] ?? null,
              company_name: row['Company name'] ?? null,
              project_name: row['Project'] ?? null,
              project_description: row['Description'] ?? null,
              task_list_name: row['Task list'] ?? null,
              task_list_description: row['Task list description'] ?? null,
              milestone: row['Milestone'] ?? null,
              start_date: excelSerialDateToISOString(row['Start date']),
              due_date: excelSerialDateToISOString(row['Due date']),
              assigned_to: row['Assigned to'] ?? null,
              created_by: row['Created by'] ?? null,
              created_at: excelSerialDateToISOString(row['Created at']),
              progress: row['Progress'] !== null && row['Progress'] !== undefined ? parseInt(row['Progress']) || null : null,
              priority_level: row['Priority'] ?? null,
              is_private: row['Private']?.toString().toLowerCase() === 'yes',
              time_estimate: row['Time estimate'] ?? null,
              billable_minutes: row['Billable minutes'] !== null && row['Billable minutes'] !== undefined ? parseInt(row['Billable minutes']) || 0 : 0,
              nonbillable_minutes: row['Non-billable minutes'] !== null && row['Non-billable minutes'] !== undefined ? parseInt(row['Non-billable minutes']) || 0 : 0,
              tags: row['Tags'] ? row['Tags'].split(',').map((t: string) => t.trim()) : [],
              parent_task_id: row['Parent task ID'] ?? null,
              priority_text: row['Priority text'] ?? null,
              completed_date: excelSerialDateToISOString(row['Completed date']),
              completed_by: row['Completed by'] ?? null,
              board_column: row['Board column'] ?? null,
              price: row['PRICE'] !== null && row['PRICE'] !== undefined ? parseFloat(row['PRICE']) || null : null,
              sku_ref: row['SKU-Reference-Code'] ?? null,
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
    setTasks(allTasks);
    setResults([]);
    setErrorLogUrl(null);
  };

  // Export handlers
  const handleExportCSV = () => {
    const csv = Papa.unparse(tasks);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'flattened_tasks.csv');
  };
  const handleExportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(tasks);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
    const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'flattened_tasks.xlsx');
  };

  // Insert handler
  const handleInsert = async () => {
    setUploading(true);
    setResults([]);
    setErrorLogUrl(null);
    const batchSize = 100;
    let rowResults: TaskRow[] = [];
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const rows = batch.map(({ _uploadStatus, _uploadMessage, ...rest }) => rest);
      const { error } = await supabase
        .from('source_projects_tasks')
        .upsert(rows, {
          onConflict: 'taskid',
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
    setTasks(rowResults);
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
      <h2 className="text-xl font-bold mb-2">Upload Tasks (Excel)</h2>
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
        <Button onClick={handleExportCSV} variant="outline" disabled={tasks.length === 0}>Export CSV</Button>
        <Button onClick={handleExportXLSX} variant="outline" disabled={tasks.length === 0}>Export XLSX</Button>
        <Button onClick={handleInsert} variant="default" disabled={uploading || tasks.length === 0}>
          {uploading ? 'Uploading...' : 'Insert to Supabase'}
        </Button>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span>Rows: <b>{tasks.length}</b></span>
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
              <tr><td colSpan={columns.length} className="text-center py-4">No tasks loaded.</td></tr>
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