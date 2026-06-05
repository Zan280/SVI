import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatNumber, formatDate } from '../lib/formatters';
import { Plus, ArrowDownCircle, ArrowUpCircle, RefreshCw, Filter, Search, Tag, DollarSign, Calendar, Camera, ImagePlus, X as XIcon } from 'lucide-react';
import BranchSelector from '../components/BranchSelector';
import StatusBadge from '../components/StatusBadge';
import { ROLES, isBranchSegmented } from '../lib/roles';

export const MovementsView = () => {
  const { user } = useAuth();
  
  // Lista y filtros
  const [movements, setMovements] = useState([]);
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
  const [formBranchId, setFormBranchId] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formTipo, setFormTipo] = useState('INGRESO_COMPRA');
  const [formCantidad, setFormCantidad] = useState('');
  const [formCostoUnitario, setFormCostoUnitario] = useState('');
  const [formReferencia, setFormReferencia] = useState('');
  const [formPhoto, setFormPhoto] = useState(null); // base64 preview para Vendedor

  const isVendedor = user?.role_nombre === ROLES.VENDEDORA;

  const fetchMovements = () => {
    setLoading(true);
    api.movements.list(selectedBranchId)
      .then(data => setMovements(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMovements();
  }, [selectedBranchId]);

  // Cargar catálogos al abrir el modal
  const openRegisterModal = async () => {
    setError('');
    // Inicializar valores por defecto
    setFormBranchId(user?.sucursal_id || '');
    setFormProductId('');
    if (user?.role_nombre === ROLES.VENDEDORA) {
      setFormTipo('SALIDA_VENTA');
    } else {
      setFormTipo('INGRESO_COMPRA');
    }
    setFormCantidad('');
    setFormCostoUnitario('');
    setFormReferencia('');
    setFormPhoto(null);
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
    if (!formBranchId || !formProductId || !formTipo || !formCantidad) {
      setError('Por favor complete todos los campos obligatorios.');
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
      sucursal_id: parseInt(formBranchId),
      producto_id: parseInt(formProductId),
      tipo: formTipo,
      cantidad: qty,
      costo_unitario: formCostoUnitario ? parseFloat(formCostoUnitario) : null,
      // Para Vendedor la referencia es la foto en base64; para los demás es texto libre
      referencia: isVendedor
        ? (formPhoto ? `[FOTO_VENTA]${formPhoto}` : 'Venta registrada')
        : formReferencia
    };

    api.movements.create(payload)
      .then(() => {
        setIsModalOpen(false);
        fetchMovements();
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.detail || 'Error al registrar el movimiento.');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  // Ayudante para autoseleccionar precio sugerido cuando cambia el producto
  useEffect(() => {
    if (formProductId && formTipo && products.length > 0) {
      const prod = products.find(p => p.id === parseInt(formProductId));
      if (prod) {
        if (formTipo === 'INGRESO_COMPRA') {
          setFormCostoUnitario(prod.precio_compra || '');
        } else {
          setFormCostoUnitario(''); // Para salidas, el sistema resuelve automáticamente el costo promedio (no lo edita el usuario)
        }
      }
    }
  }, [formProductId, formTipo, products]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Movimientos de Inventario</h1>
          <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
            Historial detallado y registro de compras, ventas y ajustes manuales en stock
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <BranchSelector selectedBranchId={selectedBranchId} onChange={setSelectedBranchId} />
          <button
            onClick={fetchMovements}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-600 dark:text-dark-300 transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openRegisterModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold shadow-md shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Movimiento</span>
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl border border-slate-200/80 dark:border-dark-700/60 shadow-sm overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-900/30">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Fecha / Hora</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Sucursal</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Producto</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Tipo Operación</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 text-right uppercase tracking-wider">Cantidad</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 text-right uppercase tracking-wider">Costo Unit.</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 text-right uppercase tracking-wider">Total</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-dark-800 text-sm">
              {movements.map((mov) => {
                const esIngreso = ['INGRESO_COMPRA', 'TRASLADO_INGRESO', 'AJUSTE_INGRESO'].includes(mov.tipo);
                return (
                  <tr key={mov.id} className="hover:bg-slate-100/40 dark:hover:bg-dark-900/10 transition-colors">
                    <td className="py-3.5 px-6 text-xs font-medium text-slate-500 dark:text-dark-400 whitespace-nowrap">
                      {formatDate(mov.creado_en)}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-800 dark:text-white">
                      {mov.nombre_sucursal}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white">{mov.producto?.nombre}</span>
                        <span className="text-[10px] text-slate-400 dark:text-dark-500">SKU: {mov.producto?.codigo_barras}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <StatusBadge type={mov.tipo} />
                    </td>
                    <td className={`py-3.5 px-6 text-right font-bold whitespace-nowrap ${
                      esIngreso ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {esIngreso ? '+' : '-'}{formatNumber(mov.cantidad)} {mov.producto?.unidad_medida || 'PZA'}
                    </td>
                    <td className="py-3.5 px-6 text-right text-slate-600 dark:text-dark-300 font-medium whitespace-nowrap">
                      {formatCurrency(mov.costo_unitario)}
                    </td>
                    <td className="py-3.5 px-6 text-right font-bold text-slate-850 dark:text-white whitespace-nowrap">
                      {formatCurrency(mov.costo_total)}
                    </td>
                    <td className="py-3.5 px-6 text-xs font-medium text-slate-500 dark:text-dark-400">
                      {mov.referencia?.startsWith('[FOTO_VENTA]') ? (
                        <a
                          href={mov.referencia.replace('[FOTO_VENTA]', '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver foto de venta"
                        >
                          <img
                            src={mov.referencia.replace('[FOTO_VENTA]', '')}
                            alt="Foto venta"
                            className="h-10 w-14 object-cover rounded-lg border border-slate-200 dark:border-dark-700 hover:scale-105 transition-transform cursor-zoom-in"
                          />
                        </a>
                      ) : (
                        mov.referencia || '-'
                      )}
                    </td>
                  </tr>
                );
              })}

              {!loading && movements.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-16 text-slate-500 dark:text-dark-400">
                    No se registran movimientos en stock. Registra uno nuevo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Movimiento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-lg p-6 shadow-xl border border-slate-200 dark:border-dark-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              Registrar Movimiento de Inventario
            </h2>

            {error && (
              <div className="mb-4 text-xs bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">Sucursal Operación</label>
                  {isBranchSegmented(user?.role_nombre) ? (
                    <input
                      type="text"
                      value={branches.find(b => b.id === user.sucursal_id)?.nombre || 'Mi Sucursal'}
                      className="w-full rounded-xl bg-slate-200/50 dark:bg-dark-900 border border-slate-350/20 dark:border-dark-800 p-2.5 text-sm text-slate-700 dark:text-dark-300 outline-none"
                      disabled
                    />
                  ) : (
                    <select
                      value={formBranchId}
                      onChange={(e) => setFormBranchId(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                      required
                    >
                      <option value="">-- Seleccionar Sucursal --</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">Tipo de Operación</label>
                  {user?.role_nombre === ROLES.VENDEDORA ? (
                    <select
                      value={formTipo}
                      disabled
                      className="w-full rounded-xl bg-slate-200/50 dark:bg-dark-900 border border-slate-350/20 dark:border-dark-800 p-2.5 text-sm text-slate-700 dark:text-dark-300 outline-none"
                      required
                    >
                      <option value="SALIDA_VENTA">Venta (Salida)</option>
                    </select>
                  ) : user?.role_nombre === ROLES.ALMACEN ? (
                    <select
                      value={formTipo}
                      onChange={(e) => setFormTipo(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                      required
                    >
                      <option value="INGRESO_COMPRA">Compra (Ingreso)</option>
                      <option value="AJUSTE_INGRESO">Ajuste Manual - Ingreso</option>
                      <option value="AJUSTE_SALIDA">Ajuste Manual - Salida</option>
                    </select>
                  ) : (
                    <select
                      value={formTipo}
                      onChange={(e) => setFormTipo(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                      required
                    >
                      <option value="INGRESO_COMPRA">Compra (Ingreso)</option>
                      <option value="SALIDA_VENTA">Venta (Salida)</option>
                      <option value="AJUSTE_INGRESO">Ajuste Manual - Ingreso</option>
                      <option value="AJUSTE_SALIDA">Ajuste Manual - Salida</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">Seleccionar Producto</label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">Cantidad</label>
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

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">
                    {['INGRESO_COMPRA', 'AJUSTE_INGRESO'].includes(formTipo) ? 'Costo Unitario (C$)' : 'Costo Medio (Autocalculado)'}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formCostoUnitario}
                    onChange={(e) => setFormCostoUnitario(e.target.value)}
                    placeholder={['INGRESO_COMPRA', 'AJUSTE_INGRESO'].includes(formTipo) ? 'C$ 0.00' : 'El sistema asignará el CPP'}
                    disabled={!['INGRESO_COMPRA', 'AJUSTE_INGRESO'].includes(formTipo)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-dark-950 disabled:bg-slate-200/55 dark:disabled:bg-dark-900 border border-slate-200 dark:border-dark-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Campo condicional: Foto (Vendedor) o Referencia Documentaria (otros) */}
              {isVendedor ? (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">
                    Foto del Producto (opcional)
                  </label>
                  {formPhoto ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-dark-900">
                      <img src={formPhoto} alt="Foto del producto" className="w-full max-h-40 object-contain" />
                      <button
                        type="button"
                        onClick={() => setFormPhoto(null)}
                        className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 text-white hover:bg-red-500/80 transition-colors"
                        title="Quitar foto"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="photo-upload"
                      className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl border-2 border-dashed border-slate-300 dark:border-dark-700 bg-slate-50 dark:bg-dark-950 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 cursor-pointer transition-all group"
                    >
                      <Camera className="w-7 h-7 text-slate-400 dark:text-dark-500 group-hover:text-indigo-500 transition-colors" />
                      <span className="text-xs text-slate-500 dark:text-dark-400 group-hover:text-indigo-500 transition-colors">
                        Tomar foto o seleccionar imagen
                      </span>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onloadend = () => setFormPhoto(reader.result);
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  )}
                  <p className="text-[10px] text-slate-400 dark:text-dark-500 mt-1.5">
                    Puedes adjuntar una foto del artículo vendido como respaldo visual.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">Referencia Documentaria</label>
                  <input
                    type="text"
                    value={formReferencia}
                    onChange={(e) => setFormReferencia(e.target.value)}
                    placeholder="Factura N° F-1234, Ajuste por Merma, Compra proveedor..."
                    className="w-full rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-dark-500 mt-1.5">
                    Número de factura, guía de remisión u otro documento que justifica el movimiento.
                  </p>
                </div>
              )}

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
                  <span>{submitting ? 'Registrando...' : 'Confirmar Registro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovementsView;
