// components/dashboard/filters/QuoteStatusFilter.tsx
// This is the component that displays the quote status filter for the dashboard.

import React from 'react';

interface QuoteStatusFilterProps {
  value: string[];
  onChange: (val: string[]) => void;
  options?: string[];
  label?: string;
  multi?: boolean;
}

export default function QuoteStatusFilter({ value, onChange, options = [], label = 'Quote Status', multi }: QuoteStatusFilterProps) {
  if (multi) {
    return (
      <fieldset style={{ marginRight: 16, border: 'none', padding: 0 }}>
        <legend>{label}:</legend>
        {options.map(opt => (
          <label key={opt} style={{ marginRight: 8 }}>
            <input
              type="checkbox"
              checked={value.includes(opt)}
              onChange={e => {
                if (e.target.checked) {
                  onChange([...value, opt]);
                } else {
                  onChange(value.filter(v => v !== opt));
                }
              }}
            />
            {opt}
          </label>
        ))}
        <label style={{ marginLeft: 8 }}>
          <input
            type="checkbox"
            checked={value.length === 0}
            onChange={e => e.target.checked && onChange([])}
          />
          All
        </label>
      </fieldset>
    );
  }
  // fallback to single select
  return (
    <label style={{ marginRight: 16 }}>
      {label}:
      <select value={value[0] || ''} onChange={e => onChange([e.target.value])} style={{ marginLeft: 8 }}>
        <option value="">All</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}
