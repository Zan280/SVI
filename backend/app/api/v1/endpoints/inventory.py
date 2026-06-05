from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.inventory import InventarioCreate, InventarioUpdate, InventarioOut
from app.crud import inventory as crud_inventory

router = APIRouter()


@router.get("/", response_model=List[InventarioOut])
def listar_inventario(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_inventory.get_inventarios(db, skip=skip, limit=limit)


@router.get("/{inventario_id}", response_model=InventarioOut)
def obtener_inventario(inventario_id: int, db: Session = Depends(get_db)):
    db_inventario = crud_inventory.get_inventario(db, inventario_id)
    if not db_inventario:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return db_inventario


@router.post("/", response_model=InventarioOut, status_code=201)
def crear_inventario(inventario: InventarioCreate, db: Session = Depends(get_db)):
    existing = crud_inventory.get_inventario_by_codigo(db, codigo_barras=inventario.codigo_barras)
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un producto con ese código de barras")
    return crud_inventory.create_inventario(db, inventario)


@router.put("/{inventario_id}", response_model=InventarioOut)
def actualizar_inventario(inventario_id: int, inventario: InventarioUpdate, db: Session = Depends(get_db)):
    db_inventario = crud_inventory.update_inventario(db, inventario_id, inventario)
    if not db_inventario:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return db_inventario


@router.delete("/{inventario_id}", response_model=InventarioOut)
def eliminar_inventario(inventario_id: int, db: Session = Depends(get_db)):
    db_inventario = crud_inventory.delete_inventario(db, inventario_id)
    if not db_inventario:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return db_inventario
