from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app.schemas.category import CategoriaCreate, CategoriaUpdate, CategoriaOut
from app.crud.category import get_categorias, get_categoria, create_categoria, update_categoria, delete_categoria

router = APIRouter()

# Dependencias de rol
require_admin = RoleChecker(["Administrador Global"])


@router.get("/", response_model=List[CategoriaOut])
def list_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Obtiene la lista de todas las categorías de productos."""
    return get_categorias(db, skip=skip, limit=limit)


@router.get("/{categoria_id}", response_model=CategoriaOut)
def read_category(categoria_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Obtiene el detalle de una categoría."""
    db_categoria = get_categoria(db, categoria_id=categoria_id)
    if not db_categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return db_categoria


@router.post("/", response_model=CategoriaOut, status_code=status.HTTP_201_CREATED)
def create_new_category(categoria: CategoriaCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """Crea una nueva categoría (Solo Administrador Global)."""
    return create_categoria(db=db, categoria=categoria)


@router.put("/{categoria_id}", response_model=CategoriaOut)
def update_existing_category(categoria_id: int, categoria: CategoriaUpdate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """Actualiza una categoría (Solo Administrador Global)."""
    db_categoria = update_categoria(db=db, categoria_id=categoria_id, categoria=categoria)
    if not db_categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return db_categoria


@router.delete("/{categoria_id}", response_model=CategoriaOut)
def delete_existing_category(categoria_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """Elimina una categoría (Solo Administrador Global)."""
    db_categoria = delete_categoria(db=db, categoria_id=categoria_id)
    if not db_categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return db_categoria
