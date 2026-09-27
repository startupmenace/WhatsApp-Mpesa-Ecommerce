import React from 'react'

export default function Card({ children, className = '' }){
  return (
    <div className={`p-4 bg-slate-800 rounded-lg border border-slate-700 ${className}`}>
      {children}
    </div>
  )
}
