import { useState } from 'react'
import { TrendingUp, Search, FileDown, FileSpreadsheet, Calendar, Filter, Package, Layers, BarChart3 } from 'lucide-react'
import axios from 'axios'

const INPUT_CLS = 'w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder-dark-500 transition-all'
const LABEL_CLS = 'block text-xs font-semibold text-dark-300 mb-1.5 uppercase tracking-wide'

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

export default function VentasReportView() {
  const [filtros, setFiltros] = useState({
    codigo: '',
    fecha_inicio: '',
    fecha_fin: '',
  })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const buildParams = () => {
    const params = new URLSearchParams()
    if (filtros.codigo) params.append('codigo', filtros.codigo)
    if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio)
    if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin)
    return params.toString()
  }

  const fetchReporte = async () => {
    setLoading(true)
    setError('')
    try {
      const params = buildParams()
      const url = `/api/v1/reportes/ventas${params ? '?' + params : ''}`
      const res = await axios.get(url)
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al obtener el reporte.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (formato) => {
    const params = buildParams()
    const url = `/api/v1/reportes/ventas/${formato}${params ? '?' + params : ''}`
    try {
      const res = await axios.get(url, { responseType: 'blob' })
      const ext = formato === 'pdf' ? 'pdf' : 'xlsx'
      const mime = formato === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      const filename = `reporte_ventas_${new Date().toISOString().slice(0, 10)}.${ext}`
      const blob = new Blob([res.data], { type: mime })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      alert('Error al descargar el reporte.')
    }
  }

  // Stats calculadas desde los datos
  const totalProductos = data?.filas.filter((r) => r.tipo_item === 'PRODUCTO').reduce((acc, r) => acc + r.subtotal, 0) || 0
  const totalServicios = data?.filas.filter((r) => r.tipo_item === 'SERVICIO').reduce((acc, r) => acc + r.subtotal, 0) || 0
  const totalFacturas = new Set(data?.filas.map((r) => r.numero_factura) || []).size

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <TrendingUp size={26} className="text-emerald-400" /> Reporte de Ventas
          </h1>
          <p className="text-dark-400 mt-1 text-sm">Historial de ventas de Productos y Servicios con filtros y exportación</p>
        </div>
        {data && data.filas.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleDownload('excel')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-bold hover:bg-emerald-600/30 transition-all"
              id="btn-export-excel"
            >
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button
              onClick={() => handleDownload('pdf')}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-sm font-bold hover:bg-rose-500/30 transition-all"
              id="btn-export-pdf"
            >
              <FileDown size={16} /> PDF
            </button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-emerald-400" />
          <h2 className="text-sm font-bold text-white">Filtros de Búsqueda</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={LABEL_CLS}>
              <Search size={11} className="inline mr-1" />
              Código de Producto
            </label>
            <input
              type="text"
              value={filtros.codigo}
              onChange={(e) => setFiltros({ ...filtros, codigo: e.target.value })}
              className={INPUT_CLS}
              placeholder="Ej: PROD-001"
              id="filter-codigo"
            />
          </div>
          <div>
            <label className={LABEL_CLS}>
              <Calendar size={11} className="inline mr-1" />
              Fecha Inicio
            </label>
            <input
              type="date"
              value={filtros.fecha_inicio}
              onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
              className={INPUT_CLS}
              id="filter-fecha-inicio"
            />
          </div>
          <div>
            <label className={LABEL_CLS}>
              <Calendar size={11} className="inline mr-1" />
              Fecha Fin
            </label>
            <input
              type="date"
              value={filtros.fecha_fin}
              onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
              className={INPUT_CLS}
              id="filter-fecha-fin"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={fetchReporte}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-sm font-bold hover:from-emerald-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60"
            id="btn-buscar"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search size={16} />
            )}
            {loading ? 'Consultando...' : 'Consultar Reporte'}
          </button>
          {(filtros.codigo || filtros.fecha_inicio || filtros.fecha_fin) && (
            <button
              onClick={() => { setFiltros({ codigo: '', fecha_inicio: '', fecha_fin: '' }); setData(null) }}
              className="px-4 py-2.5 border border-dark-700/50 text-dark-300 rounded-xl text-sm hover:bg-dark-700/30 transition-all"
              id="btn-limpiar"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm">{error}</div>
      )}

      {/* Stats summary */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Facturas', value: totalFacturas, color: 'text-white' },
            { label: 'Total Líneas', value: data.filas.length, color: 'text-white' },
            { label: 'Ventas Productos', value: `C$${totalProductos.toFixed(2)}`, color: 'text-indigo-400 font-bold' },
            { label: 'Ventas Servicios', value: `C$${totalServicios.toFixed(2)}`, color: 'text-violet-400 font-bold' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4 border border-dark-700/50">
              <p className="text-[10px] font-bold uppercase tracking-wide text-dark-500 mb-1">{stat.label}</p>
              <p className={`text-lg ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Total general */}
      {data && data.total_general > 0 && (
        <div className="glass rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-400" />
            <span className="text-sm font-semibold text-white">Total General de Ventas</span>
          </div>
          <span className="text-2xl font-bold text-emerald-400">C${data.total_general.toFixed(2)}</span>
        </div>
      )}

      {/* Tabla */}
      {data && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs" id="ventas-table">
              <thead>
                <tr className="border-b border-dark-700/50 bg-dark-800/30">
                  <th className="text-left py-3.5 px-4 text-dark-400 font-semibold uppercase tracking-wide">Fecha</th>
                  <th className="text-left py-3.5 px-4 text-dark-400 font-semibold uppercase tracking-wide">N° Factura</th>
                  <th className="text-left py-3.5 px-4 text-dark-400 font-semibold uppercase tracking-wide">Cliente</th>
                  <th className="text-left py-3.5 px-4 text-dark-400 font-semibold uppercase tracking-wide">Código</th>
                  <th className="text-left py-3.5 px-4 text-dark-400 font-semibold uppercase tracking-wide">Producto / Servicio</th>
                  <th className="text-center py-3.5 px-2 text-dark-400 font-semibold uppercase tracking-wide">Tipo</th>
                  <th className="text-right py-3.5 px-3 text-dark-400 font-semibold uppercase tracking-wide">Cant.</th>
                  <th className="text-right py-3.5 px-4 text-dark-400 font-semibold uppercase tracking-wide">P. Venta</th>
                  <th className="text-right py-3.5 px-4 text-dark-400 font-semibold uppercase tracking-wide">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {data.filas.map((row, idx) => (
                  <tr key={idx} className="border-b border-dark-800/50 hover:bg-dark-800/20 transition-colors">
                    <td className="py-3 px-4 text-dark-400 whitespace-nowrap">
                      {new Date(row.fecha).toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">{row.numero_factura}</td>
                    <td className="py-3 px-4 text-dark-300">{row.cliente}</td>
                    <td className="py-3 px-4 font-mono text-dark-400">{row.codigo_barras}</td>
                    <td className="py-3 px-4 text-white font-medium">{row.nombre_producto}</td>
                    <td className="py-3 px-2 text-center">{tipoBadge(row.tipo_item)}</td>
                    <td className="py-3 px-3 text-right text-dark-300">{row.cantidad.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-dark-300">C${row.precio_venta.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-white">C${row.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
                {data.filas.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-dark-500">
                      <TrendingUp size={32} className="mx-auto mb-2 text-dark-700" />
                      No hay ventas registradas para los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
              {data.filas.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-dark-700/60 bg-dark-800/40">
                    <td colSpan={8} className="py-3.5 px-4 text-right font-bold text-dark-300 text-sm">TOTAL GENERAL:</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400 text-sm">C${data.total_general.toFixed(2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="glass rounded-2xl p-16 text-center text-dark-400 border border-dashed border-dark-700">
          <TrendingUp size={40} className="mx-auto mb-3 text-dark-700" />
          <p className="text-sm font-semibold">Aplica filtros y haz clic en "Consultar Reporte"</p>
          <p className="text-xs mt-1 text-dark-600">Puedes filtrar por código, fecha específica o rango de fechas</p>
        </div>
      )}
    </div>
  )
}
