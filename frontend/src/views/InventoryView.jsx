import { useEffect, useState, useRef } from 'react'
import { Package, Plus, Pencil, Trash2, X, Search, Tag, Camera, Layers } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const emptyItem = {
  codigo_barras: '',
  nombre: '',
  descripcion: '',
  tipo_item: 'PRODUCTO',
  departamento: '',
  categoria_id: '',
  precio_venta: '',
  unidad_medida: 'PZA',
  proveedor_id: '',
  imagen_base64: '',
}

const INPUT_CLS = 'w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 placeholder-dark-500 transition-all'
const LABEL_CLS = 'block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wide'

export default function InventoryView() {
  const { user } = useAuth()
  const [inventario, setInventario] = useState([])
  const [categorias, setCategorias] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('TODOS')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyItem)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const fetchData = async () => {
    try {
      const [iRes, cRes, pRes] = await Promise.all([
        axios.get('/api/v1/inventario/'),
        axios.get('/api/v1/categorias/'),
        axios.get('/api/v1/proveedores/'),
      ])
      setInventario(iRes.data)
      setFiltered(iRes.data)
      setCategorias(cRes.data)
      setProveedores(pRes.data)
    } catch { /* API not ready */ }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    let result = inventario.filter(
      (i) =>
        i.nombre.toLowerCase().includes(q) ||
        i.codigo_barras.toLowerCase().includes(q) ||
        (i.departamento || '').toLowerCase().includes(q)
    )
    if (filterTipo !== 'TODOS') result = result.filter((i) => i.tipo_item === filterTipo)
    setFiltered(result)
  }, [search, inventario, filterTipo])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setForm({ ...form, imagen_base64: ev.target.result })
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      precio_venta: parseFloat(form.precio_venta) || 0,
      categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null,
      proveedor_id: form.proveedor_id ? parseInt(form.proveedor_id) : null,
      imagen_base64: form.imagen_base64 || null,
    }
    // Para Productos, el precio_compra no se define aquí (se define en Entradas)
    if (payload.tipo_item === 'PRODUCTO') payload.precio_venta = 0

    try {
      if (editing) {
        await axios.put(`/api/v1/inventario/${editing}`, payload)
      } else {
        await axios.post('/api/v1/inventario/', payload)
      }
      setShowModal(false)
      setEditing(null)
      setForm(emptyItem)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este ítem del catálogo?')) return
    await axios.delete(`/api/v1/inventario/${id}`)
    fetchData()
  }

  const openEdit = (i) => {
    setEditing(i.id)
    setForm({
      codigo_barras: i.codigo_barras,
      nombre: i.nombre,
      descripcion: i.descripcion || '',
      tipo_item: i.tipo_item || 'PRODUCTO',
      departamento: i.departamento || '',
      categoria_id: i.categoria_id || '',
      precio_venta: i.precio_venta,
      unidad_medida: i.unidad_medida || 'PZA',
      proveedor_id: i.proveedor_id || '',
      imagen_base64: i.imagen_base64 || '',
    })
    setShowModal(true)
  }

  const tipoBadge = (tipo) =>
    tipo === 'SERVICIO' ? (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
        <Layers size={9} /> SERVICIO
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">
        <Package size={9} /> PRODUCTO
      </span>
    )

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Package size={26} className="text-indigo-400" /> Catálogo de Inventario
          </h1>
          <p className="text-dark-400 mt-1 text-sm">Gestión de Productos y Servicios del catálogo</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm(emptyItem); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold text-sm hover:from-indigo-500 hover:to-indigo-600 transition-all shadow-lg shadow-indigo-500/25"
          id="btn-new-item"
        >
          <Plus size={18} /> Nuevo Ítem
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o departamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            id="catalog-search"
          />
        </div>
        <div className="flex gap-2">
          {['TODOS', 'PRODUCTO', 'SERVICIO'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTipo(t)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                filterTipo === t
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-dark-800/60 border border-dark-700/50 text-dark-300 hover:bg-dark-700/60'
              }`}
              id={`filter-${t.toLowerCase()}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" id="catalog-table">
            <thead>
              <tr className="border-b border-dark-700/50 bg-dark-800/40">
                <th className="text-left py-3.5 px-4 text-dark-400 font-semibold text-xs uppercase tracking-wide w-16">Foto</th>
                <th className="text-left py-3.5 px-4 text-dark-400 font-semibold text-xs uppercase tracking-wide">Código</th>
                <th className="text-left py-3.5 px-4 text-dark-400 font-semibold text-xs uppercase tracking-wide">Nombre / Descripción</th>
                <th className="text-left py-3.5 px-4 text-dark-400 font-semibold text-xs uppercase tracking-wide">Tipo</th>
                <th className="text-left py-3.5 px-4 text-dark-400 font-semibold text-xs uppercase tracking-wide">Departamento</th>
                <th className="text-right py-3.5 px-4 text-dark-400 font-semibold text-xs uppercase tracking-wide">P. Venta</th>
                <th className="text-center py-3.5 px-4 text-dark-400 font-semibold text-xs uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                  <td className="py-3 px-4">
                    {item.imagen_base64 ? (
                      <img
                        src={item.imagen_base64}
                        alt={item.nombre}
                        className="w-10 h-10 rounded-lg object-cover border border-dark-700/50"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-dark-700/50 flex items-center justify-center border border-dark-700/30">
                        <Package size={16} className="text-dark-500" />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-dark-300 font-mono text-xs">{item.codigo_barras}</td>
                  <td className="py-3 px-4">
                    <p className="text-white font-semibold">{item.nombre}</p>
                    {item.descripcion && <p className="text-xs text-dark-500 mt-0.5 truncate max-w-[200px]">{item.descripcion}</p>}
                  </td>
                  <td className="py-3 px-4">{tipoBadge(item.tipo_item || 'PRODUCTO')}</td>
                  <td className="py-3 px-4 text-dark-400 text-xs">{item.departamento || <span className="text-dark-600">—</span>}</td>
                  <td className="py-3 px-4 text-right">
                    {item.tipo_item === 'SERVICIO' ? (
                      <span className="text-emerald-400 font-semibold">C${parseFloat(item.precio_venta || 0).toFixed(2)}</span>
                    ) : (
                      <span className="text-dark-500 text-xs italic">Vía Entrada</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(item)} className="p-2 rounded-lg text-dark-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all" title="Editar">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Eliminar">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-dark-500">
                    <Package size={36} className="mx-auto mb-3 text-dark-700" />
                    <p>No se encontraron ítems en el catálogo</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-xl p-6 shadow-2xl animate-fade-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editing ? 'Editar Ítem' : 'Nuevo Ítem'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Tipo de Ítem */}
              <div>
                <label className={LABEL_CLS}>Tipo de Ítem <span className="text-rose-400">*</span></label>
                <div className="flex gap-3">
                  {['PRODUCTO', 'SERVICIO'].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setForm({ ...form, tipo_item: t })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                        form.tipo_item === t
                          ? t === 'PRODUCTO'
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                            : 'bg-violet-600/20 border-violet-500 text-violet-400'
                          : 'bg-dark-800/60 border-dark-700/50 text-dark-400 hover:border-dark-500'
                      }`}
                      id={`tipo-${t.toLowerCase()}`}
                    >
                      {t === 'PRODUCTO' ? '📦 Producto' : '🔧 Servicio'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-dark-500 mt-1">
                  {form.tipo_item === 'PRODUCTO'
                    ? 'Mercadería con control de stock. Precio de venta se define en Entradas.'
                    : 'Sin control de stock. El precio de venta se define aquí directamente.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Código de Producto <span className="text-rose-400">*</span></label>
                  <input type="text" required value={form.codigo_barras}
                    onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })}
                    className={INPUT_CLS} placeholder="Ej: PROD-001" id="field-codigo" />
                </div>
                <div>
                  <label className={LABEL_CLS}>Unidad de Medida</label>
                  <select value={form.unidad_medida} onChange={(e) => setForm({ ...form, unidad_medida: e.target.value })}
                    className={INPUT_CLS} id="field-unidad">
                    <option value="PZA">Pieza (PZA)</option>
                    <option value="UND">Unidad (UND)</option>
                    <option value="KG">Kilogramo (KG)</option>
                    <option value="LT">Litro (LT)</option>
                    <option value="MT">Metro (MT)</option>
                    <option value="CJ">Caja (CJ)</option>
                    <option value="PAQ">Paquete (PAQ)</option>
                    <option value="HR">Hora (HR)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={LABEL_CLS}>Nombre / Descripción corta <span className="text-rose-400">*</span></label>
                <input type="text" required value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className={INPUT_CLS} placeholder="Nombre del ítem" id="field-nombre" />
              </div>

              <div>
                <label className={LABEL_CLS}>Descripción detallada</label>
                <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2}
                  className={INPUT_CLS + ' resize-none'} placeholder="Descripción adicional (opcional)" id="field-descripcion" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Departamento / Categoría</label>
                  <input type="text" value={form.departamento}
                    onChange={(e) => setForm({ ...form, departamento: e.target.value })}
                    className={INPUT_CLS} placeholder="Ej: Electrónica" id="field-departamento" />
                </div>
                <div>
                  <label className={LABEL_CLS}>Categoría (lista)</label>
                  <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                    className={INPUT_CLS} id="field-categoria">
                    <option value="">Sin categoría</option>
                    {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>

              {/* Precio de venta solo para Servicios */}
              {form.tipo_item === 'SERVICIO' && (
                <div>
                  <label className={LABEL_CLS}>Precio de Venta <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-bold">C$</span>
                    <input type="number" step="0.01" min="0" required value={form.precio_venta}
                      onChange={(e) => setForm({ ...form, precio_venta: e.target.value })}
                      className={INPUT_CLS + ' pl-10'} placeholder="0.00" id="field-precio-venta" />
                  </div>
                  <p className="text-xs text-violet-400 mt-1">El precio de venta de Servicios se define aquí.</p>
                </div>
              )}

              {/* Imagen */}
              <div>
                <label className={LABEL_CLS}>Fotografía del Ítem</label>
                <div className="flex items-center gap-4">
                  {form.imagen_base64 ? (
                    <div className="relative">
                      <img src={form.imagen_base64} alt="preview" className="w-20 h-20 rounded-xl object-cover border border-dark-700/50" />
                      <button type="button" onClick={() => setForm({ ...form, imagen_base64: '' })}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs">
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-dark-800/60 border border-dark-700/50 border-dashed flex items-center justify-center">
                      <Camera size={20} className="text-dark-500" />
                    </div>
                  )}
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="field-imagen" />
                    <button type="button" onClick={() => fileRef.current.click()}
                      className="px-4 py-2 bg-dark-700/60 border border-dark-600/50 text-dark-300 rounded-xl text-xs font-semibold hover:bg-dark-600/60 transition-all">
                      {form.imagen_base64 ? 'Cambiar imagen' : 'Seleccionar imagen'}
                    </button>
                    <p className="text-[10px] text-dark-500 mt-1">JPG, PNG, WEBP. Máx 2MB.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-dark-700/50 text-dark-300 rounded-xl text-sm hover:bg-dark-700/30 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-sm font-bold hover:from-indigo-500 hover:to-indigo-600 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60">
                  {saving ? 'Guardando...' : (editing ? 'Guardar Cambios' : 'Crear Ítem')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
