export const ROLES = {
  ADMIN: 'Administrador Global',
  CONTADOR: 'Contador',
  ENCARGADO: 'Encargado de Sucursal',
  VENDEDORA: 'Vendedor',
  ALMACEN: 'Inventario / Almacén'
};

/**
 * Determina si un rol de usuario tiene permiso para modificar registros
 * (como crear productos, categorías, clientes o proveedores)
 */
export const canModifyCatalog = (roleName) => {
  return roleName === ROLES.ADMIN;
};

/**
 * Determina si el rol tiene acceso a los reportes financieros o contabilidad general
 */
export const canAccessFinancials = (roleName) => {
  return roleName === ROLES.ADMIN || roleName === ROLES.CONTADOR;
};

/**
 * Determina si el rol está segmentado a una sola sucursal (Encargado, Vendedor, Almacén)
 */
export const isBranchSegmented = (roleName) => {
  return roleName === ROLES.ENCARGADO || roleName === ROLES.VENDEDORA || roleName === ROLES.ALMACEN;
};

/**
 * Retorna las opciones de navegación autorizadas según el rol de usuario
 */
export const getAuthorizedMenu = (roleName) => {
  const menu = [
    { name: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
    { name: 'Inventario Base', path: '/inventario', icon: 'Package' },
  ];

  if (roleName === ROLES.ADMIN) {
    menu.push(
      { name: 'Usuarios', path: '/usuarios', icon: 'UserCircle' },
      { name: 'Sucursales', path: '/sucursales', icon: 'Store' },
      { name: 'Categorías', path: '/categorias', icon: 'FolderTree' },
      { name: 'Clientes', path: '/clientes', icon: 'Users' },
      { name: 'Proveedores', path: '/proveedores', icon: 'Truck' }
    );
  }

  // Todos pueden registrar movimientos, pero con diferentes alcances.
  menu.push(
    { name: 'Movimientos', path: '/movimientos', icon: 'ArrowLeftRight' }
  );

  // Vendedor no tiene acceso a Traslados intersucursales (sólo Almacen, Encargado, Contador, Admin)
  if (roleName !== ROLES.VENDEDORA) {
    menu.push(
      { name: 'Traslados', path: '/traslados', icon: 'Shuffle' }
    );
  }

  if (canAccessFinancials(roleName)) {
    menu.push(
      { name: 'Kardex Valorado', path: '/kardex', icon: 'BookOpen' },
      { name: 'Contabilidad (Asientos)', path: '/contabilidad', icon: 'Coins' },
      { name: 'Reportes Financieros', path: '/reportes', icon: 'BarChart3' }
    );
  }

  return menu;
};
