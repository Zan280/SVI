import { useEffect, useState } from 'react'
import { Truck, Plus, Pencil, Trash2, X, Search } from 'lucide-react'
import axios from 'axios'

const emptySupplier = { nombre: '', rfc_nit: '', contacto_nombre: '', email: '', telefono: '', direccion: '' }

export default function SuppliersView() {
  const [proveedores, setProveedores] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptySupplier)

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/v1/proveedores/')
      setProveedores(res.data)
      setFiltered(res.data)
    } catch { /* API not ready */ }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(proveedores.filter((p) =>
      p.nombre.toLowerCase().includes(q) ||
      (p.rfc_nit && p.rfc_nit.toLowerCase().includes(q)) ||
      (p.contacto_nombre && p.contacto_nombre.toLowerCase().includes(q))
    ))
  }, [search, proveedores])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await axios.put(`/api/v1/proveedores/${editing}`, form)
      } else {
        await axios.post('/api/v1/proveedores/', form)
      }
      setShowModal(false)
      setEditing(null)
      setForm(emptySupplier)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al guardar')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este proveedor?')) return
    await axios.delete(`/api/v1/proveedores/${id}`)
    fetchData()
  }

  const openEdit = (p) => {
    setEditing(p.id)
    setForm({ nombre: p.nombre, rfc_nit: p.rfc_nit || '', contacto_nombre: p.contacto_nombre || '', email: p.email || '', telefono: p.telefono || '', direccion: p.direccion || '' })
    setShowModal(true)
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Truck size={28} /> Gestión de Proveedores
          </h1>
          <p className="text-dark-400 mt-1">Catálogo de proveedores del sistema</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm(emptySupplier); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-medium text-sm hover:from-amber-500 hover:to-amber-600 transition-all shadow-lg shadow-amber-500/25"
          id="btn-new-supplier"
        >
          <Plus size={18} /> Nuevo Proveedor
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
        <input type="text" placeholder="Buscar por nombre, RFC/NIT o contacto..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          id="supplier-search" />
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" id="suppliers-table">
            <thead>
              <tr className="border-b border-dark-700/50 bg-dark-800/40">
                <th className="text-left py-3.5 px-5 text-dark-400 font-medium">ID</th>
                <th className="text-left py-3.5 px-5 text-dark-400 font-medium">Nombre</th>
                <th className="text-left py-3.5 px-5 text-dark-400 font-medium">RFC/NIT</th>
                <th className="text-left py-3.5 px-5 text-dark-400 font-medium">Contacto</th>
                <th className="text-left py-3.5 px-5 text-dark-400 font-medium">Email</th>
                <th className="text-left py-3.5 px-5 text-dark-400 font-medium">Teléfono</th>
                <th className="text-center py-3.5 px-5 text-dark-400 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                  <td className="py-3 px-5 text-dark-300 font-mono">{p.id}</td>
                  <td className="py-3 px-5 text-white font-medium">{p.nombre}</td>
                  <td className="py-3 px-5 text-dark-300 font-mono">{p.rfc_nit || '-'}</td>
                  <td className="py-3 px-5 text-dark-300">{p.contacto_nombre || '-'}</td>
                  <td className="py-3 px-5 text-dark-300">{p.email || '-'}</td>
                  <td className="py-3 px-5 text-dark-300">{p.telefono || '-'}</td>
                  <td className="py-3 px-5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-dark-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-dark-500">No se encontraron proveedores</td></tr>
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
              <h2 className="text-lg font-semibold text-white">{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { key: 'nombre', label: 'Nombre Empresa', type: 'text', required: true },
                { key: 'rfc_nit', label: 'RFC / NIT', type: 'text' },
                { key: 'contacto_nombre', label: 'Nombre de Contacto', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'telefono', label: 'Teléfono', type: 'tel' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm text-dark-300 mb-1.5">{field.label}</label>
                  <input type={field.type} required={field.required} value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                </div>
              ))}
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">Dirección</label>
                <textarea value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} rows={2}
                  className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-dark-700/50 text-dark-300 rounded-xl text-sm hover:bg-dark-700/30 transition-all">Cancelar</button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl text-sm font-medium hover:from-amber-500 hover:to-amber-600 transition-all shadow-lg shadow-amber-500/25">
                  {editing ? 'Guardar Cambios' : 'Crear Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
