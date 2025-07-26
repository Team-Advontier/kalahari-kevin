// components/dashboard/filters/ContactFilter.tsx
// This is the component that displays the contact filter for the dashboard.

import React from 'react';

interface ContactFilterProps {
  value: string[];
  onChange: (val: string[]) => void;
  options?: string[];
  multi?: boolean;
}

export default function ContactFilter({ value, onChange, options = [], multi }: ContactFilterProps) {
  if (multi) {
    return (
      <fieldset style={{ marginRight: 16, border: 'none', padding: 0 }}>
        <legend>Contact:</legend>
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
      Contact:
      <select value={value[0] || ''} onChange={e => onChange([e.target.value])} style={{ marginLeft: 8 }}>
        <option value="">All</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}
