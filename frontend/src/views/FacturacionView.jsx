import { useEffect, useState } from 'react'
import {
  FileText, Plus, Trash2, ShoppingBag, AlertCircle,
  CheckCircle2, Search, Package, Layers, Receipt
} from 'lucide-react'
import axios from 'axios'

const INPUT_CLS = 'w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder-dark-500 transition-all'
const LABEL_CLS = 'block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wide'

export default function FacturacionView() {
  const [productos, setProductos] = useState([])    // Todos (Productos + Servicios)
  const [lineas, setLineas] = useState([])          // Líneas de la factura actual
  const [clienteNombre, setClienteNombre] = useState('')
  const [notas, setNotas] = useState('')
  const [searchItem, setSearchItem] = useState('')
  const [cantidadItem, setCantidadItem] = useState('1')
  const [productoSelId, setProductoSelId] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [ultimaFactura, setUltimaFactura] = useState(null)
  const [stockInfo, setStockInfo] = useState({}) // { [producto_id]: stock_actual }

  const DEFAULT_SUCURSAL_ID = 1

  const fetchProductos = async () => {
    try {
      const [iRes, mRes] = await Promise.all([
        axios.get('/api/v1/inventario/'),
        axios.get('/api/v1/movimientos/?sucursal_id=' + DEFAULT_SUCURSAL_ID),
      ])
      setProductos(iRes.data)
      // Calcular stock actual por producto a partir de movimientos
      const stockMap = {}
      iRes.data.forEach((p) => { stockMap[p.id] = { stock: 0, costo_medio: 0 } })
      // El stock real viene del backend en inventario_sucursal, pero usamos el endpoint de movimientos
      // Para esto consultaremos el kardex o usaremos el campo existente en branch_stock
      setStockInfo(stockMap)
    } catch { /* silently fail */ }
  }

  useEffect(() => { fetchProductos() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 6000)
  }

  const productosFiltrados = productos.filter((p) => {
    const q = searchItem.toLowerCase()
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.codigo_barras.toLowerCase().includes(q) ||
      (p.departamento || '').toLowerCase().includes(q)
    )
  })

  const agregarLinea = () => {
    if (!productoSelId) { showToast('Selecciona un ítem primero.', 'error'); return }
    const cantidad = parseFloat(cantidadItem)
    if (!cantidad || cantidad <= 0) { showToast('La cantidad debe ser mayor a cero.', 'error'); return }

    const prod = productos.find((p) => p.id === parseInt(productoSelId))
    if (!prod) return

    // Verificar si ya está en las líneas
    const existe = lineas.findIndex((l) => l.producto_id === prod.id)
    if (existe >= 0) {
      // Actualizar cantidad
      const nuevas = [...lineas]
      nuevas[existe].cantidad += cantidad
      nuevas[existe].subtotal = nuevas[existe].cantidad * nuevas[existe].precio_venta
      setLineas(nuevas)
    } else {
      setLineas([
        ...lineas,
        {
          producto_id: prod.id,
          nombre: prod.nombre,
          codigo_barras: prod.codigo_barras,
          tipo_item: prod.tipo_item || 'PRODUCTO',
          cantidad,
          precio_venta: parseFloat(prod.precio_venta) || 0,
          subtotal: cantidad * (parseFloat(prod.precio_venta) || 0),
        },
      ])
    }
    setCantidadItem('1')
    setProductoSelId('')
    setSearchItem('')
  }

  const eliminarLinea = (idx) => setLineas(lineas.filter((_, i) => i !== idx))

  const totalFactura = lineas.reduce((acc, l) => acc + l.subtotal, 0)

  const procesarFactura = async () => {
    if (lineas.length === 0) { showToast('Agrega al menos un ítem a la factura.', 'error'); return }

    // Validar precios de venta
    const sinPrecio = lineas.filter((l) => l.precio_venta <= 0)
    if (sinPrecio.length > 0) {
      showToast(`"${sinPrecio[0].nombre}" no tiene precio de venta definido. Asígnalo en el catálogo o en Entradas.`, 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        cliente_nombre: clienteNombre || 'Cliente General',
        notas: notas || null,
        lineas: lineas.map((l) => ({
          producto_id: l.producto_id,
          cantidad: l.cantidad,
        })),
      }
      const res = await axios.post('/api/v1/facturacion/', payload)
      setUltimaFactura(res.data)
      showToast(`✅ Factura ${res.data.numero_factura} generada exitosamente por C$${parseFloat(res.data.total_venta).toFixed(2)}`)
      setLineas([])
      setClienteNombre('')
      setNotas('')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error al procesar la factura.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const tipoBadge = (tipo) =>
    tipo === 'SERVICIO' ? (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
        <Layers size={8} /> SERV
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">
        <Package size={8} /> PROD
      </span>
    )

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText size={26} className="text-violet-400" /> Nueva Factura
          </h1>
          <p className="text-dark-400 mt-1 text-sm">
            Registra ventas de Productos (descuenta stock al CPP) y Servicios (solo registro de venta)
          </p>
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
          <span className="flex-1">{toast.msg}</span>
        </div>
      )}

      {/* Comprobante de última factura */}
      {ultimaFactura && (
        <div className="glass rounded-2xl p-5 border border-emerald-500/30 bg-emerald-500/5 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <Receipt size={20} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-emerald-300">Última Factura Procesada</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-dark-500 text-xs uppercase tracking-wide mb-0.5">N° Factura</p>
              <p className="text-white font-bold font-mono">{ultimaFactura.numero_factura}</p>
            </div>
            <div>
              <p className="text-dark-500 text-xs uppercase tracking-wide mb-0.5">Cliente</p>
              <p className="text-white font-semibold">{ultimaFactura.cliente_nombre}</p>
            </div>
            <div>
              <p className="text-dark-500 text-xs uppercase tracking-wide mb-0.5">Ítems</p>
              <p className="text-white font-semibold">{ultimaFactura.lineas?.length || 0}</p>
            </div>
            <div>
              <p className="text-dark-500 text-xs uppercase tracking-wide mb-0.5">Total</p>
              <p className="text-emerald-400 font-bold text-lg">C${parseFloat(ultimaFactura.total_venta).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Panel izquierdo: selector de ítems */}
        <div className="lg:col-span-2 space-y-4">
          {/* Datos del cliente */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white">Datos del Cliente</h2>
            <div>
              <label className={LABEL_CLS}>Nombre del Cliente</label>
              <input
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className={INPUT_CLS}
                placeholder="Cliente General"
                id="field-cliente"
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Notas</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className={INPUT_CLS + ' resize-none'}
                rows={2}
                placeholder="Observaciones opcionales..."
                id="field-notas"
              />
            </div>
          </div>

          {/* Selector de ítem */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} className="text-violet-400" />
              <h2 className="text-sm font-bold text-white">Agregar Ítem</h2>
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-dark-800/60 border border-dark-700/50 rounded-xl text-xs text-dark-200 placeholder-dark-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                id="search-item"
              />
            </div>

            {/* Lista de productos */}
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {productosFiltrados.slice(0, 30).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProductoSelId(String(p.id))}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all ${
                    productoSelId === String(p.id)
                      ? 'bg-violet-600/20 border border-violet-500/40'
                      : 'hover:bg-dark-700/40 border border-transparent'
                  }`}
                  id={`item-${p.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{p.nombre}</p>
                      <p className="text-dark-500 font-mono">{p.codigo_barras}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {tipoBadge(p.tipo_item || 'PRODUCTO')}
                      {parseFloat(p.precio_venta) > 0 ? (
                        <p className="text-emerald-400 font-bold mt-0.5">C${parseFloat(p.precio_venta).toFixed(2)}</p>
                      ) : (
                        <p className="text-rose-400 text-[10px] mt-0.5">Sin precio</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {productosFiltrados.length === 0 && (
                <p className="text-center text-dark-500 py-4 text-xs">No se encontraron ítems</p>
              )}
            </div>

            {/* Cantidad y botón agregar */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className={LABEL_CLS}>Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={cantidadItem}
                  onChange={(e) => setCantidadItem(e.target.value)}
                  className={INPUT_CLS}
                  id="field-cantidad-item"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={agregarLinea}
                  disabled={!productoSelId}
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  id="btn-agregar-linea"
                >
                  <Plus size={16} /> Agregar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho: líneas de factura + total */}
        <div className="lg:col-span-3">
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-dark-700/50">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt size={16} className="text-violet-400" />
                Detalle de la Factura
                {lineas.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold">
                    {lineas.length} {lineas.length === 1 ? 'ítem' : 'ítems'}
                  </span>
                )}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs" id="factura-lineas-table">
                <thead>
                  <tr className="border-b border-dark-700/50 bg-dark-800/30">
                    <th className="text-left py-3 px-4 text-dark-400 font-semibold uppercase tracking-wide">Ítem</th>
                    <th className="text-center py-3 px-2 text-dark-400 font-semibold uppercase tracking-wide">Tipo</th>
                    <th className="text-right py-3 px-3 text-dark-400 font-semibold uppercase tracking-wide">Cant.</th>
                    <th className="text-right py-3 px-3 text-dark-400 font-semibold uppercase tracking-wide">P. Venta</th>
                    <th className="text-right py-3 px-4 text-dark-400 font-semibold uppercase tracking-wide">Subtotal</th>
                    <th className="py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((linea, idx) => (
                    <tr key={idx} className="border-b border-dark-800/50 hover:bg-dark-800/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="text-white font-semibold">{linea.nombre}</p>
                        <p className="text-dark-500 font-mono text-[10px]">{linea.codigo_barras}</p>
                      </td>
                      <td className="py-3 px-2 text-center">{tipoBadge(linea.tipo_item)}</td>
                      <td className="py-3 px-3 text-right text-dark-300 font-semibold">{linea.cantidad.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right text-dark-300">
                        {linea.precio_venta > 0 ? (
                          `C$${linea.precio_venta.toFixed(2)}`
                        ) : (
                          <span className="text-rose-400 text-[10px]">Sin precio</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">C${linea.subtotal.toFixed(2)}</td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => eliminarLinea(idx)}
                          className="p-1.5 rounded-lg text-dark-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          id={`btn-del-linea-${idx}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {lineas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-dark-500">
                        <ShoppingBag size={32} className="mx-auto mb-2 text-dark-700" />
                        <p>Agrega ítems desde el panel izquierdo</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total y botón procesar */}
            {lineas.length > 0 && (
              <div className="p-5 border-t border-dark-700/50 bg-dark-800/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-dark-400 text-sm">Subtotal ({lineas.length} ítems):</span>
                  <span className="text-white font-bold text-lg">C${totalFactura.toFixed(2)}</span>
                </div>
                <div className="p-3 rounded-xl bg-dark-800/60 border border-dark-700/30 mb-4 text-xs text-dark-400 flex items-start gap-2">
                  <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Nota:</strong> Los Productos se registrarán en el Kardex al{' '}
                    <strong className="text-indigo-400">Costo Promedio Ponderado (CPP)</strong>, no al precio de venta.
                    Los Servicios se registran como venta sin afectar el kardex.
                  </span>
                </div>
                <button
                  onClick={procesarFactura}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50"
                  id="btn-procesar-factura"
                >
                  {saving ? 'Procesando...' : `✓ Procesar Factura · C$${totalFactura.toFixed(2)}`}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
