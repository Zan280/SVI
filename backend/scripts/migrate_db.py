"""
Script de migración de base de datos para el ERP.
Ejecutar UNA SOLA VEZ para aplicar los cambios de esquema.

Uso:
  docker-compose exec backend python scripts/migrate_db.py

O directamente si el backend está corriendo localmente:
  python scripts/migrate_db.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base, get_db
from app import models  # Importa todos los modelos para registrarlos en Base.metadata
from sqlalchemy import text, inspect
from decimal import Decimal


def column_exists(conn, table_name, column_name):
    result = conn.execute(text(
        "SELECT COUNT(*) FROM information_schema.columns "
        "WHERE table_name = :table AND column_name = :col"
    ), {"table": table_name, "col": column_name})
    return result.scalar() > 0


def table_exists(conn, table_name):
    result = conn.execute(text(
        "SELECT COUNT(*) FROM information_schema.tables "
        "WHERE table_name = :table"
    ), {"table": table_name})
    return result.scalar() > 0


def run_migration():
    print("=" * 60)
    print("ERP - Migración de Base de Datos")
    print("=" * 60)

    with engine.connect() as conn:
        # ── 1. Tabla kardex: recrear con columnas correctas ─────────────────
        print("\n[1/6] Migrando tabla 'kardex'...")
        if table_exists(conn, "kardex"):
            # Verificar si tiene la columna vieja 'tipo' (versión antigua)
            if column_exists(conn, "kardex", "tipo"):
                print("  → Tabla kardex con esquema antiguo detectado. Recreando...")
                conn.execute(text("DROP TABLE IF EXISTS kardex CASCADE"))
                conn.commit()
                print("  ✓ Tabla kardex eliminada.")
            else:
                print("  ✓ Tabla kardex ya tiene el esquema correcto.")
        else:
            print("  → Tabla kardex no existe. Se creará.")

        # ── 2. Tabla inventario_base: agregar columnas nuevas ────────────────
        print("\n[2/6] Migrando tabla 'inventario_base'...")
        if table_exists(conn, "inventario_base"):
            if not column_exists(conn, "inventario_base", "tipo_item"):
                conn.execute(text(
                    "ALTER TABLE inventario_base ADD COLUMN tipo_item VARCHAR(20) NOT NULL DEFAULT 'PRODUCTO'"
                ))
                print("  ✓ Columna 'tipo_item' agregada.")
            else:
                print("  ✓ Columna 'tipo_item' ya existe.")

            if not column_exists(conn, "inventario_base", "departamento"):
                conn.execute(text(
                    "ALTER TABLE inventario_base ADD COLUMN departamento VARCHAR(100)"
                ))
                print("  ✓ Columna 'departamento' agregada.")
            else:
                print("  ✓ Columna 'departamento' ya existe.")

            if not column_exists(conn, "inventario_base", "imagen_base64"):
                conn.execute(text(
                    "ALTER TABLE inventario_base ADD COLUMN imagen_base64 TEXT"
                ))
                print("  ✓ Columna 'imagen_base64' agregada.")
            else:
                print("  ✓ Columna 'imagen_base64' ya existe.")
            conn.commit()
        else:
            print("  → Tabla inventario_base no existe. Se creará con todos los campos.")

        # ── 3. Crear tabla facturas_venta ────────────────────────────────────
        print("\n[3/6] Verificando tabla 'facturas_venta'...")
        if not table_exists(conn, "facturas_venta"):
            print("  → Tabla no existe. Se creará.")
        else:
            print("  ✓ Tabla 'facturas_venta' ya existe.")

        # ── 4. Crear tabla lineas_factura ────────────────────────────────────
        print("\n[4/6] Verificando tabla 'lineas_factura'...")
        if not table_exists(conn, "lineas_factura"):
            print("  → Tabla no existe. Se creará.")
        else:
            print("  ✓ Tabla 'lineas_factura' ya existe.")

        # ── 5. Crear todas las tablas faltantes usando SQLAlchemy ────────────
        print("\n[5/6] Aplicando CREATE TABLE IF NOT EXISTS para todos los modelos...")
        Base.metadata.create_all(bind=engine)
        print("  ✓ Todas las tablas verificadas/creadas.")

        # ── 6. Crear sucursal y admin por defecto si no existen ─────────────
        print("\n[6/6] Verificando datos iniciales (sucursal y admin por defecto)...")
        sucursal_exists = conn.execute(text("SELECT COUNT(*) FROM sucursales WHERE id = 1")).scalar()
        if not sucursal_exists:
            conn.execute(text("""
                INSERT INTO sucursales (nombre, codigo, activa)
                VALUES ('Principal', 'MAIN', true)
                ON CONFLICT DO NOTHING
            """))
            conn.commit()
            print("  ✓ Sucursal principal creada (ID=1).")
        else:
            print("  ✓ Sucursal principal ya existe.")

        # ── 7. Corregir check constraint en movimientos_inventario ───────────
        print("\n[7/6] Corregiendo restricción CHECK en 'movimientos_inventario'...")
        try:
            conn.execute(text("ALTER TABLE movimientos_inventario DROP CONSTRAINT IF EXISTS movimientos_inventario_tipo_check"))
            conn.execute(text("""
                ALTER TABLE movimientos_inventario 
                ADD CONSTRAINT movimientos_inventario_tipo_check 
                CHECK (tipo IN ('INGRESO_COMPRA','SALIDA_VENTA','AJUSTE_INGRESO','AJUSTE_SALIDA','TRASLADO_INGRESO','TRASLADO_SALIDA'))
            """))
            conn.commit()
            print("  ✓ Restricción CHECK de tipos de movimiento actualizada.")
        except Exception as e:
            print(f"  ⚠ Advertencia al actualizar la restricción CHECK: {e}")


    print("\n" + "=" * 60)
    print("✅ Migración completada exitosamente.")
    print("=" * 60)


if __name__ == "__main__":
    run_migration()
