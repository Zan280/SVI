import React, { useEffect, useState } from 'react';
import { Package, Store, Shuffle, ArrowLeftRight, TrendingUp, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatNumber } from '../lib/formatters';
import BranchSelector from '../components/BranchSelector';
import ChartCard from '../components/ChartCard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const { user } = useAuth();
  
  const [selectedBranchId, setSelectedBranchId] = useState(
    user?.role_nombre === 'Encargado de Sucursal' ? user.sucursal_id : null
  );

  const [stats, setStats] = useState({
    valoracion_total: 0,
    total_productos: 0,
    total_sucursales: 0,
    transferencias_pendientes: 0,
    movimientos_mes: 0
  });

  const [categoriesData, setCategoriesData] = useState([]);
  const [trendsData, setTrendsData] = useState([]);
  const [lowStockData, setLowStockData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, categoriesRes, trendsRes, valuationRes] = await Promise.all([
        api.dashboard.getStats(selectedBranchId),
        api.dashboard.getCategories(selectedBranchId),
        api.dashboard.getTrends(selectedBranchId),
        api.reports.getValuation(selectedBranchId)
      ]);

      setStats(statsRes);
      setCategoriesData(categoriesRes);
      setTrendsData(trendsRes);
      
      // Filtrar productos con stock bajo en base a la valorización actual
      const lowStock = valuationRes.filter(p => p.alerta_stock);
      setLowStockData(lowStock);
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedBranchId]);

  const cards = [
    { 
      key: 'valoracion', 
      label: 'Valoración Total', 
      value: formatCurrency(stats.valoracion_total), 
      icon: Package, 
      color: 'from-indigo-600 to-indigo-800 text-white',
      desc: 'Costo total de inventarios en NIO'
    },
    { 
      key: 'productos', 
      label: 'Productos Catalogados', 
      value: stats.total_productos, 
      icon: Package, 
      color: 'from-emerald-500 to-emerald-700 text-white',
      desc: 'Catálogo de artículos registrados'
    },
    { 
      key: 'sucursales', 
      label: 'Sucursales Activas', 
      value: stats.total_sucursales, 
      icon: Store, 
      color: 'from-amber-500 to-amber-700 text-white',
      desc: 'Almacenes físicos activos'
    },
    { 
      key: 'traslados', 
      label: 'Traslados Pendientes', 
      value: stats.transferencias_pendientes, 
      icon: Shuffle, 
      color: 'from-rose-500 to-rose-700 text-white',
      desc: 'En tránsito o aprobación'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-dark-400 mt-1">
            Métricas clave, valoración y tendencias contables de mercaderías
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BranchSelector selectedBranchId={selectedBranchId} onChange={setSelectedBranchId} />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => (
          <div
            key={c.key}
            className="glass rounded-2xl p-5 hover:scale-102 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-36 border border-slate-200 dark:border-dark-800"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">
                {c.label}
              </span>
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${c.color} flex items-center justify-center shadow-sm`}>
                <c.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-2xl font-black text-slate-850 dark:text-white leading-tight">
                {c.value}
              </h2>
              <p className="text-[10px] text-slate-400 dark:text-dark-500 mt-1">
                {c.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend line chart */}
        <ChartCard 
          title="Tendencia Mensual de Movimientos" 
          description="Comparación de importes de ingresos vs egresos (últimos 6 meses)"
          className="lg:col-span-2"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : trendsData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-500">
              No hay movimientos suficientes en los meses recientes para graficar.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                <Bar name="Ingresos (Compras/Ajustes)" dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar name="Egresos (Ventas/Mermas)" dataKey="egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Category distribution pie chart */}
        <ChartCard 
          title="Distribución de Stock por Categoría" 
          description="Porcentaje del valor neto inventariado por línea comercial"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : categoriesData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-500">
              No hay stock valorado en el catálogo.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoriesData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="valoracion"
                  nameKey="categoria"
                >
                  {categoriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px' }}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Low stock table */}
      <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-sm">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white leading-tight">Alerta de Stock Mínimo</h2>
            <p className="text-xs text-slate-500 dark:text-dark-400 mt-0.5">
              Productos cuyo inventario disponible está por debajo del límite de seguridad
            </p>
          </div>
        </div>

        {lowStockData.length === 0 ? (
          <div className="py-8 text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
            ✓ Todos los niveles de stock se encuentran dentro de los márgenes de seguridad.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-dark-850 rounded-xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-900/30">
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Código/SKU</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Producto</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-dark-400 uppercase tracking-wider">Categoría</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-dark-400 text-right uppercase tracking-wider">Stock Disponible</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-dark-400 text-right uppercase tracking-wider">Límite Mínimo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-850">
                {lowStockData.map((item) => (
                  <tr key={item.producto_id} className="hover:bg-slate-100/30 dark:hover:bg-dark-900/5 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-slate-500 dark:text-dark-400">{item.codigo_barras}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-white">{item.nombre}</td>
                    <td className="py-2.5 px-4 text-slate-500 dark:text-dark-400 text-xs">{item.categoria}</td>
                    <td className="py-2.5 px-4 text-right text-rose-600 dark:text-rose-400 font-bold">
                      {formatNumber(item.stock)} {item.unidad_medida}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-650 dark:text-dark-300">
                      {formatNumber(item.stock_minimo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
