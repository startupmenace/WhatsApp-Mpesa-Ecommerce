import React, {useEffect, useState} from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'

export default function Dashboard(){
  const [products,setProducts] = useState([])
  const [orders,setOrders] = useState([])
  const [transactions,setTransactions] = useState([])
  const [loading,setLoading] = useState(false)
  const [formMsg,setFormMsg] = useState('')

  useEffect(()=>{ load(); },[])

  async function load(){
    setLoading(true)
    try{
      const [pRes,oRes,tRes] = await Promise.all([
        fetch('/api/products', { credentials: 'include' }),
        fetch('/api/orders', { credentials: 'include' }),
        fetch('/api/transactions', { credentials: 'include' }),
      ])
      setProducts(await pRes.json())
      setOrders(await oRes.json())
      setTransactions(await tRes.json())
    }catch(e){
      console.error(e)
    }finally{ setLoading(false) }
  }

  async function remove(id){
    await fetch(`/api/products/${id}`, { method: 'DELETE', credentials: 'include' })
    load()
  }

  async function submitProduct(e){
    e.preventDefault()
    setFormMsg('')
    const form = e.target
    const fd = new FormData(form)
    const id = fd.get('id')
    const url = id ? `/api/products/${id}` : '/api/products'
    const method = id ? 'PUT' : 'POST'
    const res = await fetch(url, { method, body: fd, credentials: 'include' })
    if(!res.ok){ setFormMsg('Failed'); return }
    setFormMsg('Saved')
    form.reset()
    load()
  }

  return (
    <div className="min-h-screen p-6 bg-slate-900 text-slate-100">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={()=>{ fetch('/admin/logout', { method: 'POST', credentials: 'include' }).then(()=> location.reload()) }} className="">Logout</Button>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-4 mb-6">
        <Card>Products <div className="text-2xl font-bold">{products.length}</div></Card>
        <Card>Orders <div className="text-2xl font-bold">{orders.length}</div></Card>
        <Card>Transactions <div className="text-2xl font-bold">{transactions.length}</div></Card>
      </section>

      <section className="grid grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold mb-2">Add / Edit Product</h2>
          <form onSubmit={submitProduct} className="space-y-2">
            <Input name="id" placeholder="(optional) id to edit" />
            <Input name="name" placeholder="Name" required />
            <textarea name="description" placeholder="Description" className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-slate-100" />
            <Input name="price" type="number" placeholder="Price" required />
            <input name="image" type="file" accept="image/*" />
            <div className="flex gap-2">
              <Button className="px-4 py-2">Save</Button>
              <Button variant="outline" type="button" onClick={(e)=>{ e.target.closest('form').reset(); setFormMsg('') }}>Reset</Button>
            </div>
            {formMsg && <div className="text-sm mt-2">{formMsg}</div>}
          </form>
        </Card>

        <Card>
          <h2 className="font-semibold mb-2">Recent Orders</h2>
          <div className="space-y-2">
            {orders.slice(0,6).map(o => (
              <div key={o.id} className="p-2 bg-slate-900 rounded">{o.productName || '-'} — {o.customerPhone || '-'} — {o.status || 'pending'}</div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <h2 className="font-semibold mb-2">Products</h2>
          <div className="space-y-2">
            {products.map(p => (
              <div key={p.id} className="p-2 bg-slate-900 rounded flex items-center justify-between">
                <div>{p.id} — {p.name} — KES {p.price}</div>
                <div className="flex gap-2">
                  <Button onClick={()=>{ const f = document.querySelector('form'); f.id.value = p.id; f.name.value = p.name; f.description.value = p.description; f.price.value = p.price; window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="px-2 py-1">Edit</Button>
                  <Button variant="outline" onClick={()=> remove(p.id)} className="px-2 py-1">Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}
