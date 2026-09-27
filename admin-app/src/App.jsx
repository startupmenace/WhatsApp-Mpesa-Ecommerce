import React, {useEffect, useState} from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function App(){
  const [authed, setAuthed] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(()=>{
    (async ()=>{
      try{
        const res = await fetch('/admin/me', { credentials: 'include' })
        const data = await res.json()
        setAuthed(!!data.authenticated)
      }catch(e){
        setAuthed(false)
      }finally{ setChecked(true) }
    })()
  },[])

  if(!checked) return <div className="p-8">Checking authentication...</div>
  if(!authed) return <Login onSuccess={()=> setAuthed(true)} />
  return <Dashboard />
}

export default App
