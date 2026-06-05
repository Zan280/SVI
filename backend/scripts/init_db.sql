-- ============================================================
-- ERP MULTISUCURSAL - Script de Inicialización Completo
-- Moneda: NIO (Córdobas)
-- 13 tablas: roles, sucursales, usuarios, categorias,
--   clientes, proveedores, inventario_base, inventario_sucursal,
--   movimientos_inventario, traslados, kardex,
--   plan_cuentas, asientos_contables, detalle_asientos
-- ============================================================

-- ============================================================
-- 1. FUNCIÓN DE TRIGGER PARA ACTUALIZAR "actualizado_en"
-- ============================================================
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 2. TABLA: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(50)  NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    permisos    JSONB        DEFAULT '{}',
    creado_en   TIMESTAMP    DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trg_roles_actualizado
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();


-- ============================================================
-- 3. TABLA: sucursales
-- ============================================================
CREATE TABLE IF NOT EXISTS sucursales (
    id        SERIAL PRIMARY KEY,
    nombre    VARCHAR(100) NOT NULL UNIQUE,
    codigo    VARCHAR(20)  NOT NULL UNIQUE,
    direccion TEXT,
    telefono  VARCHAR(20),
    activa    BOOLEAN      DEFAULT TRUE,
    creado_en    TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trg_sucursales_actualizado
    BEFORE UPDATE ON sucursales
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();


-- ============================================================
-- 4. TABLA: usuarios (con sucursal_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id            SERIAL PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id       INTEGER      NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    sucursal_id   INTEGER      REFERENCES sucursales(id) ON DELETE SET NULL,
    activo        BOOLEAN      DEFAULT TRUE,
    creado_en     TIMESTAMP    DEFAULT NOW(),
    actualizado_en TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email    ON usuarios(email);
CREATE INDEX idx_usuarios_role     ON usuarios(role_id);
CREATE INDEX idx_usuarios_sucursal ON usuarios(sucursal_id);

CREATE TRIGGER trg_usuarios_actualizado
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();


-- ============================================================
-- 5. TABLA: categorias
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    creado_en   TIMESTAMP DEFAULT NOW()
);


-- ============================================================
-- 6. TABLA: clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS clientes (
    id        SERIAL PRIMARY KEY,
    nombre    VARCHAR(150) NOT NULL,
    rfc_nit   VARCHAR(20)  UNIQUE,
    email     VARCHAR(150),
    telefono  VARCHAR(20),
    direccion TEXT,
    creado_en    TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clientes_rfc ON clientes(rfc_nit);

CREATE TRIGGER trg_clientes_actualizado
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();


-- ============================================================
-- 7. TABLA: proveedores
-- ============================================================
CREATE TABLE IF NOT EXISTS proveedores (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    rfc_nit         VARCHAR(20)  UNIQUE,
    contacto_nombre VARCHAR(100),
    email           VARCHAR(150),
    telefono        VARCHAR(20),
    direccion       TEXT,
    creado_en       TIMESTAMP DEFAULT NOW(),
    actualizado_en  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proveedores_rfc ON proveedores(rfc_nit);

CREATE TRIGGER trg_proveedores_actualizado
    BEFORE UPDATE ON proveedores
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();


-- ============================================================
-- 8. TABLA: inventario_base (con categoria_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS inventario_base (
    id             SERIAL PRIMARY KEY,
    codigo_barras  VARCHAR(50)    NOT NULL UNIQUE,
    nombre         VARCHAR(200)   NOT NULL,
    descripcion    TEXT,
    categoria_id   INTEGER        REFERENCES categorias(id) ON DELETE SET NULL,
    precio_compra  NUMERIC(12,2)  DEFAULT 0.00,
    precio_venta   NUMERIC(12,2)  DEFAULT 0.00,
    unidad_medida  VARCHAR(20)    DEFAULT 'PZA',
    proveedor_id   INTEGER        REFERENCES proveedores(id) ON DELETE SET NULL,
    creado_en      TIMESTAMP      DEFAULT NOW(),
    actualizado_en TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX idx_inventario_codigo     ON inventario_base(codigo_barras);
CREATE INDEX idx_inventario_proveedor  ON inventario_base(proveedor_id);
CREATE INDEX idx_inventario_categoria  ON inventario_base(categoria_id);

CREATE TRIGGER trg_inventario_actualizado
    BEFORE UPDATE ON inventario_base
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();


-- ============================================================
-- 9. TABLA: inventario_sucursal (stock por sucursal)
-- ============================================================
CREATE TABLE IF NOT EXISTS inventario_sucursal (
    id              SERIAL PRIMARY KEY,
    producto_id     INTEGER NOT NULL REFERENCES inventario_base(id) ON DELETE CASCADE,
    sucursal_id     INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    stock_actual    NUMERIC(12,2) DEFAULT 0.00,
    stock_minimo    NUMERIC(12,2) DEFAULT 0.00,
    costo_promedio  NUMERIC(12,4) DEFAULT 0.0000,
    actualizado_en  TIMESTAMP     DEFAULT NOW(),
    UNIQUE(producto_id, sucursal_id)
);

CREATE INDEX idx_inv_suc_producto  ON inventario_sucursal(producto_id);
CREATE INDEX idx_inv_suc_sucursal  ON inventario_sucursal(sucursal_id);

CREATE TRIGGER trg_inv_sucursal_actualizado
    BEFORE UPDATE ON inventario_sucursal
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();


-- ============================================================
-- 10. TABLA: traslados (workflow doble verificación)
-- ============================================================
CREATE TABLE IF NOT EXISTS traslados (
    id                   SERIAL PRIMARY KEY,
    sucursal_origen_id   INTEGER NOT NULL REFERENCES sucursales(id),
    sucursal_destino_id  INTEGER NOT NULL REFERENCES sucursales(id),
    producto_id          INTEGER NOT NULL REFERENCES inventario_base(id),
    cantidad             NUMERIC(12,2) NOT NULL CHECK (cantidad > 0),
    estado               VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                         CHECK (estado IN ('PENDIENTE','AUTORIZADO','APROBADO','RECHAZADO','COMPLETADO')),
    solicitado_por       INTEGER NOT NULL REFERENCES usuarios(id),
    autorizado_por       INTEGER REFERENCES usuarios(id),
    aprobado_por         INTEGER REFERENCES usuarios(id),
    notas                TEXT,
    creado_en            TIMESTAMP DEFAULT NOW(),
    actualizado_en       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_traslados_origen  ON traslados(sucursal_origen_id);
CREATE INDEX idx_traslados_destino ON traslados(sucursal_destino_id);
CREATE INDEX idx_traslados_estado  ON traslados(estado);

CREATE TRIGGER trg_traslados_actualizado
    BEFORE UPDATE ON traslados
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();


-- ============================================================
-- 11. TABLA: movimientos_inventario
-- ============================================================
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id              SERIAL PRIMARY KEY,
    producto_id     INTEGER NOT NULL REFERENCES inventario_base(id),
    sucursal_id     INTEGER NOT NULL REFERENCES sucursales(id),
    tipo            VARCHAR(20) NOT NULL
                    CHECK (tipo IN ('INGRESO_COMPRA','SALIDA_VENTA','AJUSTE_INGRESO','AJUSTE_SALIDA','TRASLADO_INGRESO','TRASLADO_SALIDA')),
    cantidad        NUMERIC(12,2) NOT NULL CHECK (cantidad > 0),
    costo_unitario  NUMERIC(12,4) DEFAULT 0.0000,
    costo_total     NUMERIC(12,4) DEFAULT 0.0000,
    referencia      VARCHAR(100),
    notas           TEXT,
    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
    traslado_id     INTEGER REFERENCES traslados(id),
    fecha           TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mov_producto  ON movimientos_inventario(producto_id);
CREATE INDEX idx_mov_sucursal  ON movimientos_inventario(sucursal_id);
CREATE INDEX idx_mov_tipo      ON movimientos_inventario(tipo);
CREATE INDEX idx_mov_fecha     ON movimientos_inventario(fecha);
CREATE INDEX idx_mov_traslado  ON movimientos_inventario(traslado_id);


-- ============================================================
-- 12. TABLA: kardex (registro valorado CPP)
-- ============================================================
CREATE TABLE IF NOT EXISTS kardex (
    id                        SERIAL PRIMARY KEY,
    producto_id               INTEGER NOT NULL REFERENCES inventario_base(id),
    sucursal_id               INTEGER NOT NULL REFERENCES sucursales(id),
    movimiento_id             INTEGER NOT NULL REFERENCES movimientos_inventario(id),
    tipo                      VARCHAR(20) NOT NULL,
    cantidad                  NUMERIC(12,2) NOT NULL,
    costo_unitario            NUMERIC(12,4) NOT NULL,
    costo_total               NUMERIC(12,4) NOT NULL,
    stock_resultante          NUMERIC(12,2) NOT NULL,
    costo_promedio_resultante NUMERIC(12,4) NOT NULL,
    fecha                     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_kardex_producto  ON kardex(producto_id);
CREATE INDEX idx_kardex_sucursal  ON kardex(sucursal_id);
CREATE INDEX idx_kardex_fecha     ON kardex(fecha);


-- ============================================================
-- 13. TABLA: plan_cuentas (catálogo contable jerárquico)
-- ============================================================
CREATE TABLE IF NOT EXISTS plan_cuentas (
    id              SERIAL PRIMARY KEY,
    codigo          VARCHAR(20) NOT NULL UNIQUE,
    nombre          VARCHAR(150) NOT NULL,
    tipo            VARCHAR(20) NOT NULL CHECK (tipo IN ('ACTIVO','PASIVO','PATRIMONIO','INGRESO','COSTO','GASTO')),
    naturaleza      VARCHAR(10) NOT NULL CHECK (naturaleza IN ('DEUDORA','ACREEDORA')),
    cuenta_padre_id INTEGER REFERENCES plan_cuentas(id),
    es_detalle      BOOLEAN DEFAULT FALSE,
    creado_en       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cuentas_codigo ON plan_cuentas(codigo);
CREATE INDEX idx_cuentas_padre  ON plan_cuentas(cuenta_padre_id);


-- ============================================================
-- 14. TABLA: asientos_contables
-- ============================================================
CREATE TABLE IF NOT EXISTS asientos_contables (
    id             SERIAL PRIMARY KEY,
    numero         VARCHAR(30) NOT NULL UNIQUE,
    fecha          DATE NOT NULL DEFAULT CURRENT_DATE,
    descripcion    TEXT NOT NULL,
    sucursal_id    INTEGER REFERENCES sucursales(id),
    movimiento_id  INTEGER REFERENCES movimientos_inventario(id),
    estado         VARCHAR(15) DEFAULT 'REGISTRADO' CHECK (estado IN ('REGISTRADO','ANULADO')),
    creado_por     INTEGER NOT NULL REFERENCES usuarios(id),
    creado_en      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asientos_fecha    ON asientos_contables(fecha);
CREATE INDEX idx_asientos_sucursal ON asientos_contables(sucursal_id);


-- ============================================================
-- 15. TABLA: detalle_asientos
-- ============================================================
CREATE TABLE IF NOT EXISTS detalle_asientos (
    id         SERIAL PRIMARY KEY,
    asiento_id INTEGER NOT NULL REFERENCES asientos_contables(id) ON DELETE CASCADE,
    cuenta_id  INTEGER NOT NULL REFERENCES plan_cuentas(id),
    debe       NUMERIC(14,2) DEFAULT 0.00,
    haber      NUMERIC(14,2) DEFAULT 0.00,
    glosa      VARCHAR(255)
);

CREATE INDEX idx_det_asiento ON detalle_asientos(asiento_id);
CREATE INDEX idx_det_cuenta  ON detalle_asientos(cuenta_id);


-- ============================================================
-- 16. DATOS SEMILLA (SEED DATA)
-- ============================================================

-- Roles del sistema RBAC (todos los roles del sistema)
INSERT INTO roles (nombre, descripcion, permisos) VALUES
    ('Administrador Global', 'Acceso total a todas las sucursales, finanzas y administración',
     '{"all": true}'),
    ('Contador', 'Acceso a Kardex, asientos contables, reportes financieros e inventario (lectura)',
     '{"kardex": true, "contabilidad": true, "reportes": true, "inventario": ["read"]}'),
    ('Encargado de Sucursal', 'Registrar movimientos de su sucursal asignada, sin acceso a contabilidad global',
     '{"movimientos": true, "traslados": true, "inventario": ["read","write"], "sucursal_propia": true}'),
    ('Vendedor', 'Solo puede registrar ventas (salidas de stock) en su sucursal asignada. Acceso de lectura al catálogo.',
     '{"movimientos": ["SALIDA_VENTA"], "inventario": ["read"]}'),
    ('Inventario / Almacén', 'Gestiona ingresos de mercancía y traslados. No puede registrar ventas directas.',
     '{"movimientos": ["INGRESO_COMPRA","AJUSTE_INGRESO","AJUSTE_SALIDA"], "traslados": true, "inventario": ["read","write"]}'),
    ('Auditor', 'Acceso de solo lectura a Kardex, reportes y movimientos. Sin capacidad de edición.',
     '{"kardex": true, "reportes": true, "movimientos": ["read"]}')
ON CONFLICT (nombre) DO NOTHING;

-- Sucursal inicial
INSERT INTO sucursales (nombre, codigo, direccion, telefono, activa) VALUES
    ('Casa Matriz', 'CM-001', 'Dirección principal', '0000-0000', TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- USUARIOS SEMILLA (passwords en bcrypt bcrypt)
-- admin@erp.local       -> admin123
-- vendedor@erp.local    -> vendedor123
-- almacen@erp.local     -> almacen123
-- contador@erp.local    -> contador123
-- ============================================================
INSERT INTO usuarios (nombre, email, password_hash, role_id, sucursal_id, activo) VALUES
    ('Administrador ERP',
     'admin@erp.local',
     '$2b$12$FCI/1/MtG7E8xb0./4Hwwe7Cohpk7oFZeXbqu7b0u5Qz9PDdx86ee',
     (SELECT id FROM roles WHERE nombre = 'Administrador Global'),
     (SELECT id FROM sucursales WHERE codigo = 'CM-001'),
     TRUE),
    ('Juan Vendedor',
     'vendedor@erp.local',
     '$2b$12$tsbtLOqErgnr16RY5v1e/Owd7IBy6ileawLzsUMIEoxkML9IuoXjq',
     (SELECT id FROM roles WHERE nombre = 'Vendedor'),
     (SELECT id FROM sucursales WHERE codigo = 'CM-001'),
     TRUE),
    ('Carlos Almacén',
     'almacen@erp.local',
     '$2b$12$CBjeDSVSoW8PgGqf.rT5IuGh.XuPdQmQlBrfd5TdeGvxCRJ1APZVG',
     (SELECT id FROM roles WHERE nombre = 'Inventario / Almacén'),
     (SELECT id FROM sucursales WHERE codigo = 'CM-001'),
     TRUE),
    ('María Contadora',
     'contador@erp.local',
     '$2b$12$8yvLQo9OR3kk.RlNJDB8ruuYroAvufgaik3Dl6vcLSLGx0.vJUHH2',
     (SELECT id FROM roles WHERE nombre = 'Contador'),
     (SELECT id FROM sucursales WHERE codigo = 'CM-001'),
     TRUE)
ON CONFLICT (email) DO NOTHING;

-- Categorías base
INSERT INTO categorias (nombre, descripcion) VALUES
    ('General', 'Categoría por defecto'),
    ('Electrónica', 'Dispositivos y componentes electrónicos'),
    ('Alimentos', 'Productos alimenticios y bebidas'),
    ('Limpieza', 'Productos de limpieza e higiene'),
    ('Oficina', 'Papelería y artículos de oficina')
ON CONFLICT (nombre) DO NOTHING;

-- Plan de Cuentas Contable (NIO - Córdobas)
-- Nivel 1: Grupos principales
INSERT INTO plan_cuentas (codigo, nombre, tipo, naturaleza, cuenta_padre_id, es_detalle) VALUES
    ('1',    'ACTIVOS',          'ACTIVO',     'DEUDORA',    NULL, FALSE),
    ('2',    'PASIVOS',          'PASIVO',     'ACREEDORA',  NULL, FALSE),
    ('3',    'PATRIMONIO',       'PATRIMONIO', 'ACREEDORA',  NULL, FALSE),
    ('4',    'INGRESOS',         'INGRESO',    'ACREEDORA',  NULL, FALSE),
    ('5',    'COSTOS',           'COSTO',      'DEUDORA',    NULL, FALSE),
    ('6',    'GASTOS',           'GASTO',      'DEUDORA',    NULL, FALSE)
ON CONFLICT (codigo) DO NOTHING;

-- Nivel 2: Subgrupos
INSERT INTO plan_cuentas (codigo, nombre, tipo, naturaleza, cuenta_padre_id, es_detalle) VALUES
    ('1.1',  'Activo Corriente',          'ACTIVO',     'DEUDORA',   (SELECT id FROM plan_cuentas WHERE codigo='1'), FALSE),
    ('1.2',  'Activo No Corriente',       'ACTIVO',     'DEUDORA',   (SELECT id FROM plan_cuentas WHERE codigo='1'), FALSE),
    ('2.1',  'Pasivo Corriente',          'PASIVO',     'ACREEDORA', (SELECT id FROM plan_cuentas WHERE codigo='2'), FALSE),
    ('3.1',  'Capital Social',            'PATRIMONIO', 'ACREEDORA', (SELECT id FROM plan_cuentas WHERE codigo='3'), FALSE),
    ('3.2',  'Resultados Acumulados',     'PATRIMONIO', 'ACREEDORA', (SELECT id FROM plan_cuentas WHERE codigo='3'), FALSE),
    ('4.1',  'Ingresos por Ventas',       'INGRESO',    'ACREEDORA', (SELECT id FROM plan_cuentas WHERE codigo='4'), FALSE),
    ('5.1',  'Costo de Ventas',           'COSTO',      'DEUDORA',   (SELECT id FROM plan_cuentas WHERE codigo='5'), FALSE),
    ('6.1',  'Gastos Operativos',         'GASTO',      'DEUDORA',   (SELECT id FROM plan_cuentas WHERE codigo='6'), FALSE),
    ('6.2',  'Pérdidas de Inventario',    'GASTO',      'DEUDORA',   (SELECT id FROM plan_cuentas WHERE codigo='6'), FALSE)
ON CONFLICT (codigo) DO NOTHING;

-- Nivel 3: Cuentas de detalle
INSERT INTO plan_cuentas (codigo, nombre, tipo, naturaleza, cuenta_padre_id, es_detalle) VALUES
    ('1.1.1', 'Caja y Bancos',            'ACTIVO',  'DEUDORA',   (SELECT id FROM plan_cuentas WHERE codigo='1.1'), TRUE),
    ('1.1.2', 'Cuentas por Cobrar',       'ACTIVO',  'DEUDORA',   (SELECT id FROM plan_cuentas WHERE codigo='1.1'), TRUE),
    ('1.1.3', 'Inventario de Mercaderías', 'ACTIVO',  'DEUDORA',   (SELECT id FROM plan_cuentas WHERE codigo='1.1'), TRUE),
    ('1.1.4', 'Inventario en Tránsito',   'ACTIVO',  'DEUDORA',   (SELECT id FROM plan_cuentas WHERE codigo='1.1'), TRUE),
    ('2.1.1', 'Cuentas por Pagar',        'PASIVO',  'ACREEDORA', (SELECT id FROM plan_cuentas WHERE codigo='2.1'), TRUE),
    ('2.1.2', 'Impuestos por Pagar',      'PASIVO',  'ACREEDORA', (SELECT id FROM plan_cuentas WHERE codigo='2.1'), TRUE),
    ('4.1.1', 'Ventas de Mercadería',     'INGRESO', 'ACREEDORA', (SELECT id FROM plan_cuentas WHERE codigo='4.1'), TRUE),
    ('5.1.1', 'Costo de Mercadería Vendida','COSTO', 'DEUDORA',   (SELECT id FROM plan_cuentas WHERE codigo='5.1'), TRUE),
    ('6.1.1', 'Gastos Generales',         'GASTO',   'DEUDORA',   (SELECT id FROM plan_cuentas WHERE codigo='6.1'), TRUE),
    ('6.2.1', 'Mermas y Faltantes',       'GASTO',   'DEUDORA',   (SELECT id FROM plan_cuentas WHERE codigo='6.2'), TRUE)
ON CONFLICT (codigo) DO NOTHING;
