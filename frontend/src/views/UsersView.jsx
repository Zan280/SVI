import { useEffect, useState } from 'react'
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Shield,
  Building,
  Key,
  ShieldAlert,
  Search,
  CheckCircle,
  XCircle,
  Filter,
  Check,
  Ban
} from 'lucide-react'
import axios from 'axios'

const emptyUser = { nombre: '', email: '', password: '', role_id: '', sucursal_id: '', activo: true }
const emptyRole = {
  nombre: '',
  descripcion: '',
  permisos: { all: false, kardex: false, reportes: false, contabilidad: false, traslados: false, movimientos: false }
}

export default function UsersView() {
  const [activeTab, setActiveTab] = useState('usuarios') // 'usuarios' o 'roles'
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [sucursales, setSucursales] = useState([])

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'active', 'inactive'

  // User Modal State
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState(emptyUser)

  // Role Modal State
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [roleForm, setRoleForm] = useState(emptyRole)

  const fetchData = async () => {
    try {
      const [uRes, rRes, sRes] = await Promise.all([
        axios.get('/api/v1/usuarios/'),
        axios.get('/api/v1/usuarios/roles'),
        axios.get('/api/v1/sucursales/'),
      ])
      setUsuarios(uRes.data)
      setRoles(rRes.data)
      setSucursales(sRes.data)
    } catch (err) {
      console.error('Error fetching data:', err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // --- USER HANDLERS ---
  const handleUserSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        nombre: userForm.nombre,
        email: userForm.email,
        role_id: parseInt(userForm.role_id),
        sucursal_id: userForm.sucursal_id ? parseInt(userForm.sucursal_id) : null,
        activo: userForm.activo
      }

      if (editingUser) {
        if (userForm.password) payload.password = userForm.password
        await axios.put(`/api/v1/usuarios/${editingUser}`, payload)
      } else {
        payload.password = userForm.password
        await axios.post('/api/v1/usuarios/', payload)
      }

      setShowUserModal(false)
      setEditingUser(null)
      setUserForm(emptyUser)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al guardar usuario')
    }
  }

  const handleToggleStatus = async (user) => {
    try {
      await axios.put(`/api/v1/usuarios/${user.id}`, {
        activo: !user.activo
      })
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al cambiar estado del usuario')
    }
  }

  const handleUserDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario? Perderá acceso inmediato al sistema y a Google OAuth.')) return
    try {
      await axios.delete(`/api/v1/usuarios/${id}`)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar usuario')
    }
  }

  const openUserEdit = (user) => {
    setEditingUser(user.id)
    setUserForm({
      nombre: user.nombre,
      email: user.email,
      password: '',
      role_id: user.role_id.toString(),
      sucursal_id: user.sucursal_id ? user.sucursal_id.toString() : '',
      activo: user.activo
    })
    setShowUserModal(true)
  }

  const openNewUser = () => {
    setEditingUser(null)
    setUserForm({
      ...emptyUser,
      role_id: roles[0]?.id?.toString() || ''
    })
    setShowUserModal(true)
  }

  // --- ROLE HANDLERS ---
  const handleRoleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        nombre: roleForm.nombre,
        descripcion: roleForm.descripcion,
        permisos: roleForm.permisos
      }

      if (editingRole) {
        await axios.put(`/api/v1/usuarios/roles/${editingRole}`, payload)
      } else {
        await axios.post('/api/v1/usuarios/roles', payload)
      }

      setShowRoleModal(false)
      setEditingRole(null)
      setRoleForm(emptyRole)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al guardar rol')
    }
  }

  const handleRoleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este rol? Esta acción fallará si el rol está asignado a algún usuario.')) return
    try {
      await axios.delete(`/api/v1/usuarios/roles/${id}`)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'No se pudo eliminar el rol. Es posible que esté asignado a usuarios del sistema.')
    }
  }

  const openRoleEdit = (role) => {
    setEditingRole(role.id)
    setRoleForm({
      nombre: role.nombre,
      descripcion: role.descripcion || '',
      permisos: {
        all: role.permisos?.all || false,
        kardex: role.permisos?.kardex || false,
        reportes: role.permisos?.reportes || false,
        contabilidad: role.permisos?.contabilidad || false,
        traslados: role.permisos?.traslados || false,
        movimientos: role.permisos?.movimientos || false,
      }
    })
    setShowRoleModal(true)
  }

  const openNewRole = () => {
    setEditingRole(null)
    setRoleForm(emptyRole)
    setShowRoleModal(true)
  }

  const getRoleName = (id) => roles.find((r) => r.id === id)?.nombre || '-'
  const getBranchName = (id) => sucursales.find((s) => s.id === id)?.nombre || 'Acceso Global'

  const handlePermisoChange = (permName) => {
    setRoleForm((prev) => {
      const nextPermisos = { ...prev.permisos, [permName]: !prev.permisos[permName] }
      if (permName === 'all' && nextPermisos.all) {
        Object.keys(nextPermisos).forEach((k) => (nextPermisos[k] = true))
      } else if (permName === 'all' && !nextPermisos.all) {
        Object.keys(nextPermisos).forEach((k) => (nextPermisos[k] = false))
      }
      return { ...prev, permisos: nextPermisos }
    })
  }

  // Filtrar usuarios dinámicamente
  const filteredUsers = usuarios.filter((u) => {
    const matchesSearch =
      u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = filterRole === '' || u.role_id.toString() === filterRole

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && u.activo) ||
      (filterStatus === 'inactive' && !u.activo)

    return matchesSearch && matchesRole && matchesStatus
  })

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Users size={28} className="text-indigo-600 dark:text-indigo-400" /> Administración de Usuarios (Whitelist ERP)
          </h1>
          <p className="text-slate-500 dark:text-dark-400 mt-1">
            Gestión de cuentas autorizadas, asignación de roles y control de lista blanca para Google OAuth
          </p>
        </div>
        <div>
          {activeTab === 'usuarios' ? (
            <button
              onClick={openNewUser}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 active:scale-98"
              id="btn-new-user"
            >
              <Plus size={18} /> Añadir Usuario (Whitelist)
            </button>
          ) : (
            <button
              onClick={openNewRole}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-600/25 active:scale-98"
              id="btn-new-role"
            >
              <Plus size={18} /> Nuevo Rol
            </button>
          )}
        </div>
      </div>

      {/* Banner Informativo Whitelist Google */}
      <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4 flex items-start gap-3.5 text-sm text-indigo-900 dark:text-indigo-200">
        <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Lista Blanca de Acceso (Google OAuth):</span> Todos los usuarios creados en este módulo en estado <span className="font-bold underline">Activo</span> pueden iniciar sesión inmediatamente con su cuenta de Google. Si un usuario no está registrado o se marca como <span className="font-bold">Inactivo</span>, el sistema rechazará su acceso automáticamente.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-dark-800">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'usuarios'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-500 dark:text-dark-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Usuarios Registrados ({filteredUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'roles'
              ? 'border-violet-600 text-violet-600 dark:border-violet-500 dark:text-violet-400 bg-violet-500/5'
              : 'border-transparent text-slate-500 dark:text-dark-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Roles y Permisos ({roles.length})
        </button>
      </div>

      {/* Tab: Usuarios */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          {/* Filtros y Buscador */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-dark-500" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700/60 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-dark-500 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Filtro por Rol */}
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-dark-500" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700/60 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
              >
                <option value="">Todos los Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Estado */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700/60 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
              >
                <option value="all">Todos los Estados</option>
                <option value="active">Solo Activos (Whitelist Habilitada)</option>
                <option value="inactive">Solo Inactivos (Acceso Bloqueado)</option>
              </select>
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="glass rounded-2xl overflow-hidden border border-slate-200/80 dark:border-dark-700/60 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" id="users-table">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-dark-700/50 bg-slate-100/50 dark:bg-dark-800/40">
                    <th className="text-left py-3.5 px-5 text-slate-600 dark:text-dark-400 font-semibold">ID</th>
                    <th className="text-left py-3.5 px-5 text-slate-600 dark:text-dark-400 font-semibold">Usuario</th>
                    <th className="text-left py-3.5 px-5 text-slate-600 dark:text-dark-400 font-semibold">Correo / Lista Blanca</th>
                    <th className="text-left py-3.5 px-5 text-slate-600 dark:text-dark-400 font-semibold">Rol Asignado</th>
                    <th className="text-left py-3.5 px-5 text-slate-600 dark:text-dark-400 font-semibold">Sucursal</th>
                    <th className="text-center py-3.5 px-5 text-slate-600 dark:text-dark-400 font-semibold">Google OAuth</th>
                    <th className="text-center py-3.5 px-5 text-slate-600 dark:text-dark-400 font-semibold">Estado</th>
                    <th className="text-center py-3.5 px-5 text-slate-600 dark:text-dark-400 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-slate-200/60 dark:border-dark-800/50 hover:bg-slate-50 dark:hover:bg-dark-800/30 transition-colors">
                      <td className="py-3.5 px-5 text-slate-500 dark:text-dark-400 font-mono text-xs">#{u.id}</td>
                      <td className="py-3.5 px-5 text-slate-900 dark:text-white font-medium">{u.nombre}</td>
                      <td className="py-3.5 px-5 text-slate-700 dark:text-dark-300 font-mono text-xs">{u.email}</td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold">
                          <Shield size={13} /> {getRoleName(u.role_id)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/10 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 rounded-lg text-xs font-medium">
                          <Building size={13} /> {getBranchName(u.sucursal_id)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {u.activo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-medium border border-emerald-500/20">
                            <CheckCircle size={12} /> Permitido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-medium border border-rose-500/20">
                            <XCircle size={12} /> Denegado
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                            u.activo
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25'
                          }`}
                          title="Haz clic para cambiar el estado"
                        >
                          {u.activo ? (
                            <>
                              <Check size={12} /> Activo
                            </>
                          ) : (
                            <>
                              <Ban size={12} /> Inactivo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openUserEdit(u)}
                            className="p-2 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                            title="Editar Usuario"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleUserDelete(u.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                            title="Eliminar Usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-dark-500">
                        No se encontraron usuarios con los criterios seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Roles */}
      {activeTab === 'roles' && (
        <div className="glass rounded-2xl overflow-hidden border border-slate-200/80 dark:border-dark-700/60 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" id="roles-table">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-700/50 bg-slate-100/50 dark:bg-dark-800/40">
                  <th className="text-left py-3.5 px-5 text-slate-600 dark:text-dark-400 font-semibold">ID</th>
                  <th className="text-left py-3.5 px-5 text-slate-600 dark:text-dark-400 font-semibold">Rol</th>
                  <th className="text-left py-3.5 px-5 text-slate-600 dark:text-dark-400 font-semibold">Descripción</th>
                  <th className="text-left py-3.5 px-5 text-slate-600 dark:text-dark-400 font-semibold">Permisos Habilitados</th>
                  <th className="text-center py-3.5 px-5 text-slate-600 dark:text-dark-400 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id} className="border-b border-slate-200/60 dark:border-dark-800/50 hover:bg-slate-50 dark:hover:bg-dark-800/30 transition-colors">
                    <td className="py-3.5 px-5 text-slate-500 dark:text-dark-400 font-mono text-xs">#{r.id}</td>
                    <td className="py-3.5 px-5 text-slate-900 dark:text-white font-medium">{r.nombre}</td>
                    <td className="py-3.5 px-5 text-slate-600 dark:text-dark-300">{r.descripcion || 'Sin descripción'}</td>
                    <td className="py-3.5 px-5">
                      <div className="flex flex-wrap gap-1.5">
                        {r.permisos?.all ? (
                          <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold">Acceso Total (Admin)</span>
                        ) : (
                          <>
                            {Object.entries(r.permisos || {}).map(([key, enabled]) => {
                              if (!enabled) return null
                              return (
                                <span key={key} className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold capitalize">
                                  {key}
                                </span>
                              )
                            })}
                            {Object.values(r.permisos || {}).every((v) => !v) && (
                              <span className="text-slate-400 dark:text-dark-500 italic text-xs">Ninguno</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openRoleEdit(r)} className="p-2 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-all" title="Editar Rol">
                          <Pencil size={16} />
                        </button>
                        {r.id > 3 ? (
                          <button onClick={() => handleRoleDelete(r.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Eliminar Rol">
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span className="p-2 text-slate-300 dark:text-dark-600 cursor-not-allowed" title="Rol Protegido">
                            <Key size={16} />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Creation / Edit Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto border border-slate-200/80 dark:border-dark-700/60">
            <div className="flex items-center justify-between mb-5 border-b border-slate-200 dark:border-dark-700/50 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingUser ? 'Editar Usuario / Whitelist' : 'Añadir Usuario a Whitelist'}</h2>
              <button onClick={() => setShowUserModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-dark-700/50 transition-all">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-dark-300 mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={userForm.nombre}
                  onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
                  placeholder="Juan Pérez"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700/60 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-dark-500 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-dark-300 mb-1.5">Correo Electrónico (Google / ERP)</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="nombre@empresa.com"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700/60 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-dark-500 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-dark-300 mb-1.5">
                  Contraseña {editingUser && <span className="text-slate-400 dark:text-dark-500 font-normal lowercase">(deja en blanco para no cambiar)</span>}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  {...(!editingUser && { required: true })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700/60 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-dark-500 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-dark-300 mb-1.5">Rol de Acceso</label>
                  <select
                    value={userForm.role_id}
                    onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700/60 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-dark-300 mb-1.5">Sucursal Operativa</label>
                  <select
                    value={userForm.sucursal_id}
                    onChange={(e) => setUserForm({ ...userForm, sucursal_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700/60 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
                  >
                    <option value="">Acceso Global</option>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  checked={userForm.activo}
                  onChange={(e) => setUserForm({ ...userForm, activo: e.target.checked })}
                  className="rounded border-slate-300 dark:border-dark-600 text-indigo-600 cursor-pointer w-4 h-4"
                  id="user-active-check"
                />
                <label htmlFor="user-active-check" className="text-sm font-medium text-slate-700 dark:text-dark-300 cursor-pointer select-none">
                  Habilitar usuario en Lista Blanca (Acceso ERP y Google OAuth)
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-dark-700 text-slate-600 dark:text-dark-300 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-dark-800 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/25 active:scale-98"
                >
                  {editingUser ? 'Guardar Cambios' : 'Añadir a Whitelist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Creation / Edit Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto border border-slate-200/80 dark:border-dark-700/60">
            <div className="flex items-center justify-between mb-5 border-b border-slate-200 dark:border-dark-700/50 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</h2>
              <button onClick={() => setShowRoleModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-dark-700/50 transition-all">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-dark-300 mb-1.5">Nombre del Rol</label>
                <input
                  type="text"
                  required
                  value={roleForm.nombre}
                  onChange={(e) => setRoleForm({ ...roleForm, nombre: e.target.value })}
                  placeholder="Ej. Ventas, Auditor"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700/60 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-dark-500 outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-dark-300 mb-1.5">Descripción</label>
                <textarea
                  value={roleForm.descripcion}
                  onChange={(e) => setRoleForm({ ...roleForm, descripcion: e.target.value })}
                  rows={2}
                  placeholder="Propósito u alcance operativo de este perfil..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700/60 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-dark-500 outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-dark-300 mb-2">Permisos Habilitados</label>
                <div className="p-4 bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700/60 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-dark-700/40 pb-2">
                    <input
                      type="checkbox"
                      id="perm-all"
                      checked={roleForm.permisos.all}
                      onChange={() => handlePermisoChange('all')}
                      className="rounded border-slate-300 dark:border-dark-600 text-violet-600 cursor-pointer w-4 h-4"
                    />
                    <label htmlFor="perm-all" className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer flex items-center gap-1.5 select-none">
                      <ShieldAlert size={14} className="text-rose-500" /> Acceso Total (Administrador Global)
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700 dark:text-dark-300 pt-1">
                    {[
                      { key: 'movimientos', label: 'Movimientos Stock' },
                      { key: 'traslados', label: 'Traslados Intersucursales' },
                      { key: 'kardex', label: 'Kardex Valorado' },
                      { key: 'contabilidad', label: 'Asientos Contables' },
                      { key: 'reportes', label: 'Reportes Financieros' }
                    ].map((perm) => (
                      <div key={perm.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`perm-${perm.key}`}
                          checked={roleForm.permisos[perm.key]}
                          onChange={() => handlePermisoChange(perm.key)}
                          disabled={roleForm.permisos.all}
                          className="rounded border-slate-300 dark:border-dark-600 text-violet-600 cursor-pointer disabled:opacity-50 w-4 h-4"
                        />
                        <label htmlFor={`perm-${perm.key}`} className="cursor-pointer select-none disabled:opacity-50">
                          {perm.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-dark-700 text-slate-600 dark:text-dark-300 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-dark-800 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-600/25 active:scale-98"
                >
                  {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
