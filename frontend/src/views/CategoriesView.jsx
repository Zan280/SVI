import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Edit2, Trash2, Tag, FolderOpen } from 'lucide-react';

export const CategoriesView = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form State
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');

  const fetchCategories = () => {
    setLoading(true);
    api.categories.list()
      .then(data => setCategories(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setNombre('');
    setDescripcion('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setNombre(category.nombre);
    setDescripcion(category.descripcion || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    const payload = {
      nombre,
      descripcion
    };

    const request = editingCategory
      ? api.categories.update(editingCategory.id, payload)
      : api.categories.create(payload);

    request
      .then(() => {
        setIsModalOpen(false);
        fetchCategories();
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.detail || 'Error al guardar la categoría.');
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Está seguro de eliminar esta categoría?')) {
      api.categories.delete(id)
        .then(() => fetchCategories())
        .catch(err => {
          console.error(err);
          alert(err.response?.data?.detail || 'No se puede eliminar la categoría porque tiene productos vinculados.');
        });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Categorías</h1>
          <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
            Organiza el catálogo de productos por líneas comerciales o familias
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {loading && categories.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="glass rounded-2xl p-6 shadow-sm hover:shadow-lg dark:hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{cat.nombre}</h3>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-600 dark:text-dark-400 border-t border-slate-200/50 dark:border-dark-800/60 pt-4 flex items-start gap-2 min-h-12">
                  <FolderOpen className="w-4 h-4 text-slate-400 dark:text-dark-500 shrink-0 mt-0.5" />
                  <span>{cat.descripcion || 'Sin descripción.'}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6 border-t border-slate-200/50 dark:border-dark-800/60 pt-4">
                <button
                  onClick={() => openEditModal(cat)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-dark-800/50 dark:hover:bg-dark-700/80 text-slate-600 dark:text-dark-300 transition-colors"
                  title="Editar Categoría"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                  title="Eliminar Categoría"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {!loading && categories.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 dark:text-dark-400">
              No hay categorías registradas. Crea una nueva para comenzar.
            </div>
          )}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-dark-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>

            {error && (
              <div className="mb-4 text-xs bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">Nombre de Categoría</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Lácteos, Ferretería, etc."
                  className="w-full rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-dark-300 mb-1.5 uppercase">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Escribe detalles breves sobre el tipo de artículos en esta categoría..."
                  rows="3"
                  className="w-full rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 p-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                />
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
                  {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesView;
