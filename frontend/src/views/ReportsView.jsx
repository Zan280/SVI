import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { BarChart3, AlertTriangle, CheckCircle, RefreshCw, FileText, Search, Tag, Settings } from 'lucide-react';
import BranchSelector from '../components/BranchSelector';
import ExportButtons from '../components/ExportButtons';

export const ReportsView = () => {
  // Pestañas del módulo de reportes
  const [activeTab, setActiveTab] = useState('valuation'); // 'valuation' o 'balance'

  // Catálogos
  const [categories, setCategories] = useState([]);
  
  // 1. Estados Reporte de Valoración de Stock
  const [valuationData, setValuationData] = useState([]);
  const [valBranchId, setValBranchId] = useState('');
  const [valCatId, setValCatId] = useState('');
  const [valQuery, setValQuery] = useState('');
  const [loadingVal, setLoadingVal] = useState(false);

  // 2. Estados Reporte Balance de Comprobación
  const [balanceData, setBalanceData] = useState([]);
  const [loadingBal, setLoadingBal] = useState(false);

  // Cargar categorías iniciales
  useEffect(() => {
    api.categories.list()
      .then(data => setCategories(data))
      .catch(err => console.error(err));
  }, []);

  // Fetch Valoración de Stock
  const fetchValuation = () => {
    setLoadingVal(true);
    api.reports.getValuation(valBranchId, valCatId, valQuery)
      .then(data => setValuationData(data))
      .catch(err => console.error(err))
      .finally(() => setLoadingVal(false));
  };

  // Fetch Balance Contable
  const fetchBalance = () => {
    setLoadingBal(true);
    api.reports.getBalances()
      .then(data => setBalanceData(data))
      .catch(err => console.error(err))
      .finally(() => setLoadingBal(false));
  };

  useEffect(() => {
    if (activeTab === 'valuation') {
      fetchValuation();
    } else {
      fetchBalance();
    }
  }, [activeTab, valBranchId, valCatId]); // Recargar al cambiar de tab o filtros principales

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchValuation();
    }
  };

  // Configuración de exportación Excel de Valoración de Stock
  const valuationExcelHeaders = {
    codigo_barras: 'SKU/Código',
    nombre: 'Producto',
    categoria: 'Categoría',
    unidad_medida: 'U.M.',
    stock: 'Stock Físico',
    costo_medio: 'Costo Medio (CPP)',
    valoracion: 'Valoración Total (NIO)',
    stock_minimo: 'Stock Mínimo',
    alerta_stock: 'Alerta Stock Faltante'
  };

  // Configuración de exportación Excel de Balance Contable
  const balanceExcelHeaders = {
    codigo: 'Código Cuenta',
    nombre: 'Cuenta Contable',
    tipo: 'Tipo de Cuenta',
    naturaleza: 'Naturaleza',
    debe: 'Debe (C$)',
    haber: 'Haber (C$)',
    saldo: 'Saldo Resultante (C$)'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white font-sans">Reportes Avanzados</h1>
          <p className="text-xs text-slate-500 dark:text-dark-400 mt-1 font-sans">
            Métricas de valorización de almacenes, informes contables consolidados y balances de comprobación
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-dark-800">
        <button
          onClick={() => setActiveTab('valuation')}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'valuation'
              ? 'border-indigo-600 text-indigo-650 dark:border-indigo-500 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-dark-400 hover:text-slate-700 dark:hover:text-dark-200'
          }`}
        >
          Valoración de Stock Comercial
        </button>
        <button
          onClick={() => setActiveTab('balance')}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'balance'
              ? 'border-indigo-600 text-indigo-650 dark:border-indigo-500 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-dark-400 hover:text-slate-700 dark:hover:text-dark-200'
          }`}
        >
          Balance de Comprobación Contable
        </button>
      </div>

      {/* TAB 1: VALORACIÓN DE STOCK */}
      {activeTab === 'valuation' && (
        <div className="space-y-4">
          {/* Barra de Filtros y Exportación */}
          <div className="glass rounded-2xl p-5 border border-slate-200 dark:border-dark-850 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-dark-400">Filtrar Sucursal</label>
                <BranchSelector selectedBranchId={valBranchId} onChange={setValBranchId} />
              </div>

              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-dark-400">Línea/Categoría</label>
                <select
                  value={valCatId}
                  onChange={(e) => setValCatId(e.target.value)}
                  className="rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 py-1.5 px-3 text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">[ Todas las Categorías ]</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 min-w-[200px]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-dark-400">Buscar SKU / Nombre</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 dark:text-dark-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={valQuery}
                    onChange={(e) => setValQuery(e.target.value)}
                    onKeyDown={handleSearchKeyPress}
                    placeholder="Enter para buscar..."
                    className="rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 py-1.5 pl-9 pr-3 text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={fetchValuation}
                className="mt-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-600 dark:text-dark-300 transition-colors"
                title="Recargar"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingVal ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {valuationData.length > 0 && (
              <div className="self-end sm:self-auto">
                <ExportButtons 
                  excelData={valuationData}
                  excelHeaders={valuationExcelHeaders}
                  excelFilename="Valoracion_Stock"
                  // weasyprint no maneja la valorización general en un solo PDF dinámico ya que no es un producto individual,
                  // pero el usuario puede descargar el Excel para filtros y el reporte oficial de balances.
                />
              </div>
            )}
          </div>

          {/* Tabla de Resultados */}
          {loadingVal && valuationData.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="glass rounded-2xl border border-slate-200/80 dark:border-dark-700/60 shadow-sm overflow-hidden transition-all duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-900/30">
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Código/SKU</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Nombre Producto</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Categoría</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 text-right uppercase tracking-wider">Stock Físico</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 text-right uppercase tracking-wider">Costo Medio (CPP)</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 text-right uppercase tracking-wider">Valoración Total</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 text-right uppercase tracking-wider">Stock Mínimo</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 text-center uppercase tracking-wider">Estado Alerta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-dark-800 text-sm">
                    {valuationData.map((row) => (
                      <tr key={row.producto_id} className="hover:bg-slate-100/40 dark:hover:bg-dark-900/10 transition-colors">
                        <td className="py-3.5 px-6 font-bold text-slate-500 dark:text-dark-400">{row.codigo_barras}</td>
                        <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">{row.nombre}</td>
                        <td className="py-3.5 px-6 text-slate-650 dark:text-dark-300">{row.categoria}</td>
                        <td className="py-3.5 px-6 text-right font-bold text-slate-800 dark:text-white">
                          {formatNumber(row.stock)} {row.unidad_medida}
                        </td>
                        <td className="py-3.5 px-6 text-right text-slate-600 dark:text-dark-300 font-medium">
                          {formatCurrency(row.costo_medio)}
                        </td>
                        <td className="py-3.5 px-6 text-right font-bold text-slate-900 dark:text-white bg-indigo-500/5">
                          {formatCurrency(row.valoracion)}
                        </td>
                        <td className="py-3.5 px-6 text-right text-slate-500 dark:text-dark-400">
                          {formatNumber(row.stock_minimo)}
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          {row.alerta_stock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Bajo Mínimo</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Suficiente</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {!loadingVal && valuationData.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center py-16 text-slate-500 dark:text-dark-400">
                          No se encontraron registros de inventarios con los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BALANCE DE COMPROBACIÓN */}
      {activeTab === 'balance' && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 border border-slate-200 dark:border-dark-850 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-dark-300">
              <span>Reporte General Consolidado de Cuentas Contables</span>
              <button
                onClick={fetchBalance}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-600 dark:text-dark-300 transition-colors"
                title="Recargar"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingBal ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {balanceData.length > 0 && (
              <div className="self-end sm:self-auto">
                <ExportButtons 
                  excelData={balanceData}
                  excelHeaders={balanceExcelHeaders}
                  excelFilename="Balance_Comprobacion"
                  pdfDownloadUrl={api.reports.downloadBalancesPdfUrl()}
                  pdfFilename={`Balance_Comprobacion_${new Date().toISOString().slice(0, 10)}.pdf`}
                />
              </div>
            )}
          </div>

          {loadingBal && balanceData.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="glass rounded-2xl border border-slate-200/80 dark:border-dark-700/60 shadow-sm overflow-hidden transition-all duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-900/30">
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Código Cuenta</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Cuenta Contable</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Tipo Cuenta</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Nat.</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 text-right uppercase tracking-wider">Debe (Cargo)</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 text-right uppercase tracking-wider">Haber (Abono)</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 text-right uppercase tracking-wider">Saldo Resultante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-dark-850 text-sm">
                    {balanceData.map((row) => {
                      const level = row.codigo.split('.').length;
                      const isDetail = row.es_detalle;
                      return (
                        <tr 
                          key={row.id} 
                          className={`transition-colors ${
                            !isDetail 
                              ? 'bg-slate-100/50 dark:bg-dark-900/10 font-bold text-slate-900 dark:text-white' 
                              : 'hover:bg-slate-100/40 dark:hover:bg-dark-900/5 text-slate-750 dark:text-dark-300'
                          }`}
                        >
                          <td className="py-3 px-6 whitespace-nowrap">{row.codigo}</td>
                          <td className="py-3 px-6 whitespace-nowrap">
                            <span style={{ paddingLeft: `${(level - 1) * 12}px` }} className="inline-block">
                              {row.nombre}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-xs whitespace-nowrap">{row.tipo}</td>
                          <td className="py-3 px-6 text-xs whitespace-nowrap">{row.naturaleza}</td>
                          <td className="py-3 px-6 text-right font-semibold">
                            {row.debe > 0 ? formatCurrency(row.debe) : '-'}
                          </td>
                          <td className="py-3 px-6 text-right font-semibold">
                            {row.haber > 0 ? formatCurrency(row.haber) : '-'}
                          </td>
                          <td className="py-3 px-6 text-right font-bold bg-indigo-500/5 whitespace-nowrap">
                            {formatCurrency(row.saldo)}
                          </td>
                        </tr>
                      );
                    })}

                    {!loadingBal && balanceData.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-16 text-slate-500 dark:text-dark-400">
                          No se registran saldos de cuentas en el balance de comprobación.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsView;
