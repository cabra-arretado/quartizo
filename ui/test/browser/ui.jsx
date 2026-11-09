import React from 'react'
export function PageHeader({ title, subtitle }) { return <header><h1>{title}</h1><p>{subtitle}</p></header> }
export function Btn({ children, ...props }) { return <button type="button" {...props}>{children}</button> }
