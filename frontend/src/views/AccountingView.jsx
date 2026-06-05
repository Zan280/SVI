import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/formatters';
import { Coins, Eye, RefreshCw, Scale } from 'lucide-react';
import BranchSelector from '../components/BranchSelector';

export const AccountingView = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  
  // Detalle Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entryLoading, setEntryLoading] = useState(false);

  const fetchEntries = () => {
    setLoading(true);
    api.accounting.getEntries(selectedBranchId)
      .then(data => setEntries(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEntries();
  }, [selectedBranchId]);

  const handleOpenDetail = (id) => {
    setIsModalOpen(true);
    setEntryLoading(true);
    api.accounting.getEntry(id)
      .then(data => setSelectedEntry(data))
      .catch(err => {
        console.error(err);
        setIsModalOpen(false);
      })
      .finally(() => setEntryLoading(false));
  };

  // Calcular débitos y créditos totales del asiento seleccionado
  const calculateTotals = (detalles = []) => {
    let debe = 0;
    let haber = 0;
    detalles.forEach(d => {
      debe += parseFloat(d.debe || 0);
      haber += parseFloat(d.haber || 0);
    });
    return { debe, haber };
  };

  const { debe: totalDebe, haber: totalHaber } = selectedEntry 
    ? calculateTotals(selectedEntry.detalles) 
    : { debe: 0, haber: 0 };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white font-sans">Contabilidad</h1>
          <p className="text-xs text-slate-500 dark:text-dark-400 mt-1 font-sans">
            Auditoría de asientos contables automáticos generados por compras, ventas y ajustes de stock
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BranchSelector selectedBranchId={selectedBranchId} onChange={setSelectedBranchId} />
          <button
            onClick={fetchEntries}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-600 dark:text-dark-300 transition-colors"
            title="Recargar asientos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Lista de Asientos */}
      {loading && entries.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-slate-200/80 dark:border-dark-700/60 shadow-sm overflow-hidden transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-900/30">
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Número Asiento</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Fecha Registro</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Glosa General</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Sucursal Origen</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Estado</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Creado Por</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 text-center uppercase tracking-wider">Auditar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-800 text-sm">
                {entries.map((ent) => (
                  <tr key={ent.id} className="hover:bg-slate-100/40 dark:hover:bg-dark-900/10 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-indigo-650 dark:text-indigo-400 whitespace-nowrap">
                      {ent.numero}
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-500 dark:text-dark-400 whitespace-nowrap">
                      {formatDate(ent.fecha, false)}
                    </td>
                    <td className="py-3.5 px-6 text-slate-800 dark:text-dark-200">
                      {ent.descripcion}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-700 dark:text-dark-300">
                      {ent.nombre_sucursal}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/15">
                        {ent.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-500 dark:text-dark-400">
                      {ent.nombre_creador}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <button
                        onClick={() => handleOpenDetail(ent.id)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-indigo-600 dark:text-indigo-400 transition-colors inline-block"
                        title="Ver partida contable"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && entries.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-16 text-slate-500 dark:text-dark-400">
                      No se han registrado asientos contables automáticos todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detalle de Asiento (Auditoría Partida Doble) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-3xl p-6 shadow-xl border border-slate-200 dark:border-dark-700 max-h-[90vh] overflow-y-auto">
            {entryLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : selectedEntry ? (
              <div className="space-y-6">
                
                {/* Cabecera del Asiento */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-dark-850 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      Libro Diario General
                    </span>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-1">
                      Asiento N° {selectedEntry.numero}
                    </h2>
                  </div>
                  <div className="text-right text-xs text-slate-500 dark:text-dark-400 leading-tight">
                    <p><strong>Fecha Registro:</strong> {formatDate(selectedEntry.fecha, false)}</p>
                    <p className="mt-1"><strong>Sucursal:</strong> {selectedEntry.nombre_sucursal}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-dark-950 border border-slate-200 dark:border-dark-900 rounded-xl text-xs text-slate-700 dark:text-dark-300">
                  <strong>Glosa General:</strong> {selectedEntry.descripcion}
                </div>

                {/* Libro Diario de Cuentas */}
                <div className="border border-slate-200 dark:border-dark-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-900/30 text-xs text-slate-500 dark:text-dark-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Código Cuenta</th>
                        <th className="py-3 px-4">Cuenta Contable</th>
                        <th className="py-3 px-4 text-right">Debe (Cargo)</th>
                        <th className="py-3 px-4 text-right">Haber (Abono)</th>
                        <th className="py-3 px-4">Glosa Particular</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-dark-850 text-sm">
                      {selectedEntry.detalles.map((det) => (
                        <tr key={det.id} className="hover:bg-slate-100/30 dark:hover:bg-dark-900/5 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-400 dark:text-dark-500">
                            {det.cuenta?.codigo}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${det.haber > 0 ? 'pl-6 block text-slate-700 dark:text-dark-300' : 'text-slate-900 dark:text-white'}`}>
                              {det.cuenta?.nombre}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-teal-600 dark:text-teal-400">
                            {det.debe > 0 ? formatCurrency(det.debe) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                            {det.haber > 0 ? formatCurrency(det.haber) : '-'}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500 dark:text-dark-400 italic">
                            {det.glosa || '-'}
                          </td>
                        </tr>
                      ))}
                      
                      {/* Fila de Totales de Verificación */}
                      <tr className="bg-slate-100 dark:bg-dark-950/80 font-bold border-t-2 border-slate-300 dark:border-dark-800">
                        <td colSpan="2" className="py-3.5 px-4 text-slate-800 dark:text-dark-200 flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-indigo-500" />
                          <span>PARTIDA DOBLE (SUMAS IGUALES)</span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-teal-600 dark:text-teal-400">
                          {formatCurrency(totalDebe)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-rose-600 dark:text-rose-400">
                          {formatCurrency(totalHaber)}
                        </td>
                        <td className="py-3.5 px-4 text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-center">
                          {Math.abs(totalDebe - totalHaber) < 0.01 ? '✓ Equilibrado' : '⚠ Descuadrado'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-slate-200/50 dark:border-dark-800/60">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-colors"
                  >
                    Cerrar Auditoría
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500">Error al cargar el asiento contable.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingView;
