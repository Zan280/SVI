import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { formatCurrency, formatNumber, formatDate } from '../lib/formatters';
import { BookOpen, RefreshCw, AlertCircle, Package } from 'lucide-react';
import ExportButtons from '../components/ExportButtons';

const DEFAULT_SUCURSAL_ID = 1;

const tipoBadge = (tipo) => {
  const isIngreso = tipo?.includes('INGRESO');
  const isSalida = tipo?.includes('SALIDA');
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
      isIngreso
        ? 'bg-teal-500/15 text-teal-400'
        : isSalida
        ? 'bg-rose-500/15 text-rose-400'
        : 'bg-amber-500/15 text-amber-400'
    }`}>
      {tipo}
    </span>
  );
};

export default function KardexView() {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [products, setProducts] = useState([]);
  const [kardexEntries, setKardexEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar solo Productos (no Servicios) para el kardex
  useEffect(() => {
    api.inventory.list()
      .then((data) => {
        const soloProductos = data.filter((p) => !p.tipo_item || p.tipo_item === 'PRODUCTO');
        setProducts(soloProductos);
      })
      .catch((err) => console.error(err));
  }, []);

  const fetchKardex = () => {
    if (!selectedProductId) return;
    setLoading(true);
    setError('');
    api.kardex.list(selectedProductId, DEFAULT_SUCURSAL_ID)
      .then((data) => setKardexEntries(data))
      .catch((err) => {
        console.error(err);
        setError('Error al obtener los registros del Kardex.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchKardex(); }, [selectedProductId]);

  const selectedProduct = products.find((p) => p.id === parseInt(selectedProductId));

  const lastEntry = kardexEntries.length > 0 ? kardexEntries[kardexEntries.length - 1] : null;

  const excelHeaders = {
    creado_en: 'Fecha/Hora',
    tipo_movimiento: 'Operación',
    referencia: 'Ref. Factura',
    cantidad_entrada: 'Entrada Cant',
    costo_entrada: 'Entrada Costo',
    cantidad_salida: 'Salida Cant',
    costo_salida: 'Salida Costo',
    cantidad_saldo: 'Saldo Cant',
    costo_unitario_saldo: 'Saldo CPP',
    costo_total_saldo: 'Saldo Total',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <BookOpen size={26} className="text-emerald-400" /> Kardex
          </h1>
          <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
            Control de flujos de stock valorados — Costo Promedio Ponderado (CPP)
          </p>
        </div>
        {selectedProductId && kardexEntries.length > 0 && (
          <ExportButtons
            excelData={kardexEntries}
            excelHeaders={excelHeaders}
            excelFilename={`Kardex_${selectedProduct?.codigo_barras || 'SKU'}`}
            pdfDownloadUrl={api.kardex.downloadPdfUrl(selectedProductId, DEFAULT_SUCURSAL_ID)}
            pdfFilename={`Kardex_${selectedProduct?.codigo_barras || 'SKU'}.pdf`}
          />
        )}
      </div>

      {/* Filtro de producto */}
      <div className="glass rounded-2xl p-5 border border-slate-200 dark:border-dark-800 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5 min-w-[280px] flex-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-dark-400">
            Seleccionar Producto (tipo PRODUCTO)
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 py-2 px-3 text-sm font-medium text-slate-800 dark:text-white outline-none focus:border-emerald-500 transition-all cursor-pointer"
            id="kardex-producto-select"
          >
            <option value="">— Seleccionar un Producto —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} · {p.codigo_barras}
              </option>
            ))}
          </select>
        </div>
        {selectedProductId && (
          <button
            onClick={fetchKardex}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-600 dark:text-dark-300 transition-colors"
            title="Recargar"
            id="btn-reload-kardex"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Resumen del producto */}
      {selectedProduct && lastEntry && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Producto', value: selectedProduct.nombre, color: 'text-white' },
            { label: 'Stock Actual', value: formatNumber(lastEntry.cantidad_saldo) + ' ' + (selectedProduct.unidad_medida || ''), color: 'text-white font-bold' },
            { label: 'CPP Actual', value: `C$ ${formatNumber(lastEntry.costo_unitario_saldo, 4)}`, color: 'text-indigo-400 font-bold' },
            { label: 'Valoración Total', value: formatCurrency(lastEntry.costo_total_saldo), color: 'text-emerald-400 font-bold' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4 border border-slate-200 dark:border-dark-800">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-dark-500 mb-1">{stat.label}</p>
              <p className={`text-sm truncate ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabla Kardex */}
      {!selectedProductId ? (
        <div className="glass rounded-2xl p-16 text-center text-slate-500 dark:text-dark-400 border border-dashed border-slate-300 dark:border-dark-800">
          <BookOpen className="w-10 h-10 mx-auto text-slate-350 dark:text-dark-600 mb-3" />
          <p className="text-sm font-semibold">Selecciona un producto para ver su Kardex CPP.</p>
          <p className="text-xs mt-1">Solo Productos con control de stock.</p>
        </div>
      ) : loading && kardexEntries.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-600 dark:border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass rounded-2xl border border-slate-200/80 dark:border-dark-700/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm" id="kardex-table">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-900/30">
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Fecha</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Operación</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Ref. Factura</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-teal-600 dark:text-teal-400 text-right uppercase tracking-wider bg-teal-500/5">E. Cant</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-teal-600 dark:text-teal-400 text-right uppercase tracking-wider bg-teal-500/5">E. Costo</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-rose-600 dark:text-rose-400 text-right uppercase tracking-wider bg-rose-500/5">S. Cant</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-rose-600 dark:text-rose-400 text-right uppercase tracking-wider bg-rose-500/5">S. Costo</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 text-right uppercase tracking-wider bg-indigo-500/5">Saldo Cant</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 text-right uppercase tracking-wider bg-indigo-500/5">CPP</th>
                  <th className="py-3.5 px-5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 text-right uppercase tracking-wider bg-indigo-500/5">Saldo Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-800">
                {kardexEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/40 dark:hover:bg-dark-900/10 transition-colors">
                    <td className="py-3 px-4 text-xs text-slate-500 dark:text-dark-400 whitespace-nowrap">
                      {formatDate(entry.creado_en)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{tipoBadge(entry.tipo_movimiento)}</td>
                    <td className="py-3 px-4 text-xs font-mono text-indigo-400 dark:text-indigo-400 whitespace-nowrap">
                      {entry.movimiento?.referencia || <span className="text-slate-400 dark:text-dark-600">—</span>}
                    </td>
                    {/* Entradas */}
                    <td className="py-3 px-4 text-right font-medium text-teal-600 dark:text-teal-400 bg-teal-500/5 whitespace-nowrap">
                      {entry.cantidad_entrada > 0 ? formatNumber(entry.cantidad_entrada) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-teal-600 dark:text-teal-400 bg-teal-500/5 whitespace-nowrap">
                      {entry.cantidad_entrada > 0 ? formatCurrency(entry.costo_entrada) : '—'}
                    </td>
                    {/* Salidas */}
                    <td className="py-3 px-4 text-right font-medium text-rose-600 dark:text-rose-400 bg-rose-500/5 whitespace-nowrap">
                      {entry.cantidad_salida > 0 ? formatNumber(entry.cantidad_salida) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400 bg-rose-500/5 whitespace-nowrap">
                      {entry.cantidad_salida > 0 ? formatCurrency(entry.costo_salida) : '—'}
                    </td>
                    {/* Saldos */}
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white bg-indigo-500/5 whitespace-nowrap">
                      {formatNumber(entry.cantidad_saldo)}
                    </td>
                    <td className="py-3 px-4 text-right text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 font-medium whitespace-nowrap">
                      C${formatNumber(entry.costo_unitario_saldo, 4)}
                    </td>
                    <td className="py-3 px-5 text-right font-bold text-slate-900 dark:text-white bg-indigo-500/5 whitespace-nowrap">
                      {formatCurrency(entry.costo_total_saldo)}
                    </td>
                  </tr>
                ))}
                {!loading && kardexEntries.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-16 text-slate-500 dark:text-dark-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-dark-700" />
                      No se registran movimientos en el Kardex para este producto.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
