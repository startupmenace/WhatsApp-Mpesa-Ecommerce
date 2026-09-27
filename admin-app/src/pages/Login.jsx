import React, {useState} from 'react'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Login({onSuccess}){
  const [user,setUser] = useState('')
  const [pass,setPass] = useState('')
  const [err,setErr] = useState('')
  const [loading,setLoading] = useState(false)

  async function submit(e){
    e && e.preventDefault()
    setErr('')
    setLoading(true)
    try{
      const res = await fetch('/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      })
      if (!res.ok) throw new Error('Invalid credentials')
      onSuccess && onSuccess()
    }catch(e){
      setErr(e.message)
    }finally{ setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Admin Sign In</h2>
        {err && <div className="mb-3 text-red-300">{err}</div>}
        <form onSubmit={submit} className="space-y-3">
          <Input placeholder="Username" value={user} onChange={e=>setUser(e.target.value)} />
          <Input type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} />
          <div className="flex gap-2">
            <Button className="flex-1" disabled={loading}>{loading? 'Signing...' : 'Sign in'}</Button>
            <Button variant="outline" type="button" onClick={()=>{ setUser('admin'); setPass('password') }}>Use demo creds</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
