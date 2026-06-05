import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';

// ── Módulo Inventario ────────────────────────────────────────────────────────
import InventoryView from './views/InventoryView';
import EntradasView from './views/EntradasView';

// ── Módulo Facturación ───────────────────────────────────────────────────────
import FacturacionView from './views/FacturacionView';

// ── Módulo Informes ──────────────────────────────────────────────────────────
import KardexView from './views/KardexView';
import VentasReportView from './views/VentasReportView';

// ── Vistas de administración (escalables, accesibles desde menú si se activan) ──
import UsersView from './views/UsersView';
import ClientsView from './views/ClientsView';
import SuppliersView from './views/SuppliersView';
import BranchesView from './views/BranchesView';
import CategoriesView from './views/CategoriesView';
import MovementsView from './views/MovementsView';
import TransfersView from './views/TransfersView';
import AccountingView from './views/AccountingView';
import ReportsView from './views/ReportsView';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas bajo el Layout común */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route index element={<Dashboard />} />

            {/* ── MÓDULO INVENTARIO ── */}
            <Route path="inventario" element={<InventoryView />} />
            <Route path="entradas" element={<EntradasView />} />

            {/* ── MÓDULO FACTURACIÓN ── */}
            <Route path="facturacion/nueva" element={<FacturacionView />} />

            {/* ── MÓDULO INFORMES ── */}
            <Route path="kardex" element={<KardexView />} />
            <Route path="reportes/ventas" element={<VentasReportView />} />

            {/* ── VISTAS DE ADMINISTRACIÓN (para futuro escalado de roles) ── */}
            <Route path="usuarios" element={<UsersView />} />
            <Route path="clientes" element={<ClientsView />} />
            <Route path="proveedores" element={<SuppliersView />} />
            <Route path="sucursales" element={<BranchesView />} />
            <Route path="categorias" element={<CategoriesView />} />
            <Route path="movimientos" element={<MovementsView />} />
            <Route path="traslados" element={<TransfersView />} />
            <Route path="contabilidad" element={<AccountingView />} />
            <Route path="reportes" element={<ReportsView />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
