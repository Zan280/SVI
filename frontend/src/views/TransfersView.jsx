import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatNumber, formatDate } from '../lib/formatters';
import { Plus, Check, X, RefreshCw, Send, ArrowRight, CornerDownLeft, AlertCircle } from 'lucide-react';
import BranchSelector from '../components/BranchSelector';
import StatusBadge from '../components/StatusBadge';

export const TransfersView = () => {
  const { user } = useAuth();
  
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(
    user?.role_nombre === 'Encargado de Sucursal' ? user.sucursal_id : null
  );

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formOriginId, setFormOriginId] = useState('');
  const [formDestId, setFormDestId] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formCantidad, setFormCantidad] = useState('');

  const fetchTransfers = () => {
    setLoading(true);
    api.transfers.list(selectedBranchId)
      .then(data => setTransfers(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransfers();
  }, [selectedBranchId]);

  const openCreateModal = async () => {
    setError('');
    setFormOriginId(user?.sucursal_id || '');
    setFormDestId('');
    setFormProductId('');
    setFormCantidad('');
    setIsModalOpen(true);

    try {
      const prodData = await api.inventory.list();
      setProducts(prodData);
      
      const branchData = await api.branches.list();
      setBranches(branchData.filter(b => b.activo));
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos auxiliares.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formOriginId || !formDestId || !formProductId || !formCantidad) {
      setError('Por favor complete todos los campos.');
      return;
    }

    if (formOriginId === formDestId) {
      setError('La sucursal de origen y destino no pueden ser la misma.');
      return;
    }

    setSubmitting(true);
    setError('');

    const qty = parseFloat(formCantidad);
    if (isNaN(qty) || qty <= 0) {
      setError('La cantidad debe ser mayor que cero.');
      setSubmitting(false);
      return;
    }

    const payload = {
      sucursal_origen_id: parseInt(formOriginId),
      sucursal_destino_id: parseInt(formDestId),
      producto_id: parseInt(formProductId),
      cantidad: qty
    };

    api.transfers.create(payload)
      .then(() => {
        setIsModalOpen(false);
        fetchTransfers();
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.detail || 'Error al solicitar el traslado.');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  // Acciones del flujo de doble verificación
  const handleAuthorize = (id) => {
    if (window.confirm('¿Confirmar salida física del stock de la sucursal origen? El inventario se descontará y entrará en tránsito.')) {
      api.transfers.authorize(id)
        .then(() => fetchTransfers())
        .catch(err => alert(err.response?.data?.detail || 'Error al autorizar salida.'));
    }
  };

  const handleApprove = (id) => {
    if (window.confirm('¿Confirmar recepción de mercancía? El stock sumará al inventario de su sucursal de destino.')) {
      api.transfers.approve(id)
        .then(() => fetchTransfers())
        .catch(err => alert(err.response?.data?.detail || 'Error al aprobar recepción.'));
    }
  };

  const handleReject = (id, estado) => {
    const msg = estado === 'AUTORIZADO'
      ? '¿Rechazar mercancía recibida? Se registrará una devolución física de los productos a la sucursal de origen.'
      : '¿Rechazar solicitud de traslado pendiente?';

    if (window.confirm(msg)) {
      api.transfers.reject(id)
        .then(() => fetchTransfers())
        .catch(err => alert(err.response?.data?.detail || 'Error al rechazar traslado.'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Traslados Intersucursales</h1>
          <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
            Flujo de doble verificación (Autorización Origen → Envío en Tránsito → Recepción Aprobada por Destino)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <BranchSelector selectedBranchId={selectedBranchId} onChange={setSelectedBranchId} />
          <button
            onClick={fetchTransfers}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-600 dark:text-dark-300 transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold shadow-md shadow-indigo-600/25 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Solicitar Traslado</span>
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl border border-slate-200/80 dark:border-dark-700/60 shadow-sm overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-900/30">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">ID</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Fecha</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Ruta de Envío</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Producto</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 text-right uppercase tracking-wider">Cantidad</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Estado</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Involucrados</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 text-center uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-dark-800 text-sm">
              {transfers.map((t) => {
                // Roles y accesos
                const canAuthorize = t.estado === 'PENDIENTE' && 
                  (user.role_nombre === 'Administrador Global' || user.sucursal_id === t.sucursal_origen_id);
                
                const canApprove = t.estado === 'AUTORIZADO' && 
                  (user.role_nombre === 'Administrador Global' || user.sucursal_id === t.sucursal_destino_id);

                const canReject = (t.estado === 'PENDIENTE' && (user.role_nombre === 'Administrador Global' || user.sucursal_id === t.sucursal_origen_id || user.sucursal_id === t.sucursal_destino_id)) ||
                                  (t.estado === 'AUTORIZADO' && (user.role_nombre === 'Administrador Global' || user.sucursal_id === t.sucursal_destino_id));

                return (
                  <tr key={t.id} className="hover:bg-slate-100/40 dark:hover:bg-dark-900/10 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-400 dark:text-dark-500">#{t.id}</td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-dark-400 whitespace-nowrap">
                      {formatDate(t.creado_en)}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-white">{t.sucursal_origen?.nombre}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-semibold text-slate-800 dark:text-white">{t.sucursal_destino?.nombre}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white">{t.producto?.nombre}</span>
                        <span className="text-[10px] text-slate-400 dark:text-dark-500">SKU: {t.producto?.codigo_barras}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-800 dark:text-white whitespace-nowrap">
                      {formatNumber(t.cantidad)} {t.producto?.unidad_medida || 'PZA'}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <StatusBadge status={t.estado} />
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-dark-400">
                      <div className="flex flex-col">
                        <span>Envia: {t.nombre_usuario_envia || 'N/A'}</span>
                        <span>Recibe: {t.nombre_usuario_recibe || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {canAuthorize && (
                          <button
                            onClick={() => handleAuthorize(t.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
                            title="Autorizar Salida (Cargar a en tránsito)"
                          >
                            <Send className="w-3 h-3" />
                            <span>Autorizar Envío</span>
                          </button>
                        )}
                        
                        {canApprove && (
                          <button
                            onClick={() => handleApprove(t.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                            title="Aprobar Recepción (Ingresar a stock)"
                          >
                            <Check className="w-3 h-3" />
                            <span>Aprobar Recepción</span>
                          </button>
                        )}

                        {canReject && (
                          <button
                            onClick={() => handleReject(t.id, t.estado)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-all"
                            title="Rechazar traslado"
                          >
                            <X className="w-3 h-3" />
                            <span>Rechazar</span>
                          </button>
                        )}

                        {!canAuthorize && !canApprove && !canReject && (
                          <span className="text-xs text-slate-400 dark:text-dark-500 italic">Sin acciones</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && transfers.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-16 text-slate-500 dark:text-dark-400">
                    No se registran solicitudes de traslado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Solicitar Traslado */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-dark-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              Solicitar Traslado de Inventario
            </h2>

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">Sucursal Origen</label>
                {user?.role_nombre === 'Encargado de Sucursal' ? (
                  <input
                    type="text"
                    value={branches.find(b => b.id === user.sucursal_id)?.nombre || 'Mi Sucursal'}
                    className="w-full rounded-xl bg-slate-200/50 dark:bg-dark-900 border border-slate-350/20 dark:border-dark-800 p-2.5 text-sm text-slate-700 dark:text-dark-300 outline-none"
                    disabled
                  />
                ) : (
                  <select
                    value={formOriginId}
                    onChange={(e) => setFormOriginId(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                    required
                  >
                    <option value="">-- Seleccionar Origen --</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">Sucursal Destino</label>
                <select
                  value={formDestId}
                  onChange={(e) => setFormDestId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                  required
                >
                  <option value="">-- Seleccionar Destino --</option>
                  {branches.filter(b => b.id !== parseInt(formOriginId)).map(b => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">Producto a Trasladar</label>
                <select
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                  required
                >
                  <option value="">-- Seleccionar del Catálogo Base --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (SKU: {p.codigo_barras}) [{p.unidad_medida}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">Cantidad a Enviar</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formCantidad}
                  onChange={(e) => setFormCantidad(e.target.value)}
                  placeholder="1.00"
                  className="w-full rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/50 dark:border-dark-800/60 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-700 dark:text-dark-300 text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                >
                  {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>{submitting ? 'Solicitando...' : 'Confirmar Solicitud'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransfersView;
