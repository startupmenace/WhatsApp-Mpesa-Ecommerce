import React from 'react'

export default function Button({ children, variant = 'default', className = '', ...props }){
  const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none'
  const variants = {
    default: 'bg-emerald-500 text-black hover:bg-emerald-600',
    outline: 'bg-transparent border border-slate-600 text-slate-100 hover:bg-slate-800',
  }
  return (
    <button className={`${base} ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </button>
  )
}
