from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.supplier import ProveedorCreate, ProveedorUpdate, ProveedorOut
from app.crud import supplier as crud_supplier

router = APIRouter()


@router.get("/", response_model=List[ProveedorOut])
def listar_proveedores(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_supplier.get_proveedores(db, skip=skip, limit=limit)


@router.get("/{proveedor_id}", response_model=ProveedorOut)
def obtener_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    db_proveedor = crud_supplier.get_proveedor(db, proveedor_id)
    if not db_proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return db_proveedor


@router.post("/", response_model=ProveedorOut, status_code=201)
def crear_proveedor(proveedor: ProveedorCreate, db: Session = Depends(get_db)):
    return crud_supplier.create_proveedor(db, proveedor)


@router.put("/{proveedor_id}", response_model=ProveedorOut)
def actualizar_proveedor(proveedor_id: int, proveedor: ProveedorUpdate, db: Session = Depends(get_db)):
    db_proveedor = crud_supplier.update_proveedor(db, proveedor_id, proveedor)
    if not db_proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return db_proveedor


@router.delete("/{proveedor_id}", response_model=ProveedorOut)
def eliminar_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    db_proveedor = crud_supplier.delete_proveedor(db, proveedor_id)
    if not db_proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return db_proveedor
