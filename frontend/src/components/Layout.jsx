import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  ShoppingCart,
  BarChart3,
  BookOpen,
  TrendingUp,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  User,
  LayoutDashboard,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

// Estructura de módulos con submenús
const MENU_MODULES = [
  {
    id: 'inventario',
    label: 'Inventario',
    icon: Package,
    color: 'indigo',
    submenu: [
      { label: 'Catálogo de Inventario', path: '/inventario', icon: Package, id: 'nav-catalogo' },
      { label: 'Entradas', path: '/entradas', icon: ShoppingCart, id: 'nav-entradas' },
    ],
  },
  {
    id: 'facturacion',
    label: 'Facturación',
    icon: FileText,
    color: 'violet',
    submenu: [
      { label: 'Nueva Factura', path: '/facturacion/nueva', icon: FileText, id: 'nav-nueva-factura' },
    ],
  },
  {
    id: 'informes',
    label: 'Informes',
    icon: BarChart3,
    color: 'emerald',
    submenu: [
      { label: 'Kardex', path: '/kardex', icon: BookOpen, id: 'nav-kardex' },
      { label: 'Reporte de Ventas', path: '/reportes/ventas', icon: TrendingUp, id: 'nav-ventas' },
    ],
  },
];

const colorMap = {
  indigo: {
    active: 'bg-indigo-600/15 text-indigo-500 dark:text-indigo-400',
    hover: 'hover:bg-indigo-500/10 hover:text-indigo-500',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-600/20 text-indigo-500',
    bar: 'bg-indigo-500',
  },
  violet: {
    active: 'bg-violet-600/15 text-violet-500 dark:text-violet-400',
    hover: 'hover:bg-violet-500/10 hover:text-violet-500',
    dot: 'bg-violet-500',
    badge: 'bg-violet-600/20 text-violet-500',
    bar: 'bg-violet-500',
  },
  emerald: {
    active: 'bg-emerald-600/15 text-emerald-500 dark:text-emerald-400',
    hover: 'hover:bg-emerald-500/10 hover:text-emerald-500',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-600/20 text-emerald-500',
    bar: 'bg-emerald-500',
  },
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [openModules, setOpenModules] = useState({ inventario: true, facturacion: false, informes: false });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleModule = (moduleId) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenModules((prev) => ({ ...prev, [moduleId]: true }));
      return;
    }
    setOpenModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const isModuleActive = (mod) =>
    mod.submenu.some((item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/'));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-dark-950 text-slate-800 dark:text-dark-100 transition-colors duration-300">

      {/* ======= SIDEBAR ======= */}
      <aside
        className={`glass flex flex-col border-r border-slate-200 dark:border-dark-700/50 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        {/* Logo / Header */}
        <div className="flex items-center h-16 px-4 border-b border-slate-200 dark:border-dark-700/50 bg-white/50 dark:bg-dark-900/10">
          {!collapsed && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight block leading-tight">ERP Sistema</span>
                <span className="text-[10px] text-slate-400 dark:text-dark-500">Inventario & Ventas</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:text-dark-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-dark-700/50 transition-all"
            id="sidebar-toggle"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Dashboard link */}
        <div className="px-3 pt-4 pb-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-slate-200/70 dark:bg-dark-800/60 text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-dark-400 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-dark-700/30'
              }`
            }
            id="nav-dashboard"
          >
            <LayoutDashboard size={18} className="shrink-0" />
            {!collapsed && <span className="animate-fade-in">Dashboard</span>}
          </NavLink>
        </div>

        {/* Separator */}
        {!collapsed && (
          <div className="px-6 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-dark-600">Módulos</p>
          </div>
        )}

        {/* Navigation – Accordion Modules */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {MENU_MODULES.map((mod) => {
            const IconComponent = mod.icon;
            const isActive = isModuleActive(mod);
            const isOpen = openModules[mod.id];
            const colors = colorMap[mod.color];

            return (
              <div key={mod.id}>
                {/* Module header button (accordion trigger – no navigation) */}
                <button
                  onClick={() => toggleModule(mod.id)}
                  id={`module-${mod.id}`}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    isActive
                      ? `${colors.active}`
                      : `text-slate-500 dark:text-dark-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-700/40`
                  }`}
                >
                  <IconComponent size={18} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left animate-fade-in">{mod.label}</span>
                      {isOpen ? (
                        <ChevronUp size={14} className="shrink-0 opacity-60" />
                      ) : (
                        <ChevronDown size={14} className="shrink-0 opacity-60" />
                      )}
                    </>
                  )}
                </button>

                {/* Submenu items */}
                {!collapsed && isOpen && (
                  <div className="mt-1 ml-3 pl-3 border-l-2 border-slate-200 dark:border-dark-700/60 space-y-0.5 animate-slide-in">
                    {mod.submenu.map((item) => {
                      const SubIcon = item.icon;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end
                          id={item.id}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                              isActive
                                ? `font-semibold ${colors.active}`
                                : `text-slate-500 dark:text-dark-400 font-medium ${colors.hover} hover:text-slate-900 dark:hover:text-white`
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <SubIcon size={15} className="shrink-0" />
                              <span>{item.label}</span>
                              {isActive && (
                                <span className={`ml-auto w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                              )}
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer (User Info & Logout) */}
        <div className="p-4 border-t border-slate-200 dark:border-dark-700/50 bg-white/40 dark:bg-dark-900/10">
          {!collapsed ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user?.nombre}</p>
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-dark-500 truncate leading-none mt-0.5">{user?.role_nombre}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                id="btn-logout"
              >
                <LogOut size={14} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors flex justify-center"
              title="Cerrar Sesión"
              id="btn-logout-collapsed"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* ======= MAIN CONTENT ======= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 glass border-b border-slate-200 dark:border-dark-700/50 flex items-center justify-between px-6 shadow-sm dark:shadow-none bg-white/80 dark:bg-dark-950/80">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-400 dark:text-dark-500">
              Sistema ERP
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
