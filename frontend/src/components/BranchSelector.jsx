import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Store } from 'lucide-react';

export const BranchSelector = ({ selectedBranchId, onChange, showAllOption = true }) => {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.branches.list()
      .then(data => {
        setBranches(data);
      })
      .catch(err => {
        console.error('Error al cargar sucursales:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const isEncargado = user?.role_nombre === 'Encargado de Sucursal';

  useEffect(() => {
    // Si es Encargado y no está seleccionado su sucursal_id, forzarlo
    if (isEncargado && user?.sucursal_id && selectedBranchId !== user.sucursal_id) {
      onChange(user.sucursal_id);
    }
  }, [isEncargado, user, selectedBranchId, onChange]);

  if (isEncargado) {
    const assignedBranch = branches.find(b => b.id === user.sucursal_id);
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 text-xs font-semibold text-slate-600 dark:text-dark-300">
        <Store className="w-4 h-4 text-indigo-500" />
        <span>Sucursal: {assignedBranch ? assignedBranch.nombre : 'Cargando...'}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Store className="w-4 h-4 text-slate-400 dark:text-dark-500" />
      <select
        value={selectedBranchId || ''}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val ? parseInt(val) : null);
        }}
        disabled={loading}
        className="rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 py-1.5 px-3 text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
      >
        {showAllOption && (
          <option value="">[ Todas las Sucursales ]</option>
        )}
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.nombre} ({b.codigo})
          </option>
        ))}
      </select>
    </div>
  );
};

export default BranchSelector;
