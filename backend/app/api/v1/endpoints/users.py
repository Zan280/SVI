from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.user import UsuarioCreate, UsuarioUpdate, UsuarioOut
from app.schemas.role import RoleCreate, RoleUpdate, RoleOut
from app.crud import user as crud_user, role as crud_role
from app.auth import RoleChecker
from app.models.user import Usuario

router = APIRouter()
require_admin = RoleChecker(["Administrador Global"])


# --- ROLES ---
@router.get("/roles", response_model=List[RoleOut])
def listar_roles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    return crud_role.get_roles(db, skip=skip, limit=limit)


@router.post("/roles", response_model=RoleOut, status_code=201)
def crear_rol(
    role: RoleCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    existing = crud_role.get_role_by_name(db, nombre=role.nombre)
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un rol con ese nombre")
    return crud_role.create_role(db, role)


@router.put("/roles/{role_id}", response_model=RoleOut)
def actualizar_rol(
    role_id: int,
    role: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    db_role = crud_role.update_role(db, role_id, role)
    if not db_role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return db_role


@router.delete("/roles/{role_id}", response_model=RoleOut)
def eliminar_rol(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    # Verificar si hay usuarios asignados a este rol para dar un mensaje claro
    has_users = db.query(Usuario).filter(Usuario.role_id == role_id).first()
    if has_users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el rol porque tiene usuarios asignados."
        )
    
    db_role = crud_role.delete_role(db, role_id)
    if not db_role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return db_role


# --- USUARIOS ---
@router.get("/", response_model=List[UsuarioOut])
def listar_usuarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    return crud_user.get_usuarios(db, skip=skip, limit=limit)


@router.get("/{usuario_id}", response_model=UsuarioOut)
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    db_usuario = crud_user.get_usuario(db, usuario_id)
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return db_usuario


@router.post("/", response_model=UsuarioOut, status_code=201)
def crear_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    existing = crud_user.get_usuario_by_email(db, email=usuario.email)
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese email")
    return crud_user.create_usuario(db, usuario)


@router.put("/{usuario_id}", response_model=UsuarioOut)
def actualizar_usuario(
    usuario_id: int,
    usuario: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    db_usuario = crud_user.update_usuario(db, usuario_id, usuario)
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return db_usuario


@router.delete("/{usuario_id}", response_model=UsuarioOut)
def eliminar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    db_usuario = crud_user.delete_usuario(db, usuario_id)
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return db_usuario
