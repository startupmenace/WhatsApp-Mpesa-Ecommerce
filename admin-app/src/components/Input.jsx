import React from 'react'

export default function Input(props){
  return (
    <input {...props} className={`w-full p-2 rounded bg-slate-900 border border-slate-700 text-slate-100 ${props.className || ''}`} />
  )
}
