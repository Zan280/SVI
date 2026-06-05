import { useEffect, useState } from 'react'
import { UserCircle, Plus, Pencil, Trash2, X, Search } from 'lucide-react'
import axios from 'axios'

const emptyClient = { nombre: '', rfc_nit: '', email: '', telefono: '', direccion: '' }

export default function ClientsView() {
  const [clientes, setClientes] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyClient)

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/v1/clientes/')
      setClientes(res.data)
      setFiltered(res.data)
    } catch { /* API not ready */ }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(clientes.filter((c) =>
      c.nombre.toLowerCase().includes(q) ||
      (c.rfc_nit && c.rfc_nit.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    ))
  }, [search, clientes])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await axios.put(`/api/v1/clientes/${editing}`, form)
      } else {
        await axios.post('/api/v1/clientes/', form)
      }
      setShowModal(false)
      setEditing(null)
      setForm(emptyClient)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al guardar')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return
    await axios.delete(`/api/v1/clientes/${id}`)
    fetchData()
  }

  const openEdit = (c) => {
    setEditing(c.id)
    setForm({ nombre: c.nombre, rfc_nit: c.rfc_nit || '', email: c.email || '', telefono: c.telefono || '', direccion: c.direccion || '' })
    setShowModal(true)
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <UserCircle size={28} /> Gestión de Clientes
          </h1>
          <p className="text-dark-400 mt-1">Catálogo de clientes del sistema</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm(emptyClient); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-medium text-sm hover:from-emerald-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/25"
          id="btn-new-client"
        >
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, RFC/NIT o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          id="client-search"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" id="clients-table">
            <thead>
              <tr className="border-b border-dark-700/50 bg-dark-800/40">
                <th className="text-left py-3.5 px-5 text-dark-400 font-medium">ID</th>
                <th className="text-left py-3.5 px-5 text-dark-400 font-medium">Nombre</th>
                <th className="text-left py-3.5 px-5 text-dark-400 font-medium">RFC/NIT</th>
                <th className="text-left py-3.5 px-5 text-dark-400 font-medium">Email</th>
                <th className="text-left py-3.5 px-5 text-dark-400 font-medium">Teléfono</th>
                <th className="text-center py-3.5 px-5 text-dark-400 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                  <td className="py-3 px-5 text-dark-300 font-mono">{c.id}</td>
                  <td className="py-3 px-5 text-white font-medium">{c.nombre}</td>
                  <td className="py-3 px-5 text-dark-300 font-mono">{c.rfc_nit || '-'}</td>
                  <td className="py-3 px-5 text-dark-300">{c.email || '-'}</td>
                  <td className="py-3 px-5 text-dark-300">{c.telefono || '-'}</td>
                  <td className="py-3 px-5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-dark-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-dark-500">No se encontraron clientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { key: 'nombre', label: 'Nombre', type: 'text', required: true },
                { key: 'rfc_nit', label: 'RFC / NIT', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'telefono', label: 'Teléfono', type: 'tel' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm text-dark-300 mb-1.5">{field.label}</label>
                  <input type={field.type} required={field.required} value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
              ))}
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">Dirección</label>
                <textarea value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} rows={2}
                  className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-dark-700/50 text-dark-300 rounded-xl text-sm hover:bg-dark-700/30 transition-all">Cancelar</button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-sm font-medium hover:from-emerald-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/25">
                  {editing ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
