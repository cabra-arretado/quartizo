import React from 'react'
export function PageHeader({ title, subtitle }) { return <header><h1>{title}</h1><p>{subtitle}</p></header> }
export function Btn({ children, ...props }) { return <button type="button" {...props}>{children}</button> }
export function SegmentedControl({ segments, value, onChange, ariaLabel }) {
  return <div role="radiogroup" aria-label={ariaLabel}>
    {segments.map(segment => (
      <button key={segment.key} type="button" role="radio" aria-checked={value === segment.key}
        onClick={() => onChange(segment.key)}>{segment.label}</button>
    ))}
  </div>
}
