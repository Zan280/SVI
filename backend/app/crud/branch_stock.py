from sqlalchemy.orm import Session
from app.models.branch_stock import InventarioSucursal
from app.schemas.branch_stock import InventarioSucursalCreate, InventarioSucursalUpdate


def get_stock_by_branch_and_product(db: Session, sucursal_id: int, producto_id: int):
    return db.query(InventarioSucursal).filter(
        InventarioSucursal.sucursal_id == sucursal_id,
        InventarioSucursal.producto_id == producto_id
    ).first()


def get_stock_by_branch(db: Session, sucursal_id: int, skip: int = 0, limit: int = 100):
    return db.query(InventarioSucursal).filter(
        InventarioSucursal.sucursal_id == sucursal_id
    ).offset(skip).limit(limit).all()


def update_stock_minimo(db: Session, sucursal_id: int, producto_id: int, stock_minimo: float):
    db_stock = get_stock_by_branch_and_product(db, sucursal_id, producto_id)
    if not db_stock:
        # Crear una entrada si no existe
        db_stock = InventarioSucursal(
            sucursal_id=sucursal_id,
            producto_id=producto_id,
            stock=0.0,
            stock_minimo=stock_minimo,
            costo_medio=0.0
        )
        db.add(db_stock)
    else:
        db_stock.stock_minimo = stock_minimo
    db.commit()
    db.refresh(db_stock)
    return db_stock
