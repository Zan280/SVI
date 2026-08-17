"""
Script para registrar/asegurar el usuario zangetsugaln@gmail.com con rol Administrador Global en la DB del ERP.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, get_db
from app.models.user import Usuario
from app.models.role import Role
from app.models.branch import Sucursal
from app.crud.user import get_password_hash, get_usuario_by_email
from sqlalchemy.orm import Session

def seed_google_user():
    db: Session = next(get_db())
    try:
        email = "zangetsugaln@gmail.com"
        existing = get_usuario_by_email(db, email)

        # Buscar el rol Administrador Global
        admin_role = db.query(Role).filter(Role.nombre == "Administrador Global").first()
        if not admin_role:
            print("❌ No se encontró el rol 'Administrador Global'.")
            return

        # Buscar sucursal por defecto
        sucursal = db.query(Sucursal).first()

        if existing:
            print(f"ℹ El usuario {email} ya existe en la base de datos.")
            existing.activo = True
            existing.role_id = admin_role.id
            if sucursal:
                existing.sucursal_id = sucursal.id
            existing.password_hash = get_password_hash("admin123")
            db.commit()
            print(f"✅ Usuario {email} actualizado correctamente con rol {admin_role.nombre}.")
        else:
            new_user = Usuario(
                nombre="Admin Google (Zangetsu)",
                email=email,
                password_hash=get_password_hash("admin123"),
                role_id=admin_role.id,
                sucursal_id=sucursal.id if sucursal else None,
                activo=True
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            print(f"✅ Usuario {email} creado exitosamente con rol {admin_role.nombre} y contraseña 'admin123'.")
    except Exception as e:
        print(f"❌ Error al crear usuario: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_google_user()
