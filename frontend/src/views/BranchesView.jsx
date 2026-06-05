import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Edit2, Trash2, Store, MapPin, Phone, CheckCircle, XCircle } from 'lucide-react';

export const BranchesView = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  // Form State
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [activa, setActiva] = useState(true);
  const [error, setError] = useState('');

  const fetchBranches = () => {
    setLoading(true);
    api.branches.list()
      .then(data => setBranches(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const openCreateModal = () => {
    setEditingBranch(null);
    setNombre('');
    setCodigo('');
    setDireccion('');
    setTelefono('');
    setActiva(true);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    setNombre(branch.nombre);
    setCodigo(branch.codigo);
    setDireccion(branch.direccion || '');
    setTelefono(branch.telefono || '');
    setActiva(branch.activo ?? true); // El backend usa activo en el modelo (en la base de datos se llama activa, pero mapeado en schemas es activo)
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre || !codigo) {
      setError('Nombre y Código son campos obligatorios.');
      return;
    }

    const payload = {
      nombre,
      codigo,
      direccion,
      telefono,
      activo: activa
    };

    const request = editingBranch
      ? api.branches.update(editingBranch.id, payload)
      : api.branches.create(payload);

    request
      .then(() => {
        setIsModalOpen(false);
        fetchBranches();
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.detail || 'Error al guardar la sucursal.');
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Está seguro de eliminar esta sucursal? Esta acción no se puede deshacer.')) {
      api.branches.delete(id)
        .then(() => fetchBranches())
        .catch(err => {
          console.error(err);
          alert(err.response?.data?.detail || 'No se puede eliminar la sucursal porque tiene registros asociados.');
        });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Sucursales</h1>
          <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
            Administra los locales físicos y almacenes de distribución de la empresa
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Sucursal</span>
        </button>
      </div>

      {loading && branches.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map(branch => (
            <div
              key={branch.id}
              className="glass rounded-2xl p-6 shadow-sm hover:shadow-lg dark:hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{branch.nombre}</h3>
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                        Código: {branch.codigo}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    branch.activo 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10' 
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10'
                  }`}>
                    {branch.activo ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Activa</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Inactiva</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-2 mt-4 text-xs text-slate-600 dark:text-dark-400 border-t border-slate-200/50 dark:border-dark-800/60 pt-4">
                  {branch.direccion && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 dark:text-dark-500 shrink-0 mt-0.5" />
                      <span>{branch.direccion}</span>
                    </div>
                  )}
                  {branch.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 dark:text-dark-500 shrink-0" />
                      <span>{branch.telefono}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6 border-t border-slate-200/50 dark:border-dark-800/60 pt-4">
                <button
                  onClick={() => openEditModal(branch)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-dark-800/50 dark:hover:bg-dark-700/80 text-slate-600 dark:text-dark-300 transition-colors"
                  title="Editar Sucursal"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(branch.id)}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                  title="Eliminar Sucursal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {!loading && branches.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 dark:text-dark-400">
              No hay sucursales registradas. Crea una nueva para comenzar.
            </div>
          )}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-dark-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
            </h2>

            {error && (
              <div className="mb-4 text-xs bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">Código Único</label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="SUC-001"
                  className="w-full rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">Nombre Comercial</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Sucursal Norte"
                  className="w-full rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">Dirección</label>
                <textarea
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle 123, Frente al parque central..."
                  rows="3"
                  className="w-full rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="2222-2222"
                  className="w-full rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activa"
                  checked={activa}
                  onChange={(e) => setActiva(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 dark:bg-dark-950 dark:border-dark-800 cursor-pointer"
                />
                <label htmlFor="activa" className="text-sm font-semibold text-slate-700 dark:text-dark-300 cursor-pointer">
                  Sucursal Activa y Disponible para Operaciones
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/50 dark:border-dark-800/60 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-700 dark:text-dark-300 text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all"
                >
                  {editingBranch ? 'Guardar Cambios' : 'Crear Sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchesView;
