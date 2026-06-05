import axios from 'axios';

// Configurar URL base y encabezados por defecto
axios.defaults.baseURL = '';
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const api = {
  // Autenticación
  auth: {
    login: (email, password) => {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      return axios.post('/api/v1/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }).then(r => r.data);
    },
    me: () => axios.get('/api/v1/auth/me').then(r => r.data)
  },

  // Sucursales
  branches: {
    list: () => axios.get('/api/v1/sucursales/').then(r => r.data),
    get: (id) => axios.get(`/api/v1/sucursales/${id}`).then(r => r.data),
    create: (data) => axios.post('/api/v1/sucursales/', data).then(r => r.data),
    update: (id, data) => axios.put(`/api/v1/sucursales/${id}`, data).then(r => r.data),
    delete: (id) => axios.delete(`/api/v1/sucursales/${id}`).then(r => r.data)
  },

  // Categorías
  categories: {
    list: () => axios.get('/api/v1/categorias/').then(r => r.data),
    get: (id) => axios.get(`/api/v1/categorias/${id}`).then(r => r.data),
    create: (data) => axios.post('/api/v1/categorias/', data).then(r => r.data),
    update: (id, data) => axios.put(`/api/v1/categorias/${id}`, data).then(r => r.data),
    delete: (id) => axios.delete(`/api/v1/categorias/${id}`).then(r => r.data)
  },

  // Inventario Base
  inventory: {
    list: () => axios.get('/api/v1/inventario/').then(r => r.data),
    get: (id) => axios.get(`/api/v1/inventario/${id}`).then(r => r.data),
    create: (data) => axios.post('/api/v1/inventario/', data).then(r => r.data),
    update: (id, data) => axios.put(`/api/v1/inventario/${id}`, data).then(r => r.data),
    delete: (id) => axios.delete(`/api/v1/inventario/${id}`).then(r => r.data)
  },

  // Clientes
  clients: {
    list: () => axios.get('/api/v1/clientes/').then(r => r.data),
    get: (id) => axios.get(`/api/v1/clientes/${id}`).then(r => r.data),
    create: (data) => axios.post('/api/v1/clientes/', data).then(r => r.data),
    update: (id, data) => axios.put(`/api/v1/clientes/${id}`, data).then(r => r.data),
    delete: (id) => axios.delete(`/api/v1/clientes/${id}`).then(r => r.data)
  },

  // Proveedores
  suppliers: {
    list: () => axios.get('/api/v1/proveedores/').then(r => r.data),
    get: (id) => axios.get(`/api/v1/proveedores/${id}`).then(r => r.data),
    create: (data) => axios.post('/api/v1/proveedores/', data).then(r => r.data),
    update: (id, data) => axios.put(`/api/v1/proveedores/${id}`, data).then(r => r.data),
    delete: (id) => axios.delete(`/api/v1/proveedores/${id}`).then(r => r.data)
  },

  // Movimientos de Inventario
  movements: {
    list: (sucursalId) => {
      const url = sucursalId ? `/api/v1/movimientos/?sucursal_id=${sucursalId}` : '/api/v1/movimientos/';
      return axios.get(url).then(r => r.data);
    },
    create: (data) => axios.post('/api/v1/movimientos/', data).then(r => r.data)
  },

  // Traslados Intersucursales
  transfers: {
    list: (sucursalId) => {
      const url = sucursalId ? `/api/v1/traslados/?sucursal_id=${sucursalId}` : '/api/v1/traslados/';
      return axios.get(url).then(r => r.data);
    },
    create: (data) => axios.post('/api/v1/traslados/', data).then(r => r.data),
    authorize: (id) => axios.put(`/api/v1/traslados/${id}/autorizar`).then(r => r.data),
    approve: (id) => axios.put(`/api/v1/traslados/${id}/aprobar`).then(r => r.data),
    reject: (id) => axios.put(`/api/v1/traslados/${id}/rechazar`).then(r => r.data)
  },

  // Kardex
  kardex: {
    list: (productoId, sucursalId) => {
      let url = '/api/v1/kardex/';
      const params = [];
      if (productoId) params.push(`producto_id=${productoId}`);
      if (sucursalId) params.push(`sucursal_id=${sucursalId}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      return axios.get(url).then(r => r.data);
    },
    downloadPdfUrl: (productoId, sucursalId) => {
      return `/api/v1/reportes/kardex/pdf?producto_id=${productoId}&sucursal_id=${sucursalId}`;
    }
  },

  // Facturación
  facturacion: {
    crear: (data) => axios.post('/api/v1/facturacion/', data).then(r => r.data),
    list: (skip = 0, limit = 100) => axios.get(`/api/v1/facturacion/?skip=${skip}&limit=${limit}`).then(r => r.data),
    get: (id) => axios.get(`/api/v1/facturacion/${id}`).then(r => r.data),
  },

  // Contabilidad
  accounting: {
    getAccounts: () => axios.get('/api/v1/contabilidad/accounts').then(r => r.data),
    getEntries: (sucursalId) => {
      const url = sucursalId ? `/api/v1/contabilidad/entries?sucursal_id=${sucursalId}` : '/api/v1/contabilidad/entries';
      return axios.get(url).then(r => r.data);
    },
    getEntry: (id) => axios.get(`/api/v1/contabilidad/entries/${id}`).then(r => r.data)
  },

  // Reportes
  reports: {
    getValuation: (sucursalId, categoriaId, search) => {
      let url = '/api/v1/reportes/valuation';
      const params = [];
      if (sucursalId) params.push(`sucursal_id=${sucursalId}`);
      if (categoriaId) params.push(`categoria_id=${categoriaId}`);
      if (search) params.push(`query=${encodeURIComponent(search)}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      return axios.get(url).then(r => r.data);
    },
    getBalances: () => axios.get('/api/v1/reportes/balances').then(r => r.data),
    downloadBalancesPdfUrl: () => '/api/v1/reportes/balances/pdf',
    // Reporte de ventas
    getVentas: (filtros = {}) => {
      const params = new URLSearchParams();
      if (filtros.codigo) params.append('codigo', filtros.codigo);
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
      const qs = params.toString();
      return axios.get(`/api/v1/reportes/ventas${qs ? '?' + qs : ''}`).then(r => r.data);
    },
    downloadVentasPdfUrl: (filtros = {}) => {
      const params = new URLSearchParams(filtros);
      return `/api/v1/reportes/ventas/pdf?${params.toString()}`;
    },
    downloadVentasExcelUrl: (filtros = {}) => {
      const params = new URLSearchParams(filtros);
      return `/api/v1/reportes/ventas/excel?${params.toString()}`;
    },
  },

  dashboard: {
    getStats: (sucursalId) => {
      const url = sucursalId ? `/api/v1/dashboard/stats?sucursal_id=${sucursalId}` : '/api/v1/dashboard/stats';
      return axios.get(url).then(r => r.data);
    },
    getCategories: (sucursalId) => {
      const url = sucursalId ? `/api/v1/dashboard/categories?sucursal_id=${sucursalId}` : '/api/v1/dashboard/categories';
      return axios.get(url).then(r => r.data);
    },
    getTrends: (sucursalId) => {
      const url = sucursalId ? `/api/v1/dashboard/trends?sucursal_id=${sucursalId}` : '/api/v1/dashboard/trends';
      return axios.get(url).then(r => r.data);
    }
  }
};
