import React from 'react';

export const StatusBadge = ({ type, status }) => {
  // 1. Si es tipo de movimiento de inventario
  if (type) {
    const typeConfigs = {
      INGRESO_COMPRA: {
        text: 'Compra (Ingreso)',
        classes: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
      },
      SALIDA_VENTA: {
        text: 'Venta (Salida)',
        classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
      },
      TRASLADO_INGRESO: {
        text: 'Recepción Traslado',
        classes: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
      },
      TRASLADO_SALIDA: {
        text: 'Envío Traslado',
        classes: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
      },
      AJUSTE_INGRESO: {
        text: 'Ajuste Ingreso',
        classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
      },
      AJUSTE_SALIDA: {
        text: 'Ajuste Salida',
        classes: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
      }
    };

    const config = typeConfigs[type] || {
      text: type,
      classes: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.classes}`}>
        {config.text}
      </span>
    );
  }

  // 2. Si es estado de traslado
  if (status) {
    const statusConfigs = {
      PENDIENTE: {
        text: 'Pendiente Salida',
        classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
      },
      AUTORIZADO: {
        text: 'En Tránsito (Autorizado)',
        classes: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
      },
      APROBADO: {
        text: 'Recibido (Aprobado)',
        classes: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
      },
      RECHAZADO: {
        text: 'Rechazado',
        classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
      }
    };

    const config = statusConfigs[status] || {
      text: status,
      classes: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.classes}`}>
        {config.text}
      </span>
    );
  }

  return null;
};

export default StatusBadge;
