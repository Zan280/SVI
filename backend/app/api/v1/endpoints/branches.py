from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app.schemas.branch import SucursalCreate, SucursalUpdate, SucursalOut
from app.crud.branch import get_sucursales, get_sucursal, get_sucursal_by_codigo, create_sucursal, update_sucursal, delete_sucursal

router = APIRouter()

# Dependencias de rol
require_admin = RoleChecker(["Administrador Global"])


@router.get("/", response_model=List[SucursalOut])
def list_branches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Obtiene la lista de todas las sucursales."""
    return get_sucursales(db, skip=skip, limit=limit)


@router.get("/{sucursal_id}", response_model=SucursalOut)
def read_branch(sucursal_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Obtiene el detalle de una sucursal."""
    db_sucursal = get_sucursal(db, sucursal_id=sucursal_id)
    if not db_sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    return db_sucursal


@router.post("/", response_model=SucursalOut, status_code=status.HTTP_201_CREATED)
def create_new_branch(sucursal: SucursalCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """Crea una nueva sucursal (Solo Administrador Global)."""
    db_sucursal_existente = get_sucursal_by_codigo(db, codigo=sucursal.codigo)
    if db_sucursal_existente:
        raise HTTPException(status_code=400, detail="Ya existe una sucursal con ese código")
    return create_sucursal(db=db, sucursal=sucursal)


@router.put("/{sucursal_id}", response_model=SucursalOut)
def update_existing_branch(sucursal_id: int, sucursal: SucursalUpdate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """Actualiza una sucursal (Solo Administrador Global)."""
    db_sucursal = update_sucursal(db=db, sucursal_id=sucursal_id, sucursal=sucursal)
    if not db_sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    return db_sucursal


@router.delete("/{sucursal_id}", response_model=SucursalOut)
def delete_existing_branch(sucursal_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """Elimina una sucursal (Solo Administrador Global)."""
    db_sucursal = delete_sucursal(db=db, sucursal_id=sucursal_id)
    if not db_sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    return db_sucursal
