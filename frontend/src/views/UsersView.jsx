import { useEffect, useState } from 'react'
import { Users, Plus, Pencil, Trash2, X, Shield, Building, Key, ShieldAlert } from 'lucide-react'
import axios from 'axios'

const emptyUser = { nombre: '', email: '', password: '', role_id: '', sucursal_id: '', activo: true }
const emptyRole = { nombre: '', descripcion: '', permisos: { all: false, kardex: false, reportes: false, contabilidad: false, traslados: false, movimientos: false } }

export default function UsersView() {
  const [activeTab, setActiveTab] = useState('usuarios') // 'usuarios' o 'roles'
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [sucursales, setSucursales] = useState([])

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

  useEffect(() => { fetchData() }, [])

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

  const handleUserDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return
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
    setRoleForm(prev => {
      const nextPermisos = { ...prev.permisos, [permName]: !prev.permisos[permName] }
      // Si se activa "all", se pueden activar todos
      if (permName === 'all' && nextPermisos.all) {
        Object.keys(nextPermisos).forEach(k => nextPermisos[k] = true)
      } else if (permName === 'all' && !nextPermisos.all) {
        Object.keys(nextPermisos).forEach(k => nextPermisos[k] = false)
      }
      return { ...prev, permisos: nextPermisos }
    })
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users size={28} /> Gestión de Accesos y Seguridad
          </h1>
          <p className="text-dark-400 mt-1">Control de accesos, creación de usuarios y asignación dinámica de roles y permisos</p>
        </div>
        <div>
          {activeTab === 'usuarios' ? (
            <button
              onClick={openNewUser}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium text-sm hover:from-primary-500 hover:to-primary-600 transition-all shadow-lg shadow-primary-500/25"
              id="btn-new-user"
            >
              <Plus size={18} /> Nuevo Usuario
            </button>
          ) : (
            <button
              onClick={openNewRole}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-650 to-indigo-750 text-white rounded-xl font-medium text-sm hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-lg shadow-indigo-600/25"
              id="btn-new-role"
            >
              <Plus size={18} /> Nuevo Rol
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-dark-800/80">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'usuarios'
              ? 'border-primary-500 text-primary-400 bg-primary-500/5'
              : 'border-transparent text-dark-400 hover:text-white'
          }`}
        >
          Usuarios
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'roles'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-dark-400 hover:text-white'
          }`}
        >
          Roles del Sistema
        </button>
      </div>

      {/* Tab: Usuarios */}
      {activeTab === 'usuarios' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" id="users-table">
              <thead>
                <tr className="border-b border-dark-700/50 bg-dark-800/40">
                  <th className="text-left py-3.5 px-5 text-dark-400 font-medium">ID</th>
                  <th className="text-left py-3.5 px-5 text-dark-400 font-medium">Nombre</th>
                  <th className="text-left py-3.5 px-5 text-dark-400 font-medium">Email</th>
                  <th className="text-left py-3.5 px-5 text-dark-400 font-medium">Rol</th>
                  <th className="text-left py-3.5 px-5 text-dark-400 font-medium">Sucursal Asignada</th>
                  <th className="text-center py-3.5 px-5 text-dark-400 font-medium">Estado</th>
                  <th className="text-center py-3.5 px-5 text-dark-400 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                    <td className="py-3 px-5 text-dark-300 font-mono">{u.id}</td>
                    <td className="py-3 px-5 text-white font-medium">{u.nombre}</td>
                    <td className="py-3 px-5 text-dark-300">{u.email}</td>
                    <td className="py-3 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-500/15 text-primary-400 rounded-lg text-xs font-medium">
                        <Shield size={12} /> {getRoleName(u.role_id)}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/15 text-indigo-400 rounded-lg text-xs font-medium">
                        <Building size={12} /> {getBranchName(u.sucursal_id)}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${u.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openUserEdit(u)} className="p-2 rounded-lg text-dark-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all" title="Editar Usuario"><Pencil size={16} /></button>
                        <button onClick={() => handleUserDelete(u.id)} className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Eliminar Usuario"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-dark-500">No hay usuarios registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Roles */}
      {activeTab === 'roles' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" id="roles-table">
              <thead>
                <tr className="border-b border-dark-700/50 bg-dark-800/40">
                  <th className="text-left py-3.5 px-5 text-dark-400 font-medium">ID</th>
                  <th className="text-left py-3.5 px-5 text-dark-400 font-medium">Rol</th>
                  <th className="text-left py-3.5 px-5 text-dark-400 font-medium">Descripción</th>
                  <th className="text-left py-3.5 px-5 text-dark-400 font-medium">Permisos Habilitados</th>
                  <th className="text-center py-3.5 px-5 text-dark-400 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                    <td className="py-3 px-5 text-dark-300 font-mono">{r.id}</td>
                    <td className="py-3 px-5 text-white font-medium">{r.nombre}</td>
                    <td className="py-3 px-5 text-dark-300">{r.descripcion || 'Sin descripción'}</td>
                    <td className="py-3 px-5">
                      <div className="flex flex-wrap gap-1.5">
                        {r.permisos?.all ? (
                          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-lg text-xs font-semibold">Total (Admin)</span>
                        ) : (
                          <>
                            {Object.entries(r.permisos || {}).map(([key, enabled]) => {
                              if (!enabled) return null
                              return (
                                <span key={key} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-semibold capitalize">
                                  {key}
                                </span>
                              )
                            })}
                            {Object.values(r.permisos || {}).every(v => !v) && (
                              <span className="text-dark-500 italic text-xs">Ninguno</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openRoleEdit(r)} className="p-2 rounded-lg text-dark-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all" title="Editar Rol"><Pencil size={16} /></button>
                        {r.id > 3 ? (
                          <button onClick={() => handleRoleDelete(r.id)} className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Eliminar Rol"><Trash2 size={16} /></button>
                        ) : (
                          <span className="p-2 text-dark-600 cursor-not-allowed" title="Rol Semilla (Protegido)"><Key size={16} /></span>
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
          <div className="glass rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button onClick={() => setShowUserModal(false)} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50"><X size={18} /></button>
            </div>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">Nombre Completo</label>
                <input type="text" required value={userForm.nombre} onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
                  placeholder="Juan Pérez"
                  className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">Dirección de Email</label>
                <input type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="juan@example.com"
                  className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
              </div>
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">Contraseña {editingUser && <span className="text-dark-500">(vacío para mantener actual)</span>}</label>
                <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  {...(!editingUser && { required: true })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-1.5">Rol de Acceso</label>
                  <select value={userForm.role_id} onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer">
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1.5">Sucursal de Operación</label>
                  <select value={userForm.sucursal_id} onChange={(e) => setUserForm({ ...userForm, sucursal_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer">
                    <option value="">Acceso Global / Ninguna</option>
                    {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" checked={userForm.activo} onChange={(e) => setUserForm({ ...userForm, activo: e.target.checked })}
                  className="rounded border-dark-600 cursor-pointer" id="user-active-check" />
                <label htmlFor="user-active-check" className="text-sm text-dark-300 cursor-pointer">Habilitar acceso de usuario al sistema</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2.5 border border-dark-700/50 text-dark-300 rounded-xl text-sm hover:bg-dark-700/30 transition-all">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-medium hover:from-primary-500 hover:to-primary-600 transition-all shadow-lg shadow-primary-500/25">
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Creation / Edit Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</h2>
              <button onClick={() => setShowRoleModal(false)} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50"><X size={18} /></button>
            </div>
            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">Nombre del Rol</label>
                <input type="text" required value={roleForm.nombre} onChange={(e) => setRoleForm({ ...roleForm, nombre: e.target.value })}
                  placeholder="Ej. Ventas, Auditor"
                  className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              
              <div>
                <label className="block text-sm text-dark-300 mb-1.5">Descripción</label>
                <textarea value={roleForm.descripcion} onChange={(e) => setRoleForm({ ...roleForm, descripcion: e.target.value })} rows={2}
                  placeholder="Propósito u alcance operativo de este perfil..."
                  className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2 font-semibold">Permisos Habilitados</label>
                <div className="p-4 bg-dark-800/40 border border-dark-700/40 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 border-b border-dark-700/30 pb-2">
                    <input type="checkbox" id="perm-all" checked={roleForm.permisos.all} onChange={() => handlePermisoChange('all')}
                      className="rounded border-dark-600 text-indigo-650 cursor-pointer" />
                    <label htmlFor="perm-all" className="text-sm font-bold text-white cursor-pointer flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-rose-400" /> Acceso Total (Administrador Global)
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-dark-300 pt-1">
                    {[
                      { key: 'movimientos', label: 'Movimientos Stock' },
                      { key: 'traslados', label: 'Traslados Intersucursales' },
                      { key: 'kardex', label: 'Kardex Valorado' },
                      { key: 'contabilidad', label: 'Asientos Contables' },
                      { key: 'reportes', label: 'Reportes Financieros' }
                    ].map((perm) => (
                      <div key={perm.key} className="flex items-center gap-2">
                        <input type="checkbox" id={`perm-${perm.key}`} checked={roleForm.permisos[perm.key]} onChange={() => handlePermisoChange(perm.key)}
                          disabled={roleForm.permisos.all}
                          className="rounded border-dark-600 text-indigo-650 cursor-pointer disabled:opacity-50" />
                        <label htmlFor={`perm-${perm.key}`} className="cursor-pointer select-none disabled:opacity-50">
                          {perm.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRoleModal(false)}
                  className="flex-1 px-4 py-2.5 border border-dark-700/50 text-dark-300 rounded-xl text-sm hover:bg-dark-700/30 transition-all">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-sm font-medium hover:from-indigo-500 hover:to-indigo-600 transition-all shadow-lg shadow-indigo-600/25">
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
