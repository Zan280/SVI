import { useEffect, useState } from 'react'
import { ShoppingCart, Plus, Search, FileText, AlertCircle, CheckCircle2, History } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const INPUT_CLS = 'w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-dark-500 transition-all'
const LABEL_CLS = 'block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wide'

const emptyForm = {
  producto_id: '',
  referencia_factura: '',
  cantidad: '',
  costo_unitario: '',
  precio_venta_nuevo: '',
}

const DEFAULT_SUCURSAL_ID = 1

export default function EntradasView() {
  const { user } = useAuth()
  const [productos, setProductos] = useState([])    // Solo tipo PRODUCTO
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    try {
      const [iRes, mRes] = await Promise.all([
        axios.get('/api/v1/inventario/'),
        axios.get('/api/v1/movimientos/?sucursal_id=' + DEFAULT_SUCURSAL_ID),
      ])
      // Filtrar solo Productos (no Servicios)
      setProductos(iRes.data.filter((p) => p.tipo_item === 'PRODUCTO' || !p.tipo_item))
      // Filtrar solo INGRESO_COMPRA para el historial
      setMovimientos(mRes.data.filter((m) => m.tipo === 'INGRESO_COMPRA'))
    } catch { /* silently fail if API not ready */ }
  }

  useEffect(() => { fetchData() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const productoSeleccionado = productos.find((p) => p.id === parseInt(form.producto_id))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.producto_id) return
    setSaving(true)

    const cantidad = parseFloat(form.cantidad)
    const costoUnitario = parseFloat(form.costo_unitario)
    const precioVentaNuevo = parseFloat(form.precio_venta_nuevo)

    if (!cantidad || cantidad <= 0) {
      showToast('La cantidad debe ser mayor a cero.', 'error')
      setSaving(false)
      return
    }
    if (!costoUnitario || costoUnitario <= 0) {
      showToast('El costo unitario debe ser mayor a cero.', 'error')
      setSaving(false)
      return
    }

    try {
      // 1. Registrar el movimiento de entrada (kardex)
      await axios.post('/api/v1/movimientos/', {
        sucursal_id: DEFAULT_SUCURSAL_ID,
        producto_id: parseInt(form.producto_id),
        tipo: 'INGRESO_COMPRA',
        cantidad: cantidad,
        costo_unitario: costoUnitario,
        referencia: form.referencia_factura || null,
      })

      // 2. Actualizar precio de venta en el catálogo (si se proporcionó)
      if (precioVentaNuevo > 0) {
        await axios.put(`/api/v1/inventario/${form.producto_id}`, {
          precio_venta: precioVentaNuevo,
          precio_compra: costoUnitario,
        })
      }

      showToast(`✅ Entrada registrada correctamente para "${productoSeleccionado?.nombre}"`)
      setForm(emptyForm)
      fetchData()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error al registrar la entrada.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const movimientosFiltrados = movimientos.filter((m) => {
    const q = search.toLowerCase()
    return (
      m.producto?.nombre?.toLowerCase().includes(q) ||
      m.producto?.codigo_barras?.toLowerCase().includes(q) ||
      (m.referencia || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShoppingCart size={26} className="text-indigo-400" /> Entradas de Inventario
          </h1>
          <p className="text-dark-400 mt-1 text-sm">Registra el ingreso de mercadería (solo Productos). Actualiza stock y Costo Promedio Ponderado.</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in ${
          toast.type === 'error'
            ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
            : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Formulario de Entrada */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Plus size={18} className="text-indigo-400" />
              <h2 className="text-base font-bold text-white">Registrar Entrada</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selector de Producto */}
              <div>
                <label className={LABEL_CLS}>Producto <span className="text-rose-400">*</span></label>
                <select
                  value={form.producto_id}
                  onChange={(e) => setForm({ ...form, producto_id: e.target.value })}
                  required
                  className={INPUT_CLS}
                  id="field-producto"
                >
                  <option value="">— Seleccionar producto —</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.codigo_barras})
                    </option>
                  ))}
                </select>
                {productoSeleccionado && (
                  <div className="mt-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1">
                    <p className="text-indigo-300 font-semibold">{productoSeleccionado.nombre}</p>
                    <p className="text-dark-400">Código: <span className="font-mono text-white">{productoSeleccionado.codigo_barras}</span></p>
                    {productoSeleccionado.departamento && <p className="text-dark-400">Depto: {productoSeleccionado.departamento}</p>}
                  </div>
                )}
              </div>

              {/* Referencia / N° Factura de Compra */}
              <div>
                <label className={LABEL_CLS}>
                  <FileText size={12} className="inline mr-1" />
                  Ref. / N° Factura de Compra
                </label>
                <input
                  type="text"
                  value={form.referencia_factura}
                  onChange={(e) => setForm({ ...form, referencia_factura: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="Ej: FAC-2024-0032 (para auditoría)"
                  id="field-referencia"
                />
                <p className="text-[10px] text-dark-500 mt-1">Este número quedará registrado en el Kardex para trazabilidad.</p>
              </div>

              {/* Cantidad */}
              <div>
                <label className={LABEL_CLS}>Cantidad de Ingreso <span className="text-rose-400">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.cantidad}
                  onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="0"
                  id="field-cantidad"
                />
              </div>

              {/* Costo unitario */}
              <div>
                <label className={LABEL_CLS}>Costo Unitario de Compra <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-bold text-sm">C$</span>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    value={form.costo_unitario}
                    onChange={(e) => setForm({ ...form, costo_unitario: e.target.value })}
                    className={INPUT_CLS + ' pl-10'}
                    placeholder="0.0000"
                    id="field-costo"
                  />
                </div>
                <p className="text-[10px] text-dark-500 mt-1">Se usará para calcular el Costo Promedio Ponderado (CPP).</p>
              </div>

              {/* Precio de venta (actualiza catálogo) */}
              <div>
                <label className={LABEL_CLS}>
                  Nuevo Precio de Venta al Público
                  <span className="ml-1 text-dark-500 font-normal normal-case">(opcional – actualiza catálogo)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-bold text-sm">C$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.precio_venta_nuevo}
                    onChange={(e) => setForm({ ...form, precio_venta_nuevo: e.target.value })}
                    className={INPUT_CLS + ' pl-10'}
                    placeholder="0.00"
                    id="field-precio-venta-nuevo"
                  />
                </div>
              </div>

              {/* Preview del total */}
              {form.cantidad && form.costo_unitario && (
                <div className="p-3 rounded-xl bg-dark-800/60 border border-dark-700/30 space-y-1 text-sm">
                  <div className="flex justify-between text-dark-400">
                    <span>Cantidad:</span>
                    <span className="text-white font-semibold">{parseFloat(form.cantidad || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-dark-400">
                    <span>Costo unitario:</span>
                    <span className="text-white font-semibold">C${parseFloat(form.costo_unitario || 0).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between border-t border-dark-700/50 pt-1 mt-1">
                    <span className="font-bold text-dark-300">Total ingreso:</span>
                    <span className="font-bold text-indigo-400">
                      C${(parseFloat(form.cantidad || 0) * parseFloat(form.costo_unitario || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !form.producto_id}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold text-sm hover:from-indigo-500 hover:to-indigo-600 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                id="btn-registrar-entrada"
              >
                {saving ? 'Registrando...' : '✓ Registrar Entrada'}
              </button>
            </form>
          </div>
        </div>

        {/* Historial de entradas */}
        <div className="lg:col-span-3">
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-dark-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={16} className="text-dark-400" />
                <h3 className="text-sm font-bold text-white">Historial de Entradas</h3>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-dark-800/60 border border-dark-700/50 rounded-lg text-xs text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 w-40"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" id="entradas-table">
                <thead>
                  <tr className="border-b border-dark-700/50 bg-dark-800/30">
                    <th className="text-left py-3 px-4 text-dark-400 font-semibold uppercase tracking-wide">Fecha</th>
                    <th className="text-left py-3 px-4 text-dark-400 font-semibold uppercase tracking-wide">Producto</th>
                    <th className="text-left py-3 px-4 text-dark-400 font-semibold uppercase tracking-wide">Ref. Factura</th>
                    <th className="text-right py-3 px-4 text-dark-400 font-semibold uppercase tracking-wide">Cantidad</th>
                    <th className="text-right py-3 px-4 text-dark-400 font-semibold uppercase tracking-wide">Costo Unit.</th>
                    <th className="text-right py-3 px-4 text-dark-400 font-semibold uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosFiltrados.slice(0, 50).map((m) => (
                    <tr key={m.id} className="border-b border-dark-800/50 hover:bg-dark-800/20 transition-colors">
                      <td className="py-3 px-4 text-dark-400">
                        {new Date(m.creado_en || m.fecha).toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-white font-medium">{m.producto?.nombre || '—'}</p>
                        <p className="text-dark-500 font-mono">{m.producto?.codigo_barras}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-400">{m.referencia || <span className="text-dark-600">—</span>}</td>
                      <td className="py-3 px-4 text-right text-white font-semibold">{parseFloat(m.cantidad).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-dark-300">C${parseFloat(m.costo_unitario || 0).toFixed(4)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">C${parseFloat(m.costo_total || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {movimientosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-dark-500">
                        <ShoppingCart size={28} className="mx-auto mb-2 text-dark-700" />
                        No hay entradas registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
