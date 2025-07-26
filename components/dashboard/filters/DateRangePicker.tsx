// components/dashboard/filters/DateRangePicker.tsx
// This is the component that displays the date range picker for the dashboard.

import React from 'react';

interface DateRangePickerProps {
  value: { start: string; end: string };
  onChange: (val: { start: string; end: string }) => void;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <span style={{ marginRight: 16 }}>
      Date Range:
      <input type="date" value={value.start} onChange={e => onChange({ ...value, start: e.target.value })} style={{ marginLeft: 8, marginRight: 4 }} />
      -
      <input type="date" value={value.end} onChange={e => onChange({ ...value, end: e.target.value })} style={{ marginLeft: 4 }} />
    </span>
  );
}
