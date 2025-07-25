// components/TicketTable.tsx
// This is the component that displays the tickets in a table.

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { FlattenedTicket } from './flattenTickets';

interface TicketTableProps {
  tickets: FlattenedTicket[];
  onTicketsChange: (tickets: FlattenedTicket[]) => void;
}

export const TicketTable: React.FC<TicketTableProps> = ({ tickets, onTicketsChange }) => {
  const [data, setData] = React.useState<FlattenedTicket[]>(tickets);

  React.useEffect(() => {
    setData(tickets);
  }, [tickets]);

  // Inline edit handler
  const handleEdit = (rowIdx: number, key: keyof FlattenedTicket, value: string) => {
    const updated = data.map((row, idx) =>
      idx === rowIdx ? { ...row, [key]: value } : row
    );
    setData(updated);
    onTicketsChange(updated);
  };

  const columns = React.useMemo<ColumnDef<FlattenedTicket, any>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'subject', header: 'Subject' },
      {
        accessorKey: 'ticketStatus',
        header: 'Status',
        cell: ({ row, getValue }) => (
          <Input
            value={getValue() || ''}
            onChange={e => handleEdit(row.index + table.getState().pagination.pageIndex * 250, 'ticketStatus', e.target.value)}
            className="min-w-[100px]"
          />
        ),
      },
      {
        accessorKey: 'ticketType',
        header: 'Type',
        cell: ({ row, getValue }) => (
          <Input
            value={getValue() || ''}
            onChange={e => handleEdit(row.index + table.getState().pagination.pageIndex * 250, 'ticketType', e.target.value)}
            className="min-w-[100px]"
          />
        ),
      },
      { accessorKey: 'createdAt', header: 'Created' },
      { accessorKey: 'updatedAt', header: 'Updated' },
      { accessorKey: 'customerID', header: 'Customer' },
      {
        accessorKey: 'firstMessage',
        header: 'First Message',
        cell: ({ getValue }) => (
          <span className="block max-w-xs truncate" title={getValue() || ''}>{getValue()}</span>
        ),
      },
      {
        accessorKey: 'attachments',
        header: 'Attachments',
        cell: ({ getValue }) => (
          <span className="block max-w-xs truncate" title={getValue() || ''}>{getValue()}</span>
        ),
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
        cell: ({ row, getValue }) => (
          <Input
            value={getValue() || ''}
            onChange={e => handleEdit(row.index + table.getState().pagination.pageIndex * 250, 'tags', e.target.value)}
            className="min-w-[100px]"
          />
        ),
      },
      { accessorKey: 'threadCount', header: 'Threads' },
      {
        accessorKey: 'hasAttachments',
        header: 'Has Attachments',
        cell: ({ getValue }) => (getValue() ? 'Yes' : 'No'),
      },
      {
        accessorKey: 'assignedToID',
        header: 'Assigned To',
        cell: ({ row, getValue }) => (
          <Input
            value={getValue() || ''}
            onChange={e => handleEdit(row.index + table.getState().pagination.pageIndex * 250, 'assignedToID', e.target.value)}
            className="min-w-[100px]"
          />
        ),
      },
    ],
    [data]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 250 } },
  });

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">No tickets</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {/* Pagination Controls */}
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-gray-600">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} &mdash; Showing {table.getRowModel().rows.length} of {data.length} tickets
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}; 