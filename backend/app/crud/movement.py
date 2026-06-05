from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from app.models.movement import MovimientoInventario


def get_movimientos(db: Session, sucursal_id: Optional[int] = None, skip: int = 0, limit: int = 100):
    query = db.query(MovimientoInventario)
    if sucursal_id is not None:
        query = query.filter(MovimientoInventario.sucursal_id == sucursal_id)
    return query.order_by(desc(MovimientoInventario.creado_en)).offset(skip).limit(limit).all()


def get_movimiento(db: Session, movimiento_id: int):
    return db.query(MovimientoInventario).filter(MovimientoInventario.id == movimiento_id).first()
